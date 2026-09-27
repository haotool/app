/**
 * Simulation：固定 60 Hz 物理步（accumulator + 最大追趕步數），整合所有系統；實作 SimApi。
 * 輸入路由：USER（鍵盤/滑鼠/觸控/3D 側桿）、AUTOPILOT（Demo 虛擬機師）。使用者側桿超控會解除 AP。
 */
import { Quaternion, Vector3 } from 'three';
import type { SimApi } from './api';
import { clMaxFor, liftCoefficient, stallAlpha } from './aero';
import { AutoFlightSystem } from './autoflight/autoflight';
import { updateIls, updateNavigation } from './autoflight/navigation';
import { applyCommand } from './commands';
import type { Command } from './controlDefs';
import { AIRCRAFT, DEG, FLAP_TABLE, G, KT, TLA } from './constants';
import { DemoPilot } from './demo';
import { FlightDynamics, type DynamicsOutput } from './dynamics';
import { EngineSystem } from './engines';
import { FlightControlComputer } from './fcc';
import { FlightPhaseManager } from './phase';
import { ReplayRecorder } from './replay';
import { COLD_DARK_CHECKLIST } from './checklist';
import { createInitialState, WEATHER_PRESETS } from './state';
import { updateElectrical } from './systems/electrical';
import {
  updateAdirs,
  updateAntiIce,
  updateFuel,
  updatePneumatic,
  updatePressurization,
} from './systems/fuelPneumatic';
import { DoorSystem } from './systems/doors';
import { GearSystem, updateLights } from './systems/gearLights';
import { updateHydraulic } from './systems/hydraulic';
import { WarningSystem } from './systems/warnings';
import type { Scenario, SimEvent, SimState, WeatherPreset, WeatherState } from './types';
import { updateWeather } from './weather';

export const FIXED_DT = 1 / 60;
const MAX_STEPS = 6;
const RA_CALLOUTS: [number, string][] = [
  [1000, 'ONE THOUSAND'],
  [500, 'FIVE HUNDRED'],
  [400, 'FOUR HUNDRED'],
  [300, 'THREE HUNDRED'],
  [200, 'TWO HUNDRED'],
  [100, 'ONE HUNDRED'],
  [50, 'FIFTY'],
  [40, 'FORTY'],
  [30, 'THIRTY'],
  [20, 'TWENTY'],
  [10, 'TEN'],
];

export interface UserControls {
  pitch: number;
  roll: number;
  rudder: number;
  tiller: number;
  brakeL: number;
  brakeR: number;
}

export class Simulation implements SimApi {
  state: SimState;
  dyn = new FlightDynamics();
  readonly replay = new ReplayRecorder();
  /** 上一物理步姿態（渲染插值） */
  readonly prevPos = new Vector3();
  readonly prevQuat = new Quaternion();
  private fcc = new FlightControlComputer();
  private engines = new EngineSystem();
  private afs = new AutoFlightSystem();
  private gear = new GearSystem();
  private doors = new DoorSystem();
  private warnings = new WarningSystem();
  private phase = new FlightPhaseManager();
  private readonly demo: DemoPilot;
  private readonly listeners = new Set<(e: SimEvent) => void>();
  private readonly dynOut: DynamicsOutput = {
    nz: 1,
    touchdown: null,
    structureImpact: 0,
    tailStrike: false,
    engineThrust: [0, 0],
  };
  private accumulator = 0;
  private lastRa = 0;
  private v1Called = false;
  private liftoffEmitted = false;
  private readonly stick3d: { side: 0 | 1 | 2; x: number; y: number } = { side: 0, x: 0, y: 0 };
  readonly user: UserControls = { pitch: 0, roll: 0, rudder: 0, tiller: 0, brakeL: 0, brakeR: 0 };
  /** Demo 是否仍在飛（使用者 TAKE CONTROL 後為 false） */
  demoFlying = false;
  keepApOnTakeover = true;
  private readonly emitFn = (e: SimEvent): void => this.emit(e);
  /** 檢查單輔助：完成過的步驟保持完成 */
  private readonly assistDone = new Set<number>();

  constructor(scenario: Scenario = 'quick', weather: WeatherPreset = 'CLEAR', timeOfDay = 10.5) {
    this.state = createInitialState(scenario, weather, timeOfDay);
    this.demo = new DemoPilot((c) => this.command(c));
    this.reset(scenario, weather, timeOfDay);
  }

  reset(scenario: Scenario, weather: WeatherPreset, timeOfDay: number): void {
    this.state = createInitialState(scenario, weather, timeOfDay);
    this.prevPos.copy(this.state.aircraft.position);
    this.prevQuat.copy(this.state.aircraft.quaternion);
    this.accumulator = 0;
    // 子系統皆含內部狀態（積分器、計時器、邊緣偵測），重置時一律重建
    this.dyn = new FlightDynamics();
    this.fcc = new FlightControlComputer();
    this.engines = new EngineSystem();
    this.afs = new AutoFlightSystem();
    this.gear = new GearSystem();
    this.doors = new DoorSystem();
    this.warnings = new WarningSystem();
    this.phase = new FlightPhaseManager();
    this.replay.reset();
    this.demo.reset();
    this.demoFlying = scenario === 'demo';
    this.v1Called = false;
    this.liftoffEmitted = false;
    this.lastRa = 0;
    this.assistDone.clear();
    // 讓衍生量（空速、電力等）在第一幀即正確
    this.step(0.0001);
    this.emit({ type: 'RESET' });
  }

  // ------------------------------------------------------------------ SimApi
  command(cmd: Command): void {
    applyCommand(this.state, this.afs, cmd, this.emitFn);
  }

  setSidestick(side: 1 | 2, x: number, y: number, active: boolean): void {
    this.stick3d.side = active ? side : 0;
    this.stick3d.x = x;
    this.stick3d.y = y;
  }

  on(listener: (e: SimEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(e: SimEvent): void {
    for (const l of this.listeners) l(e);
  }

  // ------------------------------------------------------------------ 時間
  /** 推進真實時間 dt（s）；回傳渲染插值係數 0..1 */
  advance(realDt: number): number {
    const s = this.state;
    if (s.meta.paused || s.meta.crashed) {
      this.accumulator = 0;
      return 1;
    }
    // 起降階段強制 1×
    const critical =
      s.flight.radioAltitude < 2500 ||
      s.flight.onGround ||
      s.meta.phase === 'APPROACH' ||
      s.meta.phase === 'FINAL';
    if (critical && s.meta.timeScale !== 1) s.meta.timeScale = 1;
    this.accumulator += Math.min(realDt, 0.1) * s.meta.timeScale;
    let steps = 0;
    const maxSteps = MAX_STEPS * s.meta.timeScale;
    while (this.accumulator >= FIXED_DT && steps < maxSteps) {
      this.prevPos.copy(s.aircraft.position);
      this.prevQuat.copy(s.aircraft.quaternion);
      this.step(FIXED_DT);
      this.accumulator -= FIXED_DT;
      steps++;
    }
    // 掉幀：捨棄剩餘累積，避免瞬移
    if (steps >= maxSteps) this.accumulator = 0;
    return this.accumulator / FIXED_DT;
  }

  /** 背景回前景：重置累積器 */
  resetAccumulator(): void {
    this.accumulator = 0;
  }

  takeControl(): void {
    this.demoFlying = false;
    this.state.meta.demoActive = false;
    this.state.input.owner = 'USER';
    if (!this.keepApOnTakeover && (this.state.afs.ap1 || this.state.afs.ap2))
      this.afs.disconnectAp(this.state, true);
  }

  // ------------------------------------------------------------------ 物理步
  step(dt: number): void {
    const s = this.state;
    const emit = this.emitFn;
    s.meta.time += dt;
    s.meta.stepCount++;
    this.routeInput(s, dt);

    this.dyn.prepare(s, dt);
    updateNavigation(s);
    updateIls(s);
    const afsOut = this.afs.update(s, this.dyn, dt, emit);
    this.gear.apSteer = afsOut.ap.active && s.afs.lateral === 'ROLL OUT' ? afsOut.ap.rudder : 0;
    this.engines.update(s, dt, afsOut.athrN1, emit);
    this.fcc.update(s, this.dyn, afsOut.ap, this.engines.thrust, dt, emit);
    this.dyn.step(s, dt, this.engines.thrust, this.dynOut);
    this.dyn.updateFlightData(s, this.dynOut.nz);

    updateElectrical(s, dt);
    updateHydraulic(s, dt);
    updateFuel(s, dt);
    updatePneumatic(s, dt);
    updatePressurization(s, dt);
    updateAntiIce(s, dt);
    updateAdirs(s, dt);
    this.gear.update(s, dt, emit);
    this.doors.update(s, dt);
    updateLights(s, dt);
    updateWeather(s, dt, emit);
    this.performanceSpeeds(s);
    this.events(s);
    this.warnings.update(s, dt, emit);
    this.phase.update(s, emit);
    // FCU 旋鈕推/拉動畫衰減
    const k = s.fcu.knobAnim;
    const decay = Math.max(0, 1 - dt * 6);
    k.spd *= decay;
    k.hdg *= decay;
    k.alt *= decay;
    k.vs *= decay;
    this.replay.record(s);
  }

  private routeInput(s: SimState, dt: number): void {
    const inp = s.input;
    const u = this.user;
    const side = this.stick3d.side;
    const userPitch = side ? this.stick3d.y : u.pitch;
    const userRoll = side ? this.stick3d.x : u.roll;
    if (this.demoFlying) {
      // 使用者強力操縱側桿 → 視為接管
      if (Math.abs(userPitch) > 0.5 || Math.abs(userRoll) > 0.5) this.takeControl();
      else {
        this.demo.update(s, dt);
        s.meta.demoActive = true;
      }
    }
    if (!this.demoFlying) {
      inp.owner = 'USER';
      inp.pitch = userPitch;
      inp.roll = userRoll;
      inp.rudder = u.rudder;
      inp.tiller = u.tiller;
      inp.brakeL = u.brakeL;
      inp.brakeR = u.brakeR;
      // 側桿超越門檻 → AP 解除（Airbus 超控）
      if ((s.afs.ap1 || s.afs.ap2) && (Math.abs(userPitch) > 0.5 || Math.abs(userRoll) > 0.5))
        this.afs.stickOverride(s);
      else if (s.afs.ap1 || s.afs.ap2) {
        inp.pitch = 0;
        inp.roll = 0;
      }
    }
    // 側桿視覺（AP 作動時側桿不隨動）
    const cap = s.controls.sidestickCapt;
    const target = side === 2 ? { x: 0, y: 0 } : { x: inp.roll, y: inp.pitch };
    cap.x += (target.x - cap.x) * Math.min(1, dt * 20);
    cap.y += (target.y - cap.y) * Math.min(1, dt * 20);
    const fo = s.controls.sidestickFo;
    const tfo = side === 2 ? { x: this.stick3d.x, y: this.stick3d.y } : { x: 0, y: 0 };
    fo.x += (tfo.x - fo.x) * Math.min(1, dt * 20);
    fo.y += (tfo.y - fo.y) * Math.min(1, dt * 20);
  }

  private performanceSpeeds(s: SimState): void {
    const f = s.flight;
    const m = s.aircraft.mass;
    const ice = s.antiIce.iceAccretion;
    const vs1g = (flaps: number, slats: number): number =>
      Math.sqrt((2 * m * G) / (1.225 * AIRCRAFT.wing.area * clMaxFor(flaps, slats, ice))) / KT;
    const cur = vs1g(s.controls.flapsAngle, s.controls.slatsAngle);
    const takeoff = s.afs.phase === 'TAKEOFF' || s.afs.phase === 'PREFLIGHT';
    f.vls = cur * (takeoff ? 1.13 : 1.23);
    const aStall = stallAlpha(s.controls.slatsAngle, ice);
    const clMax = clMaxFor(s.controls.flapsAngle, s.controls.slatsAngle, ice);
    f.vaprot =
      cur *
      Math.sqrt(
        clMax /
          liftCoefficient(aStall - 3.5 * DEG, s.controls.flapsAngle, s.controls.slatsAngle, ice),
      );
    f.vamax =
      cur *
      Math.sqrt(
        clMax /
          liftCoefficient(aStall - 1.5 * DEG, s.controls.flapsAngle, s.controls.slatsAngle, ice),
      );
    f.greenDot = 2 * (m / 1000) + 85 + Math.max(0, (f.pressureAltitude - 20000) / 1000);
    f.sSpeed = 1.23 * vs1g(0, 0);
    f.fSpeed = 1.26 * vs1g(10, 18);
    const row = FLAP_TABLE.find((r) => r.config === s.controls.flapConfig) ?? FLAP_TABLE[0];
    let vmax = Math.min(350, row.vfe);
    if (s.gear.lever === 'DOWN' || s.gear.position[1] > 0.01) vmax = Math.min(vmax, 280);
    f.vmax = vmax;
    if (s.afs.phase !== 'APPROACH') s.afs.vapp = Math.round(1.23 * vs1g(40, 27) + 5);
  }

  private events(s: SimState): void {
    const f = s.flight;
    const emit = this.emitFn;
    if (this.dynOut.touchdown) {
      const td = this.dynOut.touchdown;
      s.meta.lastTouchdown = { vs: td.vs, time: s.meta.time, g: td.g };
      this.phase.onTouchdown(s.meta.time);
      emit({ type: 'TOUCHDOWN', vs: td.vs, g: td.g });
      if (td.vs > 900) s.meta.crashed = true;
    }
    if (this.dynOut.structureImpact > 4.5) s.meta.crashed = true;
    if (!f.onGround && f.radioAltitude > 5 && !this.liftoffEmitted && f.ias > 80) {
      this.liftoffEmitted = true;
      emit({ type: 'LIFTOFF' });
    }
    if (f.onGround && f.gs < 30) this.liftoffEmitted = false;
    // V1
    const tla = Math.max(s.engines[0].tla, s.engines[1].tla);
    if (f.onGround && tla >= TLA.FLX - 0.5 && f.ias >= s.afs.v1 && !this.v1Called) {
      this.v1Called = true;
      emit({ type: 'V1' });
    }
    if (f.onGround && f.ias < 40) this.v1Called = false;
    // 無線電高度報讀（下降時）
    const ra = f.radioAltitude;
    if (!f.onGround && f.vs < -100 && (s.gear.lever === 'DOWN' || s.afs.phase === 'APPROACH')) {
      for (const [h, text] of RA_CALLOUTS) {
        if (this.lastRa > h && ra <= h) emit({ type: 'CALLOUT', text });
      }
    }
    this.lastRa = ra;
  }

  // ------------------------------------------------------------------ 設定
  setWeatherPreset(p: WeatherPreset): void {
    const w = this.state.weather;
    Object.assign(w, WEATHER_PRESETS[p]);
    w.preset = p;
  }

  /** 使用者自訂天氣（任一欄位變更即視為 CUSTOM，除非明確指定 preset） */
  setWeather(patch: Partial<WeatherState>): void {
    Object.assign(this.state.weather, { preset: 'CUSTOM' as const }, patch);
  }

  /** 冷艙檢查單目前步驟（全部完成回傳 -1） */
  assistStep(): number {
    COLD_DARK_CHECKLIST.forEach((st, i) => {
      if (st.done(this.state)) this.assistDone.add(i);
    });
    return COLD_DARK_CHECKLIST.findIndex((_, i) => !this.assistDone.has(i));
  }

  setFailure(k: keyof SimState['failures'], v: boolean): void {
    this.state.failures[k] = v;
  }

  setFastAlign(v: boolean): void {
    this.state.adirs.fastAlign = v;
  }

  setKeepApOnTakeover(v: boolean): void {
    this.keepApOnTakeover = v;
  }

  setTimeScale(ts: 1 | 2 | 4): void {
    const s = this.state;
    const critical = s.flight.radioAltitude < 2500 || s.flight.onGround;
    s.meta.timeScale = critical ? 1 : ts;
  }

  setPaused(p: boolean): void {
    this.state.meta.paused = p;
    this.accumulator = 0;
  }
}
