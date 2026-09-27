/**
 * EngineSystem（LEAP-1A 風格，FADEC 邏輯）與 APU。
 * 啟動需：電源 → 氣源（APU/另一發 bleed ≥ 25 psi）→ MODE IGN/START → MASTER ON → 起動機 → N2 → 點火/燃油 → EGT → N1 穩定。
 * 油門桿位置（TLA）與 A/THR 指令決定 N1 指令；N1/N2 有 spool 慣性。
 */
import { TLA } from './constants';
import type { EngineState, SimEvent, SimState } from './types';

const TMAX = 120_600; // N 單發最大靜推力
export const N1_IDLE_GROUND = 19.5;
export const N1_IDLE_FLIGHT = 24;

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

export interface ThrustLimits {
  toga: number;
  flx: number;
  mct: number;
  clb: number;
  idle: number;
}

/** 依高度/溫度的 N1 限制（%） */
export function thrustLimits(s: SimState): ThrustLimits {
  const alt = s.flight.pressureAltitude;
  const oat = s.flight.oat;
  const altBoost = Math.min(4, alt / 4000);
  const tempPenalty = Math.max(0, oat - 30) * 0.12;
  const toga = clamp(95.5 + altBoost - tempPenalty, 80, 101);
  const flexTemp = s.afs.flexTemp;
  const flx = flexTemp !== null ? clamp(toga - Math.max(0, flexTemp - oat) * 0.18, 78, toga) : toga;
  const mct = clamp(92 + altBoost - tempPenalty, 80, 99);
  const clb = clamp(87.5 + altBoost * 0.8 - tempPenalty, 78, 96);
  const idle = s.flight.onGround
    ? N1_IDLE_GROUND
    : N1_IDLE_FLIGHT + (s.antiIce.eng1 || s.antiIce.eng2 ? 2 : 0);
  return { toga, flx, mct, clb, idle };
}

/** 手動推力：TLA → N1 指令 */
export function manualN1(tla: number, lim: ThrustLimits): number {
  if (tla <= TLA.IDLE) {
    if (tla <= TLA.REV_IDLE) {
      const r = (TLA.REV_IDLE - tla) / (TLA.REV_IDLE - TLA.MAX_REV);
      return lim.idle + r * (72 - lim.idle);
    }
    return lim.idle;
  }
  if (tla <= TLA.CL) return lim.idle + ((tla - TLA.IDLE) / TLA.CL) * (lim.clb - lim.idle);
  if (tla <= TLA.FLX) return lim.clb + ((tla - TLA.CL) / (TLA.FLX - TLA.CL)) * (lim.flx - lim.clb);
  return lim.flx + ((tla - TLA.FLX) / (TLA.TOGA - TLA.FLX)) * (lim.toga - lim.flx);
}

/** 油門桿位置對應的推力上限（A/THR 作動時） */
export function leverLimit(tla: number, lim: ThrustLimits, onGround: boolean): number {
  if (tla >= TLA.TOGA - 0.5) return lim.toga;
  if (tla >= TLA.FLX - 0.5) return onGround ? lim.flx : lim.mct;
  return manualN1(tla, lim);
}

function thrustFromN1(e: EngineState, rho: number, mach: number): number {
  if (e.n1 < 5) return 0;
  const sigma = rho / 1.225;
  const x = clamp((e.n1 - 17) / 83, 0, 1.1);
  const fwd = TMAX * Math.pow(sigma, 0.72) * (1 - 0.28 * mach) * Math.pow(x, 1.75) + 1200 * sigma;
  if (e.reverser > 0.05) {
    return -fwd * 0.42 * e.reverser + fwd * (1 - e.reverser) * 0.2;
  }
  return fwd;
}

export class EngineSystem {
  /** 本步推力（N） */
  readonly thrust: [number, number] = [0, 0];

  update(s: SimState, dt: number, athrN1: number | null, emit: (e: SimEvent) => void): void {
    this.apu(s, dt, emit);
    const lim = thrustLimits(s);
    this.engine(s, 0, dt, lim, athrN1, emit);
    this.engine(s, 1, dt, lim, athrN1, emit);
  }

  private engine(
    s: SimState,
    i: 0 | 1,
    dt: number,
    lim: ThrustLimits,
    athrN1: number | null,
    emit: (e: SimEvent) => void,
  ): void {
    const e = s.engines[i];
    const failed = i === 0 ? s.failures.eng1Fail : s.failures.eng2Fail;
    const side = i === 0 ? 'left' : 'right';
    const fuelAvail = this.fuelAvailable(s, side);
    const ductPress = i === 0 ? s.pneu.ductL : s.pneu.ductR;
    const ignStart = s.mech.engMode === 'IGN/START';
    const crank = s.mech.engMode === 'CRANK';
    const dcPower = s.elec.dcBat || s.elec.dcEss;
    const prevState = e.state;

    e.fuelValve = e.master && !e.firePushed && fuelAvail && !failed;
    // ---- 起動程序 ----
    if (e.master && e.state === 'OFF' && ignStart && dcPower) {
      e.state = 'STARTING';
      e.startTimer = 0;
      emit({ type: 'ENGINE_START', engine: i });
    }
    if (e.state === 'STARTING') {
      e.startTimer += dt;
      e.starterValve = ductPress > 24 && e.n2 < 50;
      e.ignition = e.n2 > 16 && e.n2 < 50;
      if (!e.master || !dcPower) {
        e.state = 'SHUTTING_DOWN';
      } else if (e.starterValve) {
        // 起動機帶動 N2
        e.n2 += (Math.max(0, 26 - e.n2 * 0.25) * 0.14 + (e.n2 > 22 && e.fuelValve ? 1.3 : 0)) * dt;
      } else if (e.n2 >= 50 && e.fuelValve) {
        e.n2 += (58.5 - e.n2) * 0.18 * dt + 0.25 * dt;
      } else if (!e.starterValve && e.n2 < 50) {
        e.n2 = Math.max(0, e.n2 - 1.5 * dt); // 氣源不足：懸置/衰減
      }
      const lit = e.n2 > 22 && e.fuelValve;
      e.ff = lit ? clamp(120 + (e.n2 - 22) * 6, 0, 320) : 0;
      const egtTarget = lit ? 420 + Math.max(0, 48 - Math.abs(e.n2 - 38)) * 5.5 : s.flight.oat + 5;
      e.egt += (egtTarget - e.egt) * 0.5 * dt;
      e.n1 += ((lit ? Math.max(0, (e.n2 - 22) * 0.55) : e.n2 * 0.05) - e.n1) * 0.4 * dt;
      if (e.n2 >= 58) {
        e.state = 'IDLE';
        e.starterValve = false;
        e.ignition = false;
        emit({ type: 'ENGINE_RUNNING', engine: i });
      }
    } else if (crank && e.master === false && ductPress > 24 && e.state === 'OFF') {
      // 乾轉
      e.starterValve = true;
      e.n2 += (22 - e.n2) * 0.1 * dt;
      e.n1 += (e.n2 * 0.2 - e.n1) * 0.3 * dt;
    } else if (e.state === 'OFF') {
      e.starterValve = false;
    }

    // ---- 運轉中 ----
    if ((e.state === 'IDLE' || e.state === 'RUNNING') && (!e.fuelValve || !e.master)) {
      e.state = 'SHUTTING_DOWN';
      emit({ type: 'ENGINE_SHUTDOWN', engine: i });
    }
    if (e.state === 'IDLE' || e.state === 'RUNNING') {
      // 反推：限地面、需液壓
      const hydOk = (i === 0 ? s.hyd.green.pressure : s.hyd.yellow.pressure) > 1500;
      const wantRev = e.tla < -1 && (s.flight.wow[1] || s.flight.wow[2]) && hydOk;
      const wasRev = e.reverser > 0.5;
      e.reverser = clamp(e.reverser + (wantRev ? 0.6 : -0.6) * dt, 0, 1);
      if (e.reverser > 0.5 !== wasRev) emit({ type: 'REVERSE', deployed: e.reverser > 0.5 });
      // N1 指令：A/THR 作動時取 min(A/THR, 桿位上限)
      let cmd = manualN1(e.reverser > 0.9 || e.tla >= 0 ? e.tla : TLA.IDLE, lim);
      if (athrN1 !== null && e.tla > TLA.IDLE + 0.5)
        cmd = clamp(athrN1, lim.idle, leverLimit(e.tla, lim, s.flight.onGround));
      if (e.tla < 0 && e.reverser < 0.9) cmd = lim.idle; // 反推未展開前保持慢車
      cmd = Math.max(cmd, lim.idle);
      cmd -= s.antiIce.engineIce[i] * 8;
      e.n1Cmd = cmd;
      // spool：低 N1 加速較慢
      const accel = e.n1Cmd > e.n1;
      const tau = accel ? 1.2 + Math.max(0, 45 - e.n1) * 0.06 : 1.4;
      e.n1 += (e.n1Cmd - e.n1) * Math.min(1, dt / tau);
      e.n2 += (58.5 + (e.n1 - 19.5) * 0.47 - e.n2) * Math.min(1, dt / 0.8);
      e.egt +=
        (420 +
          (e.n1 - 19.5) * 5.4 +
          Math.max(0, s.flight.oat - 15) * 1.5 +
          (e.antiIce ? 12 : 0) -
          e.egt) *
        Math.min(1, dt / 2.5);
      e.state = e.n1 > lim.idle + 3 ? 'RUNNING' : 'IDLE';
      e.ignition = s.mech.engMode === 'IGN/START' && s.flight.onGround === false;
    }
    if (e.state === 'SHUTTING_DOWN') {
      e.n1 = Math.max(0, e.n1 - (4 + e.n1 * 0.08) * dt);
      e.n2 = Math.max(0, e.n2 - (2.5 + e.n2 * 0.05) * dt);
      e.egt += (s.flight.oat + 40 - e.egt) * 0.08 * dt;
      e.ff = 0;
      e.reverser = clamp(e.reverser - 0.6 * dt, 0, 1);
      if (e.n2 < 1) {
        e.state = 'OFF';
        e.n2 = 0;
        e.n1 = 0;
      }
      // 空中風車：N1 依空速維持
      const windmill = s.flight.ias * 0.09;
      e.n1 = Math.max(e.n1, windmill);
    }
    if (e.state === 'OFF') {
      e.ff = 0;
      e.egt += (s.flight.oat - e.egt) * 0.02 * dt;
      const windmill = s.flight.ias * 0.09;
      e.n1 += (windmill - e.n1) * 0.3 * dt;
      e.n2 += (windmill * 0.6 - e.n2) * 0.3 * dt;
    }
    this.thrust[i] =
      e.state === 'IDLE' || e.state === 'RUNNING'
        ? thrustFromN1(e, s.flight.rho, s.flight.mach)
        : 0;
    e.thrust = this.thrust[i];
    if (e.state === 'IDLE' || e.state === 'RUNNING') e.ff = 250 + Math.abs(e.thrust) * 0.042;
    e.oilPress = e.n2 > 10 ? clamp(15 + e.n2 * 0.7, 0, 90) : 0;
    e.bleedPress = e.n2 > 50 ? 28 + (e.n1 - 19.5) * 0.18 : e.n2 * 0.3;
    e.antiIce = i === 0 ? s.antiIce.eng1 : s.antiIce.eng2;
    // 風扇相位（外部模型）：N1 100% ≈ 3900 rpm
    e.fanAngle = (e.fanAngle + (e.n1 / 100) * 3900 * (Math.PI / 30) * dt) % (Math.PI * 2);
    if (prevState !== e.state && e.state === 'OFF') e.starterValve = false;
  }

  private fuelAvailable(s: SimState, side: 'left' | 'right'): boolean {
    const f = s.fuel;
    const wing = side === 'left' ? f.left : f.right;
    const pumps = side === 'left' ? f.pumps.l1 || f.pumps.l2 : f.pumps.r1 || f.pumps.r2;
    const ctr = f.center > 0 && (f.pumps.c1 || f.pumps.c2);
    const other = side === 'left' ? f.right : f.left;
    // 重力供油（低空、無泵）
    const gravity = s.flight.pressureAltitude < 15000 && wing > 0;
    return (wing > 0 && pumps) || ctr || gravity || (f.xfeed && other > 0);
  }

  private apu(s: SimState, dt: number, emit: (e: SimEvent) => void): void {
    const a = s.apu;
    const dc = s.elec.dcBat || s.elec.dcEss;
    const fuel = s.fuel.left > 0 || s.fuel.center > 0;
    if (s.failures.apuFail && a.state !== 'OFF') a.master = false;
    a.flap += ((a.master && dc ? 1 : 0) - a.flap) * Math.min(1, dt / 3);
    if (a.master && a.startPb && a.state === 'OFF' && a.flap > 0.95 && dc && fuel) {
      a.state = 'STARTING';
      a.timer = 0;
      emit({ type: 'APU_START' });
    }
    switch (a.state) {
      case 'STARTING':
        a.timer += dt;
        a.n = Math.min(100, a.n + (a.n < 60 ? 3.2 : 2.2) * dt);
        a.egt +=
          ((a.n < 50 ? 350 + a.n * 9 : 820 - (a.n - 50) * 7) - a.egt) * Math.min(1, dt / 1.5);
        if (!a.master) a.state = 'SHUTDOWN';
        if (a.n >= 99.5) {
          a.state = 'AVAILABLE';
          a.startPb = false;
          emit({ type: 'APU_AVAIL' });
        }
        break;
      case 'AVAILABLE':
      case 'RUNNING':
        a.n = 100;
        a.egt +=
          (380 + (s.pneu.apuBleed ? 90 : 0) + s.elec.loads.apuLoad * 0.8 - a.egt) *
          Math.min(1, dt / 3);
        if (!a.master) {
          a.state = 'SHUTDOWN';
          a.timer = s.pneu.apuBleed ? 12 : 3; // 冷卻
        }
        break;
      case 'SHUTDOWN':
        if (a.timer > 0) {
          a.timer -= dt;
        } else {
          a.n = Math.max(0, a.n - 4 * dt);
          a.egt += (s.flight.oat + 30 - a.egt) * 0.05 * dt;
          if (a.n <= 0) a.state = 'OFF';
        }
        if (a.master && a.n > 50) a.state = 'AVAILABLE';
        break;
      default:
        a.n = 0;
        a.egt += (s.flight.oat - a.egt) * 0.02 * dt;
    }
    a.bleedPress = a.state === 'AVAILABLE' && s.pneu.apuBleed ? 36 : 0;
  }
}
