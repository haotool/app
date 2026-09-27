/**
 * 模擬狀態單一真相來源（SSOT）。
 * 所有系統、儀表、外部模型、音效、攝影機只讀寫這份狀態；任何顯示元件不得自持狀態。
 *
 * 座標慣例（three.js）：世界 x=東、y=上、z=南（北為 -z）；1 unit = 1 m。
 * 機體座標：+X 右翼、+Y 上、-Z 機鼻；原點為重心（機身中心線上）。
 * 航向 0°=北（-z）、90°=東（+x）。
 */
import type { Quaternion, Vector3 } from 'three';

export type Scenario = 'quick' | 'coldDark' | 'demo' | 'free';
export type WeatherPreset =
  | 'CLEAR'
  | 'SCATTERED'
  | 'OVERCAST'
  | 'RAIN'
  | 'FOG'
  | 'CROSSWIND'
  | 'TURBULENCE'
  | 'CUSTOM';

export type FlightPhase =
  | 'COLD_DARK'
  | 'POWERED'
  | 'ENGINE_START'
  | 'TAXI'
  | 'TAKEOFF_ROLL'
  | 'ROTATION'
  | 'INITIAL_CLIMB'
  | 'CLIMB'
  | 'CRUISE'
  | 'DESCENT'
  | 'APPROACH'
  | 'FINAL'
  | 'FLARE'
  | 'TOUCHDOWN'
  | 'ROLLOUT'
  | 'TAXI_IN'
  | 'PARKED';

/** 剛體與飛行衍生量 */
export interface AircraftState {
  position: Vector3; // 世界座標（重心），m
  velocity: Vector3; // 世界慣性速度，m/s
  acceleration: Vector3; // 世界加速度，m/s²
  quaternion: Quaternion; // 機體 → 世界
  /** 機體角速度，航空慣例：p 右翼下沉為正、q 抬頭為正、r 機鼻右偏為正（rad/s） */
  p: number;
  q: number;
  r: number;
  angularAccel: { p: number; q: number; r: number };
  mass: number; // kg（含燃油）
  cgMac: number; // %MAC
}

/** 空速/姿態/高度等衍生量（每個物理步更新） */
export interface FlightData {
  ias: number; // kt
  tas: number; // kt
  gs: number; // kt
  mach: number;
  aoa: number; // deg
  beta: number; // deg
  altitudeMsl: number; // ft，真實幾何高度
  pressureAltitude: number; // ft，標準氣壓高度（QNH 修正在顯示端依各側 BARO 計算）
  radioAltitude: number; // ft，主輪底至地面
  vs: number; // ft/min
  heading: number; // deg
  track: number; // deg
  pitch: number; // deg，抬頭為正
  roll: number; // deg，右傾為正
  fpa: number; // deg，飛行路徑角
  nz: number; // g
  speedTrend: number; // kt，10 秒預測增量
  onGround: boolean;
  wow: [boolean, boolean, boolean]; // nose, left main, right main
  windDir: number; // 當地風向（from），deg
  windSpeed: number; // kt
  oat: number; // °C
  tat: number; // °C
  rho: number; // kg/m³
  vls: number; // kt，最低可選速度
  vaprot: number; // kt，α prot
  vamax: number; // kt，α max
  vmax: number; // kt，VMO/VFE 取小
  greenDot: number; // kt
  fSpeed: number; // kt
  sSpeed: number; // kt
}

export interface PilotInput {
  pitch: number; // -1..1，拉桿為正（抬頭）
  roll: number; // -1..1，右為正
  rudder: number; // -1..1，右踏板為正
  tiller: number; // -1..1
  brakeL: number; // 0..1
  brakeR: number; // 0..1
  /** 目前輸入擁有者；AUTOPILOT 時使用者側桿超過門檻會觸發 AP 解除 */
  owner: 'USER' | 'AUTOPILOT' | 'ASSIST';
}

export type FlapConfig = '0' | '1' | '1+F' | '2' | '3' | 'FULL';

export interface FlightControlsState {
  elevator: number; // deg，後緣下為正（產生低頭）
  ths: number; // deg，水平安定面配平，機頭上為正
  aileronL: number; // deg，後緣下為正
  aileronR: number;
  rudder: number; // deg，後緣右為正
  rudderTrim: number; // deg
  /** 每側 5 片擾流板（1 = 內側），deg 0..50 */
  spoilersL: number[];
  spoilersR: number[];
  flapHandle: number; // 0..4
  flapConfig: FlapConfig;
  flapsAngle: number; // deg 實際位置
  slatsAngle: number; // deg 實際位置
  flapsTarget: number;
  slatsTarget: number;
  speedbrakeHandle: number; // 0..1（RET..FULL）
  spoilersArmed: boolean;
  groundSpoilersActive: boolean;
  law: 'NORMAL' | 'ALTERNATE' | 'DIRECT';
  /** FBW 內部參考 */
  fpaRef: number;
  pitchIntegrator: number;
  protActive: { aoa: boolean; speed: boolean; bank: boolean; pitch: boolean };
  sidestickCapt: { x: number; y: number }; // 視覺用側桿偏移（-1..1）
  sidestickFo: { x: number; y: number };
}

export type EngineRunState = 'OFF' | 'STARTING' | 'IDLE' | 'RUNNING' | 'SHUTTING_DOWN';

export interface EngineState {
  state: EngineRunState;
  master: boolean;
  firePushed: boolean;
  n1: number; // %
  n2: number; // %
  egt: number; // °C
  ff: number; // kg/h
  thrust: number; // N（負值為反推）
  n1Cmd: number; // %
  tla: number; // deg，油門桿角度 -20 (MAX REV) .. 45 (TOGA)
  reverser: number; // 0..1 展開量
  starterValve: boolean;
  ignition: boolean;
  fuelValve: boolean;
  oilPress: number; // psi
  startTimer: number; // s
  fanAngle: number; // rad，外部模型風扇相位（由 N1 積分）
  bleedPress: number; // psi
  antiIce: boolean;
}

export type ApuRunState = 'OFF' | 'STARTING' | 'AVAILABLE' | 'RUNNING' | 'SHUTDOWN';

export interface ApuState {
  master: boolean;
  startPb: boolean;
  state: ApuRunState;
  n: number; // %
  egt: number; // °C
  flap: number; // 0..1 進氣門
  timer: number;
  bleedPress: number;
}

export type AcSource = 'GEN1' | 'GEN2' | 'APU' | 'EXT' | null;

export interface ElectricalState {
  bat1: boolean; // pb AUTO=true
  bat2: boolean;
  bat1V: number;
  bat2V: number;
  bat1Charge: number; // 0..1
  bat2Charge: number;
  extPwrAvail: boolean;
  extPwrOn: boolean;
  gen1: boolean; // pb ON=true
  gen2: boolean;
  apuGen: boolean;
  busTie: boolean;
  gen1Online: boolean;
  gen2Online: boolean;
  apuGenOnline: boolean;
  ac1Source: AcSource;
  ac2Source: AcSource;
  acBus1: boolean;
  acBus2: boolean;
  acEss: boolean;
  dcBus1: boolean;
  dcBus2: boolean;
  dcEss: boolean;
  dcBat: boolean;
  hotBus: boolean;
  /** 各負載功率旗標，給顯示器與系統讀取 */
  loads: { load1: number; load2: number; apuLoad: number };
}

export interface HydSystem {
  pressure: number; // psi
  quantity: number; // 0..1
}

export interface HydraulicState {
  green: HydSystem;
  blue: HydSystem;
  yellow: HydSystem;
  eng1Pump: boolean;
  eng2Pump: boolean;
  elecPump: boolean; // blue elec pump（AUTO=true）
  yellowElecPump: boolean;
  ptu: boolean;
  ptuActive: boolean;
}

export interface FuelState {
  left: number; // kg
  right: number;
  center: number;
  pumps: { l1: boolean; l2: boolean; c1: boolean; c2: boolean; r1: boolean; r2: boolean };
  xfeed: boolean;
  used1: number; // kg
  used2: number;
  fob: number;
}

export type XBleed = 'SHUT' | 'AUTO' | 'OPEN';

export interface PneumaticState {
  eng1Bleed: boolean;
  eng2Bleed: boolean;
  apuBleed: boolean;
  xbleed: XBleed;
  xbleedOpen: boolean;
  pack1: boolean;
  pack2: boolean;
  packFlow: 'LO' | 'NORM' | 'HI';
  ductL: number; // psi
  ductR: number;
  pack1Flow: number; // 0..1
  pack2Flow: number;
  cabinTemp: number; // °C
}

export interface PressurizationState {
  cabinAlt: number; // ft
  cabinVs: number; // ft/min
  deltaP: number; // psi
  modeMan: boolean;
  manVs: -1 | 0 | 1; // 1 = UP, -1 = DN
  ditching: boolean;
  outflowValve: number; // 0..1 開度
  landingElev: number; // ft
}

export interface AntiIceState {
  wing: boolean;
  eng1: boolean;
  eng2: boolean;
  probe: boolean;
  iceAccretion: number; // 0..1（機翼）
  engineIce: [number, number];
  iceDetected: boolean;
}

export type IrMode = 'OFF' | 'NAV' | 'ATT';

export interface AdirsState {
  ir: { mode: IrMode; alignRemaining: number; aligned: boolean; attAvail: boolean }[];
  fastAlign: boolean;
}

export type Autobrake = 'OFF' | 'LO' | 'MED' | 'MAX';

export interface GearState {
  lever: 'UP' | 'DOWN';
  /** 0 = 收上鎖定，1 = 放下鎖定；[nose, left, right] */
  position: [number, number, number];
  doors: [number, number, number]; // 0 關 .. 1 開
  downLocked: [boolean, boolean, boolean];
  upLocked: [boolean, boolean, boolean];
  compression: [number, number, number]; // m
  wheelSpin: [number, number, number]; // rad/s
  wheelAngle: [number, number, number]; // rad（視覺相位）
  steerAngle: number; // deg，前輪轉向
  parkingBrake: boolean;
  autobrake: Autobrake;
  autobrakeActive: boolean;
  autobrakeDecel: boolean; // DECEL 燈
  brakeTemp: [number, number]; // °C
  brakePressL: number; // 0..1 實際
  brakePressR: number;
  antiSkid: boolean;
}

export interface LightState {
  strobe: 'OFF' | 'AUTO' | 'ON';
  beacon: boolean;
  wing: boolean;
  navLogo: boolean;
  rwyTurnoff: boolean;
  landL: 'RETRACT' | 'OFF' | 'ON';
  landR: 'RETRACT' | 'OFF' | 'ON';
  nose: 'OFF' | 'TAXI' | 'TO';
  dome: 'OFF' | 'DIM' | 'BRT';
  annun: 'TEST' | 'BRT' | 'DIM';
  integral: number; // 0..1 面板背光
  flood: number; // 0..1 面板泛光
  seatBelts: 'OFF' | 'AUTO' | 'ON';
  noSmoking: 'OFF' | 'AUTO' | 'ON';
  /** 外部模型直接讀取的閃爍輸出（由 LightSystem 計算） */
  strobeOn: boolean;
  beaconOn: number; // 0..1
  landingLightExtension: [number, number]; // 0..1 著陸燈伸出量
  duBrightness: Record<DuId, number>; // 0..1，0 = OFF
}

export type WarningLevel = 'WARNING' | 'CAUTION' | 'ADVISORY' | 'MEMO';

export interface EcamMessage {
  id: string;
  level: WarningLevel;
  title: string; // 英文 ECAM 標準文字
  actions: string[];
  since: number;
}

export interface WarningState {
  masterWarning: boolean;
  masterCaution: boolean;
  messages: EcamMessage[]; // 目前成立的警告/注意
  acknowledged: string[]; // 已按 MASTER 解除燈號的訊息 id
  cleared: string[]; // 已按 CLR 移至 STATUS 的訊息 id
  memos: string[]; // 綠色 memo
  toConfigTest: number; // >0 表 T.O CONFIG 測試中剩餘秒數
  fireTest: boolean;
}

export type SdPage =
  | 'ENG'
  | 'BLEED'
  | 'PRESS'
  | 'ELEC'
  | 'HYD'
  | 'FUEL'
  | 'APU'
  | 'COND'
  | 'DOOR'
  | 'WHEEL'
  | 'F/CTL'
  | 'STS'
  | 'CRUISE';

export interface EcamState {
  sdPage: SdPage;
  manualPage: SdPage | null; // null = 自動
}

export type DuId = 'pfd1' | 'nd1' | 'ewd' | 'sd' | 'nd2' | 'pfd2' | 'mcdu1' | 'mcdu2' | 'isis';

export type NdMode = 'LS' | 'VOR' | 'NAV' | 'ARC' | 'PLAN';

export interface EfisState {
  fd: boolean;
  ls: boolean;
  cstr: boolean;
  wpt: boolean;
  vord: boolean;
  ndb: boolean;
  arpt: boolean;
  mode: NdMode;
  range: 10 | 20 | 40 | 80 | 160 | 320;
  baroStd: boolean;
  qnh: number; // hPa
  baroUnit: 'hPa' | 'inHg';
}

export interface FcuState {
  spd: number; // kt
  mach: number;
  spdMach: 'SPD' | 'MACH';
  spdManaged: boolean;
  hdg: number;
  hdgManaged: boolean; // 顯示 dashes
  hdgPreset: boolean; // 使用者旋轉但尚未拉出
  trkFpa: boolean; // false = HDG-V/S
  alt: number; // ft
  altInc: 100 | 1000;
  vs: number; // ft/min
  fpa: number; // deg
  vsDashes: boolean;
  metric: boolean;
  exped: boolean;
  /** 燈號與旋鈕動畫 */
  knobAnim: { spd: number; hdg: number; alt: number; vs: number }; // push(+1)/pull(-1) 動畫衰減
}

export type AthrMode =
  | 'SPEED'
  | 'MACH'
  | 'THR CLB'
  | 'THR IDLE'
  | 'THR LVR'
  | 'THR MCT'
  | 'MAN TOGA'
  | 'MAN FLX'
  | 'MAN THR'
  | 'A.FLOOR'
  | 'TOGA LK';

export type LateralMode =
  | 'RWY'
  | 'RWY TRK'
  | 'HDG'
  | 'TRK'
  | 'NAV'
  | 'LOC*'
  | 'LOC'
  | 'GA TRK'
  | 'ROLL OUT';

export type VerticalMode =
  | 'SRS'
  | 'CLB'
  | 'OP CLB'
  | 'DES'
  | 'OP DES'
  | 'ALT*'
  | 'ALT'
  | 'ALT CST*'
  | 'ALT CST'
  | 'V/S'
  | 'FPA'
  | 'EXP CLB'
  | 'EXP DES'
  | 'G/S*'
  | 'G/S'
  | 'LAND'
  | 'FLARE'
  | 'ROLL OUT';

export type FmgcPhase =
  | 'PREFLIGHT'
  | 'TAKEOFF'
  | 'CLIMB'
  | 'CRUISE'
  | 'DESCENT'
  | 'APPROACH'
  | 'GO AROUND'
  | 'DONE';

export interface AutoflightState {
  ap1: boolean;
  ap2: boolean;
  fd1: boolean; // 與 EFIS fd 同步（EFIS 為輸入，這裡為 FD 可用+啟用）
  fd2: boolean;
  athrArmed: boolean; // A/THR pb 綠燈（armed 或 active）
  athrActive: boolean;
  athrMode: AthrMode | null;
  athrArmedMode: 'A/THR' | null; // FMA 藍色「A/THR」（armed 未作動）
  lateral: LateralMode | null;
  lateralArmed: 'NAV' | 'LOC' | null;
  vertical: VerticalMode | null;
  verticalArmed: ('ALT' | 'G/S' | 'CLB' | 'DES' | 'FINAL')[];
  approachCap: 'CAT1' | 'CAT2' | 'CAT3 SINGLE' | 'CAT3 DUAL' | null;
  apprArmed: boolean; // APPR pb 燈
  locArmed: boolean; // LOC pb 燈
  /** FD 導引（姿態目標），給 PFD FD bars */
  fdRoll: number; // deg 目標坡度
  fdPitch: number; // deg 目標俯仰
  fdYaw: number; // 滑跑時的 yaw bar
  targetSpeed: number; // kt（有效目標速度）
  targetMach: number;
  targetAltitude: number; // ft（有效：受約束影響）
  phase: FmgcPhase;
  v1: number;
  vr: number;
  v2: number;
  flexTemp: number | null;
  thrRedAlt: number; // ft
  accAlt: number; // ft
  transAlt: number; // ft
  vapp: number;
  /** FMA 模式變更時框線時間戳（10 s 內顯示白框） */
  modeChangeTime: { athr: number; lat: number; vert: number; cap: number; ap: number };
  /** 模式內部參考（例如 OP CLB 的積分器） */
  speedIntegrator: number;
  altCaptureVs: number;
  flareStartVs: number;
  retardCalled: boolean;
  /** TOGA LK / alpha floor 等狀態 */
  alphaFloor: boolean;
  apDisconnectWarning: number; // >0 播放紅色 AUTO FLT AP OFF 剩餘秒數
  athrDisconnectCaution: number;
}

export interface Waypoint {
  ident: string;
  x: number; // 世界 m
  z: number;
  alt?: { type: 'AT' | 'AT_OR_ABOVE' | 'AT_OR_BELOW'; ft: number };
  spd?: number; // kt 限制
  kind: 'RWY' | 'WPT' | 'IAF' | 'FAF' | 'VOR' | 'NDB';
}

export interface FlightPlanState {
  origin: string;
  originRwy: string;
  destination: string;
  destRwy: string;
  waypoints: Waypoint[];
  activeLeg: number; // 目前 TO waypoint 索引
  crzFl: number; // flight level（百呎）
  costIndex: number;
  flightNo: string;
  zfw: number; // t
  blockFuel: number; // t
  initialized: boolean;
  perfInitialized: boolean;
  /** 衍生：沿航路剩餘距離 nm、下降頂點距離 nm */
  distToDest: number;
  distToWpt: number;
  todDist: number;
  xtk: number; // nm，右為正
  desiredTrack: number; // deg
  directToPending: string | null;
}

export interface IlsState {
  ident: string;
  freq: number;
  course: number;
  tuned: boolean;
  locValid: boolean;
  gsValid: boolean;
  locDev: number; // dots（右為正：航道在右）
  gsDev: number; // dots（上為正：下滑道在上）
  dme: number; // nm
  markerOuter: boolean;
}

export type McduColor = 'white' | 'cyan' | 'green' | 'amber' | 'magenta' | 'yellow' | 'red';

export interface McduSeg {
  col: number; // 0..23
  text: string;
  color: McduColor;
  small?: boolean;
}

/** 14 行（0=標題、1..12=標籤/資料交替、13=草稿列），每行 24 欄 */
export interface McduScreen {
  rows: McduSeg[][];
  arrows: { up: boolean; down: boolean; left: boolean; right: boolean };
}

export type McduPage =
  | 'MENU'
  | 'INIT'
  | 'FPLN'
  | 'PERF'
  | 'PROG'
  | 'DIR'
  | 'RADNAV'
  | 'DATA'
  | 'FUEL'
  | 'AIRPORT';

export interface McduState {
  page: McduPage;
  perfPage: 'TO' | 'CLB' | 'CRZ' | 'DES' | 'APPR' | 'GA';
  scratchpad: string;
  message: string | null;
  scroll: number;
  msgAmber: boolean;
  keyFlash: number; // 最近按鍵時間（給按鍵背光回饋）
}

export interface WeatherState {
  preset: WeatherPreset;
  windDir: number; // 地面風向（from），deg
  windSpeed: number; // kt（地面）
  windAloftDir: number;
  windAloftSpeed: number; // kt（FL100）
  gust: number; // kt
  turbulence: number; // 0..1
  visibility: number; // m
  cloudCover: number; // 0..1
  cloudBase: number; // ft MSL
  cloudTop: number; // ft MSL
  precipitation: number; // 0..1
  isaDev: number; // °C
  qnh: number; // hPa（實際）
  timeOfDay: number; // 0..24 h（本地時）
  seed: number;
  /** 由 WeatherManager 計算 */
  inCloud: boolean;
  cloudDensityAtAircraft: number; // 0..1
  icing: boolean;
  lightning: number; // 0..1 閃電亮度（RAIN 限定）
}

export interface FailureState {
  eng1Fail: boolean;
  eng2Fail: boolean;
  gen1Fail: boolean;
  hydGreenLeak: boolean;
  apuFail: boolean;
}

/** 艙門（0 關閉 .. 1 全開）；地勤於停機位開啟，推出/啟動前自動關閉 */
export interface DoorsState {
  cabinFwdL: number;
  cabinFwdR: number;
  cabinAftL: number;
  cabinAftR: number;
  cargoFwd: number;
  cargoAft: number;
  avionics: number;
}

/** 導航無線電調頻（VOR 以識別碼表示） */
export interface RadioState {
  vor1: string;
  vor2: string;
}

/** 純機構位置（無獨立系統的選擇器/保護蓋） */
export interface MechState {
  engMode: 'CRANK' | 'NORM' | 'IGN/START';
  guardsOpen: string[]; // 已掀開保護蓋所保護的按鈕 id
}

export interface SimMeta {
  time: number; // s 模擬時間
  paused: boolean;
  timeScale: 1 | 2 | 4;
  scenario: Scenario;
  phase: FlightPhase;
  phaseSince: number;
  demoActive: boolean;
  stepCount: number;
  lastTouchdown: { vs: number; time: number; g: number } | null;
  crashed: boolean;
  assist: boolean;
}

export interface SimState {
  meta: SimMeta;
  aircraft: AircraftState;
  flight: FlightData;
  input: PilotInput;
  controls: FlightControlsState;
  engines: [EngineState, EngineState];
  apu: ApuState;
  elec: ElectricalState;
  hyd: HydraulicState;
  fuel: FuelState;
  pneu: PneumaticState;
  press: PressurizationState;
  antiIce: AntiIceState;
  adirs: AdirsState;
  gear: GearState;
  lights: LightState;
  warnings: WarningState;
  ecam: EcamState;
  efis: [EfisState, EfisState]; // [capt, fo]
  fcu: FcuState;
  afs: AutoflightState;
  fplan: FlightPlanState;
  ils: IlsState;
  mcdu: [McduState, McduState];
  weather: WeatherState;
  failures: FailureState;
  mech: MechState;
  doors: DoorsState;
  radio: RadioState;
}

/** 事件匯流排（模擬 → 音效 / 攝影機 / UI） */
export type SimEvent =
  | { type: 'ENGINE_START'; engine: 0 | 1 }
  | { type: 'ENGINE_RUNNING'; engine: 0 | 1 }
  | { type: 'ENGINE_SHUTDOWN'; engine: 0 | 1 }
  | { type: 'APU_START' }
  | { type: 'APU_AVAIL' }
  | { type: 'GEAR_LEVER'; down: boolean }
  | { type: 'GEAR_LOCKED'; down: boolean }
  | { type: 'FLAPS_SELECTED'; config: FlapConfig }
  | { type: 'AP_ENGAGED'; ap: 1 | 2 }
  | { type: 'AP_DISCONNECT'; instinctive: boolean }
  | { type: 'ATHR_DISCONNECT' }
  | { type: 'FMA_CHANGE'; column: 'athr' | 'lat' | 'vert' }
  | { type: 'LOC_CAPTURE' }
  | { type: 'GS_CAPTURE' }
  | { type: 'LIFTOFF' }
  | { type: 'TOUCHDOWN'; vs: number; g: number }
  | { type: 'GROUND_SPOILERS'; deployed: boolean }
  | { type: 'REVERSE'; deployed: boolean }
  | { type: 'CLOUD_ENTRY' }
  | { type: 'CLOUD_EXIT' }
  | { type: 'TOP_OF_DESCENT' }
  | { type: 'PHASE'; phase: FlightPhase }
  | { type: 'CALLOUT'; text: string }
  | { type: 'MASTER_WARNING'; on: boolean }
  | { type: 'MASTER_CAUTION'; on: boolean }
  | { type: 'CLICK'; kind: 'button' | 'switch' | 'knob' | 'lever' | 'key' | 'guard' | 'detent' }
  | { type: 'CHIME' }
  | { type: 'V1' }
  | { type: 'ROTATE' }
  | { type: 'RESET' };
