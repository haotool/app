/**
 * FlightControlComputer：Airbus Normal Law 風格線傳飛控。
 * - 俯仰：側桿 = 飛行路徑變化率（負載因子）指令，放桿 = 保持飛行路徑；以動態反演（NDI）求升降舵，THS 自動配平。
 * - 滾轉：側桿 = 滾轉率指令，放桿 = 保持坡度（>33° 回到 33°），最大 67°。
 * - 偏航：轉彎協調 + 側滑阻尼；踏板 = 偏航率指令。
 * - 保護：高 AoA、俯仰姿態、坡度、超速。
 * - 地面模式直接律；起飛後 3 秒混合進入飛行律；50 ft 以下手動為 flare 模式。
 * 自動駕駛只能提供坡度 / 飛行路徑角目標，經由本模組作用在物理上。
 */
import { CBAR, BSPAN, CL_DA, CL_SP, CM_DE, CN_DR, S, computeAero, type AeroCoeffs } from './aero';
import { AIRCRAFT, DEG, FLAP_TABLE, G } from './constants';
import type { FlightDynamics } from './dynamics';
import type { FlapConfig, SimEvent, SimState } from './types';

export interface ApCommand {
  active: boolean;
  bank: number; // deg 目標
  fpa: number; // deg 目標飛行路徑角
  /** 若設定：以俯仰姿態為目標（SRS / flare / rollout） */
  pitch: number | null;
  rudder: number; // -1..1（rollout 對正跑道）
  maxBankRate: number; // deg/s
}

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
const approach = (v: number, target: number, rate: number): number =>
  v < target ? Math.min(target, v + rate) : Math.max(target, v - rate);

export class FlightControlComputer {
  private blend = 0;
  private airborneTime = 0;
  private bankRef = 0;
  private flare = false;
  private flarePitch = 0;
  private readonly co: AeroCoeffs = {
    cl: 0,
    cd: 0,
    cy: 0,
    cRoll: 0,
    cm: 0,
    cn: 0,
    alphaStall: 0.2,
  };
  private lastConfig: FlapConfig = '0';

  update(
    s: SimState,
    dyn: FlightDynamics,
    ap: ApCommand,
    thrust: [number, number],
    dt: number,
    emit: (e: SimEvent) => void,
  ): void {
    this.flapsAndSlats(s, dt, emit);
    this.spoilers(s, dt, emit);
    this.primary(s, dyn, ap, thrust, dt);
  }

  private hydFactor(s: SimState, a: number, b: number): number {
    const sys = [s.hyd.green.pressure, s.hyd.blue.pressure, s.hyd.yellow.pressure];
    const n = (sys[a] > 1500 ? 1 : 0) + (sys[b] > 1500 ? 1 : 0);
    return n / 2;
  }

  private flapsAndSlats(s: SimState, dt: number, emit: (e: SimEvent) => void): void {
    const c = s.controls;
    const f = s.flight;
    let config: FlapConfig;
    switch (c.flapHandle) {
      case 0:
        config = '0';
        break;
      case 1:
        // 地面或低速選 1 → 1+F；空中由 0 選 1 → 1；1+F 在 210 kt 自動收為 1
        if (f.onGround || f.ias < 100) config = '1+F';
        else if (c.flapConfig === '1+F' && f.ias < 210) config = '1+F';
        else config = '1';
        break;
      case 2:
        config = '2';
        break;
      case 3:
        config = '3';
        break;
      default:
        config = 'FULL';
    }
    if (config !== this.lastConfig) {
      this.lastConfig = config;
      if (config !== c.flapConfig) emit({ type: 'FLAPS_SELECTED', config });
    }
    c.flapConfig = config;
    const row = FLAP_TABLE.find((r) => r.config === config) ?? FLAP_TABLE[0];
    c.flapsTarget = row.flaps;
    c.slatsTarget = row.slats;
    const flapRate = 1.6 * this.hydFactor(s, 0, 2) * dt;
    const slatRate = 1.2 * this.hydFactor(s, 0, 1) * dt;
    c.flapsAngle = approach(c.flapsAngle, c.flapsTarget, flapRate);
    c.slatsAngle = approach(c.slatsAngle, c.slatsTarget, slatRate);
  }

  private spoilers(s: SimState, dt: number, emit: (e: SimEvent) => void): void {
    const c = s.controls;
    const f = s.flight;
    const levers = Math.max(s.engines[0].tla, s.engines[1].tla);
    const bothMain = f.wow[1] && f.wow[2];
    const anyMain = f.wow[1] || f.wow[2];
    const reverse = s.engines[0].tla < -1 || s.engines[1].tla < -1;
    const wasActive = c.groundSpoilersActive;
    // 落地（剛離開空中）或中止起飛（>72 kt）才展開
    if (!anyMain && !f.wow[0]) this.recentlyAirborne = true;
    if (f.gs < 20) this.recentlyAirborne = false;
    if (
      anyMain &&
      (c.spoilersArmed || reverse) &&
      levers <= 2.5 &&
      ((this.recentlyAirborne && (bothMain || f.gs > 40)) || f.gs > 72)
    ) {
      c.groundSpoilersActive = true;
    }
    if (
      c.groundSpoilersActive &&
      (levers > 20 || (!c.spoilersArmed && !reverse && c.speedbrakeHandle < 0.05) || !anyMain)
    ) {
      c.groundSpoilersActive = false;
    }
    if (wasActive !== c.groundSpoilersActive)
      emit({ type: 'GROUND_SPOILERS', deployed: c.groundSpoilersActive });
    // 減速板：襟翼 FULL 或 α prot 時抑制
    const sbInhibit = c.flapConfig === 'FULL' || c.protActive.aoa;
    const sb = sbInhibit ? 0 : c.speedbrakeHandle;
    const rollSpoiler = this.rollSpoiler;
    const hyd = this.hydFactor(s, 0, 2) > 0 || s.hyd.blue.pressure > 1500 ? 1 : 0;
    const rate = 55 * dt * hyd;
    for (let i = 0; i < 5; i++) {
      let tl = 0;
      let tr = 0;
      if (c.groundSpoilersActive) {
        tl = tr = 50;
      } else {
        if (i >= 1 && i <= 3) tl = tr = sb * 40;
        if (i >= 1) {
          if (rollSpoiler > 0) tr = Math.max(tr, rollSpoiler * 35);
          if (rollSpoiler < 0) tl = Math.max(tl, -rollSpoiler * 35);
        }
      }
      c.spoilersL[i] = approach(c.spoilersL[i], tl, rate);
      c.spoilersR[i] = approach(c.spoilersR[i], tr, rate);
    }
  }

  private rollSpoiler = 0;
  private recentlyAirborne = false;

  private primary(
    s: SimState,
    dyn: FlightDynamics,
    ap: ApCommand,
    thrust: [number, number],
    dt: number,
  ): void {
    const c = s.controls;
    const f = s.flight;
    const a = s.aircraft;
    const inp = s.input;
    const onGround = f.wow[0] || f.wow[1] || f.wow[2];
    if (onGround) {
      this.airborneTime = 0;
      this.flare = false;
    } else {
      this.airborneTime += dt;
    }
    const inFlightLaw = !(f.wow[1] && f.wow[2]) && this.airborneTime > 0.5;
    this.blend = approach(this.blend, inFlightLaw ? 1 : 0, dt / (inFlightLaw ? 3 : 1));

    const V = Math.max(dyn.tasMs, 30);
    const qbar = Math.max(dyn.qbar, 50);
    const phi = f.roll * DEG;
    const theta = f.pitch * DEG;
    const gamma = f.fpa * DEG;
    const alpha = dyn.aeroIn.alpha;
    const aStall = dyn.coeffs.alphaStall;
    const maxRudder = clamp(30 - (f.ias - 160) * 0.13, 3.5, 30);
    const hydOk =
      s.hyd.green.pressure > 1500 || s.hyd.blue.pressure > 1500 || s.hyd.yellow.pressure > 1500;
    const rateScale = hydOk ? 1 : 0;

    // ---------------- 直接律（地面） ----------------
    const dElev = -inp.pitch * 30;
    const dAil = inp.roll * 25;
    const pedal = ap.active && ap.rudder !== 0 ? ap.rudder : inp.rudder;
    const dRud = pedal * maxRudder;

    // ---------------- 飛行律（NDI） ----------------
    // 俯仰：飛行路徑變化率
    let thetaDot: number;
    const manualFlare =
      !ap.active && f.radioAltitude < 50 && f.vs < 200 && !onGround && this.airborneTime > 5;
    if (manualFlare && !this.flare) {
      this.flare = true;
      this.flarePitch = f.pitch;
    }
    if (!manualFlare && f.radioAltitude > 60) this.flare = false;
    c.protActive.speed = f.ias > f.vmax + 6;
    if (ap.active) {
      if (ap.pitch !== null) {
        thetaDot = clamp(0.6 * (ap.pitch - f.pitch) * DEG, -3 * DEG, 3 * DEG);
      } else {
        const maxG = (0.12 * G) / V;
        thetaDot = clamp(0.8 * (ap.fpa * DEG - gamma), -maxG, maxG);
      }
      c.fpaRef = f.fpa;
    } else if (this.flare) {
      // flare 模式：側桿直接控制俯仰率，並有緩慢低頭趨勢
      this.flarePitch -= 0.35 * dt;
      thetaDot =
        inp.pitch * 6 * DEG + 0.8 * (this.flarePitch - f.pitch) * DEG * (inp.pitch === 0 ? 1 : 0.2);
    } else if (Math.abs(inp.pitch) > 0.03) {
      const dnz = inp.pitch > 0 ? inp.pitch * 1.5 : inp.pitch * 2.0;
      thetaDot = (G * dnz) / V;
      c.fpaRef = f.fpa;
    } else {
      thetaDot = clamp(0.7 * (c.fpaRef - f.fpa) * DEG, -0.05, 0.05);
    }
    if (c.protActive.speed) thetaDot += (f.ias - f.vmax - 6) * 0.0015;
    // 高 AoA 保護
    const aProt = aStall - 3.5 * DEG;
    const aMax = aStall - 1.5 * DEG;
    if (alpha > aProt && inp.pitch >= -0.1 && this.blend > 0.5) c.protActive.aoa = true;
    if (c.protActive.aoa && (alpha < aProt - 1.5 * DEG || inp.pitch < -0.5))
      c.protActive.aoa = false;
    if (c.protActive.aoa) {
      const aCmd = aProt + Math.max(0, inp.pitch) * (aMax - aProt);
      thetaDot = Math.min(thetaDot, 1.2 * (aCmd - alpha));
    }
    // 俯仰姿態保護
    const thetaMax = (c.flapConfig === 'FULL' ? 25 : 30) * DEG;
    thetaDot = Math.min(thetaDot, 0.6 * (thetaMax - theta));
    thetaDot = Math.max(thetaDot, 0.6 * (-15 * DEG - theta));
    c.protActive.pitch = theta > thetaMax - 2 * DEG || theta < -13 * DEG;

    // 轉彎補償
    const phiComp = clamp(phi, -33 * DEG, 33 * DEG);
    const psiDot = (G * Math.tan(phiComp)) / V;
    const qCmd = thetaDot * Math.cos(phi) + psiDot * Math.cos(theta) * Math.sin(phi);

    // 滾轉
    let pCmd: number;
    const bankLimit = (c.protActive.aoa || c.protActive.speed ? 45 : 67) * DEG;
    if (ap.active) {
      const err = ap.bank * DEG - phi;
      pCmd = clamp(1.1 * err, -ap.maxBankRate * DEG, ap.maxBankRate * DEG);
      this.bankRef = phi;
    } else if (Math.abs(inp.roll) > 0.03) {
      pCmd = inp.roll * 15 * DEG;
      this.bankRef = phi;
    } else {
      this.bankRef = clamp(this.bankRef, -33 * DEG, 33 * DEG);
      pCmd = clamp(1.2 * (this.bankRef - phi), -10 * DEG, 10 * DEG);
    }
    if (phi > bankLimit) pCmd = Math.min(pCmd, 1.5 * (bankLimit - phi));
    if (phi < -bankLimit) pCmd = Math.max(pCmd, 1.5 * (-bankLimit - phi));
    c.protActive.bank = Math.abs(phi) > 33 * DEG;
    pCmd -= psiDot * Math.sin(theta);

    // 偏航：協調 + 側滑阻尼
    let rCmd = psiDot * Math.cos(theta) * Math.cos(phi) - thetaDot * Math.sin(phi);
    if (Math.abs(pedal) < 0.05) rCmd += 0.8 * dyn.aeroIn.beta;
    else rCmd += pedal * 0.07;

    // 動態反演：求所需力矩係數
    const IX = AIRCRAFT.inertia.iyy;
    const IZ = AIRCRAFT.inertia.ixx;
    const IY = AIRCRAFT.inertia.izz;
    const qDot = 2.4 * (qCmd - a.q);
    const pDot = 3.5 * (pCmd - a.p);
    const rDot = 1.8 * (rCmd - a.r);
    const sf = dyn.surfaces;
    const saveE = sf.elevator;
    const saveA = sf.aileron;
    const saveR = sf.rudder;
    sf.elevator = 0;
    sf.aileron = 0;
    sf.rudder = c.rudderTrim * DEG;
    const base = computeAero(dyn.aeroIn, sf, this.co);
    sf.elevator = saveE;
    sf.aileron = saveA;
    sf.rudder = saveR;
    const thrustM = -AIRCRAFT.engine.y * (thrust[0] + thrust[1]);
    const thrustN = AIRCRAFT.engine.x * (thrust[0] - thrust[1]);
    const cmReq = (IX * qDot - thrustM) / (qbar * S * CBAR);
    let eNdi = (cmReq - base.cm) / CM_DE / DEG;
    const clReq = (IZ * pDot) / (qbar * S * BSPAN);
    let aNdi = (clReq - base.cRoll) / CL_DA / DEG;
    const cnReq = (IY * rDot - thrustN) / (qbar * S * BSPAN);
    let rNdi = (cnReq - base.cn) / CN_DR / DEG;
    eNdi = clamp(eNdi, -30, 17);
    // 滾轉分配：副翼飽和後加入擾流板
    let roll = 0;
    if (Math.abs(aNdi) > 20) {
      const extra = ((Math.abs(aNdi) - 20) * DEG * CL_DA) / CL_SP;
      roll = Math.sign(aNdi) * clamp(extra, 0, 1);
    }
    aNdi = clamp(aNdi, -25, 25);
    rNdi = clamp(
      rNdi + (Math.abs(pedal) >= 0.05 ? pedal * maxRudder * 0.4 : 0),
      -maxRudder,
      maxRudder,
    );

    // 混合直接律與飛行律
    const b = this.blend;
    const tElev = dElev * (1 - b) + eNdi * b;
    const tAil = dAil * (1 - b) + aNdi * b;
    const tRud = onGround && b < 0.5 ? dRud : dRud * (1 - b) + rNdi * b;
    this.rollSpoiler = roll * b;
    c.elevator = approach(c.elevator, tElev, 45 * dt * rateScale);
    c.aileronL = approach(c.aileronL, tAil, 60 * dt * rateScale);
    c.aileronR = approach(c.aileronR, -tAil, 60 * dt * rateScale);
    c.rudder = approach(c.rudder, clamp(tRud, -maxRudder, maxRudder), 40 * dt * rateScale);

    // 自動配平（THS）：飛行律且無保護時，使升降舵回中
    if (b > 0.9 && !c.protActive.aoa && !this.flare && Math.abs(f.roll) < 33 && hydOk) {
      c.ths = clamp(c.ths - clamp(0.35 * c.elevator, -0.5, 0.5) * dt, -4, 13.5);
    } else if (onGround && f.gs < 40 && hydOk) {
      c.ths = approach(c.ths, 2.5, 0.5 * dt); // 起飛配平
    }
    c.law = 'NORMAL';
  }
}
