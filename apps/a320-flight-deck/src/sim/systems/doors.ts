/**
 * 艙門：停機位（發動機關閉、防撞燈關、停機剎車設定）由地勤開啟前左客艙門與貨艙門；
 * 防撞燈開啟、任一發動機運轉或飛機移動時，地勤關門（推出前程序）。
 */
import type { DoorsState, SimState } from '../types';

const OPEN_AT_GATE: (keyof DoorsState)[] = ['cabinFwdL', 'cargoFwd', 'cargoAft'];

export class DoorSystem {
  private parkedFor = 0;

  update(s: SimState, dt: number): void {
    const d = s.doors;
    const enginesOff = s.engines[0].state === 'OFF' && s.engines[1].state === 'OFF';
    const mustClose = s.lights.beacon || !enginesOff || s.flight.gs > 1 || !s.flight.onGround;
    const atGate =
      s.flight.onGround &&
      s.flight.gs < 0.5 &&
      s.gear.parkingBrake &&
      enginesOff &&
      !s.lights.beacon;
    this.parkedFor = atGate ? this.parkedFor + dt : 0;
    for (const k of Object.keys(d) as (keyof DoorsState)[]) {
      const open = !mustClose && this.parkedFor > 8 && OPEN_AT_GATE.includes(k);
      const target = mustClose ? 0 : open || d[k] > 0.5 ? 1 : 0;
      const rate = 0.25 * dt;
      d[k] = d[k] < target ? Math.min(target, d[k] + rate) : Math.max(target, d[k] - rate);
    }
  }
}

/** ECAM 顯示用名稱 */
export const DOOR_LABELS: Record<keyof DoorsState, string> = {
  cabinFwdL: 'L FWD CABIN',
  cabinFwdR: 'R FWD CABIN',
  cabinAftL: 'L AFT CABIN',
  cabinAftR: 'R AFT CABIN',
  cargoFwd: 'FWD CARGO',
  cargoAft: 'AFT CARGO',
  avionics: 'AVIONICS',
};
