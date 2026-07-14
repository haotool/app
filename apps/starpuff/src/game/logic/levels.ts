import type { EnemyKind, LevelId } from '../core/types';

// 關卡資料 SSOT（GAME_DESIGN §15，pure TS 不 import phaser），vitest 對象。
// GameScene 與 waves runner 一律讀表驅動，禁止每關硬編碼分支。

export interface EnemyMixEntry {
  kind: EnemyKind;
  weight: number;
}

// x 為平台中心點；主地面由 GameScene 依 worldWidth 全寬鋪設，不列入 platforms。
export interface PlatformSpec {
  x: number;
  y: number;
  w: number;
}

export interface LevelSpec {
  id: LevelId;
  nameZh: string;
  bgKey: string;
  worldWidth: number;
  killQuota: number;
  spawnIntervalMs: number;
  maxOnScreen: number;
  safeZoneTailPx: number;
  enemyMix: readonly EnemyMixEntry[];
  platforms: readonly PlatformSpec[];
  boss: boolean;
  tutorial: boolean;
}

// v3 橫式世界（§21）：高 480、主地面頂 y=400（480-80）；平台雙層以內，
// 層高 336 / 272（單段爬升 ≤82px，跳躍 -420 可達），節奏依 encounter spacing 每 300–650px 一組。
export const LEVELS: readonly LevelSpec[] = [
  {
    id: 1,
    nameZh: '果凍草原',
    bgKey: 'bg-meadow',
    worldWidth: 2700,
    killQuota: 6,
    spawnIntervalMs: 2600,
    maxOnScreen: 3,
    safeZoneTailPx: 480,
    enemyMix: [
      { kind: 'jelly', weight: 0.6 },
      { kind: 'floaty', weight: 0.4 },
    ],
    platforms: [
      { x: 700, y: 336, w: 180 },
      { x: 1400, y: 336, w: 170 },
      { x: 2050, y: 320, w: 160 },
    ],
    boss: false,
    tutorial: true,
  },
  {
    id: 2,
    nameZh: '雲朵高台',
    bgKey: 'bg-heights',
    worldWidth: 3100,
    killQuota: 9,
    spawnIntervalMs: 1800,
    maxOnScreen: 4,
    safeZoneTailPx: 480,
    enemyMix: [
      { kind: 'floaty', weight: 0.4 },
      { kind: 'spiky', weight: 0.35 },
      { kind: 'puffy', weight: 0.25 },
    ],
    platforms: [
      { x: 450, y: 336, w: 150 },
      { x: 760, y: 272, w: 140 },
      { x: 1250, y: 336, w: 150 },
      { x: 1560, y: 272, w: 140 },
      { x: 2050, y: 336, w: 150 },
      { x: 2400, y: 300, w: 140 },
    ],
    boss: false,
    tutorial: false,
  },
  {
    id: 3,
    nameZh: '星空回廊',
    bgKey: 'bg-arena',
    worldWidth: 3500,
    killQuota: 10,
    spawnIntervalMs: 1300,
    maxOnScreen: 5,
    safeZoneTailPx: 480,
    // 五種混編，可吸怪（jelly/floaty/puffy）佔比 50%（§15）。
    enemyMix: [
      { kind: 'jelly', weight: 0.15 },
      { kind: 'floaty', weight: 0.15 },
      { kind: 'puffy', weight: 0.2 },
      { kind: 'spiky', weight: 0.3 },
      { kind: 'chompy', weight: 0.2 },
    ],
    platforms: [
      { x: 400, y: 336, w: 130 },
      { x: 700, y: 272, w: 120 },
      { x: 1050, y: 336, w: 130 },
      { x: 1450, y: 300, w: 130 },
      { x: 1800, y: 336, w: 120 },
      { x: 2150, y: 272, w: 120 },
      { x: 2600, y: 336, w: 130 },
    ],
    boss: false,
    tutorial: false,
  },
  {
    id: 4,
    nameZh: '魔王城',
    bgKey: 'bg-throne',
    worldWidth: 854,
    killQuota: 0,
    spawnIntervalMs: 3500,
    maxOnScreen: 2,
    safeZoneTailPx: 0,
    enemyMix: [
      { kind: 'jelly', weight: 0.6 },
      { kind: 'floaty', weight: 0.4 },
    ],
    platforms: [],
    boss: true,
    tutorial: false,
  },
];

export function getLevel(id: LevelId): LevelSpec {
  const level = LEVELS.find((spec) => spec.id === id);
  if (!level) throw new Error(`未定義的關卡 id：${id}`);
  return level;
}

export function nextLevelId(id: LevelId): LevelId | null {
  const index = LEVELS.findIndex((spec) => spec.id === id);
  return LEVELS[index + 1]?.id ?? null;
}

// 關卡推進狀態機：擊殺累計 → 配額達成開門；boss 關過關由 BOSS_DEFEATED 觸發，永不開門。
export interface LevelRunState {
  levelId: LevelId;
  killCount: number;
  spawnTimerMs: number;
  gateOpen: boolean;
}

export function createLevelRun(id: LevelId): LevelRunState {
  return { levelId: id, killCount: 0, spawnTimerMs: 0, gateOpen: false };
}

export function recordKill(state: LevelRunState): LevelRunState {
  const level = getLevel(state.levelId);
  const killCount = state.killCount + 1;
  const gateOpen = !level.boss && killCount >= level.killQuota;
  return { ...state, killCount, gateOpen };
}

export interface LevelSpawnTick {
  deltaMs: number;
  aliveEnemies: number;
}

export interface LevelSpawnResult {
  state: LevelRunState;
  spawn: boolean;
}

// spawn 節流：間隔到期且未達同屏上限才生成；開門後停止（尾端 release）。
// 達上限時 timer 停在間隔值，空位一出現即刻補生。
export function advanceLevelSpawn(state: LevelRunState, tick: LevelSpawnTick): LevelSpawnResult {
  const level = getLevel(state.levelId);
  const spawnTimerMs = Math.min(state.spawnTimerMs + tick.deltaMs, level.spawnIntervalMs);
  if (state.gateOpen || spawnTimerMs < level.spawnIntervalMs) {
    return { state: { ...state, spawnTimerMs }, spawn: false };
  }
  if (tick.aliveEnemies >= level.maxOnScreen) {
    return { state: { ...state, spawnTimerMs }, spawn: false };
  }
  return { state: { ...state, spawnTimerMs: 0 }, spawn: true };
}

// 加權抽選：rand01 由呼叫端注入（Math.random 或測試定值）。
export function pickEnemyKind(level: LevelSpec, rand01: number): EnemyKind {
  const total = level.enemyMix.reduce((sum, entry) => sum + entry.weight, 0);
  let threshold = rand01 * total;
  for (const entry of level.enemyMix) {
    threshold -= entry.weight;
    if (threshold < 0) return entry.kind;
  }
  return level.enemyMix[level.enemyMix.length - 1]?.kind ?? 'jelly';
}

// 尾端安全區：星星門前禁 spawn 的喘息帶。
export function isInSafeTail(level: LevelSpec, x: number): boolean {
  return level.safeZoneTailPx > 0 && x >= level.worldWidth - level.safeZoneTailPx;
}
