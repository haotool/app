/**
 * CameraDirector：座艙眼位、機體掛載鏡頭、自由外部鏡頭與 CINEMATIC_AUTO 電影運鏡。
 * 只移動攝影機，不修改 SimState；一律以 frame.pose 計算（重播時同樣適用）。
 */
import { MathUtils, Quaternion, Vector3, type PerspectiveCamera } from 'three';
import { AIRCRAFT, AIRPORT } from '../../sim/constants';
import { groundHeight } from '../../sim/terrain';
import type { SimEvent } from '../../sim/types';
import type { FrameContext } from '../types';
import {
  EVENT_COOLDOWN,
  HISTORY_SIZE,
  pickShot,
  type Rig,
  type ShotCategory,
  type ShotDef,
  type ShotNeed,
} from './shots';

export type CameraMode =
  | 'CAPTAIN_EYE'
  | 'FO_EYE'
  | 'CENTER_COCKPIT'
  | 'PEDESTAL_CLOSEUP'
  | 'OVERHEAD_CLOSEUP'
  | 'WING_LEFT'
  | 'WING_RIGHT'
  | 'TAIL'
  | 'NOSE'
  | 'GEAR'
  | 'ENGINE_LEFT'
  | 'ENGINE_RIGHT'
  | 'EXTERNAL_CHASE'
  | 'RUNWAY_SIDE'
  | 'TOWER_VIEW'
  | 'FLYBY'
  | 'ORBIT'
  | 'CINEMATIC_AUTO';

export const CAMERA_MODES: readonly CameraMode[] = [
  'CAPTAIN_EYE',
  'FO_EYE',
  'CENTER_COCKPIT',
  'PEDESTAL_CLOSEUP',
  'OVERHEAD_CLOSEUP',
  'WING_LEFT',
  'WING_RIGHT',
  'TAIL',
  'NOSE',
  'GEAR',
  'ENGINE_LEFT',
  'ENGINE_RIGHT',
  'EXTERNAL_CHASE',
  'RUNWAY_SIDE',
  'TOWER_VIEW',
  'FLYBY',
  'ORBIT',
  'CINEMATIC_AUTO',
];

/** 手動模式對應取景（座艙固定構圖與機體掛載） */
const MANUAL_RIGS: Partial<Record<CameraMode, Rig>> = {
  CAPTAIN_EYE: { kind: 'cockpit', eye: 'capt', yaw: 0, pitch: -12, panRate: 0 },
  FO_EYE: { kind: 'cockpit', eye: 'fo', yaw: 0, pitch: -12, panRate: 0 },
  CENTER_COCKPIT: { kind: 'cockpit', eye: 'center', yaw: 0, pitch: -10, panRate: 0 },
  PEDESTAL_CLOSEUP: { kind: 'cockpit', eye: 'pedestal', yaw: 0, pitch: -62, panRate: 0 },
  OVERHEAD_CLOSEUP: { kind: 'cockpit', eye: 'center', yaw: 0, pitch: 70, panRate: 0 },
  WING_LEFT: {
    kind: 'mount',
    pos: [-2.7, 1.1, 2.8],
    target: [-16.5, -0.4, 2.5],
    drift: [0, 0, 0],
    inside: false,
  },
  WING_RIGHT: {
    kind: 'mount',
    pos: [2.7, 1.1, 2.8],
    target: [16.5, -0.4, 2.5],
    drift: [0, 0, 0],
    inside: false,
  },
  TAIL: { kind: 'mount', pos: [0, 8.3, 30], target: [0, 1.2, -6], drift: [0, 0, 0], inside: false },
  NOSE: {
    kind: 'mount',
    pos: [2.6, -1.4, -27],
    target: [0, 0.2, -13],
    drift: [0, 0, 0],
    inside: false,
  },
  GEAR: {
    kind: 'mount',
    pos: [-1.2, -3.4, -3.8],
    target: [-3.8, -2.9, 1.4],
    drift: [0, 0, 0],
    inside: false,
  },
  ENGINE_LEFT: {
    kind: 'mount',
    pos: [-9.4, -1.3, -11.2],
    target: [-5.75, -2.15, -6.2],
    drift: [0, 0, 0],
    inside: false,
  },
  ENGINE_RIGHT: {
    kind: 'mount',
    pos: [9.4, -1.3, -11.2],
    target: [5.75, -2.15, -6.2],
    drift: [0, 0, 0],
    inside: false,
  },
  EXTERNAL_CHASE: { kind: 'chase', back: 46, up: 9, side: 0 },
  ORBIT: { kind: 'orbit', dist: 60, elev: 12, rate: 0 },
  RUNWAY_SIDE: { kind: 'world', spot: 'runwaySide', frame: 55 },
  TOWER_VIEW: { kind: 'world', spot: 'tower', frame: 50 },
  FLYBY: { kind: 'world', spot: 'flyby', frame: 70 },
};

const EYE_CENTER = { x: 0, y: 0.7, z: -13.85 };
/** 中央操縱台特寫：位於兩座椅之間上方 */
const EYE_PEDESTAL = { x: 0, y: 0.32, z: -14.25 };
const DEG = Math.PI / 180;
const Y_AXIS = new Vector3(0, 1, 0);
const X_AXIS = new Vector3(1, 0, 0);

export class CameraDirector {
  mode: CameraMode = 'CAPTAIN_EYE';
  inCockpit = true;
  currentShot: { id: string; category: ShotCategory; lens: number } | null = null;

  private readonly camera: PerspectiveCamera;
  private reducedMotion = false;
  private clock = 0;
  // 使用者環視 / 環繞
  private lookYaw = 0;
  private lookPitch = 0;
  private lookYawSm = 0;
  private lookPitchSm = 0;
  private fovScale = 1;
  private orbitAz = 200;
  private orbitEl = 12;
  private orbitDist = 60;
  private orbitAzVel = 0;
  private orbitElVel = 0;
  private chaseDist = 46;
  private chaseYaw = 0;
  private chaseEl = 8;
  // 頭部慣性
  private readonly headOffset = new Vector3();
  private headPitchLag = 0;
  // 電影運鏡
  private shot: ShotDef | null = null;
  private shotStart = 0;
  private shotDur = 0;
  private pickCount = 0;
  private readonly history: string[] = [];
  private readonly lastUsed = new Map<string, number>();
  private readonly lastEventTime = new Map<SimEvent['type'], number>();
  private pendingEvent: { type: SimEvent['type']; time: number } | null = null;
  private readonly anchor = new Vector3();
  private anchorValid = false;
  private blendT = 1;
  private readonly blendFromPos = new Vector3();
  private readonly blendFromQuat = new Quaternion();
  // 追隨平滑
  private readonly chaseDir = new Vector3(0, 0, 1);
  private chaseInit = false;
  private readonly prevPose = new Vector3();
  private readonly vel = new Vector3();
  private posePrimed = false;
  private lastNear = -1;
  private lastFov = -1;
  // 暫存
  private readonly tPos = new Vector3();
  private readonly tTarget = new Vector3();
  private readonly tUp = new Vector3();
  private readonly tA = new Vector3();
  private readonly tB = new Vector3();
  private readonly fwdH = new Vector3();
  private readonly rightH = new Vector3();
  private readonly qA = new Quaternion();
  private readonly qB = new Quaternion();
  private readonly qInv = new Quaternion();

  constructor(camera: PerspectiveCamera) {
    this.camera = camera;
  }

  get shotHistory(): readonly string[] {
    return this.history;
  }

  setMode(m: CameraMode): void {
    if (m === this.mode) return;
    this.mode = m;
    this.resetLook();
    this.anchorValid = false;
    this.chaseInit = false;
    this.blendT = 1;
    if (m === 'CINEMATIC_AUTO') {
      this.shot = null;
    } else {
      this.currentShot = null;
    }
  }

  cycleQuick(): void {
    const order: CameraMode[] = ['CAPTAIN_EYE', 'ORBIT', 'WING_LEFT', 'CINEMATIC_AUTO'];
    const i = order.indexOf(this.mode);
    this.setMode(order[(i + 1) % order.length]);
  }

  look(dxPx: number, dyPx: number): void {
    if (this.mode === 'ORBIT' || this.mode === 'EXTERNAL_CHASE') {
      this.orbitAzVel -= dxPx * 6;
      this.orbitElVel += dyPx * 3;
      return;
    }
    const k = 0.18 * this.fovScale;
    this.lookYaw = MathUtils.clamp(this.lookYaw - dxPx * k, -150, 150);
    this.lookPitch = MathUtils.clamp(this.lookPitch - dyPx * k, -60, 75);
  }

  zoom(delta: number): void {
    if (this.mode === 'ORBIT') {
      this.orbitDist = MathUtils.clamp(this.orbitDist * (1 + delta * 0.001), 16, 600);
    } else if (this.mode === 'EXTERNAL_CHASE') {
      this.chaseDist = MathUtils.clamp(this.chaseDist * (1 + delta * 0.001), 20, 300);
    } else {
      this.fovScale = MathUtils.clamp(this.fovScale * (1 + delta * 0.0008), 0.45, 1.25);
    }
  }

  resetLook(): void {
    this.chaseYaw = 0;
    this.chaseEl = 8;
    this.lookYaw = 0;
    this.lookPitch = 0;
    this.fovScale = 1;
  }

  setReducedMotion(v: boolean): void {
    this.reducedMotion = v;
  }

  onSimEvent(e: SimEvent): void {
    if (e.type === 'RESET') {
      this.history.length = 0;
      this.lastUsed.clear();
      this.lastEventTime.clear();
      this.shot = null;
      this.chaseInit = false;
      return;
    }
    if (this.mode !== 'CINEMATIC_AUTO') return;
    const cd = EVENT_COOLDOWN[e.type];
    if (cd === undefined) return;
    const last = this.lastEventTime.get(e.type);
    if (last !== undefined && this.clock - last < cd) return;
    this.lastEventTime.set(e.type, this.clock);
    this.pendingEvent = { type: e.type, time: this.clock };
  }

  update(frame: FrameContext): void {
    const dt = Math.min(frame.dt, 0.1);
    this.clock += dt;
    this.updateVelocity(frame, dt);
    this.updateHorizontalAxes(frame);

    let rig: Rig;
    if (this.mode === 'CINEMATIC_AUTO') {
      rig = this.updateCinematic(frame);
    } else {
      rig = MANUAL_RIGS[this.mode] ?? { kind: 'chase', back: 46, up: 9, side: 0 };
    }
    this.applyRig(rig, frame, dt);
    this.applyBlend(dt);
  }

  // ---------------------------------------------------------------------------
  // 電影運鏡
  // ---------------------------------------------------------------------------
  private updateCinematic(frame: FrameContext): Rig {
    const elapsed = this.clock - this.shotStart;
    const ev = this.pendingEvent;
    if (ev && this.clock - ev.time > 3) this.pendingEvent = null;
    const eventCut = this.pendingEvent !== null && elapsed > 2;
    if (!this.shot || elapsed > this.shotDur || eventCut) {
      this.selectNext(frame, eventCut ? (this.pendingEvent?.type ?? null) : null);
      this.pendingEvent = null;
    }
    const shot = this.shot;
    if (!shot) return { kind: 'chase', back: 46, up: 9, side: 0 };
    return shot.rig;
  }

  private selectNext(frame: FrameContext, event: SimEvent['type'] | null): void {
    const prevShot = this.shot;
    const next = pickShot({
      phase: frame.state.meta.phase,
      now: this.clock,
      history: this.history,
      lastUsed: this.lastUsed,
      event,
      dusk: frame.lighting.dusk,
      pickCount: this.pickCount++,
      feasible: (n) => this.feasible(n, frame),
    });
    this.shot = next;
    this.shotStart = this.clock;
    const span = next.dur[1] - next.dur[0];
    const frac = (((this.pickCount * 0.618) % 1) + 1) % 1;
    this.shotDur = (next.dur[0] + span * frac) * (this.reducedMotion ? 1.4 : 1);
    this.history.unshift(next.id);
    if (this.history.length > HISTORY_SIZE) this.history.length = HISTORY_SIZE;
    this.lastUsed.set(next.id, this.clock);
    this.currentShot = { id: next.id, category: next.category, lens: next.lens };
    this.anchorValid = false;
    this.chaseInit = false;
    this.orbitAz = next.side === 'L' ? 250 : 110;
    // 大多為硬切；外部 → 外部偶爾平滑轉場
    const ext = (c: ShotCategory): boolean => c === 'EXTERNAL' || c === 'WIDE';
    if (
      prevShot &&
      ext(prevShot.category) &&
      ext(next.category) &&
      this.pickCount % 4 === 0 &&
      !this.reducedMotion
    ) {
      this.blendFromPos.copy(this.camera.position);
      this.blendFromQuat.copy(this.camera.quaternion);
      this.blendT = 0;
    } else {
      this.blendT = 1;
    }
  }

  private feasible(need: ShotNeed | undefined, frame: FrameContext): boolean {
    if (!need) return true;
    const p = frame.pose.position;
    const onGround = frame.state.flight.onGround;
    switch (need) {
      case 'ground':
        return onGround;
      case 'air':
        return !onGround;
      case 'high':
        return !onGround && p.y > 1200;
      case 'nearRunway':
        return (
          Math.abs(p.z - AIRPORT.runway.z) < 3000 &&
          p.x > AIRPORT.runway.thr09X - 4000 &&
          p.x < AIRPORT.runway.thr27X + 14000 &&
          p.y < 1500
        );
      case 'nearTower':
        return Math.hypot(p.x - AIRPORT.tower.x, p.z - AIRPORT.tower.z) < 14000 && p.y < 1500;
    }
  }

  // ---------------------------------------------------------------------------
  // 取景
  // ---------------------------------------------------------------------------
  private applyRig(rig: Rig, frame: FrameContext, dt: number): void {
    const cam = this.camera;
    const pose = frame.pose;
    const aspect = cam.aspect > 0 ? cam.aspect : 1;
    const shotT = this.clock - this.shotStart;
    switch (rig.kind) {
      case 'cockpit': {
        this.inCockpit = true;
        this.setClip(0.03);
        const e =
          rig.eye === 'capt'
            ? AIRCRAFT.eyeCaptain
            : rig.eye === 'fo'
              ? AIRCRAFT.eyeFo
              : rig.eye === 'pedestal'
                ? EYE_PEDESTAL
                : EYE_CENTER;
        const cinematic = this.mode === 'CINEMATIC_AUTO';
        const yawT = rig.yaw + (cinematic ? rig.panRate * shotT : this.lookYaw);
        const pitchT = rig.pitch + (cinematic ? 0 : this.lookPitch);
        const k = 1 - Math.exp(-dt * 10);
        this.lookYawSm += (yawT - this.lookYawSm) * k;
        this.lookPitchSm += (pitchT - this.lookPitchSm) * k;
        this.updateHeadInertia(frame, dt);
        const pitch = MathUtils.clamp(this.lookPitchSm + this.headPitchLag, -70, 80);
        const yaw = this.lookYawSm;
        // 看上方後仰、看下方前傾，側看時稍往外移
        const up = Math.max(0, pitch) / 75;
        const down = Math.max(0, -pitch) / 60;
        const side = Math.sin(yaw * DEG);
        const lx = MathUtils.clamp(e.x - side * 0.12 + this.headOffset.x, e.x - 0.25, e.x + 0.25);
        const ly = MathUtils.clamp(
          e.y + up * 0.05 - down * 0.08 + this.headOffset.y,
          e.y - 0.2,
          e.y + 0.15,
        );
        const lz = MathUtils.clamp(
          e.z + up * 0.15 - down * 0.12 + this.headOffset.z,
          e.z - 0.15,
          e.z + 0.25,
        );
        this.localToWorld(pose, lx, ly, lz, cam.position);
        this.qA.setFromAxisAngle(Y_AXIS, yaw * DEG);
        this.qB.setFromAxisAngle(X_AXIS, pitch * DEG);
        cam.quaternion.copy(pose.quaternion).multiply(this.qA).multiply(this.qB);
        this.setFov(this.cockpitFov(aspect) * (cinematic ? 1 : this.fovScale));
        return;
      }
      case 'mount': {
        this.inCockpit = rig.inside;
        this.setClip(rig.inside ? 0.03 : 0.3);
        const d = this.reducedMotion ? 0 : shotT;
        this.localToWorld(
          pose,
          rig.pos[0] + rig.drift[0] * d,
          rig.pos[1] + rig.drift[1] * d,
          rig.pos[2] + rig.drift[2] * d,
          cam.position,
        );
        this.localToWorld(pose, rig.target[0], rig.target[1], rig.target[2], this.tTarget);
        this.tUp.set(0, 1, 0).applyQuaternion(pose.quaternion);
        cam.up.copy(this.tUp);
        cam.lookAt(this.tTarget);
        cam.up.set(0, 1, 0);
        const lens = this.mode === 'CINEMATIC_AUTO' && this.shot ? this.shot.lens : 55;
        this.setFov(
          this.portraitFov(lens, aspect) * (this.mode === 'CINEMATIC_AUTO' ? 1 : this.fovScale),
        );
        return;
      }
      case 'chase': {
        this.inCockpit = false;
        this.setClip(0.5);
        if (!this.chaseInit) {
          this.chaseDir.copy(this.fwdH).negate();
          this.chaseInit = true;
        }
        // 只平滑方向（機體座標偏移），避免高速時位置延遲
        const k = 1 - Math.exp(-dt * (this.reducedMotion ? 1.2 : 2.2));
        this.tA.copy(this.fwdH).negate();
        this.chaseDir.lerp(this.tA, k).normalize();
        const manual = this.mode === 'EXTERNAL_CHASE';
        this.orbitAzVel *= Math.exp(-dt * 3);
        this.orbitElVel *= Math.exp(-dt * 3);
        if (manual) {
          this.chaseYaw = MathUtils.clamp(this.chaseYaw + this.orbitAzVel * dt, -170, 170);
          this.chaseEl = MathUtils.clamp(this.chaseEl + this.orbitElVel * dt, -10, 70);
        }
        const back = manual ? this.chaseDist : rig.back;
        this.tA.copy(this.chaseDir);
        if (manual) this.tA.applyAxisAngle(Y_AXIS, this.chaseYaw * DEG);
        cam.position.copy(pose.position).addScaledVector(this.tA, back);
        this.tB.set(-this.tA.z, 0, this.tA.x);
        cam.position.addScaledVector(this.tB, rig.side);
        cam.position.y += manual ? rig.up + Math.sin(this.chaseEl * DEG) * back * 0.4 : rig.up;
        this.tTarget.copy(pose.position).addScaledVector(this.fwdH, 12);
        this.keepClear(pose, cam.position, 2);
        cam.lookAt(this.tTarget);
        this.setFov(this.portraitFov(this.shot?.lens ?? 45, aspect));
        return;
      }
      case 'orbit': {
        this.inCockpit = false;
        this.setClip(0.5);
        const cinematic = this.mode === 'CINEMATIC_AUTO';
        if (cinematic) {
          this.orbitAz += rig.rate * (this.reducedMotion ? 0.35 : 1) * dt;
          this.orbitEl = rig.elev;
          this.orbitDist = rig.dist;
        } else {
          this.orbitAz += this.orbitAzVel * dt;
          this.orbitEl = MathUtils.clamp(this.orbitEl + this.orbitElVel * dt, -15, 80);
          const decay = Math.exp(-dt * 3);
          this.orbitAzVel *= decay;
          this.orbitElVel *= decay;
        }
        // 方位角相對機頭方向
        const heading = Math.atan2(this.fwdH.x, -this.fwdH.z);
        const az = heading + this.orbitAz * DEG;
        const el = this.orbitEl * DEG;
        cam.position
          .set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el))
          .multiplyScalar(this.orbitDist)
          .add(pose.position);
        this.keepClear(pose, cam.position, 2);
        cam.lookAt(pose.position);
        this.setFov(this.portraitFov(this.shot && cinematic ? this.shot.lens : 50, aspect));
        return;
      }
      case 'world': {
        this.inCockpit = false;
        this.setClip(0.5);
        if (
          !this.anchorValid ||
          (rig.spot === 'flyby' && this.flybyPassed(pose.position)) ||
          (rig.spot === 'runwaySide' &&
            this.mode === 'RUNWAY_SIDE' &&
            this.anchor.distanceTo(pose.position) > 2500)
        ) {
          this.computeAnchor(rig.spot, frame);
          this.anchorValid = true;
        }
        cam.position.copy(this.anchor);
        cam.lookAt(pose.position);
        const dist = Math.max(1, this.anchor.distanceTo(pose.position));
        const framed = (2 * Math.atan(rig.frame / 2 / dist)) / DEG;
        const lensCap =
          this.mode === 'CINEMATIC_AUTO' && this.shot ? Math.max(this.shot.lens, 20) : 60;
        this.setFov(
          MathUtils.clamp(framed, 6, lensCap) *
            (this.mode === 'CINEMATIC_AUTO' ? 1 : this.fovScale),
        );
        return;
      }
    }
  }

  private computeAnchor(spot: Extract<Rig, { kind: 'world' }>['spot'], frame: FrameContext): void {
    const p = frame.pose.position;
    const a = this.anchor;
    const spd = Math.max(this.vel.length(), 0);
    const gh = (x: number, z: number): number => groundHeight(x, z);
    switch (spot) {
      case 'runwaySide': {
        a.copy(p)
          .addScaledVector(this.fwdH, 180 + spd * 3)
          .addScaledVector(this.rightH, 95);
        a.y = gh(a.x, a.z) + 1.8;
        break;
      }
      case 'rotation': {
        a.copy(p)
          .addScaledVector(this.fwdH, 420 + spd * 2)
          .addScaledVector(this.rightH, -38);
        a.y = gh(a.x, a.z) + 0.6;
        break;
      }
      case 'threshold':
        a.set(AIRPORT.runway.thr27X + 140, 0, 62);
        a.y = gh(a.x, a.z) + 2.5;
        break;
      case 'touchdown':
        a.set(AIRPORT.runway.touchdownX - 260, 0, 95);
        a.y = gh(a.x, a.z) + 2;
        break;
      case 'tower':
        a.set(AIRPORT.tower.x, AIRPORT.tower.height + 2, AIRPORT.tower.z);
        break;
      case 'flyby': {
        a.copy(p)
          .addScaledVector(this.fwdH, spd * 7 + 250)
          .addScaledVector(this.rightH, 70);
        a.y = Math.max(p.y - 10 + this.vel.y * 7, gh(a.x, a.z) + 3);
        break;
      }
      case 'hold': {
        a.copy(p).addScaledVector(this.fwdH, -60).addScaledVector(this.rightH, 55);
        a.y = gh(a.x, a.z) + 1.7;
        break;
      }
      case 'far': {
        a.copy(p)
          .addScaledVector(this.fwdH, 2500 + spd * 8)
          .addScaledVector(this.rightH, 1800);
        a.y = Math.max(p.y + 400, gh(a.x, a.z) + 50);
        break;
      }
      case 'taxiArrival': {
        a.copy(p)
          .addScaledVector(this.fwdH, 120 + spd * 4)
          .addScaledVector(this.rightH, -40);
        a.y = gh(a.x, a.z) + 1.5;
        break;
      }
    }
  }

  private flybyPassed(p: Vector3): boolean {
    this.tA.copy(p).sub(this.anchor);
    return this.tA.dot(this.fwdH) > 150 || this.tA.length() > 4000;
  }

  /** 攝影機不得進入機身/機翼或地形 */
  private keepClear(pose: FrameContext['pose'], pos: Vector3, minAgl: number): void {
    this.qInv.copy(pose.quaternion).invert();
    const l = this.tB.copy(pos).sub(pose.position).applyQuaternion(this.qInv);
    if (l.z > AIRCRAFT.noseZ - 1 && l.z < AIRCRAFT.tailZ + 1) {
      const r = Math.hypot(l.x, l.y);
      const minR = AIRCRAFT.fuselageRadius + 1.2;
      if (r < minR) {
        if (r < 1e-3) l.y = minR;
        else l.set((l.x / r) * minR, (l.y / r) * minR, l.z);
      }
    }
    if (Math.abs(l.x) < AIRCRAFT.span / 2 + 1 && l.z > -7 && l.z < 6 && l.y > -3.6 && l.y < 0.9) {
      l.y = l.y > -1.3 ? 0.9 : -3.6;
    }
    pos.copy(l.applyQuaternion(pose.quaternion)).add(pose.position);
    const g = groundHeight(pos.x, pos.z) + minAgl;
    if (pos.y < g) pos.y = g;
  }

  private updateHeadInertia(frame: FrameContext, dt: number): void {
    if (this.reducedMotion) {
      this.headOffset.set(0, 0, 0);
      this.headPitchLag = 0;
      return;
    }
    this.qInv.copy(frame.pose.quaternion).invert();
    const acc = this.tA.copy(frame.state.aircraft.acceleration).applyQuaternion(this.qInv);
    const clampA = (v: number): number => MathUtils.clamp(-v * 0.0035, -0.04, 0.04);
    const k = 1 - Math.exp(-dt * 4);
    this.headOffset.x += (clampA(acc.x) - this.headOffset.x) * k;
    this.headOffset.y += (clampA(acc.y) - this.headOffset.y) * k;
    this.headOffset.z += (clampA(acc.z) - this.headOffset.z) * k;
    const lag = MathUtils.clamp((-frame.state.aircraft.q / DEG) * 0.15, -1.5, 1.5);
    this.headPitchLag += (lag - this.headPitchLag) * k;
  }

  private applyBlend(dt: number): void {
    if (this.blendT >= 1) return;
    this.blendT = Math.min(1, this.blendT + dt / 1.2);
    const e = this.blendT * this.blendT * (3 - 2 * this.blendT);
    this.tPos.copy(this.camera.position);
    this.camera.position.lerpVectors(this.blendFromPos, this.tPos, e);
    this.qA.copy(this.camera.quaternion);
    this.camera.quaternion.copy(this.blendFromQuat).slerp(this.qA, e);
  }

  private updateVelocity(frame: FrameContext, dt: number): void {
    const p = frame.pose.position;
    if (this.posePrimed && dt > 1e-4) {
      this.tA.copy(p).sub(this.prevPose).divideScalar(dt);
      if (this.tA.lengthSq() < 400 * 400) this.vel.lerp(this.tA, 1 - Math.exp(-dt * 5));
    } else {
      this.vel.copy(frame.state.aircraft.velocity);
    }
    this.prevPose.copy(p);
    this.posePrimed = true;
  }

  private updateHorizontalAxes(frame: FrameContext): void {
    this.fwdH.set(0, 0, -1).applyQuaternion(frame.pose.quaternion);
    this.fwdH.y = 0;
    if (this.fwdH.lengthSq() < 1e-6) this.fwdH.set(0, 0, -1);
    this.fwdH.normalize();
    this.rightH.set(-this.fwdH.z, 0, this.fwdH.x);
  }

  private localToWorld(
    pose: FrameContext['pose'],
    x: number,
    y: number,
    z: number,
    out: Vector3,
  ): Vector3 {
    return out.set(x, y, z).applyQuaternion(pose.quaternion).add(pose.position);
  }

  /** 正常人眼視角；直式螢幕放寬以維持水平視野 */
  private cockpitFov(aspect: number): number {
    const fromH = (2 * Math.atan(Math.tan(35 * DEG) / aspect)) / DEG;
    return MathUtils.clamp(Math.max(58, fromH), 58, 85);
  }

  private portraitFov(lens: number, aspect: number): number {
    if (aspect >= 1) return lens;
    const h = 2 * Math.atan(Math.tan((lens * DEG) / 2) * 1.2);
    return MathUtils.clamp((2 * Math.atan(Math.tan(h / 2) / aspect)) / DEG, lens, 90);
  }

  private setFov(fov: number): void {
    if (Math.abs(fov - this.lastFov) < 0.01) return;
    this.lastFov = fov;
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  private setClip(near: number): void {
    if (near === this.lastNear) return;
    this.lastNear = near;
    this.camera.near = near;
    this.camera.far = 120000;
    this.camera.updateProjectionMatrix();
  }
}
