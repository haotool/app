/**
 * WarningSystem（FWS）：只依 AircraftState 推導警告/注意/memo；MASTER WARN/CAUT 燈與確認；ECAM SD 自動頁面。
 */
import { TLA } from '../constants';
import type { DoorsState, EcamMessage, SdPage, SimEvent, SimState, WarningLevel } from '../types';
import { DOOR_LABELS } from './doors';

interface Cond {
  id: string;
  level: WarningLevel;
  title: string;
  actions: string[];
  page?: SdPage;
}

function evaluate(s: SimState): Cond[] {
  const out: Cond[] = [];
  const f = s.flight;
  const e = s.engines;
  const airborne = !f.onGround;
  const anyEngine = e[0].state !== 'OFF' || e[1].state !== 'OFF';
  const tla = Math.max(e[0].tla, e[1].tla);
  const toPower = f.onGround && tla >= TLA.FLX - 0.5;
  const toTest = s.warnings.toConfigTest > 0;

  // --- 起飛組態 ---
  if (toPower || toTest) {
    if (s.controls.flapHandle === 0 || s.controls.flapHandle === 4)
      out.push({
        id: 'CFG_FLAPS',
        level: 'WARNING',
        title: 'CONFIG FLAPS NOT IN T.O CONFIG',
        actions: [],
      });
    if (s.controls.speedbrakeHandle > 0.05)
      out.push({
        id: 'CFG_SPDBRK',
        level: 'WARNING',
        title: 'CONFIG SPD BRK NOT RETRACTED',
        actions: [],
      });
    if (s.gear.parkingBrake)
      out.push({ id: 'CFG_PARK', level: 'WARNING', title: 'CONFIG PARK BRK ON', actions: [] });
    if (s.controls.ths < -2 || s.controls.ths > 7)
      out.push({
        id: 'CFG_PITCH',
        level: 'WARNING',
        title: 'CONFIG PITCH TRIM NOT IN T.O RANGE',
        actions: [],
      });
  }
  // --- 飛行 ---
  if (airborne && f.ias > f.vmax + 4)
    out.push({
      id: 'OVERSPEED',
      level: 'WARNING',
      title: `OVERSPEED VMO/VFE`,
      actions: ['-SPD........REDUCE'],
    });
  if (
    airborne &&
    f.radioAltitude < 750 &&
    f.radioAltitude > 5 &&
    s.gear.lever === 'UP' &&
    tla <= TLA.CL * 0.5 &&
    f.vs < 0
  ) {
    out.push({
      id: 'GEAR_NOT_DOWN',
      level: 'WARNING',
      title: 'L/G GEAR NOT DOWN',
      actions: ['-L/G..........DOWN'],
      page: 'WHEEL',
    });
  }
  if (s.afs.apDisconnectWarning > 0)
    out.push({ id: 'AP_OFF', level: 'WARNING', title: 'AUTO FLT AP OFF', actions: [] });
  if (s.press.cabinAlt > 9550)
    out.push({
      id: 'EXCESS_CAB',
      level: 'WARNING',
      title: 'CAB PR EXCESS CAB ALT',
      actions: ['-CREW OXY MASKS...USE', '-DESCENT......INITIATE'],
      page: 'PRESS',
    });
  if (airborne && e[0].state === 'OFF' && e[1].state === 'OFF')
    out.push({
      id: 'DUAL_FAIL',
      level: 'WARNING',
      title: 'ENG DUAL FAILURE',
      actions: ['-ENG MODE SEL....IGN', '-THR LEVERS.....IDLE'],
      page: 'ENG',
    });
  if (f.aoa > 15 && airborne && s.controls.law !== 'NORMAL')
    out.push({ id: 'STALL', level: 'WARNING', title: 'STALL', actions: [] });

  // --- 注意 ---
  if (s.afs.athrDisconnectCaution > 0)
    out.push({ id: 'ATHR_OFF', level: 'CAUTION', title: 'AUTO FLT A/THR OFF', actions: [] });
  for (const i of [0, 1] as const) {
    const n = i + 1;
    const failed = i === 0 ? s.failures.eng1Fail : s.failures.eng2Fail;
    if (
      airborne &&
      (failed || (e[i].master && e[i].state === 'SHUTTING_DOWN' && !e[i].firePushed))
    ) {
      out.push({
        id: `ENG${n}_FAIL`,
        level: 'CAUTION',
        title: `ENG ${n} FAIL`,
        actions: [`-ENG ${n} MASTER.....OFF`],
        page: 'ENG',
      });
    }
    if (
      e[i].state !== 'OFF' &&
      e[i].n2 > 57 &&
      !(i === 0 ? s.elec.gen1Online : s.elec.gen2Online)
    ) {
      out.push({
        id: `GEN${n}`,
        level: 'CAUTION',
        title: `ELEC GEN ${n} FAULT`,
        actions: [`-GEN ${n}...........OFF THEN ON`],
        page: 'ELEC',
      });
    }
  }
  if (anyEngine && e[0].state !== 'STARTING' && e[1].state !== 'STARTING') {
    if (e[0].n2 > 50 && s.hyd.green.pressure < 1450)
      out.push({
        id: 'HYD_G',
        level: 'CAUTION',
        title: 'HYD G SYS LO PR',
        actions: [],
        page: 'HYD',
      });
    if (e[1].n2 > 50 && s.hyd.yellow.pressure < 1450)
      out.push({
        id: 'HYD_Y',
        level: 'CAUTION',
        title: 'HYD Y SYS LO PR',
        actions: [],
        page: 'HYD',
      });
    if (!s.hyd.elecPump && (e[0].n2 > 50 || e[1].n2 > 50))
      out.push({
        id: 'HYD_B',
        level: 'CAUTION',
        title: 'HYD B ELEC PUMP OFF',
        actions: [],
        page: 'HYD',
      });
    const f2 = s.fuel.pumps;
    if (!f2.l1 && !f2.l2)
      out.push({
        id: 'FUEL_L',
        level: 'CAUTION',
        title: 'FUEL L TK PUMPS LO PR',
        actions: ['-L TK PUMPS.......ON'],
        page: 'FUEL',
      });
    if (!f2.r1 && !f2.r2)
      out.push({
        id: 'FUEL_R',
        level: 'CAUTION',
        title: 'FUEL R TK PUMPS LO PR',
        actions: ['-R TK PUMPS.......ON'],
        page: 'FUEL',
      });
  }
  // 艙門未關而飛機移動或推力設定
  for (const k of Object.keys(s.doors) as (keyof DoorsState)[]) {
    if (s.doors[k] > 0.05 && (f.gs > 3 || !f.onGround || tla > TLA.CL)) {
      out.push({
        id: `DOOR_${k}`,
        level: 'CAUTION',
        title: `DOOR ${DOOR_LABELS[k]}`,
        actions: [],
        page: 'DOOR',
      });
    }
  }
  if (s.gear.brakeTemp[0] > 300 || s.gear.brakeTemp[1] > 300)
    out.push({
      id: 'BRK_HOT',
      level: 'CAUTION',
      title: 'BRAKES HOT',
      actions: ['-PARK BRK.....PREFER CHOCKS'],
      page: 'WHEEL',
    });
  if (airborne && s.controls.speedbrakeHandle > 0.1 && tla > TLA.CL - 5)
    out.push({ id: 'SPDBRK_OUT', level: 'CAUTION', title: 'F/CTL SPD BRK STILL OUT', actions: [] });
  if (airborne && s.pneu.ductL < 5 && s.pneu.ductR < 5 && anyEngine)
    out.push({
      id: 'BLEED_LO',
      level: 'CAUTION',
      title: 'AIR ENG BLEED LO PR',
      actions: [],
      page: 'BLEED',
    });
  if (s.weather.icing && s.antiIce.iceDetected && !s.antiIce.wing && airborne)
    out.push({
      id: 'ICE',
      level: 'CAUTION',
      title: 'ANTI ICE ICE DETECTED',
      actions: ['-WING ANTI ICE.....ON', '-ENG ANTI ICE......ON'],
    });
  if (s.apu.master && s.failures.apuFail)
    out.push({
      id: 'APU_FAULT',
      level: 'CAUTION',
      title: 'APU AUTO SHUT DOWN',
      actions: ['-MASTER SW........OFF'],
      page: 'APU',
    });
  if (s.adirs.ir.some((ir) => ir.mode === 'OFF') && anyEngine)
    out.push({ id: 'IR_OFF', level: 'CAUTION', title: 'NAV IR NOT ALIGNED', actions: [] });
  return out;
}

function memos(s: SimState): string[] {
  const m: string[] = [];
  const f = s.flight;
  const e = s.engines;
  const bothRunning = e[0].state !== 'OFF' && e[1].state !== 'OFF';
  if (
    f.onGround &&
    bothRunning &&
    Math.max(e[0].tla, e[1].tla) < TLA.FLX - 0.5 &&
    f.gs < 60 &&
    s.meta.phase !== 'ROLLOUT' &&
    s.meta.phase !== 'TAXI_IN'
  ) {
    m.push(`T.O AUTO BRK${s.gear.autobrake === 'MAX' ? '.....MAX' : '.....MAX (SET)'}`);
    m.push(`SIGNS${s.lights.seatBelts === 'ON' ? '..........ON' : '.....ON (SET)'}`);
    m.push('CABIN...........CHECK');
    m.push(`SPLRS${s.controls.spoilersArmed ? '.........ARM' : '...ARM (SET)'}`);
    m.push(
      `FLAPS${s.controls.flapHandle >= 1 && s.controls.flapHandle <= 3 ? '..........T.O' : '...T.O (SET)'}`,
    );
    m.push(s.warnings.toConfigTest > 0 ? 'T.O CONFIG.....NORMAL' : 'T.O CONFIG......TEST');
    return m;
  }
  if (
    !f.onGround &&
    f.radioAltitude < 2000 &&
    s.gear.lever === 'DOWN' &&
    s.controls.flapHandle >= 2
  ) {
    m.push(`LDG GEAR${s.gear.downLocked.every(Boolean) ? '..........DN' : '......DN (SET)'}`);
    m.push(`SIGNS${s.lights.seatBelts === 'ON' ? '..........ON' : '.....ON (SET)'}`);
    m.push('CABIN...........READY');
    m.push(`SPLRS${s.controls.spoilersArmed ? '.........ARM' : '...ARM (SET)'}`);
    m.push(`FLAPS${s.controls.flapHandle === 4 ? '.........FULL' : '..FULL (SET)'}`);
    return m;
  }
  if (s.apu.state === 'AVAILABLE') m.push('APU AVAIL');
  if (s.pneu.apuBleed && s.apu.state === 'AVAILABLE') m.push('APU BLEED');
  if (s.gear.parkingBrake) m.push('PARK BRK');
  if (s.lights.seatBelts === 'ON') m.push('SEAT BELTS');
  if (s.lights.noSmoking === 'ON') m.push('NO SMOKING');
  if (s.controls.speedbrakeHandle > 0.05 && !f.onGround) m.push('SPEED BRK');
  if (s.controls.spoilersArmed) m.push('GND SPLRS ARMED');
  if (s.gear.autobrake !== 'OFF' && !f.onGround) m.push(`AUTO BRK ${s.gear.autobrake}`);
  if (s.antiIce.wing) m.push('WING A.ICE');
  if (s.antiIce.eng1 || s.antiIce.eng2) m.push('ENG A.ICE');
  if (
    s.mech.engMode === 'IGN/START' &&
    (e[0].state === 'STARTING' || e[1].state === 'STARTING' || !f.onGround)
  )
    m.push('IGNITION');
  if (s.lights.landL === 'ON' || s.lights.landR === 'ON') m.push('LDG LT');
  if (s.adirs.ir.some((ir) => !ir.aligned && ir.mode === 'NAV')) {
    const rem = Math.max(...s.adirs.ir.map((ir) => ir.alignRemaining));
    m.push(`IR IN ALIGN ${Math.ceil(rem / 60)} MN`);
  }
  if (s.hyd.ptuActive) m.push('HYD PTU');
  return m;
}

export class WarningSystem {
  private prevWarn = false;
  private prevCaut = false;
  private seen = new Set<string>();

  update(s: SimState, dt: number, emit: (e: SimEvent) => void): void {
    const w = s.warnings;
    const powered = s.elec.dcBat || s.elec.dcEss;
    if (w.toConfigTest > 0) w.toConfigTest = Math.max(0, w.toConfigTest - dt);
    if (s.afs.apDisconnectWarning > 0)
      s.afs.apDisconnectWarning = Math.max(0, s.afs.apDisconnectWarning - dt);
    if (s.afs.athrDisconnectCaution > 0)
      s.afs.athrDisconnectCaution = Math.max(0, s.afs.athrDisconnectCaution - dt);
    const conds = powered ? evaluate(s) : [];
    const ids = new Set(conds.map((c) => c.id));
    const kept: EcamMessage[] = [];
    for (const c of conds) {
      const old = w.messages.find((m) => m.id === c.id);
      kept.push({
        id: c.id,
        level: c.level,
        title: c.title,
        actions: c.actions,
        since: old?.since ?? s.meta.time,
      });
    }
    // 條件消失：清除確認/CLR 紀錄
    w.acknowledged = w.acknowledged.filter((id) => ids.has(id));
    w.cleared = w.cleared.filter((id) => ids.has(id));
    for (const id of [...this.seen]) if (!ids.has(id)) this.seen.delete(id);
    kept.sort((a, b) => (a.level === b.level ? a.since - b.since : a.level === 'WARNING' ? -1 : 1));
    w.messages = kept;
    w.memos = powered ? memos(s) : [];
    w.masterWarning = kept.some((m) => m.level === 'WARNING' && !w.acknowledged.includes(m.id));
    w.masterCaution = kept.some((m) => m.level === 'CAUTION' && !w.acknowledged.includes(m.id));
    for (const m of kept) {
      if (!this.seen.has(m.id)) {
        this.seen.add(m.id);
        if (m.level === 'CAUTION') emit({ type: 'MASTER_CAUTION', on: true });
      }
    }
    if (w.masterWarning !== this.prevWarn) emit({ type: 'MASTER_WARNING', on: w.masterWarning });
    if (w.masterCaution && !this.prevCaut) emit({ type: 'MASTER_CAUTION', on: true });
    this.prevWarn = w.masterWarning;
    this.prevCaut = w.masterCaution;
    this.autoPage(s, conds);
  }

  private flightControlCheckUntil = 0;

  private autoPage(s: SimState, conds: Cond[]): void {
    const ec = s.ecam;
    if (ec.manualPage) {
      ec.sdPage = ec.manualPage;
      return;
    }
    const top = conds.find((c) => c.page && !s.warnings.cleared.includes(c.id));
    if (top?.page) {
      ec.sdPage = top.page;
      return;
    }
    const f = s.flight;
    const e = s.engines;
    if (f.onGround && (Math.abs(s.input.pitch) > 0.3 || Math.abs(s.input.roll) > 0.3) && f.gs < 30)
      this.flightControlCheckUntil = s.meta.time + 20;
    let page: SdPage;
    if (
      s.apu.state === 'STARTING' ||
      (s.apu.state === 'AVAILABLE' &&
        s.meta.time - s.meta.phaseSince < 10 &&
        s.meta.phase === 'POWERED')
    )
      page = 'APU';
    else if (
      e[0].state === 'STARTING' ||
      e[1].state === 'STARTING' ||
      (s.mech.engMode === 'IGN/START' && f.onGround)
    )
      page = 'ENG';
    else if (s.meta.time < this.flightControlCheckUntil) page = 'F/CTL';
    else if (f.onGround && Math.max(e[0].tla, e[1].tla) >= TLA.FLX - 0.5) page = 'ENG';
    else if (f.onGround && e[0].state === 'OFF' && e[1].state === 'OFF') page = 'DOOR';
    else if (f.onGround) page = 'WHEEL';
    else if (
      s.gear.lever === 'DOWN' ||
      f.radioAltitude < 800 ||
      (s.gear.position[1] < 0.99 && s.gear.position[1] > 0.01)
    )
      page = 'WHEEL';
    else if (f.radioAltitude > 1500) page = 'CRUISE';
    else page = 'ENG';
    ec.sdPage = page;
  }
}
