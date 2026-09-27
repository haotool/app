/**
 * AutopilotDemonstrationController：扮演虛擬機師，只透過座艙指令（sim.command）與側桿/踏板/手輪輸入操作飛機，
 * 飛機本身仍由同一套 FBW + 物理 + AutoFlight 飛行。不存在任何預錄軌跡。
 */
import type { Command } from './controlDefs';
import { AIRPORT, TLA } from './constants';
import { wrap180, bearing } from './autoflight/navigation';
import type { SimState } from './types';

type Stage =
  | 'LINEUP'
  | 'ROLL'
  | 'ROTATE'
  | 'CLIMB'
  | 'ENROUTE'
  | 'APPROACH'
  | 'FLARE'
  | 'ROLLOUT'
  | 'TAXI'
  | 'DONE';

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

export class DemoPilot {
  stage: Stage = 'LINEUP';
  private t = 0;
  private rotateStart = 0;
  private done = new Set<string>();
  private taxiPath: { x: number; z: number }[] = [];
  private taxiIdx = 0;
  private apDiscPresses = 0;

  constructor(private readonly command: (c: Command) => void) {}

  reset(): void {
    this.stage = 'LINEUP';
    this.t = 0;
    this.done.clear();
    this.taxiPath = [];
    this.taxiIdx = 0;
    this.apDiscPresses = 0;
  }

  /** 只執行一次的動作 */
  private once(key: string, fn: () => void): void {
    if (this.done.has(key)) return;
    this.done.add(key);
    fn();
  }

  /** 下降過快 → 減速板（MORE DRAG） */
  private speedbrake(s: SimState): void {
    const a = s.afs;
    const f = s.flight;
    const descending = a.vertical === 'DES' || a.vertical === 'OP DES';
    const sb = s.controls.speedbrakeHandle;
    if (descending && f.ias > a.targetSpeed + 10 && s.gear.lever === 'UP' && sb < 0.4)
      this.command({ type: 'set', id: 'spdbrk', value: 0.5 });
    else if (sb > 0 && (!descending || f.ias < a.targetSpeed + 2 || s.gear.lever === 'DOWN'))
      this.command({ type: 'set', id: 'spdbrk', value: 0 });
  }

  private levers(tla: number): void {
    this.command({ type: 'set', id: 'thr.lever1', value: tla });
    this.command({ type: 'set', id: 'thr.lever2', value: tla });
  }

  update(s: SimState, dt: number): void {
    this.t += dt;
    const f = s.flight;
    const a = s.afs;
    const inp = s.input;
    inp.owner = 'AUTOPILOT';
    inp.tiller = 0;
    const apOn = a.ap1 || a.ap2;
    // 手飛時跟隨 FD（起飛段）
    const followFd = (): void => {
      inp.pitch = clamp((a.fdPitch - f.pitch) * 0.18 - s.aircraft.q * 1.5, -0.6, 0.8);
      inp.roll = clamp((a.fdRoll - f.roll) * 0.05, -0.5, 0.5);
    };
    switch (this.stage) {
      case 'LINEUP':
        inp.pitch = 0;
        inp.roll = 0;
        inp.brakeL = inp.brakeR = 0;
        if (s.gear.parkingBrake) this.command({ type: 'press', id: 'pbrk' });
        if (this.t > 2.5) {
          this.levers(TLA.FLX);
          this.stage = 'ROLL';
        }
        break;
      case 'ROLL':
        inp.rudder = clamp(a.fdYaw * 1.2, -1, 1);
        inp.pitch = f.ias > 80 ? 0 : 0.0;
        if (f.ias >= a.vr) {
          this.stage = 'ROTATE';
          this.rotateStart = this.t;
        }
        break;
      case 'ROTATE': {
        inp.rudder = f.onGround ? clamp(a.fdYaw * 1.2, -1, 1) : 0;
        const target = Math.min(12.5, (this.t - this.rotateStart) * 3);
        inp.pitch = clamp((target - f.pitch) * 0.2 - s.aircraft.q * 2, -0.3, 0.9);
        inp.roll = clamp(-f.roll * 0.05, -0.3, 0.3);
        if (!f.onGround && f.radioAltitude > 35) this.stage = 'CLIMB';
        break;
      }
      case 'CLIMB':
        inp.rudder = 0;
        if (!apOn) followFd();
        else {
          inp.pitch = 0;
          inp.roll = 0;
        }
        if (f.vs > 300 && f.radioAltitude > 30)
          this.once('gearUp', () => this.command({ type: 'press', id: 'gear.lever' }));
        if (f.radioAltitude > 150)
          this.once('ap1', () => this.command({ type: 'press', id: 'fcu.ap1' }));
        if (f.radioAltitude > a.thrRedAlt) this.once('clb', () => this.levers(TLA.CL));
        if (s.controls.flapConfig === '1' && f.ias > f.sSpeed + 3)
          this.once('flaps0', () => this.command({ type: 'set', id: 'flaps', value: 0 }));
        if (s.controls.flapHandle === 0 && f.radioAltitude > 3000) this.stage = 'ENROUTE';
        break;
      case 'ENROUTE':
        inp.pitch = 0;
        inp.roll = 0;
        if (!apOn && !f.onGround)
          this.once('apRe', () => this.command({ type: 'press', id: 'fcu.ap1' }));
        // TOD 前 10 nm 預設下降高度
        if (s.fplan.todDist < 10 && s.fcu.alt > 3000 && a.phase !== 'CLIMB') {
          this.once('altSet', () =>
            this.command({
              type: 'rotate',
              id: 'fcu.alt',
              delta: -Math.round((s.fcu.alt - 3000) / s.fcu.altInc),
            }),
          );
        }
        this.speedbrake(s);
        if (a.phase === 'APPROACH' || s.fplan.distToDest < 22) this.stage = 'APPROACH';
        break;
      case 'APPROACH': {
        inp.pitch = 0;
        inp.roll = 0;
        const d = s.fplan.distToDest;
        this.speedbrake(s);
        this.once('seatbelt', () => this.command({ type: 'set', id: 'sign.seatbelts', value: 2 }));
        this.once('abrk', () => this.command({ type: 'press', id: 'abrk.lo' }));
        // 依 VFE 逐段放外形；距離觸發放輪以增加阻力（穩定進場：1000 ft 前完成）
        const h = s.controls.flapHandle;
        if (h === 0 && d < 20 && f.ias < 225) this.command({ type: 'set', id: 'flaps', value: 1 });
        if (h === 1 && d < 14 && f.ias < 195) this.command({ type: 'set', id: 'flaps', value: 2 });
        if (s.ils.locValid && (a.lateral === 'NAV' || a.lateral === 'HDG') && d < 17)
          this.once('appr', () => this.command({ type: 'press', id: 'fcu.appr' }));
        if (a.apprArmed || a.lateral === 'LOC' || a.lateral === 'LOC*')
          this.once('ap2', () => this.command({ type: 'press', id: 'fcu.ap2' }));
        if (d < 11 || a.vertical === 'G/S' || a.vertical === 'G/S*') {
          this.once('gearDn', () => this.command({ type: 'press', id: 'gear.lever' }));
          this.once('arm', () => this.command({ type: 'press', id: 'spdbrk' }));
        }
        if (s.gear.lever === 'DOWN' && h === 2 && f.ias < 180)
          this.command({ type: 'set', id: 'flaps', value: 3 });
        if (h === 3 && f.ias < 172) this.command({ type: 'set', id: 'flaps', value: 4 });
        if (a.retardCalled || (f.radioAltitude < 15 && a.vertical === 'FLARE')) {
          this.levers(TLA.IDLE);
          this.stage = 'FLARE';
        }
        if (!apOn && !f.onGround && f.radioAltitude > 200)
          this.once('apBack', () => this.command({ type: 'press', id: 'fcu.ap1' }));
        break;
      }
      case 'FLARE':
        this.levers(TLA.IDLE);
        if (f.wow[1] && f.wow[2]) this.stage = 'ROLLOUT';
        break;
      case 'ROLLOUT': {
        inp.pitch = 0;
        const gs = f.gs;
        if (gs > 70) this.once('rev', () => this.levers(TLA.MAX_REV));
        if (gs < 70 && gs > 40) this.once('revIdle', () => this.levers(TLA.REV_IDLE));
        if (gs <= 40) {
          this.once('idle', () => this.levers(TLA.IDLE));
          if (apOn && this.apDiscPresses === 0) {
            this.apDiscPresses = 1;
            this.command({ type: 'press', id: 'sidestick1.apdisc' });
            this.command({ type: 'press', id: 'sidestick1.apdisc' });
          }
          inp.rudder = clamp(-wrap180(f.heading - 270) * 0.1 + s.aircraft.position.z * 0.02, -1, 1);
          // 人工剎車至 18 kt（同時解除自動剎車）
          const brake = gs > 18 ? 0.55 : 0;
          inp.brakeL = inp.brakeR = brake;
        }
        if (gs < 20 && !apOn) {
          this.buildTaxiPath(s);
          this.once('after', () => {
            this.command({ type: 'set', id: 'flaps', value: 0 });
            if (s.controls.spoilersArmed) this.command({ type: 'press', id: 'spdbrk' });
            this.command({ type: 'set', id: 'lt.strobe', value: 1 });
            this.command({ type: 'set', id: 'lt.landL', value: 0 });
            this.command({ type: 'set', id: 'lt.landR', value: 0 });
            this.command({ type: 'set', id: 'lt.nose', value: 1 });
            this.command({ type: 'set', id: 'lt.rwyturnoff', value: 1 });
          });
          this.stage = 'TAXI';
        }
        break;
      }
      case 'TAXI':
        this.taxi(s);
        break;
      case 'DONE':
        inp.brakeL = inp.brakeR = 0;
        inp.rudder = 0;
        break;
    }
  }

  private buildTaxiPath(s: SimState): void {
    const x = s.aircraft.position.x;
    // 向西滑行：選前方第一條聯絡道（至少 250 m）
    const exitX = Math.floor((x - 250) / 400) * 400;
    const tz = AIRPORT.taxiwayZ;
    const gate = { x: 120, z: -300 };
    this.taxiPath = [
      { x: exitX + 60, z: 0 },
      { x: exitX, z: -60 },
      { x: exitX, z: tz + 40 },
      { x: exitX + (gate.x > exitX ? 40 : -40), z: tz },
      { x: gate.x - (gate.x > exitX ? 60 : -60), z: tz },
      { x: gate.x, z: tz - 50 },
      { x: gate.x, z: gate.z },
    ];
    this.taxiIdx = 0;
  }

  private taxi(s: SimState): void {
    const inp = s.input;
    const f = s.flight;
    const p = s.aircraft.position;
    const tgt = this.taxiPath[this.taxiIdx];
    if (!tgt) {
      inp.brakeL = inp.brakeR = 1;
      inp.tiller = 0;
      if (f.gs < 0.5) {
        this.once('park', () => {
          this.command({ type: 'press', id: 'pbrk' });
          this.command({ type: 'set', id: 'lt.nose', value: 0 });
          this.command({ type: 'set', id: 'lt.rwyturnoff', value: 0 });
          this.command({ type: 'set', id: 'sign.seatbelts', value: 0 });
          // 到位關車：發動機主開關、防撞燈關閉後地勤開門
          this.command({ type: 'set', id: 'eng.master1', value: 0 });
          this.command({ type: 'set', id: 'eng.master2', value: 0 });
          this.command({ type: 'set', id: 'lt.beacon', value: 0 });
        });
        this.stage = 'DONE';
      }
      return;
    }
    const dist = Math.hypot(tgt.x - p.x, tgt.z - p.z);
    const brg = bearing(tgt.x - p.x, tgt.z - p.z);
    const err = wrap180(brg - f.heading);
    inp.tiller = clamp(err / 35, -1, 1);
    inp.rudder = 0;
    const isLast = this.taxiIdx === this.taxiPath.length - 1;
    const targetSpeed = isLast ? Math.min(12, dist / 6) : Math.abs(err) > 25 ? 8 : 16;
    const e = targetSpeed - f.gs;
    const tla = e > 2 ? 6 : 0;
    this.command({ type: 'set', id: 'thr.lever1', value: tla });
    this.command({ type: 'set', id: 'thr.lever2', value: tla });
    const brake = e < -2 ? clamp(-e * 0.08, 0, 0.6) : 0;
    inp.brakeL = inp.brakeR = brake;
    if (dist < (isLast ? 4 : 25)) this.taxiIdx++;
  }
}
