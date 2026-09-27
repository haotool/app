/**
 * FlightDynamics：6DOF 剛體 + 空氣動力 + 推力 + 起落架接地（彈簧阻尼、滾動/剎車/側向摩擦、前輪轉向）。
 * 地面滑行與空中飛行共用同一個 AircraftState；不存在任何預錄動畫或直接指定位置的路徑。
 */
import { Quaternion, Vector3 } from 'three';
import {
  BSPAN,
  CBAR,
  S,
  computeAero,
  type AeroCoeffs,
  type AeroInput,
  type AeroSurfaces,
} from './aero';
import { sampleAtmosphere, tasToCas, type AtmosphereSample } from './atmosphere';
import { AIRCRAFT, DEG, FT, G, KT } from './constants';
import { groundHeight, surfaceType } from './terrain';
import type { SimState } from './types';
import { stepTurbulence, windVector, type TurbulenceState } from './weather';

const I = AIRCRAFT.inertia;
// three 機體座標慣量：x=俯仰、y=偏航、z=滾轉
const IX = I.iyy;
const IY = I.izz;
const IZ = I.ixx;

interface ContactPoint {
  local: Vector3;
  kind: 'gear' | 'structure';
  gear: number; // -1 表結構點
}

const STRUCTURE: ContactPoint[] = [
  { local: new Vector3(0, -1.9, -16.5), kind: 'structure', gear: -1 }, // 機鼻下緣
  { local: new Vector3(0, -2.05, -4), kind: 'structure', gear: -1 }, // 機腹
  { local: new Vector3(0, -1.55, 15.2), kind: 'structure', gear: -1 }, // 尾部（tail strike）
  {
    local: new Vector3(-AIRCRAFT.engine.x, AIRCRAFT.engine.y - AIRCRAFT.engine.radius, -5),
    kind: 'structure',
    gear: -1,
  },
  {
    local: new Vector3(AIRCRAFT.engine.x, AIRCRAFT.engine.y - AIRCRAFT.engine.radius, -5),
    kind: 'structure',
    gear: -1,
  },
  { local: new Vector3(-17.2, 0.1, 6.5), kind: 'structure', gear: -1 },
  { local: new Vector3(17.2, 0.1, 6.5), kind: 'structure', gear: -1 },
];

const GEAR_K = [1.4e6, 2.3e6, 2.3e6];
const GEAR_C = [1.6e5, 3.0e5, 3.0e5];
const GEAR_STROKE = [0.42, 0.5, 0.5];

export interface DynamicsOutput {
  /** 本步非重力比力（機體 up 軸，g） */
  nz: number;
  touchdown: { vs: number; g: number } | null;
  structureImpact: number; // m/s，結構點撞擊垂直速度
  tailStrike: boolean;
  engineThrust: [number, number];
}

export class FlightDynamics {
  readonly atmo: AtmosphereSample = {
    temperature: 288,
    pressure: 101325,
    density: 1.225,
    speedOfSound: 340,
  };
  readonly turb: TurbulenceState = { u: 0, v: 0, w: 0, p: 0, gustPhase: 0 };
  readonly coeffs: AeroCoeffs = { cl: 0, cd: 0, cy: 0, cRoll: 0, cm: 0, cn: 0, alphaStall: 0.2 };
  readonly aeroIn: AeroInput = {
    alpha: 0,
    beta: 0,
    pHat: 0,
    qHat: 0,
    rHat: 0,
    mach: 0,
    flaps: 0,
    slats: 0,
    gear: 1,
    spoilerL: 0,
    spoilerR: 0,
    heightOverSpan: 1,
    ice: 0,
  };
  readonly surfaces: AeroSurfaces = { elevator: 0, ths: 0, aileron: 0, rudder: 0 };
  /** 最近一次動壓與空速（FBW 反演使用） */
  qbar = 0;
  tasMs = 0;
  private readonly wind = { x: 0, z: 0 };
  private readonly v = {
    air: new Vector3(),
    vb: new Vector3(),
    force: new Vector3(),
    torque: new Vector3(),
    tmp: new Vector3(),
    tmp2: new Vector3(),
    wWorld: new Vector3(),
    pw: new Vector3(),
    r: new Vector3(),
    vp: new Vector3(),
    fwd: new Vector3(),
    right: new Vector3(),
    lift: new Vector3(),
    omega: new Vector3(),
    iw: new Vector3(),
    fSpec: new Vector3(),
    up: new Vector3(),
  };
  private readonly qInv = new Quaternion();
  private readonly dq = new Quaternion();
  private wasOnGround = true;
  private readonly gearPts = AIRCRAFT.gear.map((g) => new Vector3(g.x, g.y, g.z));

  /** 更新大氣、風、氣流相對量（每步先呼叫；FBW 依此計算） */
  prepare(s: SimState, dt: number): void {
    const a = s.aircraft;
    sampleAtmosphere(a.position.y, s.weather.isaDev, this.atmo);
    windVector(
      s.weather,
      Math.max(0, a.position.y - groundHeight(a.position.x, a.position.z)),
      this.wind,
    );
    stepTurbulence(this.turb, s, dt, this.tasMs);
    const t = this.v;
    this.qInv.copy(a.quaternion).invert();
    // 亂流在機體座標加入
    t.air.set(a.velocity.x - this.wind.x, a.velocity.y, a.velocity.z - this.wind.z);
    t.vb.copy(t.air).applyQuaternion(this.qInv);
    t.vb.x -= this.turb.v;
    t.vb.y -= this.turb.w;
    t.vb.z += this.turb.u;
    const V = Math.max(t.vb.length(), 0.01);
    this.tasMs = V;
    const u = -t.vb.z;
    const w = -t.vb.y;
    const vr = t.vb.x;
    const ai = this.aeroIn;
    ai.alpha = V > 3 ? Math.atan2(w, Math.max(u, 0.5)) : 0;
    ai.beta = V > 3 ? Math.asin(Math.max(-1, Math.min(1, vr / V))) : 0;
    const Vn = Math.max(V, 20);
    ai.pHat = (a.p * BSPAN) / (2 * Vn);
    ai.qHat = (a.q * CBAR) / (2 * Vn);
    ai.rHat = (a.r * BSPAN) / (2 * Vn);
    ai.mach = V / this.atmo.speedOfSound;
    ai.flaps = s.controls.flapsAngle;
    ai.slats = s.controls.slatsAngle;
    ai.gear =
      (s.gear.position[0] + s.gear.position[1] + s.gear.position[2]) / 3 +
      (s.gear.doors[0] + s.gear.doors[1]) * 0.1;
    let sl = 0;
    let sr = 0;
    for (let i = 0; i < 5; i++) {
      sl += s.controls.spoilersL[i];
      sr += s.controls.spoilersR[i];
    }
    ai.spoilerL = sl / 250;
    ai.spoilerR = sr / 250;
    const hAgl = Math.max(0, a.position.y - groundHeight(a.position.x, a.position.z) - 2.2);
    ai.heightOverSpan = hAgl / BSPAN;
    ai.ice = s.antiIce.iceAccretion;
    this.qbar = 0.5 * this.atmo.density * V * V;
  }

  /** 積分一步（dt 秒，內部再細分以穩定接地剛性） */
  step(s: SimState, dt: number, thrust: [number, number], out: DynamicsOutput): void {
    const sub = 4;
    const h = dt / sub;
    out.touchdown = null;
    out.structureImpact = 0;
    out.tailStrike = false;
    out.engineThrust = thrust;
    let nzSum = 0;
    for (let k = 0; k < sub; k++) {
      nzSum += this.substep(s, h, thrust, out);
    }
    out.nz = nzSum / sub;
  }

  private substep(s: SimState, dt: number, thrust: [number, number], out: DynamicsOutput): number {
    const a = s.aircraft;
    const t = this.v;
    const c = s.controls;
    const m = a.mass;
    // 以目前姿態重算氣流（姿態在子步間改變）
    this.qInv.copy(a.quaternion).invert();
    t.air.set(a.velocity.x - this.wind.x, a.velocity.y, a.velocity.z - this.wind.z);
    t.vb.copy(t.air).applyQuaternion(this.qInv);
    t.vb.x -= this.turb.v;
    t.vb.y -= this.turb.w;
    t.vb.z += this.turb.u;
    const V = Math.max(t.vb.length(), 0.01);
    const ai = this.aeroIn;
    if (V > 3) {
      ai.alpha = Math.atan2(-t.vb.y, Math.max(-t.vb.z, 0.5));
      ai.beta = Math.asin(Math.max(-1, Math.min(1, t.vb.x / V)));
    } else {
      ai.alpha = 0;
      ai.beta = 0;
    }
    const Vn = Math.max(V, 20);
    ai.pHat = (a.p * BSPAN) / (2 * Vn);
    ai.qHat = (a.q * CBAR) / (2 * Vn);
    ai.rHat = (a.r * BSPAN) / (2 * Vn);
    const sf = this.surfaces;
    sf.elevator = c.elevator * DEG;
    sf.ths = c.ths * DEG;
    sf.aileron = ((c.aileronL - c.aileronR) / 2) * DEG;
    sf.rudder = (c.rudder + c.rudderTrim) * DEG;
    const co = computeAero(ai, sf, this.coeffs);
    const qbar = 0.5 * this.atmo.density * V * V;

    // ---- 力（機體座標）----
    t.force.set(0, 0, 0);
    t.torque.set(0, 0, 0);
    if (V > 0.5) {
      const vhat = t.tmp.copy(t.vb).divideScalar(V);
      // 阻力
      t.force.addScaledVector(vhat, -qbar * S * co.cd);
      // 升力 ⟂ 速度（在對稱面內）
      t.lift.set(1, 0, 0).cross(vhat).normalize();
      t.force.addScaledVector(t.lift, qbar * S * co.cl);
      // 側力
      t.force.x += qbar * S * co.cy;
      // 氣動力矩（three 軸：x=俯仰、y=-偏航、z=-滾轉）
      t.torque.x += qbar * S * CBAR * co.cm;
      t.torque.y -= qbar * S * BSPAN * co.cn;
      t.torque.z -= qbar * S * BSPAN * co.cRoll;
      t.torque.z -= this.turb.p * qbar * S * BSPAN * 0.02;
    }
    // 推力（作用點在發動機，向 -Z）
    const ey = AIRCRAFT.engine.y;
    for (let e = 0; e < 2; e++) {
      const ex = e === 0 ? -AIRCRAFT.engine.x : AIRCRAFT.engine.x;
      const T = thrust[e];
      t.force.z -= T;
      // r × F，F = (0,0,-T)，r = (ex, ey, -4)
      t.torque.x += ey * -T;
      t.torque.y -= ex * -T;
    }

    // 轉到世界座標，加重力
    t.fSpec.copy(t.force); // 機體比力（不含重力）先暫存
    t.force.applyQuaternion(a.quaternion);
    // 地面接觸（世界座標力 + 機體力矩）
    const onGround = this.contacts(s, dt, t.force, t.torque, out);
    const nz = (t.fSpec.y + this.lastGearUp) / (m * G);
    t.force.y -= m * G;

    // ---- 積分：半隱式 Euler ----
    a.acceleration.copy(t.force).divideScalar(m);
    a.velocity.addScaledVector(a.acceleration, dt);
    a.position.addScaledVector(a.velocity, dt);

    // 角運動（機體）
    t.omega.set(a.q, -a.r, -a.p);
    t.iw.set(IX * t.omega.x, IY * t.omega.y, IZ * t.omega.z);
    t.tmp2.copy(t.omega).cross(t.iw);
    const ax = (t.torque.x - t.tmp2.x) / IX;
    const ay = (t.torque.y - t.tmp2.y) / IY;
    const az = (t.torque.z - t.tmp2.z) / IZ;
    t.omega.x += ax * dt;
    t.omega.y += ay * dt;
    t.omega.z += az * dt;
    a.angularAccel.q = ax;
    a.angularAccel.r = -ay;
    a.angularAccel.p = -az;
    a.q = t.omega.x;
    a.r = -t.omega.y;
    a.p = -t.omega.z;
    const angle = t.omega.length() * dt;
    if (angle > 1e-9) {
      this.dq.setFromAxisAngle(t.tmp.copy(t.omega).normalize(), angle);
      a.quaternion.multiply(this.dq).normalize();
    }
    if (onGround && !this.wasOnGround) {
      out.touchdown = { vs: (-a.velocity.y / FT) * 60, g: nz };
    }
    this.wasOnGround = onGround;
    return nz;
  }

  private lastGearUp = 0;

  /** 計算所有接觸點；力加到 forceWorld，力矩加到 torqueBody；回傳是否有輪子著地 */
  private contacts(
    s: SimState,
    dt: number,
    forceWorld: Vector3,
    torqueBody: Vector3,
    out: DynamicsOutput,
  ): boolean {
    const a = s.aircraft;
    const t = this.v;
    const g = s.gear;
    let anyWheel = false;
    let upSum = 0;
    // 角速度（世界）
    t.wWorld.set(a.q, -a.r, -a.p).applyQuaternion(a.quaternion);
    t.up.set(0, 1, 0).applyQuaternion(a.quaternion);
    for (let i = 0; i < 3; i++) {
      const locked = g.position[i] > 0.98;
      if (!locked) {
        g.compression[i] = 0;
        s.flight.wow[i] = false;
        continue;
      }
      const res = this.contactForce(s, this.gearPts[i], i, dt, forceWorld, torqueBody);
      g.compression[i] = res;
      s.flight.wow[i] = res > 0.005;
      if (s.flight.wow[i]) anyWheel = true;
    }
    upSum = this.gearUpForce;
    this.gearUpForce = 0;
    for (const p of STRUCTURE) {
      const impact = this.structContact(s, p.local, forceWorld, torqueBody);
      if (p.local.z > 14 && this.lastPen > 0)
        out.tailStrike = true; // 尾部觸地
      else if (impact > out.structureImpact) out.structureImpact = impact;
    }
    this.lastGearUp = upSum;
    return anyWheel;
  }

  private gearUpForce = 0;
  private lastPen = 0;

  private contactForce(
    s: SimState,
    local: Vector3,
    i: number,
    dt: number,
    forceWorld: Vector3,
    torqueBody: Vector3,
  ): number {
    const a = s.aircraft;
    const t = this.v;
    t.pw.copy(local).applyQuaternion(a.quaternion).add(a.position);
    const gh = groundHeight(t.pw.x, t.pw.z);
    const pen = gh - t.pw.y;
    if (pen <= 0) return 0;
    const comp = Math.min(pen, GEAR_STROKE[i] + 0.2);
    // 接觸點速度
    t.r.subVectors(t.pw, a.position);
    t.vp.copy(t.wWorld).cross(t.r).add(a.velocity);
    let fn = GEAR_K[i] * comp - GEAR_C[i] * t.vp.y;
    if (pen > GEAR_STROKE[i]) fn += (pen - GEAR_STROKE[i]) * 2.5e7; // 觸底
    fn = Math.max(0, fn);
    // 輪胎方向（地面平面內）
    t.fwd.set(0, 0, -1);
    if (i === 0) t.fwd.applyAxisAngle(t.tmp2.set(0, 1, 0), -s.gear.steerAngle * DEG);
    t.fwd.applyQuaternion(a.quaternion);
    t.fwd.y = 0;
    t.fwd.normalize();
    t.right.set(-t.fwd.z, 0, t.fwd.x);
    const vLong = t.vp.dot(t.fwd);
    const vLat = t.vp.dot(t.right);
    const surf = surfaceType(t.pw.x, t.pw.z);
    const wet = s.weather.precipitation > 0.3;
    const muLat = surf === 'grass' ? 0.45 : surf === 'water' ? 0.1 : wet ? 0.5 : 0.8;
    const muRoll = surf === 'grass' ? 0.06 : surf === 'water' ? 0.3 : 0.012;
    let muBrake = 0;
    if (i > 0) {
      const press = i === 1 ? s.gear.brakePressL : s.gear.brakePressR;
      const muMax = surf === 'grass' ? 0.3 : wet ? 0.32 : 0.55;
      muBrake = press * muMax * (s.gear.antiSkid ? 1 : 0.8);
    }
    const satLong = Math.max(-1, Math.min(1, vLong / 0.35));
    const fLong = -(muRoll + muBrake) * fn * satLong;
    const slip = vLat / Math.max(Math.abs(vLong) * 0.14, 0.3);
    const fLat = -muLat * fn * Math.max(-1, Math.min(1, slip));
    // 合力（世界）
    t.tmp.set(0, fn, 0).addScaledVector(t.fwd, fLong).addScaledVector(t.right, fLat);
    forceWorld.add(t.tmp);
    // 力矩：r × F 轉到機體
    t.tmp2.copy(t.r).cross(t.tmp).applyQuaternion(this.qInv.copy(a.quaternion).invert());
    torqueBody.add(t.tmp2);
    this.gearUpForce += t.tmp.dot(t.up);
    // 輪轉
    const radius = AIRCRAFT.gear[i].wheelRadius;
    const target = vLong / radius;
    const brakeLock = i > 0 && s.gear.parkingBrake ? 0 : 1;
    s.gear.wheelSpin[i] += (target * brakeLock - s.gear.wheelSpin[i]) * Math.min(1, dt / 0.06);
    return comp;
  }

  private structContact(
    s: SimState,
    local: Vector3,
    forceWorld: Vector3,
    torqueBody: Vector3,
  ): number {
    const a = s.aircraft;
    const t = this.v;
    t.pw.copy(local).applyQuaternion(a.quaternion).add(a.position);
    const pen = groundHeight(t.pw.x, t.pw.z) - t.pw.y;
    this.lastPen = pen;
    if (pen <= 0) return 0;
    t.r.subVectors(t.pw, a.position);
    t.vp.copy(t.wWorld).cross(t.r).add(a.velocity);
    const impact = Math.max(0, -t.vp.y);
    const fn = Math.max(0, 6e6 * pen - 6e5 * t.vp.y);
    const hs = Math.hypot(t.vp.x, t.vp.z);
    const mu = 0.5;
    t.tmp.set((-t.vp.x / Math.max(hs, 0.3)) * mu * fn, fn, (-t.vp.z / Math.max(hs, 0.3)) * mu * fn);
    forceWorld.add(t.tmp);
    t.tmp2.copy(t.r).cross(t.tmp).applyQuaternion(this.qInv.copy(a.quaternion).invert());
    torqueBody.add(t.tmp2);
    return impact;
  }

  /** 物理步後更新 FlightData 衍生量 */
  updateFlightData(s: SimState, nz: number): void {
    const a = s.aircraft;
    const f = s.flight;
    const t = this.v;
    const V = this.tasMs;
    f.tas = V / KT;
    f.ias = V > 1 ? tasToCas(V, this.atmo.density, this.atmo.pressure) : 0;
    f.mach = V / this.atmo.speedOfSound;
    f.aoa = this.aeroIn.alpha / DEG;
    f.beta = this.aeroIn.beta / DEG;
    f.rho = this.atmo.density;
    f.oat = this.atmo.temperature - 273.15;
    f.tat = f.oat + (V * V) / 2010;
    f.altitudeMsl = a.position.y / FT;
    f.pressureAltitude = f.altitudeMsl + (1013.25 - s.weather.qnh) * 27.3;
    // 無線電高度：主輪底（放下）或機腹
    const gearDown = s.gear.position[1] > 0.98;
    t.pw
      .set(0, gearDown ? AIRCRAFT.gear[1].y : -2.05, gearDown ? AIRCRAFT.gear[1].z : 0)
      .applyQuaternion(a.quaternion)
      .add(a.position);
    f.radioAltitude = Math.max(0, (t.pw.y - groundHeight(t.pw.x, t.pw.z)) / FT);
    f.vs = (a.velocity.y / FT) * 60;
    // 姿態
    t.fwd.set(0, 0, -1).applyQuaternion(a.quaternion);
    t.right.set(1, 0, 0).applyQuaternion(a.quaternion);
    t.up.set(0, 1, 0).applyQuaternion(a.quaternion);
    f.pitch = Math.asin(Math.max(-1, Math.min(1, t.fwd.y))) / DEG;
    f.heading = (Math.atan2(t.fwd.x, -t.fwd.z) / DEG + 360) % 360;
    f.roll = Math.atan2(-t.right.y, t.up.y) / DEG;
    const hs = Math.hypot(a.velocity.x, a.velocity.z);
    f.gs = hs / KT;
    f.track = hs > 1 ? (Math.atan2(a.velocity.x, -a.velocity.z) / DEG + 360) % 360 : f.heading;
    f.fpa = hs > 5 ? Math.atan2(a.velocity.y, hs) / DEG : 0;
    f.nz = nz;
    f.onGround = f.wow[1] || f.wow[2];
    const accelKt = t.tmp.copy(a.acceleration).dot(t.fwd) / KT;
    f.speedTrend += (accelKt * 10 - f.speedTrend) * 0.05;
    // 風（當地）
    const ws = Math.hypot(this.wind.x, this.wind.z);
    f.windSpeed = ws / KT;
    f.windDir = ws > 0.1 ? (Math.atan2(-this.wind.x, this.wind.z) / DEG + 360) % 360 : 0;
  }
}
