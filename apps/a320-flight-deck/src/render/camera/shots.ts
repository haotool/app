/**
 * CINEMATIC_AUTO 鏡頭庫與評分選鏡。純邏輯（不碰 three 物件），便於測試。
 * 分數 = FlightPhaseScore + NoveltyScore + EventScore + CompositionScore − RecentPenalty − DirectionPenalty。
 */
import type { FlightPhase, SimEvent } from '../../sim/types';

export type ShotCategory = 'WIDE' | 'MEDIUM' | 'DETAIL' | 'POV' | 'EXTERNAL';
type V3 = readonly [number, number, number];

/** 取景方式：座艙眼位、機體掛載、追隨、環繞、世界定點（開鏡時決定錨點） */
export type Rig =
  | {
      kind: 'cockpit';
      eye: 'capt' | 'fo' | 'center' | 'pedestal';
      yaw: number;
      pitch: number;
      panRate: number;
    }
  | { kind: 'mount'; pos: V3; target: V3; drift: V3; inside: boolean }
  | { kind: 'chase'; back: number; up: number; side: number }
  | { kind: 'orbit'; dist: number; elev: number; rate: number }
  | {
      kind: 'world';
      spot:
        | 'runwaySide'
        | 'rotation'
        | 'threshold'
        | 'touchdown'
        | 'tower'
        | 'flyby'
        | 'hold'
        | 'far'
        | 'taxiArrival';
      frame: number; // 取景寬度 m（決定望遠 FOV）
    };

/** 可行性：依飛機位置/狀態排除不合理鏡頭 */
export type ShotNeed = 'ground' | 'air' | 'nearRunway' | 'nearTower' | 'high';

export interface ShotDef {
  id: string;
  category: ShotCategory;
  phases: readonly FlightPhase[];
  dur: readonly [number, number];
  cooldown: number;
  lens: number; // 垂直 FOV（world rig 以取景寬度動態計算，lens 為上限）
  side: 'L' | 'R' | 'C';
  group: string; // 同群組不可連拍（例如左翼）
  priority: number;
  after?: readonly ShotCategory[]; // 偏好的前一鏡類別
  events?: readonly SimEvent['type'][];
  need?: ShotNeed;
  rig: Rig;
}

const GROUND: FlightPhase[] = ['COLD_DARK', 'POWERED', 'ENGINE_START', 'TAXI', 'PARKED', 'TAXI_IN'];
const AIR: FlightPhase[] = ['CLIMB', 'CRUISE', 'DESCENT'];
const ALL_AIR: FlightPhase[] = ['ROTATION', 'INITIAL_CLIMB', ...AIR, 'APPROACH', 'FINAL', 'FLARE'];

const cockpit = (
  yaw: number,
  pitch: number,
  panRate = 0,
  eye: 'capt' | 'fo' | 'center' | 'pedestal' = 'capt',
): Rig => ({ kind: 'cockpit', eye, yaw, pitch, panRate });
const mount = (pos: V3, target: V3, drift: V3 = [0, 0, 0], inside = false): Rig => ({
  kind: 'mount',
  pos,
  target,
  drift,
  inside,
});

export const SHOTS: readonly ShotDef[] = [
  {
    id: 'cockpitPovTaxi',
    category: 'POV',
    phases: [...GROUND, 'TAKEOFF_ROLL', 'ROLLOUT'],
    dur: [7, 11],
    cooldown: 45,
    lens: 55,
    side: 'C',
    group: 'cockpit',
    priority: 1.5,
    rig: cockpit(4, -4, 0.4),
  },
  {
    id: 'engineStartL',
    category: 'DETAIL',
    phases: GROUND,
    dur: [6, 9],
    cooldown: 60,
    lens: 38,
    side: 'L',
    group: 'engineL',
    priority: 0.5,
    events: ['ENGINE_START'],
    rig: mount([-8.6, -1.2, -11.5], [-5.75, -2.15, -6.6], [0.08, 0, 0.12]),
  },
  {
    id: 'engineStartR',
    category: 'DETAIL',
    phases: GROUND,
    dur: [6, 9],
    cooldown: 60,
    lens: 38,
    side: 'R',
    group: 'engineR',
    priority: 0.5,
    events: ['ENGINE_START'],
    rig: mount([8.6, -1.2, -11.5], [5.75, -2.15, -6.6], [-0.08, 0, 0.12]),
  },
  {
    id: 'wingTaxiL',
    category: 'MEDIUM',
    phases: [...GROUND, 'TAKEOFF_ROLL', 'ROTATION', 'ROLLOUT'],
    dur: [7, 10],
    cooldown: 50,
    lens: 50,
    side: 'L',
    group: 'wingL',
    priority: 1,
    rig: mount([-2.6, 1.05, 3.2], [-15.5, -0.6, 1.5]),
  },
  {
    id: 'wingTaxiR',
    category: 'MEDIUM',
    phases: [...GROUND, 'TAKEOFF_ROLL', 'ROTATION', 'ROLLOUT'],
    dur: [7, 10],
    cooldown: 50,
    lens: 50,
    side: 'R',
    group: 'wingR',
    priority: 1,
    rig: mount([2.6, 1.05, 3.2], [15.5, -0.6, 1.5]),
  },
  {
    id: 'noseGearTaxi',
    category: 'DETAIL',
    phases: [...GROUND, 'TAKEOFF_ROLL', 'ROLLOUT'],
    dur: [5, 8],
    cooldown: 55,
    lens: 45,
    side: 'C',
    group: 'noseGear',
    priority: 0.8,
    need: 'ground',
    rig: mount([1.7, -3.1, -15.2], [0, -3.3, -11.2], [0, 0, 0.1]),
  },
  {
    id: 'runwayHold',
    category: 'WIDE',
    phases: [...GROUND, 'TAKEOFF_ROLL'],
    dur: [8, 12],
    cooldown: 60,
    lens: 40,
    side: 'R',
    group: 'groundFixed',
    priority: 1,
    need: 'ground',
    rig: { kind: 'world', spot: 'hold', frame: 60 },
  },
  {
    id: 'takeoffSideTracking',
    category: 'EXTERNAL',
    phases: ['TAKEOFF_ROLL', 'ROTATION', 'INITIAL_CLIMB'],
    dur: [7, 11],
    cooldown: 60,
    lens: 30,
    side: 'R',
    group: 'runwaySide',
    priority: 2,
    need: 'nearRunway',
    rig: { kind: 'world', spot: 'runwaySide', frame: 55 },
  },
  {
    id: 'rotationLowAngle',
    category: 'EXTERNAL',
    phases: ['TAKEOFF_ROLL', 'ROTATION', 'INITIAL_CLIMB'],
    dur: [6, 9],
    cooldown: 60,
    lens: 35,
    side: 'L',
    group: 'lowAngle',
    priority: 2,
    events: ['ROTATE', 'LIFTOFF'],
    need: 'nearRunway',
    rig: { kind: 'world', spot: 'rotation', frame: 70 },
  },
  {
    id: 'gearRetraction',
    category: 'DETAIL',
    phases: ['INITIAL_CLIMB', 'CLIMB'],
    dur: [6, 9],
    cooldown: 90,
    lens: 48,
    side: 'L',
    group: 'mainGear',
    priority: 1,
    events: ['GEAR_LEVER', 'GEAR_LOCKED'],
    rig: mount([-1.2, -3.4, -3.8], [-3.8, -2.6, 1.4]),
  },
  {
    id: 'wingClimb',
    category: 'MEDIUM',
    phases: ['ROTATION', 'INITIAL_CLIMB', ...AIR, 'APPROACH', 'FINAL'],
    dur: [7, 11],
    cooldown: 50,
    lens: 55,
    side: 'L',
    group: 'wingL',
    priority: 1,
    rig: mount([-2.7, 1.1, 2.8], [-16.5, -0.2, 3.5]),
  },
  {
    id: 'engineClimb',
    category: 'DETAIL',
    phases: ['TAKEOFF_ROLL', 'ROTATION', 'INITIAL_CLIMB', ...AIR, 'APPROACH'],
    dur: [6, 9],
    cooldown: 55,
    lens: 42,
    side: 'R',
    group: 'engineR',
    priority: 0.8,
    rig: mount([7.9, -0.6, 2.8], [5.75, -2.1, -4.5]),
  },
  {
    id: 'chase',
    category: 'EXTERNAL',
    phases: ['TAXI', 'TAKEOFF_ROLL', ...ALL_AIR, 'TOUCHDOWN', 'ROLLOUT'],
    dur: [8, 13],
    cooldown: 40,
    lens: 45,
    side: 'C',
    group: 'chase',
    priority: 1.2,
    rig: { kind: 'chase', back: 48, up: 9, side: 6 },
  },
  {
    id: 'orbit',
    category: 'WIDE',
    phases: [...GROUND, 'TAKEOFF_ROLL', ...ALL_AIR, 'TOUCHDOWN', 'ROLLOUT'],
    dur: [10, 15],
    cooldown: 60,
    lens: 50,
    side: 'C',
    group: 'orbit',
    priority: 1,
    rig: { kind: 'orbit', dist: 62, elev: 12, rate: 9 },
  },
  {
    id: 'cloudPass',
    category: 'MEDIUM',
    phases: ['INITIAL_CLIMB', ...AIR, 'APPROACH'],
    dur: [6, 10],
    cooldown: 70,
    lens: 58,
    side: 'R',
    group: 'wingR',
    priority: 0.7,
    events: ['CLOUD_ENTRY', 'CLOUD_EXIT'],
    need: 'air',
    rig: mount([2.8, 1.0, 1.2], [17, -0.3, -2.5]),
  },
  {
    id: 'highAltitudeWide',
    category: 'WIDE',
    phases: AIR,
    dur: [9, 14],
    cooldown: 80,
    lens: 30,
    side: 'R',
    group: 'farFixed',
    priority: 1,
    need: 'high',
    rig: { kind: 'world', spot: 'far', frame: 220 },
  },
  {
    id: 'sunsetWing',
    category: 'MEDIUM',
    phases: ['INITIAL_CLIMB', ...AIR, 'APPROACH'],
    dur: [8, 12],
    cooldown: 70,
    lens: 60,
    side: 'R',
    group: 'wingR',
    priority: 0.6,
    need: 'air',
    rig: mount([2.5, 1.2, 4.2], [14, -0.2, 6]),
  },
  {
    id: 'cockpitCruise',
    category: 'POV',
    phases: ['INITIAL_CLIMB', ...AIR, 'APPROACH'],
    dur: [8, 12],
    cooldown: 50,
    lens: 58,
    side: 'C',
    group: 'cockpit',
    priority: 1.2,
    rig: cockpit(12, -6, -0.8, 'fo'),
  },
  {
    id: 'descentTerrainReveal',
    category: 'WIDE',
    phases: ['CRUISE', 'DESCENT', 'APPROACH'],
    dur: [9, 13],
    cooldown: 80,
    lens: 55,
    side: 'L',
    group: 'chaseHigh',
    priority: 1,
    events: ['TOP_OF_DESCENT'],
    need: 'air',
    rig: { kind: 'chase', back: 70, up: 38, side: -30 },
  },
  {
    id: 'approachNose',
    category: 'MEDIUM',
    phases: ['DESCENT', 'APPROACH', 'FINAL', 'FLARE'],
    dur: [6, 9],
    cooldown: 60,
    lens: 45,
    side: 'C',
    group: 'nose',
    priority: 1,
    rig: mount([2.6, -1.6, -27], [0, 0.2, -13]),
  },
  {
    id: 'landingGearView',
    category: 'DETAIL',
    phases: ['APPROACH', 'FINAL', 'FLARE'],
    dur: [6, 9],
    cooldown: 80,
    lens: 50,
    side: 'R',
    group: 'mainGear',
    priority: 1,
    events: ['GEAR_LEVER', 'GEAR_LOCKED'],
    rig: mount([1.3, -3.4, -4.2], [3.8, -3.2, 1.4]),
  },
  {
    id: 'runwayThreshold',
    category: 'EXTERNAL',
    phases: ['FINAL', 'FLARE', 'TOUCHDOWN'],
    dur: [7, 10],
    cooldown: 90,
    lens: 30,
    side: 'C',
    group: 'threshold',
    priority: 2,
    need: 'nearRunway',
    rig: { kind: 'world', spot: 'threshold', frame: 60 },
  },
  {
    id: 'towerTelephoto',
    category: 'EXTERNAL',
    phases: [
      'TAXI',
      'TAXI_IN',
      'TAKEOFF_ROLL',
      'ROTATION',
      'INITIAL_CLIMB',
      'FINAL',
      'FLARE',
      'TOUCHDOWN',
      'ROLLOUT',
    ],
    dur: [7, 11],
    cooldown: 70,
    lens: 20,
    side: 'L',
    group: 'tower',
    priority: 1.3,
    events: ['TOUCHDOWN'],
    need: 'nearTower',
    rig: { kind: 'world', spot: 'tower', frame: 50 },
  },
  {
    id: 'touchdownSide',
    category: 'EXTERNAL',
    phases: ['FINAL', 'FLARE', 'TOUCHDOWN', 'ROLLOUT'],
    dur: [7, 10],
    cooldown: 90,
    lens: 28,
    side: 'R',
    group: 'runwaySide',
    priority: 2,
    events: ['TOUCHDOWN'],
    need: 'nearRunway',
    rig: { kind: 'world', spot: 'touchdown', frame: 55 },
  },
  {
    id: 'spoilerDeployment',
    category: 'DETAIL',
    phases: ['FLARE', 'TOUCHDOWN', 'ROLLOUT'],
    dur: [5, 8],
    cooldown: 90,
    lens: 50,
    side: 'L',
    group: 'wingL',
    priority: 1,
    events: ['GROUND_SPOILERS'],
    rig: mount([-3.0, 1.6, 6.2], [-9, -0.5, 1.2]),
  },
  {
    id: 'reverseThrust',
    category: 'DETAIL',
    phases: ['TOUCHDOWN', 'ROLLOUT'],
    dur: [5, 8],
    cooldown: 90,
    lens: 45,
    side: 'R',
    group: 'engineR',
    priority: 1,
    events: ['REVERSE'],
    rig: mount([8.3, -1.0, 4.5], [5.75, -2.2, -1.5]),
  },
  {
    id: 'runwayRollout',
    category: 'EXTERNAL',
    phases: ['TAKEOFF_ROLL', 'TOUCHDOWN', 'ROLLOUT', 'TAXI_IN'],
    dur: [7, 11],
    cooldown: 60,
    lens: 50,
    side: 'L',
    group: 'chaseLow',
    priority: 1,
    need: 'ground',
    rig: { kind: 'chase', back: 36, up: 3.5, side: -9 },
  },
  {
    id: 'taxiArrival',
    category: 'WIDE',
    phases: GROUND,
    dur: [9, 13],
    cooldown: 70,
    lens: 45,
    side: 'L',
    group: 'groundAhead',
    priority: 1,
    need: 'ground',
    rig: { kind: 'world', spot: 'taxiArrival', frame: 55 },
  },
  {
    id: 'cockpitFinal',
    category: 'POV',
    phases: ['TAKEOFF_ROLL', 'ROTATION', 'APPROACH', 'FINAL', 'FLARE', 'TOUCHDOWN', 'ROLLOUT'],
    dur: [8, 12],
    cooldown: 50,
    lens: 56,
    side: 'C',
    group: 'cockpit',
    priority: 1.5,
    events: ['TOUCHDOWN'],
    rig: cockpit(0, -5),
  },
  {
    id: 'pfdDetail',
    category: 'DETAIL',
    phases: ['INITIAL_CLIMB', ...AIR, 'APPROACH', 'FINAL'],
    dur: [5, 7],
    cooldown: 60,
    lens: 40,
    side: 'L',
    group: 'panel',
    priority: 0.8,
    events: ['LOC_CAPTURE', 'GS_CAPTURE', 'FMA_CHANGE'],
    rig: mount([-0.5, 0.42, -14.85], [-0.62, 0.02, -15.4], [0, 0, 0.02], true),
  },
  {
    id: 'fcuDetail',
    category: 'DETAIL',
    phases: ['POWERED', 'TAXI', 'INITIAL_CLIMB', ...AIR, 'APPROACH'],
    dur: [5, 7],
    cooldown: 60,
    lens: 40,
    side: 'C',
    group: 'panel',
    priority: 0.8,
    events: ['LOC_CAPTURE', 'AP_ENGAGED'],
    rig: mount([-0.2, 0.55, -14.75], [0.05, 0.36, -15.3], [0.02, 0, 0], true),
  },
  {
    id: 'tailView',
    category: 'MEDIUM',
    phases: [
      'TAKEOFF_ROLL',
      'ROTATION',
      'INITIAL_CLIMB',
      ...AIR,
      'APPROACH',
      'FLARE',
      'TOUCHDOWN',
      'ROLLOUT',
    ],
    dur: [7, 11],
    cooldown: 55,
    lens: 55,
    side: 'C',
    group: 'tail',
    priority: 0.9,
    rig: mount([0, 8.3, 30], [0, 1.2, -6]),
  },
  {
    id: 'overheadDetail',
    category: 'DETAIL',
    phases: GROUND,
    dur: [5, 7],
    cooldown: 70,
    lens: 48,
    side: 'C',
    group: 'overhead',
    priority: 0.6,
    events: ['APU_START', 'APU_AVAIL'],
    rig: cockpit(-8, 62, 0, 'center'),
  },
  {
    id: 'flybyPass',
    category: 'EXTERNAL',
    phases: ['INITIAL_CLIMB', ...AIR, 'APPROACH', 'FINAL'],
    dur: [7, 10],
    cooldown: 70,
    lens: 35,
    side: 'R',
    group: 'flyby',
    priority: 1.3,
    need: 'air',
    rig: { kind: 'world', spot: 'flyby', frame: 70 },
  },
];

/** 類別節奏：前一鏡類別 → 偏好的下一鏡類別 */
const RHYTHM: Record<ShotCategory, readonly ShotCategory[]> = {
  WIDE: ['DETAIL', 'POV', 'MEDIUM'],
  MEDIUM: ['WIDE', 'POV', 'EXTERNAL'],
  DETAIL: ['POV', 'EXTERNAL', 'WIDE'],
  POV: ['EXTERNAL', 'WIDE', 'MEDIUM'],
  EXTERNAL: ['DETAIL', 'POV', 'MEDIUM'],
};

export const HISTORY_SIZE = 12;
export const NO_REPEAT_WINDOW = 8;

export interface PickContext {
  phase: FlightPhase;
  now: number;
  history: readonly string[]; // 新到舊
  lastUsed: ReadonlyMap<string, number>;
  event: SimEvent['type'] | null;
  dusk: number;
  pickCount: number;
  feasible: (need: ShotNeed | undefined) => boolean;
}

const BY_ID = new Map(SHOTS.map((s) => [s.id, s]));
export const shotById = (id: string): ShotDef | undefined => BY_ID.get(id);

/** 確定性擾動（打破平手，不依賴 Math.random） */
function jitter(id: string, n: number): number {
  let h = 2166136261 ^ n;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

export function scoreShot(s: ShotDef, c: PickContext, strict: boolean): number {
  if (!s.phases.includes(c.phase) || !c.feasible(s.need)) return -Infinity;
  const prev = c.history.length > 0 ? BY_ID.get(c.history[0]) : undefined;
  const recentIdx = c.history.indexOf(s.id);
  if (prev && (prev.id === s.id || prev.group === s.group)) return -Infinity;
  if (strict && recentIdx >= 0 && recentIdx < NO_REPEAT_WINDOW) return -Infinity;

  const phaseScore = 5 + s.priority;
  const last = c.lastUsed.get(s.id);
  const novelty = last === undefined ? 3.5 : Math.min(3, (c.now - last) / 60);
  const eventScore = c.event && s.events?.includes(c.event) ? 10 : 0;
  let composition = 0;
  if (prev) {
    if (RHYTHM[prev.category].includes(s.category)) composition += 2.5;
    else if (prev.category === s.category) composition -= 3;
    if (s.after && !s.after.includes(prev.category)) composition -= 1.5;
  }
  if (s.id === 'sunsetWing') composition += c.dusk * 4 - 1;
  let recentPenalty = recentIdx >= 0 ? (recentIdx < NO_REPEAT_WINDOW ? 12 : 4) : 0;
  if (last !== undefined && c.now - last < s.cooldown) recentPenalty += 6;
  const directionPenalty = prev && prev.side !== 'C' && prev.side === s.side ? 4 : 0;
  return (
    phaseScore +
    novelty +
    eventScore +
    composition -
    recentPenalty -
    directionPenalty +
    jitter(s.id, c.pickCount) * 0.8
  );
}

/** 選下一鏡：先嚴格（最近 8 鏡不重複），無候選時放寬（仍不連拍同鏡/同群組） */
export function pickShot(c: PickContext): ShotDef {
  for (const strict of [true, false]) {
    let best: ShotDef | null = null;
    let bestScore = -Infinity;
    for (const s of SHOTS) {
      const sc = scoreShot(s, c, strict);
      if (sc > bestScore) {
        bestScore = sc;
        best = s;
      }
    }
    if (best) return best;
  }
  const fallback = BY_ID.get(c.history[0] === 'orbit' ? 'chase' : 'orbit');
  if (!fallback) throw new Error('shot catalog missing fallback');
  return fallback;
}

/** 事件類型冷卻秒數（CINEMATIC_AUTO 事件切鏡） */
export const EVENT_COOLDOWN: Partial<Record<SimEvent['type'], number>> = {
  ENGINE_START: 25,
  APU_START: 40,
  APU_AVAIL: 40,
  GEAR_LEVER: 15,
  GEAR_LOCKED: 15,
  CLOUD_ENTRY: 45,
  CLOUD_EXIT: 45,
  TOP_OF_DESCENT: 60,
  LOC_CAPTURE: 25,
  GS_CAPTURE: 25,
  FMA_CHANGE: 45,
  AP_ENGAGED: 40,
  TOUCHDOWN: 30,
  GROUND_SPOILERS: 20,
  REVERSE: 20,
  ROTATE: 30,
  LIFTOFF: 30,
};
