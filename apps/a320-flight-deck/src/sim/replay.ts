/**
 * Replay：以 10 Hz 記錄最近 120 秒的低頻狀態快照；重播時插值寫入獨立的 SimState 複本（不重新模擬物理）。
 */
import { Quaternion, Vector3 } from 'three';
import type { SimState } from './types';

const RATE = 10;
const CAPACITY = 120 * RATE;
/** 每個快照的欄位數：位置 3、四元數 4、舵面/發動機/空速 12、擾流板 10、起落架 13、飛行量 7、著陸燈 2 */
const FIELDS = 3 + 4 + 12 + 10 + 13 + 7 + 2;

export class ReplayRecorder {
  private readonly buf = new Float32Array(CAPACITY * FIELDS);
  private readonly times = new Float64Array(CAPACITY);
  private head = 0;
  private count = 0;
  private lastT = -1;

  reset(): void {
    this.head = 0;
    this.count = 0;
    this.lastT = -1;
  }

  get duration(): number {
    if (this.count < 2) return 0;
    return (
      this.times[(this.head - 1 + CAPACITY) % CAPACITY] -
      this.times[(this.head - this.count + CAPACITY) % CAPACITY]
    );
  }

  record(s: SimState): void {
    if (s.meta.time - this.lastT < 1 / RATE) return;
    this.lastT = s.meta.time;
    const o = this.head * FIELDS;
    const b = this.buf;
    const a = s.aircraft;
    const c = s.controls;
    const g = s.gear;
    let k = o;
    b[k++] = a.position.x;
    b[k++] = a.position.y;
    b[k++] = a.position.z;
    b[k++] = a.quaternion.x;
    b[k++] = a.quaternion.y;
    b[k++] = a.quaternion.z;
    b[k++] = a.quaternion.w;
    b[k++] = c.elevator;
    b[k++] = c.ths;
    b[k++] = c.aileronL;
    b[k++] = c.aileronR;
    b[k++] = c.rudder;
    b[k++] = c.flapsAngle;
    b[k++] = c.slatsAngle;
    b[k++] = s.engines[0].n1;
    b[k++] = s.engines[1].n1;
    b[k++] = s.engines[0].reverser;
    b[k++] = s.engines[1].reverser;
    b[k++] = s.flight.ias;
    for (let i = 0; i < 5; i++) b[k++] = c.spoilersL[i];
    for (let i = 0; i < 5; i++) b[k++] = c.spoilersR[i];
    for (let i = 0; i < 3; i++) b[k++] = g.position[i];
    for (let i = 0; i < 3; i++) b[k++] = g.doors[i];
    for (let i = 0; i < 3; i++) b[k++] = g.compression[i];
    for (let i = 0; i < 3; i++) b[k++] = g.wheelSpin[i];
    b[k++] = g.steerAngle;
    b[k++] = s.flight.radioAltitude;
    b[k++] = s.flight.pitch;
    b[k++] = s.flight.roll;
    b[k++] = s.flight.heading;
    b[k++] = s.flight.altitudeMsl;
    b[k++] = s.flight.vs;
    b[k++] = s.flight.gs;
    b[k++] = s.lights.landingLightExtension[0];
    b[k++] = s.lights.landingLightExtension[1];
    this.times[this.head] = s.meta.time;
    this.head = (this.head + 1) % CAPACITY;
    this.count = Math.min(CAPACITY, this.count + 1);
  }

  /** 將 0..duration 的相對時間插值寫入 target（位置/姿態/外觀量） */
  sample(rel: number, target: SimState, pos: Vector3, quat: Quaternion): void {
    if (this.count < 2) return;
    const start = (this.head - this.count + CAPACITY) % CAPACITY;
    const t0 = this.times[start] + Math.max(0, Math.min(rel, this.duration));
    // 二分搜尋
    let lo = 0;
    let hi = this.count - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (this.times[(start + mid) % CAPACITY] <= t0) lo = mid;
      else hi = mid;
    }
    const i0 = (start + lo) % CAPACITY;
    const i1 = (start + hi) % CAPACITY;
    const ta = this.times[i0];
    const tb = this.times[i1];
    const u = tb > ta ? Math.max(0, Math.min(1, (t0 - ta) / (tb - ta))) : 0;
    const A = i0 * FIELDS;
    const B = i1 * FIELDS;
    const b = this.buf;
    const L = (k: number): number => b[A + k] + (b[B + k] - b[A + k]) * u;
    pos.set(L(0), L(1), L(2));
    const qa = new Quaternion(b[A + 3], b[A + 4], b[A + 5], b[A + 6]);
    quat.set(b[B + 3], b[B + 4], b[B + 5], b[B + 6]);
    quat.copy(qa.slerp(quat, u));
    const c = target.controls;
    let k = 7;
    c.elevator = L(k++);
    c.ths = L(k++);
    c.aileronL = L(k++);
    c.aileronR = L(k++);
    c.rudder = L(k++);
    c.flapsAngle = L(k++);
    c.slatsAngle = L(k++);
    target.engines[0].n1 = L(k++);
    target.engines[1].n1 = L(k++);
    target.engines[0].reverser = L(k++);
    target.engines[1].reverser = L(k++);
    target.flight.ias = L(k++);
    for (let i = 0; i < 5; i++) c.spoilersL[i] = L(k++);
    for (let i = 0; i < 5; i++) c.spoilersR[i] = L(k++);
    const g = target.gear;
    for (let i = 0; i < 3; i++) g.position[i] = L(k++);
    for (let i = 0; i < 3; i++) g.doors[i] = L(k++);
    for (let i = 0; i < 3; i++) g.compression[i] = L(k++);
    for (let i = 0; i < 3; i++) g.wheelSpin[i] = L(k++);
    g.steerAngle = L(k++);
    target.flight.radioAltitude = L(k++);
    target.flight.pitch = L(k++);
    target.flight.roll = L(k++);
    target.flight.heading = L(k++);
    target.flight.altitudeMsl = L(k++);
    target.flight.vs = L(k++);
    target.flight.gs = L(k++);
    target.lights.landingLightExtension[0] = L(k++);
    target.lights.landingLightExtension[1] = L(k++);
    target.aircraft.position.copy(pos);
    target.aircraft.quaternion.copy(quat);
  }
}

/** 深拷貝狀態（重播用複本） */
export function cloneState(s: SimState): SimState {
  const c = structuredClone({
    ...s,
    aircraft: {
      ...s.aircraft,
      position: null,
      velocity: null,
      acceleration: null,
      quaternion: null,
    },
  }) as unknown as SimState;
  c.aircraft.position = new Vector3().copy(s.aircraft.position);
  c.aircraft.velocity = new Vector3().copy(s.aircraft.velocity);
  c.aircraft.acceleration = new Vector3().copy(s.aircraft.acceleration);
  c.aircraft.quaternion = new Quaternion().copy(s.aircraft.quaternion);
  return c;
}
