/**
 * AutoFlightSystem：AP1/AP2、FD1/FD2、A/THR，橫向（RWY/RWY TRK/HDG/TRK/NAV/LOC* /LOC/GA TRK/ROLL OUT）
 * 與垂直（SRS/CLB/OP CLB/DES/OP DES/ALT* /ALT/V/S/FPA/EXP/G/S* /G/S/LAND/FLARE/ROLL OUT）模式。
 * 自動駕駛只輸出坡度/飛行路徑角/俯仰目標與 A/THR N1 指令，不直接修改飛機位置或姿態。
 */
import { DEG, FT, KT, TLA } from '../constants';
import type { FlightDynamics } from '../dynamics';
import { thrustLimits } from '../engines';
import type { ApCommand } from '../fcc';
import type { LateralMode, SimEvent, SimState, VerticalMode } from '../types';
import {
  glidepathAltitude,
  profileAltitude,
  runwayLateralOffset,
  wrap180,
  PATH_SLOPE_FT_PER_NM,
} from './navigation';

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
const COURSE = 270;

export interface AfsOutput {
  ap: ApCommand;
  athrN1: number | null;
}

export class AutoFlightSystem {
  readonly out: AfsOutput = {
    ap: { active: false, bank: 0, fpa: 0, pitch: null, rudder: 0, maxBankRate: 5 },
    athrN1: null,
  };
  private emit: (e: SimEvent) => void = () => undefined;
  private athrTrim = 40;
  private trackHold = 270;
  private altCaptureStartVs = 0;
  private airborneTime = 0;
  private lastLat: LateralMode | null = null;
  private lastVert: VerticalMode | null = null;
  private lastAthr: string | null = null;
  private gammaRef = 0;

  update(s: SimState, dyn: FlightDynamics, dt: number, emit: (e: SimEvent) => void): AfsOutput {
    this.emit = emit;
    const a = s.afs;
    const f = s.flight;
    const powered = s.elec.acBus1 || s.elec.acBus2;
    if (!powered) {
      if (a.ap1 || a.ap2) this.disconnectAp(s, false);
      a.athrArmed = false;
      a.athrActive = false;
    }
    a.fd1 = s.efis[0].fd;
    a.fd2 = s.efis[1].fd;
    this.airborneTime = f.onGround ? 0 : this.airborneTime + dt;
    this.phaseLogic(s);
    this.speedTarget(s);
    this.modeTransitions(s);
    const lat = this.lateral(s, dt);
    const vert = this.vertical(s, dyn);
    this.athr(s, dyn, dt);
    // 自動駕駛輸出
    const apOn = a.ap1 || a.ap2;
    const o = this.out.ap;
    o.active = apOn;
    o.bank = lat.bank;
    o.rudder = lat.rudder;
    o.fpa = vert.fpa;
    o.pitch = vert.pitch;
    o.maxBankRate = a.lateral === 'LOC' || a.lateral === 'LOC*' ? 4 : 5;
    // FD 導引（姿態目標）
    a.fdRoll = lat.bank;
    a.fdPitch = vert.pitch ?? vert.fpa + f.aoa;
    a.fdYaw = clamp(-runwayLateralOffset(s) * 0.05 - wrap180(f.heading - COURSE) * 0.1, -1, 1);
    a.targetAltitude = s.fcu.alt;
    this.fmaEvents(s);
    return this.out;
  }

  // ------------------------------------------------------------------ 飛行階段
  private phaseLogic(s: SimState): void {
    const a = s.afs;
    const f = s.flight;
    const tla = Math.max(s.engines[0].tla, s.engines[1].tla);
    const fieldAlt = f.altitudeMsl - f.radioAltitude;
    switch (a.phase) {
      case 'PREFLIGHT':
      case 'DONE':
        if (f.onGround && tla >= TLA.FLX - 0.5 && s.engines[0].state !== 'OFF') {
          a.phase = 'TAKEOFF';
          a.lateral = 'RWY';
          a.vertical = 'SRS';
          if (s.fplan.waypoints.length > 1 && s.fcu.hdgManaged) a.lateralArmed = 'NAV';
          a.verticalArmed = ['CLB'];
          a.athrArmed = true;
          a.retardCalled = false;
          this.modeChanged(s, 'lat');
          this.modeChanged(s, 'vert');
        }
        break;
      case 'TAKEOFF':
        if (!f.onGround && f.altitudeMsl - fieldAlt >= 0 && f.radioAltitude > a.accAlt) {
          a.phase = 'CLIMB';
          if (a.vertical === 'SRS') this.engageClimb(s, s.fcu.hdgManaged && a.lateral === 'NAV');
        }
        break;
      case 'CLIMB':
        if (Math.abs(f.pressureAltitude - s.fplan.crzFl * 100) < 60 && a.vertical === 'ALT')
          a.phase = 'CRUISE';
        break;
      case 'CRUISE':
        // 到達 TOD 且 FCU 高度已下調 → 自動開始下降
        if (
          s.fplan.todDist <= 0.2 &&
          s.fcu.alt < f.pressureAltitude - 500 &&
          a.lateral === 'NAV' &&
          (a.vertical === 'ALT' || a.vertical === 'ALT CST')
        ) {
          a.phase = 'DESCENT';
          this.setVertical(s, 'DES');
          this.emit({ type: 'TOP_OF_DESCENT' });
        }
        break;
      case 'DESCENT':
        if (s.fplan.distToDest < 16 || a.apprArmed) a.phase = 'APPROACH';
        break;
      case 'APPROACH':
        if (f.onGround && f.gs < 30) {
          a.phase = 'DONE';
        }
        if (!f.onGround && tla >= TLA.TOGA - 0.5 && s.controls.flapHandle > 0) this.goAround(s);
        break;
      case 'GO AROUND':
        if (f.radioAltitude > a.accAlt) {
          a.phase = 'APPROACH';
          this.engageClimb(s, false);
        }
        break;
    }
    // 進入巡航/下降時若尚未進入 CRUISE 而直接下降
    if (
      (a.phase === 'CLIMB' || a.phase === 'CRUISE') &&
      (a.vertical === 'DES' || a.vertical === 'OP DES')
    )
      a.phase = 'DESCENT';
  }

  private speedTarget(s: SimState): void {
    const a = s.afs;
    const f = s.flight;
    let managed: number;
    const alt = f.pressureAltitude;
    switch (a.phase) {
      case 'PREFLIGHT':
      case 'TAKEOFF':
      case 'GO AROUND':
        managed = Math.max(a.v2 + 10, f.ias < a.v2 ? a.v2 : Math.min(f.ias, a.v2 + 15));
        if (a.phase === 'TAKEOFF' && a.vertical !== 'SRS') managed = alt < 10000 ? 250 : 290;
        break;
      case 'CLIMB':
        managed = alt < 10000 ? 250 : 290;
        break;
      case 'CRUISE':
        managed = alt < 10000 ? 250 : 290;
        break;
      case 'DESCENT':
        managed = alt < 10500 ? 250 : 280;
        break;
      case 'APPROACH':
      case 'DONE': {
        const h = s.controls.flapHandle;
        managed =
          h === 0 ? f.greenDot : h === 1 ? f.sSpeed : h === 2 || h === 3 ? f.fSpeed : a.vapp;
        if (h === 0 && s.fplan.distToDest > 10) managed = Math.min(250, Math.max(f.greenDot, 210));
        break;
      }
    }
    // 航路點速度限制（下降/進場）
    const to = s.fplan.waypoints[s.fplan.activeLeg];
    if (to?.spd && (a.phase === 'DESCENT' || a.phase === 'APPROACH'))
      managed = Math.min(managed, to.spd);
    const tgt = s.fcu.spdManaged ? managed : s.fcu.spd;
    a.targetSpeed = clamp(tgt, Math.max(f.vls, 100), Math.max(f.vmax - 5, 120));
    if (s.fcu.spdManaged) s.fcu.spd = Math.round(a.targetSpeed);
  }

  // ------------------------------------------------------------------ 模式轉換
  private modeTransitions(s: SimState): void {
    const a = s.afs;
    const f = s.flight;
    const ils = s.ils;
    // RWY → NAV / RWY TRK（30 ft）
    if (a.lateral === 'RWY' && !f.onGround && f.radioAltitude > 30) {
      if (a.lateralArmed === 'NAV') {
        this.setLateral(s, 'NAV');
        a.lateralArmed = null;
      } else {
        this.trackHold = f.track;
        this.setLateral(s, 'RWY TRK');
      }
    }
    if (
      a.lateralArmed === 'NAV' &&
      a.lateral !== 'RWY' &&
      !f.onGround &&
      Math.abs(s.fplan.xtk) < 5
    ) {
      this.setLateral(s, 'NAV');
      a.lateralArmed = null;
    }
    // LOC 截獲
    if (
      (a.lateralArmed === 'LOC' || a.locArmed || a.apprArmed) &&
      ils.locValid &&
      a.lateral !== 'LOC' &&
      a.lateral !== 'LOC*' &&
      a.lateral !== 'ROLL OUT'
    ) {
      const closing = Math.abs(wrap180(f.track - COURSE)) < 90;
      if (closing && Math.abs(ils.locDev) < 1.6) {
        this.setLateral(s, 'LOC*');
        a.lateralArmed = null;
        this.emit({ type: 'LOC_CAPTURE' });
      }
    }
    if (
      a.lateral === 'LOC*' &&
      Math.abs(ils.locDev) < 0.12 &&
      Math.abs(wrap180(f.track - COURSE)) < 8
    )
      this.setLateral(s, 'LOC');
    // G/S 截獲（需 LOC 已截獲或截獲中）
    if (
      a.verticalArmed.includes('G/S') &&
      ils.gsValid &&
      (a.lateral === 'LOC' || a.lateral === 'LOC*') &&
      ils.gsDev < 0.35 &&
      ils.gsDev > -1
    ) {
      this.setVertical(s, 'G/S*');
      a.verticalArmed = [];
      this.emit({ type: 'GS_CAPTURE' });
    }
    if (a.vertical === 'G/S*' && Math.abs(ils.gsDev) < 0.1) this.setVertical(s, 'G/S');
    // LAND / FLARE / ROLL OUT
    if (
      (a.vertical === 'G/S' || a.vertical === 'G/S*') &&
      a.lateral === 'LOC' &&
      f.radioAltitude < 400 &&
      f.radioAltitude > 5
    ) {
      this.setVertical(s, 'LAND');
      this.setLateral(s, 'LOC');
      a.apprArmed = false;
      a.locArmed = false;
    }
    const flareHeight = clamp((-f.vs / 60) * 3.4, 38, 60);
    if (a.vertical === 'LAND' && f.radioAltitude < flareHeight) {
      this.setVertical(s, 'FLARE');
      a.flareStartVs = f.vs;
    }
    if ((a.vertical === 'FLARE' || a.vertical === 'LAND') && (f.wow[1] || f.wow[2])) {
      this.setVertical(s, 'ROLL OUT');
      this.setLateral(s, 'ROLL OUT');
    }
    // ALT 截獲（CLB/DES/OP/VS/EXP）
    const capturable: VerticalMode[] = [
      'CLB',
      'OP CLB',
      'DES',
      'OP DES',
      'V/S',
      'FPA',
      'EXP CLB',
      'EXP DES',
    ];
    if (a.vertical && capturable.includes(a.vertical) && !f.onGround) {
      const dh = s.fcu.alt - f.pressureAltitude;
      const toward =
        a.vertical === 'V/S' || a.vertical === 'FPA'
          ? Math.sign(dh) === Math.sign(f.vs) || Math.abs(dh) < 30
          : true;
      const window = Math.max(60, Math.abs(f.vs) * 0.18);
      if (toward && Math.abs(dh) < window) {
        this.altCaptureStartVs = f.vs;
        this.setVertical(s, 'ALT*');
      }
    }
    if (
      a.vertical === 'ALT*' &&
      Math.abs(s.fcu.alt - f.pressureAltitude) < 25 &&
      Math.abs(f.vs) < 200
    )
      this.setVertical(s, 'ALT');
    if (a.vertical === 'ALT' || a.vertical === 'ALT*') {
      a.verticalArmed = a.verticalArmed.filter((m) => m === 'G/S');
    }
    if (
      a.apprArmed &&
      !a.verticalArmed.includes('G/S') &&
      a.vertical !== 'G/S' &&
      a.vertical !== 'G/S*' &&
      a.vertical !== 'LAND' &&
      a.vertical !== 'FLARE' &&
      a.vertical !== 'ROLL OUT'
    ) {
      a.verticalArmed = [...a.verticalArmed, 'G/S'];
    }
    // 進近能力
    const apBoth = a.ap1 && a.ap2;
    a.approachCap =
      a.apprArmed ||
      a.vertical === 'G/S' ||
      a.vertical === 'G/S*' ||
      a.vertical === 'LAND' ||
      a.vertical === 'FLARE'
        ? apBoth
          ? 'CAT3 DUAL'
          : a.ap1 || a.ap2
            ? 'CAT3 SINGLE'
            : 'CAT1'
        : null;
  }

  // ------------------------------------------------------------------ 橫向導引
  private lateral(s: SimState, dt: number): { bank: number; rudder: number } {
    const a = s.afs;
    const f = s.flight;
    let bank = 0;
    let rudder = 0;
    const maxBank = f.radioAltitude < 700 && !f.onGround ? 15 : 25;
    const trackTo = (tgt: number, gain = 2.2): number =>
      clamp(gain * wrap180(tgt - f.track), -maxBank, maxBank);
    switch (a.lateral) {
      case 'HDG':
        bank = clamp(2.2 * wrap180(s.fcu.hdg - f.heading), -maxBank, maxBank);
        break;
      case 'TRK':
      case 'RWY TRK':
      case 'GA TRK':
        bank = trackTo(a.lateral === 'TRK' ? s.fcu.hdg : this.trackHold);
        break;
      case 'NAV': {
        const corr = clamp(s.fplan.xtk * 35, -45, 45);
        bank = trackTo(s.fplan.desiredTrack - corr);
        if (s.fcu.hdgManaged) s.fcu.hdg = Math.round(s.fplan.desiredTrack);
        break;
      }
      case 'LOC*':
      case 'LOC': {
        const y = runwayLateralOffset(s);
        const gain = f.radioAltitude < 1000 ? 0.035 : 0.025;
        const lim = a.lateral === 'LOC*' ? 35 : 20;
        const tgt = COURSE - clamp(y * gain, -lim, lim);
        bank = trackTo(tgt, 2.6);
        break;
      }
      case 'ROLL OUT': {
        const y = runwayLateralOffset(s);
        rudder = clamp(y * 0.06 - wrap180(f.heading - COURSE) * 0.25 - s.aircraft.r * 4, -1, 1);
        bank = 0;
        break;
      }
      case 'RWY':
        bank = 0;
        break;
      default:
        bank = f.roll;
    }
    if (a.vertical === 'FLARE' && a.lateral === 'LOC') {
      // 去偏流：flare 時以方向舵對正跑道
      rudder = clamp(-wrap180(f.heading - COURSE) * 0.12, -0.6, 0.6);
    }
    void dt;
    return { bank, rudder };
  }

  // ------------------------------------------------------------------ 垂直導引
  private vertical(s: SimState, dyn: FlightDynamics): { fpa: number; pitch: number | null } {
    const a = s.afs;
    const f = s.flight;
    const V = Math.max(f.tas * KT, 40);
    const vsToFpa = (vs: number): number => Math.asin(clamp((vs * FT) / 60 / V, -0.4, 0.4)) / DEG;
    // 推力剩餘爬升梯度（能量前饋）
    const thrust = s.engines[0].thrust + s.engines[1].thrust;
    const drag = dyn.qbar * 122.6 * dyn.coeffs.cd;
    const gammaAvail = (thrust - drag) / (s.aircraft.mass * 9.80665) / DEG;
    const speedOnPitch = (lo: number, hi: number): number => {
      const e = f.ias - a.targetSpeed;
      const g = gammaAvail + 0.22 * e + 0.12 * f.speedTrend;
      this.gammaRef += (clamp(g, lo, hi) - this.gammaRef) * 0.08;
      return this.gammaRef;
    };
    const dh = s.fcu.alt - f.pressureAltitude;
    let fpa = f.fpa;
    let pitch: number | null = null;
    switch (a.vertical) {
      case 'SRS': {
        if (f.onGround) {
          pitch = f.ias > a.vr - 3 ? 12.5 : 0;
        } else {
          const g = speedOnPitch(1.5, 22);
          pitch = clamp(g + f.aoa, 0, 18);
        }
        break;
      }
      case 'CLB':
      case 'OP CLB':
      case 'EXP CLB':
        fpa = dh > 0 ? speedOnPitch(0.5, 15) : vsToFpa(-500);
        break;
      case 'OP DES':
      case 'EXP DES':
        fpa = dh < 0 ? speedOnPitch(-9, -0.4) : vsToFpa(500);
        break;
      case 'DES': {
        const prof = profileAltitude(s, s.fplan.distToDest);
        const target = Math.max(s.fcu.alt, Number.isFinite(prof) ? prof : s.fcu.alt);
        const pathVs = (-PATH_SLOPE_FT_PER_NM * f.gs) / 60;
        const vs = clamp((target - f.pressureAltitude) * 1.0 + pathVs, -3500, -150);
        fpa = dh < 0 ? vsToFpa(vs) : 0;
        break;
      }
      case 'ALT*': {
        const vs = clamp(
          dh * 7.5,
          -Math.max(Math.abs(this.altCaptureStartVs), 400),
          Math.max(Math.abs(this.altCaptureStartVs), 400),
        );
        fpa = vsToFpa(vs);
        break;
      }
      case 'ALT':
      case 'ALT CST':
        fpa = vsToFpa(clamp(dh * 4, -1000, 1000));
        break;
      case 'V/S':
        fpa = vsToFpa(s.fcu.vs);
        break;
      case 'FPA':
        fpa = s.fcu.fpa;
        break;
      case 'G/S*':
      case 'G/S':
      case 'LAND': {
        const err = f.altitudeMsl - glidepathAltitude(s);
        fpa = -3 - clamp(err * 0.012, -1.8, 1.8);
        break;
      }
      case 'FLARE': {
        const h = f.radioAltitude;
        const vs = -(h * 60) / 3.6 - 70;
        fpa = vsToFpa(Math.max(vs, a.flareStartVs));
        break;
      }
      case 'ROLL OUT':
        pitch = f.wow[0] ? 0 : Math.max(0, f.pitch - 1.2);
        break;
      default:
        fpa = f.fpa;
    }
    return { fpa, pitch };
  }

  // ------------------------------------------------------------------ A/THR
  private athr(s: SimState, dyn: FlightDynamics, dt: number): void {
    const a = s.afs;
    const f = s.flight;
    const tla = Math.max(s.engines[0].tla, s.engines[1].tla);
    const lim = thrustLimits(s);
    const inRange = tla > TLA.IDLE + 0.5 && tla <= TLA.CL + 0.5;
    const wasActive = a.athrActive;
    // 落地後收油門 → A/THR 解除預位
    if (
      f.onGround &&
      tla <= TLA.IDLE + 0.5 &&
      a.phase !== 'TAKEOFF' &&
      a.athrArmed &&
      this.airborneTime === 0 &&
      f.gs < 150 &&
      s.meta.phase !== 'TAKEOFF_ROLL'
    ) {
      if (a.athrActive || a.vertical === 'ROLL OUT') a.athrArmed = false;
    }
    // alpha floor
    if (!f.onGround && f.aoa > dyn.coeffs.alphaStall / DEG - 2.5 && a.athrArmed)
      a.alphaFloor = true;
    if (a.alphaFloor && f.aoa < dyn.coeffs.alphaStall / DEG - 5) a.alphaFloor = false;

    a.athrActive = a.athrArmed && (inRange || a.alphaFloor) && !f.onGround;
    let mode: typeof a.athrMode = null;
    if (a.athrArmed && !a.athrActive) {
      mode =
        tla >= TLA.TOGA - 0.5
          ? 'MAN TOGA'
          : tla >= TLA.FLX - 0.5
            ? f.onGround || a.phase === 'TAKEOFF'
              ? 'MAN FLX'
              : 'THR MCT'
            : null;
      a.athrArmedMode = 'A/THR';
    } else {
      a.athrArmedMode = null;
    }
    let n1: number | null = null;
    if (a.athrActive) {
      if (a.alphaFloor) {
        mode = 'A.FLOOR';
        n1 = lim.toga;
      } else {
        const v = a.vertical;
        if (v === 'CLB' || v === 'OP CLB' || v === 'EXP CLB' || v === 'SRS') {
          mode = 'THR CLB';
          n1 = lim.clb;
        } else if (
          v === 'OP DES' ||
          v === 'EXP DES' ||
          (v === 'FLARE' && f.radioAltitude < 20) ||
          v === 'ROLL OUT'
        ) {
          mode = 'THR IDLE';
          n1 = lim.idle;
        } else {
          mode = f.mach > 0.72 && s.fcu.spdMach === 'MACH' ? 'MACH' : 'SPEED';
          if (!wasActive || this.lastAthr !== mode)
            this.athrTrim = (s.engines[0].n1 + s.engines[1].n1) / 2;
          const e = a.targetSpeed - f.ias;
          this.athrTrim = clamp(this.athrTrim + e * 0.35 * dt, lim.idle, lim.clb);
          n1 = clamp(
            this.athrTrim + e * 1.6 - f.speedTrend * 0.9,
            lim.idle,
            tla <= TLA.CL + 0.5 ? leverCap(tla, lim) : lim.clb,
          );
        }
      }
      if (mode !== 'SPEED' && mode !== 'MACH')
        this.athrTrim = (s.engines[0].n1 + s.engines[1].n1) / 2;
    }
    // RETARD：自動降落 10 ft、手動 20 ft
    const autoland = (a.ap1 || a.ap2) && (a.vertical === 'FLARE' || a.vertical === 'LAND');
    const retardAt = autoland ? 10 : 20;
    if (
      !f.onGround &&
      f.radioAltitude < retardAt &&
      f.vs < 0 &&
      a.phase === 'APPROACH' &&
      !a.retardCalled &&
      tla > TLA.IDLE + 0.5
    ) {
      a.retardCalled = true;
      this.emit({ type: 'CALLOUT', text: 'RETARD' });
    }
    if (f.radioAltitude > 100) a.retardCalled = false;
    a.athrMode = mode;
    this.lastAthr = mode;
    this.out.athrN1 = n1;
  }

  private fmaEvents(s: SimState): void {
    const a = s.afs;
    if (a.lateral !== this.lastLat) {
      this.lastLat = a.lateral;
      a.modeChangeTime.lat = s.meta.time;
      this.emit({ type: 'FMA_CHANGE', column: 'lat' });
    }
    if (a.vertical !== this.lastVert) {
      this.lastVert = a.vertical;
      a.modeChangeTime.vert = s.meta.time;
      this.emit({ type: 'FMA_CHANGE', column: 'vert' });
    }
    const am = a.athrMode ?? '';
    if (am !== this.lastAthrFma) {
      this.lastAthrFma = am;
      a.modeChangeTime.athr = s.meta.time;
      this.emit({ type: 'FMA_CHANGE', column: 'athr' });
    }
  }

  private lastAthrFma = '';

  private modeChanged(s: SimState, col: 'lat' | 'vert'): void {
    s.afs.modeChangeTime[col] = s.meta.time;
  }

  private setLateral(s: SimState, m: LateralMode): void {
    if (m === 'RWY TRK' || m === 'GA TRK') this.trackHold = s.flight.track;
    s.afs.lateral = m;
  }

  private setVertical(s: SimState, m: VerticalMode): void {
    if (s.afs.vertical !== m) this.gammaRef = s.flight.fpa;
    s.afs.vertical = m;
  }

  private engageClimb(s: SimState, managed: boolean): void {
    const dh = s.fcu.alt - s.flight.pressureAltitude;
    if (dh > 50) this.setVertical(s, managed ? 'CLB' : 'OP CLB');
    else if (dh < -50) this.setVertical(s, managed ? 'DES' : 'OP DES');
    else this.setVertical(s, 'ALT');
    s.afs.verticalArmed = s.afs.verticalArmed.filter((m) => m === 'G/S');
  }

  private goAround(s: SimState): void {
    const a = s.afs;
    a.phase = 'GO AROUND';
    this.setVertical(s, 'SRS');
    this.setLateral(s, 'GA TRK');
    a.apprArmed = false;
    a.locArmed = false;
    a.verticalArmed = [];
    a.athrArmed = true;
  }

  // ================================================================== FCU 指令
  private canEngageAp(s: SimState): boolean {
    const f = s.flight;
    return (
      (s.elec.acBus1 || s.elec.acBus2) &&
      !f.onGround &&
      f.radioAltitude > 100 &&
      this.airborneTime > 5 &&
      s.adirs.ir.some((ir) => ir.attAvail)
    );
  }

  toggleAp(s: SimState, n: 1 | 2): void {
    const a = s.afs;
    const on = n === 1 ? a.ap1 : a.ap2;
    if (on) {
      this.disconnectAp(s, false);
      return;
    }
    if (!this.canEngageAp(s)) return;
    const approachMode =
      a.apprArmed ||
      a.lateral === 'LOC' ||
      a.lateral === 'LOC*' ||
      a.vertical === 'G/S' ||
      a.vertical === 'LAND';
    if (n === 1) {
      a.ap1 = true;
      if (!approachMode) a.ap2 = false;
    } else {
      a.ap2 = true;
      if (!approachMode) a.ap1 = false;
    }
    // 無作用模式 → 基本模式 HDG + V/S
    if (!a.lateral || a.lateral === 'RWY') {
      this.setLateral(s, s.fcu.trkFpa ? 'TRK' : 'HDG');
      s.fcu.hdg = Math.round(s.flight.heading);
      s.fcu.hdgManaged = false;
    }
    if (!a.vertical) {
      this.setVertical(s, 'V/S');
      s.fcu.vs = Math.round(s.flight.vs / 100) * 100;
      s.fcu.vsDashes = false;
    }
    a.modeChangeTime.ap = s.meta.time;
    this.emit({ type: 'AP_ENGAGED', ap: n });
  }

  disconnectAp(s: SimState, instinctive: boolean): void {
    const a = s.afs;
    if (!a.ap1 && !a.ap2) {
      // 再按一次瞬斷鈕：取消警告
      if (instinctive) a.apDisconnectWarning = 0;
      return;
    }
    a.ap1 = false;
    a.ap2 = false;
    a.apDisconnectWarning = instinctive ? 1.8 : 3;
    a.modeChangeTime.ap = s.meta.time;
    this.emit({ type: 'AP_DISCONNECT', instinctive });
  }

  toggleAthr(s: SimState): void {
    const a = s.afs;
    if (a.athrArmed) {
      const wasActive = a.athrActive;
      a.athrArmed = false;
      a.athrActive = false;
      if (wasActive) {
        a.athrDisconnectCaution = 3;
        this.emit({ type: 'ATHR_DISCONNECT' });
      }
    } else if (s.elec.acBus1 || s.elec.acBus2) {
      a.athrArmed = true;
    }
  }

  instinctiveAthrDisc(s: SimState): void {
    const a = s.afs;
    if (a.athrArmed) {
      a.athrArmed = false;
      a.athrActive = false;
      a.alphaFloor = false;
      a.athrDisconnectCaution = 3;
      this.emit({ type: 'ATHR_DISCONNECT' });
    }
  }

  pushSpd(s: SimState): void {
    s.fcu.spdManaged = true;
  }
  pullSpd(s: SimState): void {
    s.fcu.spdManaged = false;
    s.fcu.spd = Math.round(s.afs.targetSpeed);
  }
  pushHdg(s: SimState): void {
    const a = s.afs;
    if (s.fplan.waypoints.length < 2) return;
    s.fcu.hdgManaged = true;
    s.fcu.hdgPreset = false;
    if (s.flight.onGround || a.lateral === 'RWY') a.lateralArmed = 'NAV';
    else if (Math.abs(s.fplan.xtk) < 5) this.setLateral(s, 'NAV');
    else a.lateralArmed = 'NAV';
  }
  pullHdg(s: SimState): void {
    const a = s.afs;
    if (s.flight.onGround && a.lateral !== 'RWY') {
      s.fcu.hdgManaged = false;
      return;
    }
    s.fcu.hdgManaged = false;
    s.fcu.hdgPreset = false;
    if (!s.flight.onGround) {
      this.setLateral(s, s.fcu.trkFpa ? 'TRK' : 'HDG');
      if (a.lateralArmed === 'NAV') a.lateralArmed = null;
      if (a.lateral !== 'LOC' && a.locArmed && !a.apprArmed) a.locArmed = false;
    }
  }
  rotateHdg(s: SimState, delta: number): void {
    s.fcu.hdg = (((s.fcu.hdg + delta) % 360) + 360) % 360;
    if (s.fcu.hdgManaged) s.fcu.hdgPreset = true;
  }
  pushAlt(s: SimState): void {
    const a = s.afs;
    if (s.flight.onGround) return;
    const managed = a.lateral === 'NAV' && s.fplan.waypoints.length > 1;
    const dh = s.fcu.alt - s.flight.pressureAltitude;
    if (Math.abs(dh) < 50) return;
    if (dh > 0) this.setVertical(s, managed ? 'CLB' : 'OP CLB');
    else this.setVertical(s, managed ? 'DES' : 'OP DES');
    s.fcu.vsDashes = true;
    if (dh < 0 && (a.phase === 'CRUISE' || a.phase === 'CLIMB')) {
      a.phase = 'DESCENT';
      this.emit({ type: 'TOP_OF_DESCENT' });
    }
  }
  pullAlt(s: SimState): void {
    if (s.flight.onGround) return;
    const dh = s.fcu.alt - s.flight.pressureAltitude;
    if (Math.abs(dh) < 50) return;
    this.setVertical(s, dh > 0 ? 'OP CLB' : 'OP DES');
    s.fcu.vsDashes = true;
    if (dh < 0 && (s.afs.phase === 'CRUISE' || s.afs.phase === 'CLIMB')) {
      s.afs.phase = 'DESCENT';
      this.emit({ type: 'TOP_OF_DESCENT' });
    }
  }
  rotateVs(s: SimState, delta: number): void {
    const fcu = s.fcu;
    if (fcu.vsDashes) {
      fcu.vs = Math.round(s.flight.vs / 100) * 100;
      fcu.fpa = Math.round(s.flight.fpa * 10) / 10;
    }
    if (fcu.trkFpa) fcu.fpa = clamp(Math.round((fcu.fpa + delta * 0.1) * 10) / 10, -9.9, 9.9);
    else fcu.vs = clamp(fcu.vs + delta * 100, -6000, 6000);
    this.engageVs(s);
  }
  pullVs(s: SimState): void {
    if (s.fcu.vsDashes) {
      s.fcu.vs = Math.round(s.flight.vs / 100) * 100;
      s.fcu.fpa = Math.round(s.flight.fpa * 10) / 10;
    }
    this.engageVs(s);
  }
  pushVs(s: SimState): void {
    // 平飛：V/S = 0
    s.fcu.vs = 0;
    s.fcu.fpa = 0;
    this.engageVs(s);
  }
  private engageVs(s: SimState): void {
    if (s.flight.onGround) return;
    s.fcu.vsDashes = false;
    this.setVertical(s, s.fcu.trkFpa ? 'FPA' : 'V/S');
    s.afs.verticalArmed = s.afs.verticalArmed.filter((m) => m === 'G/S');
  }
  toggleLoc(s: SimState): void {
    const a = s.afs;
    if (a.locArmed || a.lateralArmed === 'LOC') {
      a.locArmed = false;
      if (a.lateralArmed === 'LOC') a.lateralArmed = null;
      return;
    }
    if (!s.ils.tuned || s.flight.onGround) return;
    a.locArmed = true;
    a.lateralArmed = 'LOC';
    a.apprArmed = false;
  }
  toggleAppr(s: SimState): void {
    const a = s.afs;
    if (a.apprArmed) {
      a.apprArmed = false;
      a.verticalArmed = a.verticalArmed.filter((m) => m !== 'G/S');
      if (a.lateralArmed === 'LOC') a.lateralArmed = null;
      return;
    }
    if (!s.ils.tuned || s.flight.onGround) return;
    a.apprArmed = true;
    a.locArmed = false;
    if (a.lateral !== 'LOC' && a.lateral !== 'LOC*') a.lateralArmed = 'LOC';
    if (!a.verticalArmed.includes('G/S')) a.verticalArmed = [...a.verticalArmed, 'G/S'];
    if (a.phase === 'DESCENT' || a.phase === 'CRUISE') a.phase = 'APPROACH';
  }
  toggleExped(s: SimState): void {
    if (s.flight.onGround) return;
    const dh = s.fcu.alt - s.flight.pressureAltitude;
    s.fcu.exped = !s.fcu.exped;
    if (s.fcu.exped && Math.abs(dh) > 100) this.setVertical(s, dh > 0 ? 'EXP CLB' : 'EXP DES');
    else if (!s.fcu.exped && (s.afs.vertical === 'EXP CLB' || s.afs.vertical === 'EXP DES'))
      this.setVertical(s, dh > 0 ? 'OP CLB' : 'OP DES');
  }
  toggleTrkFpa(s: SimState): void {
    s.fcu.trkFpa = !s.fcu.trkFpa;
    const a = s.afs;
    if (a.lateral === 'HDG') this.setLateral(s, 'TRK');
    else if (a.lateral === 'TRK') this.setLateral(s, 'HDG');
    if (a.vertical === 'V/S') {
      s.fcu.fpa = Math.round(s.flight.fpa * 10) / 10;
      this.setVertical(s, 'FPA');
    } else if (a.vertical === 'FPA') {
      s.fcu.vs = Math.round(s.flight.vs / 100) * 100;
      this.setVertical(s, 'V/S');
    }
  }
  /** 使用者側桿超控 → AP 解除 */
  stickOverride(s: SimState): void {
    if (s.afs.ap1 || s.afs.ap2) this.disconnectAp(s, false);
  }
  reset(): void {
    this.lastLat = null;
    this.lastVert = null;
    this.airborneTime = 0;
  }
}

function leverCap(tla: number, lim: { idle: number; clb: number }): number {
  return lim.idle + (Math.min(tla, TLA.CL) / TLA.CL) * (lim.clb - lim.idle);
}
