import type { BossKind, EnemyKind, LevelId } from '../core/types';
import { canInhale } from './combat';
import type { EasterEggSpec } from './eggs';

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

// v4 平台元素（§29）：data-driven 進關卡資料，由 systems/stage.ts 建立與更新。
// oneway/moving 座標同 PlatformSpec 中心點制；moving 的 range 為 tween 目標軸向位移（可負）。
// v8 上升氣流柱（§51）：zone 型非碰撞，x 為柱心、topY 為升力終止高、w 為柱寬。
export type StageElementSpec =
  | { kind: 'oneway'; x: number; y: number; w: number }
  | {
      kind: 'moving';
      x: number;
      y: number;
      w: number;
      axis: 'x' | 'y';
      range: number;
      durationMs: number;
    }
  | { kind: 'spring'; x: number; y: number }
  | { kind: 'breakable'; x: number; y: number; loot: 'ammo' | 'hp' }
  | { kind: 'updraft'; x: number; topY: number; w: number };

// 主題道具佈景（§31/§32）：純裝飾無碰撞，key 對應 assets.ts 的 prop-<theme>-<1..4>。
export interface DecorSpec {
  key: string;
  x: number;
}

// 中魔王精英（§48）：關卡中段一隻既有怪變體（tint+scale+血量+FSM 倍率，零新美術）。
// 擊敗掉落稀有味小怪與回復食物；精英房軟鎖門擊敗開門、60s 逾時自動開門防卡關。
export interface EliteSpec {
  kind: EnemyKind;
  x: number;
  hp: number;
  scale: number;
  tint: number;
  speedMul: number;
  rewardFlavor: EnemyKind;
}

// v8 契約變更（§50）：elite 單值改 elites 陣列（L6 雙精英）；boss 改品種標記
//（'jellord'／'noctra'／null，truthy 語意與舊 boolean 相容）。
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
  elements: readonly StageElementSpec[];
  decor: readonly DecorSpec[];
  easterEggs: readonly EasterEggSpec[];
  elites: readonly EliteSpec[];
  boss: BossKind | null;
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
    // §29：S1 起單向平台 2-4 個；與既有平台錯位排布。
    elements: [
      { kind: 'oneway', x: 1000, y: 336, w: 150 },
      { kind: 'oneway', x: 1750, y: 320, w: 150 },
      { kind: 'oneway', x: 2350, y: 336, w: 140 },
    ],
    // §32：地面帶每 400-600px 1-2 件，主題 key 對應 prop-meadow-1..4。
    decor: [
      { key: 'prop-meadow-1', x: 320 },
      { key: 'prop-meadow-2', x: 880 },
      { key: 'prop-meadow-3', x: 1420 },
      { key: 'prop-meadow-4', x: 1980 },
      { key: 'prop-meadow-1', x: 2520 },
    ],
    // §24 彩蛋一：開局反向走到世界最左緣（玩家起點 x=100）。
    easterEggs: [{ trigger: 'reach-x', reward: 'hp-up', maxX: 60 }],
    // §48：粉紅暴走果凍丁——跳頻與衝量 1.5 倍，擊敗掉流光味。
    elites: [
      {
        kind: 'jelly',
        x: 1500,
        hp: 10,
        scale: 1.6,
        tint: 0xff6fa5,
        speedMul: 1.5,
        rewardFlavor: 'glowy',
      },
    ],
    boss: null,
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
    // v4 §30 權重重配 + v7 §47 glowy 10% 入編：可吸佔比維持 ≥50%。
    enemyMix: [
      { kind: 'floaty', weight: 0.3 },
      { kind: 'spiky', weight: 0.25 },
      { kind: 'puffy', weight: 0.2 },
      { kind: 'shelly', weight: 0.15 },
      { kind: 'glowy', weight: 0.1 },
    ],
    platforms: [
      { x: 450, y: 336, w: 150 },
      { x: 760, y: 272, w: 140 },
      { x: 1250, y: 336, w: 150 },
      { x: 1560, y: 272, w: 140 },
      { x: 2050, y: 336, w: 150 },
      { x: 2400, y: 300, w: 140 },
    ],
    // §29：S2 起加入移動平台與彈簧墊；彈簧立於地面（矩形中心 y=391，高 18）。
    elements: [
      { kind: 'oneway', x: 950, y: 336, w: 140 },
      { kind: 'oneway', x: 1850, y: 336, w: 140 },
      { kind: 'moving', x: 2620, y: 320, w: 120, axis: 'x', range: 140, durationMs: 2600 },
      { kind: 'spring', x: 1150, y: 391 },
    ],
    decor: [
      { key: 'prop-heights-1', x: 280 },
      { key: 'prop-heights-2', x: 820 },
      { key: 'prop-heights-3', x: 1380 },
      { key: 'prop-heights-4', x: 1920 },
      { key: 'prop-heights-1', x: 2460 },
      { key: 'prop-heights-2', x: 2960 },
    ],
    // §24 彩蛋二：最高雲朵平台（層高 272）連續站上 3 次。
    easterEggs: [{ trigger: 'stand-count', reward: 'full-magazine', platformY: 272, count: 3 }],
    // §48：鋼青重殼殼——血量池制（不入縮殼循環）、走速 1.4 倍，擊敗掉重鑽味。
    elites: [
      {
        kind: 'shelly',
        x: 1700,
        hp: 14,
        scale: 1.55,
        tint: 0x5aa8c8,
        speedMul: 1.4,
        rewardFlavor: 'drilly',
      },
    ],
    boss: null,
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
    // 混編高壓（§15）+ v7 §47 drilly/glowy 入編（八種）：可吸佔比維持 ≥50%
    // （drilly 僅破土窗可吸，保守值不計入）。
    enemyMix: [
      { kind: 'jelly', weight: 0.15 },
      { kind: 'floaty', weight: 0.1 },
      { kind: 'puffy', weight: 0.1 },
      { kind: 'spiky', weight: 0.2 },
      { kind: 'chompy', weight: 0.15 },
      { kind: 'zappy', weight: 0.1 },
      { kind: 'drilly', weight: 0.1 },
      { kind: 'glowy', weight: 0.1 },
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
    // §29：S3 起加入可破壞磚 2-3 個；磚為地面獨立磚（40x40 中心 y=380），
    // 單跳最高 98px 必可越過，佈於支線不擋唯一路徑（反卡死）。
    elements: [
      { kind: 'oneway', x: 1250, y: 320, w: 130 },
      { kind: 'oneway', x: 2900, y: 336, w: 130 },
      { kind: 'moving', x: 2380, y: 336, w: 120, axis: 'y', range: -56, durationMs: 2200 },
      { kind: 'spring', x: 1600, y: 391 },
      { kind: 'breakable', x: 550, y: 380, loot: 'ammo' },
      { kind: 'breakable', x: 1950, y: 380, loot: 'hp' },
      { kind: 'breakable', x: 3050, y: 380, loot: 'ammo' },
    ],
    decor: [
      { key: 'prop-arena-1', x: 340 },
      { key: 'prop-arena-2', x: 900 },
      { key: 'prop-arena-3', x: 1460 },
      { key: 'prop-arena-4', x: 2020 },
      { key: 'prop-arena-1', x: 2580 },
      { key: 'prop-arena-2', x: 3140 },
    ],
    // §24 彩蛋三：依序連吞 jelly→floaty→puffy。
    easterEggs: [
      { trigger: 'eat-sequence', reward: 'gold-star', sequence: ['jelly', 'floaty', 'puffy'] },
    ],
    // §48：暗紫狂咬花——前搖/冷卻縮時 1.6 倍攻速，擊敗掉流光味。
    elites: [
      {
        kind: 'chompy',
        x: 1900,
        hp: 20,
        scale: 1.5,
        tint: 0x8a5fd8,
        speedMul: 1.6,
        rewardFlavor: 'glowy',
      },
    ],
    boss: null,
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
    // §29：boss 關僅裝飾；decor x 以資料 worldWidth 為基準，stage 依當前視寬等比換算。
    elements: [],
    decor: [
      { key: 'prop-throne-1', x: 110 },
      { key: 'prop-throne-2', x: 320 },
      { key: 'prop-throne-3', x: 540 },
      { key: 'prop-throne-4', x: 750 },
    ],
    // §24 彩蛋四：魔王可擊打後 5 秒內命中皇冠（首擊）。
    easterEggs: [{ trigger: 'crown-early-hit', reward: 'heal', windowMs: 5000 }],
    // §48：魔王關無中魔王（Boss 即高潮）。
    elites: [],
    boss: 'jellord',
    tutorial: false,
  },
  // v8 世界擴張（§50）——L5 翔風峽谷：上升氣流柱垂直分層探索、Gusty 主場。
  {
    id: 5,
    nameZh: '翔風峽谷',
    bgKey: 'bg-canyon',
    worldWidth: 3300,
    killQuota: 10,
    spawnIntervalMs: 1500,
    maxOnScreen: 5,
    safeZoneTailPx: 480,
    // §52 入編：gusty 主場 30%＋spora 20%；可吸佔比 0.8（gusty/floaty/spora/jelly）。
    enemyMix: [
      { kind: 'gusty', weight: 0.3 },
      { kind: 'spora', weight: 0.2 },
      { kind: 'spiky', weight: 0.2 },
      { kind: 'floaty', weight: 0.15 },
      { kind: 'jelly', weight: 0.15 },
    ],
    // §51 垂直分層：208 高台僅氣流柱可達（anti-softlock：主線走地面雙層即可）。
    platforms: [
      { x: 500, y: 336, w: 150 },
      { x: 1000, y: 208, w: 130 },
      { x: 1420, y: 336, w: 150 },
      { x: 1900, y: 208, w: 130 },
      { x: 2350, y: 300, w: 140 },
      { x: 2820, y: 336, w: 140 },
    ],
    elements: [
      { kind: 'updraft', x: 1000, topY: 150, w: 96 },
      { kind: 'updraft', x: 1900, topY: 150, w: 96 },
      { kind: 'updraft', x: 2600, topY: 170, w: 96 },
      { kind: 'oneway', x: 700, y: 320, w: 140 },
      { kind: 'oneway', x: 2150, y: 336, w: 140 },
      { kind: 'spring', x: 1550, y: 391 },
    ],
    // §55 重用評估：峽谷天空道具沿用 heights 主題（氣球/雲絮/風旗/星燈）。
    decor: [
      { key: 'prop-heights-1', x: 300 },
      { key: 'prop-heights-2', x: 850 },
      { key: 'prop-heights-3', x: 1400 },
      { key: 'prop-heights-4', x: 1950 },
      { key: 'prop-heights-1', x: 2500 },
      { key: 'prop-heights-2', x: 3000 },
    ],
    // §24 彩蛋五：乘氣流連續兩次站上 208 高台。
    easterEggs: [{ trigger: 'stand-count', reward: 'hp-up', platformY: 208, count: 2 }],
    // §52：狂風飄鳥——俯衝與側風強化 1.4 倍，擊敗掉迴旋味（迴旋星先行體驗）。
    elites: [
      {
        kind: 'gusty',
        x: 1650,
        hp: 16,
        scale: 1.5,
        tint: 0x6fa8dc,
        speedMul: 1.4,
        rewardFlavor: 'boomy',
      },
    ],
    boss: null,
    tutorial: false,
  },
  // L6 迴聲石廊：Boomy 迴旋彈道主場＋移動平台/彈簧複合陣＋雙精英、全怪種高密度混編。
  {
    id: 6,
    nameZh: '迴聲石廊',
    bgKey: 'bg-gallery',
    worldWidth: 3600,
    killQuota: 12,
    spawnIntervalMs: 1200,
    maxOnScreen: 5,
    safeZoneTailPx: 480,
    // §52 全怪種混編（十二種）：可吸佔比 0.72（shelly/drilly 條件可吸保守不計）。
    enemyMix: [
      { kind: 'boomy', weight: 0.16 },
      { kind: 'spora', weight: 0.12 },
      { kind: 'gusty', weight: 0.1 },
      { kind: 'spiky', weight: 0.1 },
      { kind: 'jelly', weight: 0.08 },
      { kind: 'floaty', weight: 0.08 },
      { kind: 'puffy', weight: 0.08 },
      { kind: 'chompy', weight: 0.08 },
      { kind: 'zappy', weight: 0.07 },
      { kind: 'shelly', weight: 0.06 },
      { kind: 'drilly', weight: 0.04 },
      { kind: 'glowy', weight: 0.03 },
    ],
    platforms: [
      { x: 420, y: 336, w: 140 },
      { x: 760, y: 272, w: 130 },
      { x: 1150, y: 336, w: 140 },
      { x: 1750, y: 300, w: 130 },
      { x: 2200, y: 336, w: 140 },
      { x: 2650, y: 272, w: 120 },
      { x: 3050, y: 336, w: 130 },
    ],
    // §29 複合陣：雙移動平台＋雙彈簧＋破磚支線。
    elements: [
      { kind: 'oneway', x: 950, y: 320, w: 130 },
      { kind: 'oneway', x: 2430, y: 320, w: 130 },
      { kind: 'moving', x: 1450, y: 320, w: 120, axis: 'x', range: 160, durationMs: 2200 },
      { kind: 'moving', x: 2900, y: 336, w: 120, axis: 'y', range: -56, durationMs: 2000 },
      { kind: 'spring', x: 1900, y: 391 },
      { kind: 'spring', x: 3200, y: 391 },
      { kind: 'breakable', x: 600, y: 380, loot: 'ammo' },
      { kind: 'breakable', x: 2050, y: 380, loot: 'hp' },
    ],
    // §55 重用評估：石廊沿用 arena 主題道具（水晶/星柱/光苔/浮石）。
    decor: [
      { key: 'prop-arena-1', x: 320 },
      { key: 'prop-arena-2', x: 870 },
      { key: 'prop-arena-3', x: 1420 },
      { key: 'prop-arena-4', x: 1970 },
      { key: 'prop-arena-1', x: 2520 },
      { key: 'prop-arena-2', x: 3070 },
    ],
    // §24 彩蛋六：依序連吞 boomy→zappy（電鋸迴旋配方預告）。
    easterEggs: [{ trigger: 'eat-sequence', reward: 'gold-star', sequence: ['boomy', 'zappy'] }],
    // §52 雙精英：重殼迴力守衛（前段）＋暗雷水母（後段），房距 1200px 不重疊。
    elites: [
      {
        kind: 'boomy',
        x: 1300,
        hp: 16,
        scale: 1.5,
        tint: 0x8fb8e8,
        speedMul: 1.3,
        rewardFlavor: 'glowy',
      },
      {
        kind: 'zappy',
        x: 2500,
        hp: 18,
        scale: 1.5,
        tint: 0x9b6fd8,
        speedMul: 1.5,
        rewardFlavor: 'drilly',
      },
    ],
    boss: null,
    tutorial: false,
  },
  // L7 蝕月王座：第二魔王暗月蝠王 Noctra（§54，空中型三階段）。
  {
    id: 7,
    nameZh: '蝕月王座',
    bgKey: 'bg-eclipse',
    worldWidth: 854,
    killQuota: 0,
    spawnIntervalMs: 3200,
    maxOnScreen: 2,
    safeZoneTailPx: 0,
    // 補生全可吸（§26 飢荒保證律）：gusty 歸疾風味。
    enemyMix: [
      { kind: 'jelly', weight: 0.4 },
      { kind: 'floaty', weight: 0.3 },
      { kind: 'gusty', weight: 0.3 },
    ],
    platforms: [],
    elements: [],
    decor: [
      { key: 'prop-throne-1', x: 110 },
      { key: 'prop-throne-2', x: 320 },
      { key: 'prop-throne-3', x: 540 },
      { key: 'prop-throne-4', x: 750 },
    ],
    // §24 彩蛋七：蝠王可擊打後 5 秒內首次命中。
    easterEggs: [{ trigger: 'crown-early-hit', reward: 'heal', windowMs: 5000 }],
    elites: [],
    boss: 'noctra',
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
  // 反卡死（§26）：玩家彈藥 0 且場上無可吸怪的飢荒狀態。
  starving?: boolean;
}

export interface LevelSpawnResult {
  state: LevelRunState;
  spawn: boolean;
}

// spawn 節流：間隔到期且未達同屏上限才生成；開門後停止（尾端 release）。
// 達上限時 timer 停在間隔值，空位一出現即刻補生。
// 反卡死保證律（§26）：boss 期彈藥飢荒立即補生，不等生成間隔。
export function advanceLevelSpawn(state: LevelRunState, tick: LevelSpawnTick): LevelSpawnResult {
  const level = getLevel(state.levelId);
  if (tick.starving && level.boss) {
    return { state: { ...state, spawnTimerMs: 0 }, spawn: true };
  }
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

// 反卡死保證律（§26）：飢荒時覆蓋權重，僅自可吸子集抽選。
export function pickSpawnKind(level: LevelSpec, rand01: number, starving: boolean): EnemyKind {
  if (!starving) return pickEnemyKind(level, rand01);
  const inhalable = level.enemyMix.filter((entry) => canInhale(entry.kind));
  if (inhalable.length === 0) return 'jelly';
  const forced: LevelSpec = { ...level, enemyMix: inhalable };
  return pickEnemyKind(forced, rand01);
}

// 尾端安全區：星星門前禁 spawn 的喘息帶。
export function isInSafeTail(level: LevelSpec, x: number): boolean {
  return level.safeZoneTailPx > 0 && x >= level.worldWidth - level.safeZoneTailPx;
}
