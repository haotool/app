import type { BossKind, EnemyKind, LevelId } from '../core/types';
import type { BuffId } from './buffs';
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
// v10 星門折躍（§65）：同 pairId 成對傳送；純邏輯見 logic/warp.ts，資料不變式見 levels.test。
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
  | { kind: 'updraft'; x: number; topY: number; w: number }
  | { kind: 'warp'; x: number; y: number; pairId: string };

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
// v9（§60）：hint 為關卡開場提示浮字（資料驅動，L8 星化教學用），無則不顯示。
// v10（§66）：checkpointX 為卡點關中點重生錨（死亡自此重生，killCount／彩蛋／計時不重置）。
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
  hint?: string;
  checkpointX?: number;
  // v10 魔王關體系（§68）：anteroomPx 為前室廊道寬（runtime 世界寬＝前室＋動態視寬）；
  // anteroomBuffs 為前室二選一台座、arenaBuff 為 P2 高風險位投放（EX 不投放）。
  anteroomPx?: number;
  anteroomBuffs?: readonly BuffId[];
  arenaBuff?: BuffId;
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
    // v9 攻略多樣化（§58）：補生加入 shelly（暈眩窗可吸）供殼化反彈路徑；
    // 飢荒保證律取保守值（shelly 不計入），jelly/floaty 仍佔 0.8。
    enemyMix: [
      { kind: 'jelly', weight: 0.5 },
      { kind: 'floaty', weight: 0.3 },
      { kind: 'shelly', weight: 0.2 },
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
    // 難度根修（§54）：供給怪定位是彈藥非第二傷害源——間隔 3200 → 4500、同屏 2 → 1、
    // 移除俯衝型 gusty（疾風味由 floaty 供給）；彈藥保證由飢荒立即補生承擔（§26）。
    spawnIntervalMs: 4500,
    maxOnScreen: 1,
    safeZoneTailPx: 0,
    // 補生全可吸（§26 飢荒保證律）；v9（§58）加 zappy 供雷化斷召路徑。
    enemyMix: [
      { kind: 'jelly', weight: 0.45 },
      { kind: 'floaty', weight: 0.35 },
      { kind: 'zappy', weight: 0.2 },
    ],
    platforms: [],
    // v9 攻略多樣化（§58）：雙彈簧板提供非風化的到空路徑（過 stageModel 掃掠背擋）。
    elements: [
      { kind: 'spring', x: 190, y: 391 },
      { kind: 'spring', x: 664, y: 391 },
    ],
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
  // v9 世界擴張（§60）——L8 磁極洞窟：Magno 主場磁場干擾＋drilly 地下突襲組合、
  // 首次星化教學提示（hint 浮字）；精英磁暴磁極獸。
  {
    id: 8,
    nameZh: '磁極洞窟',
    bgKey: 'bg-cavern',
    worldWidth: 3400,
    killQuota: 11,
    spawnIntervalMs: 1400,
    maxOnScreen: 5,
    safeZoneTailPx: 480,
    // §60 入編：magno 主場 26%＋zappy 16%（雷化素材充足）；可吸佔比 0.74
    //（magno/zappy/jelly/glowy 恆可吸；drilly 破土窗保守不計）。
    enemyMix: [
      { kind: 'magno', weight: 0.26 },
      { kind: 'zappy', weight: 0.16 },
      { kind: 'jelly', weight: 0.16 },
      { kind: 'glowy', weight: 0.16 },
      { kind: 'drilly', weight: 0.13 },
      { kind: 'spiky', weight: 0.13 },
    ],
    platforms: [
      { x: 520, y: 336, w: 150 },
      { x: 900, y: 272, w: 130 },
      { x: 1350, y: 336, w: 150 },
      { x: 1980, y: 300, w: 140 },
      { x: 2450, y: 336, w: 140 },
      { x: 2900, y: 272, w: 130 },
    ],
    // §29 推進：單向 ×3＋移動 ×1＋彈簧 ×1＋破磚 ×2（磁場中彈道不可靠，破磚補彈救急）。
    elements: [
      { kind: 'oneway', x: 700, y: 320, w: 140 },
      { kind: 'oneway', x: 1650, y: 336, w: 140 },
      { kind: 'oneway', x: 2680, y: 320, w: 130 },
      { kind: 'moving', x: 2150, y: 320, w: 120, axis: 'x', range: 150, durationMs: 2400 },
      { kind: 'spring', x: 1150, y: 391 },
      { kind: 'breakable', x: 800, y: 380, loot: 'ammo' },
      { kind: 'breakable', x: 2300, y: 380, loot: 'hp' },
    ],
    // §55 重用評估：洞窟沿用 arena 主題道具（水晶/星柱/光苔/浮石——晶洞質感）。
    decor: [
      { key: 'prop-arena-1', x: 300 },
      { key: 'prop-arena-2', x: 850 },
      { key: 'prop-arena-3', x: 1400 },
      { key: 'prop-arena-4', x: 1950 },
      { key: 'prop-arena-1', x: 2500 },
      { key: 'prop-arena-2', x: 3050 },
    ],
    // §24 彩蛋八：連吞兩隻雷鏈味（magno/zappy 皆計，雷化素材湊法教學）。
    easterEggs: [{ trigger: 'eat-sequence', reward: 'gold-star', sequence: ['zappy', 'zappy'] }],
    // §60：磁暴磁極獸——磁場週期縮時 1.3 倍，擊敗掉重鑽味。
    elites: [
      {
        kind: 'magno',
        x: 1750,
        hp: 18,
        scale: 1.5,
        tint: 0x6a80c8,
        speedMul: 1.3,
        rewardFlavor: 'drilly',
      },
    ],
    boss: null,
    tutorial: false,
    hint: '同系星彈集滿 3 發，地面長按吸入鍵 0.6 秒星化變身',
  },
  // L9 鏡影迴廊：Mirri 主場反射主題＋移動平台複合陣＋雙精英；通關提示 EX 入口解鎖。
  {
    id: 9,
    nameZh: '鏡影迴廊',
    bgKey: 'bg-mirror',
    worldWidth: 3700,
    killQuota: 12,
    spawnIntervalMs: 1150,
    maxOnScreen: 5,
    safeZoneTailPx: 480,
    // §60 入編：mirri 主場 24%＋magno 12%（雙新怪同場）；可吸佔比 0.9。
    enemyMix: [
      { kind: 'mirri', weight: 0.24 },
      { kind: 'boomy', weight: 0.12 },
      { kind: 'magno', weight: 0.12 },
      { kind: 'floaty', weight: 0.14 },
      { kind: 'spora', weight: 0.14 },
      { kind: 'gusty', weight: 0.14 },
      { kind: 'chompy', weight: 0.1 },
    ],
    platforms: [
      { x: 430, y: 336, w: 140 },
      { x: 800, y: 272, w: 130 },
      { x: 1250, y: 336, w: 140 },
      { x: 1850, y: 300, w: 130 },
      { x: 2350, y: 336, w: 140 },
      { x: 2800, y: 272, w: 120 },
      { x: 3200, y: 336, w: 130 },
    ],
    // §29 複合陣：雙移動平台＋雙彈簧＋單向 ×3＋破磚 ×2（反射窗躲位靠垂直機動）。
    elements: [
      { kind: 'oneway', x: 1000, y: 320, w: 130 },
      { kind: 'oneway', x: 2100, y: 320, w: 130 },
      { kind: 'oneway', x: 3000, y: 336, w: 130 },
      { kind: 'moving', x: 1500, y: 320, w: 120, axis: 'x', range: 160, durationMs: 2200 },
      { kind: 'moving', x: 2600, y: 336, w: 120, axis: 'y', range: -56, durationMs: 2000 },
      { kind: 'spring', x: 1700, y: 391 },
      { kind: 'spring', x: 3300, y: 391 },
      { kind: 'breakable', x: 650, y: 380, loot: 'ammo' },
      { kind: 'breakable', x: 2250, y: 380, loot: 'hp' },
    ],
    // §55 重用評估：迴廊沿用 arena 主題道具（水晶/星柱——鏡晶質感）。
    decor: [
      { key: 'prop-arena-3', x: 320 },
      { key: 'prop-arena-4', x: 870 },
      { key: 'prop-arena-1', x: 1420 },
      { key: 'prop-arena-2', x: 1970 },
      { key: 'prop-arena-3', x: 2520 },
      { key: 'prop-arena-4', x: 3070 },
    ],
    // §24 彩蛋九：連吞兩隻迴旋味（mirri/boomy 皆計）。
    easterEggs: [
      { trigger: 'eat-sequence', reward: 'full-magazine', sequence: ['boomy', 'boomy'] },
    ],
    // §60 雙精英：銀鏡鏡面蟲（前段）＋暗磁磁極獸（後段），房距 1300 ≥ 2×門距。
    elites: [
      {
        kind: 'mirri',
        x: 1250,
        hp: 17,
        scale: 1.5,
        tint: 0xb8c0d8,
        speedMul: 1.4,
        rewardFlavor: 'spora',
      },
      {
        kind: 'magno',
        x: 2550,
        hp: 19,
        scale: 1.5,
        tint: 0x5a70b8,
        speedMul: 1.3,
        rewardFlavor: 'boomy',
      },
    ],
    boss: null,
    tutorial: false,
  },
  // v10 三區完結（§65）——L10 幽光晶湖：星門折躍首發（三區新機制 2/2）×鏡蟲潛行混編；
  // 折躍高台（y=208）僅星門可達；第二對星門通向西岸補給灣（ammo 破磚 ×2）。
  {
    id: 10,
    nameZh: '幽光晶湖',
    bgKey: 'bg-lumen',
    worldWidth: 3400,
    killQuota: 12,
    spawnIntervalMs: 1150,
    maxOnScreen: 5,
    safeZoneTailPx: 480,
    // §65 入編：mirri/glowy 雙主場（幽光湖語彙）；可吸佔比 0.85（spiky 不可吸）。
    enemyMix: [
      { kind: 'mirri', weight: 0.2 },
      { kind: 'glowy', weight: 0.2 },
      { kind: 'floaty', weight: 0.15 },
      { kind: 'zappy', weight: 0.15 },
      { kind: 'jelly', weight: 0.15 },
      { kind: 'spiky', weight: 0.15 },
    ],
    platforms: [
      { x: 520, y: 336, w: 150 },
      { x: 950, y: 272, w: 130 },
      { x: 1400, y: 336, w: 140 },
      // 折躍專屬高台（§65 彩蛋台）：僅星門可達，主線地面雙層不依賴。
      { x: 2050, y: 208, w: 130 },
      { x: 2500, y: 336, w: 140 },
      { x: 2950, y: 272, w: 130 },
    ],
    // 星門跳入制（§65）：門心高於就地站立中心 80px——站立不觸發、單跳可入、
    // 出門落地即脫離觸發半徑（500ms 冷卻內不回彈）。
    elements: [
      { kind: 'oneway', x: 350, y: 320, w: 140 },
      { kind: 'oneway', x: 1620, y: 336, w: 140 },
      { kind: 'oneway', x: 3050, y: 320, w: 130 },
      { kind: 'moving', x: 2350, y: 320, w: 120, axis: 'x', range: 150, durationMs: 2400 },
      { kind: 'spring', x: 1250, y: 391 },
      { kind: 'breakable', x: 550, y: 380, loot: 'ammo' },
      { kind: 'breakable', x: 700, y: 380, loot: 'ammo' },
      { kind: 'warp', x: 1050, y: 300, pairId: 'lake-high' },
      { kind: 'warp', x: 2050, y: 100, pairId: 'lake-high' },
      { kind: 'warp', x: 2750, y: 300, pairId: 'lake-cove' },
      { kind: 'warp', x: 600, y: 300, pairId: 'lake-cove' },
    ],
    // §55 重用評估：晶湖沿用 arena 主題道具（水晶/星柱——幽光晶簇質感）。
    decor: [
      { key: 'prop-arena-1', x: 320 },
      { key: 'prop-arena-2', x: 870 },
      { key: 'prop-arena-3', x: 1420 },
      { key: 'prop-arena-4', x: 1970 },
      { key: 'prop-arena-1', x: 2520 },
      { key: 'prop-arena-2', x: 3070 },
    ],
    // §24 彩蛋十：折躍專屬高台連續站上 2 次（僅星門可達）。
    easterEggs: [{ trigger: 'stand-count', reward: 'hp-up', platformY: 208, count: 2 }],
    // §65：鏡光燈長老——脈衝週期縮時 1.4 倍，擊敗掉迴旋味（與在編 zappy 湊電鋸迴旋）。
    elites: [
      {
        kind: 'glowy',
        x: 1450,
        hp: 20,
        scale: 1.5,
        tint: 0xf0d888,
        speedMul: 1.4,
        rewardFlavor: 'boomy',
      },
    ],
    boss: null,
    tutorial: false,
    hint: '跳入發光星環可折躍傳送（捷徑，主線不依賴）',
  },
  // L11 磁晶險徑：磁力域（重用 v9 Magno）×星門折躍（重用 L10）複合考驗關（卡點一）；
  // 雙精英＋中點 checkpoint 首發（§66）。
  {
    id: 11,
    nameZh: '磁晶險徑',
    bgKey: 'bg-magnetic',
    worldWidth: 3700,
    killQuota: 13,
    spawnIntervalMs: 1100,
    maxOnScreen: 5,
    safeZoneTailPx: 480,
    // §66 入編：magno/mirri/drilly 三新舊怪複合；可吸佔比 0.73（drilly 破土窗保守不計）。
    enemyMix: [
      { kind: 'magno', weight: 0.15 },
      { kind: 'mirri', weight: 0.15 },
      { kind: 'chompy', weight: 0.15 },
      { kind: 'boomy', weight: 0.15 },
      { kind: 'floaty', weight: 0.15 },
      { kind: 'spora', weight: 0.13 },
      { kind: 'drilly', weight: 0.12 },
    ],
    platforms: [
      { x: 450, y: 336, w: 140 },
      { x: 850, y: 272, w: 130 },
      { x: 1350, y: 336, w: 140 },
      { x: 1800, y: 300, w: 130 },
      { x: 2400, y: 336, w: 140 },
      { x: 2900, y: 272, w: 120 },
      { x: 3300, y: 336, w: 130 },
    ],
    elements: [
      { kind: 'oneway', x: 580, y: 320, w: 130 },
      { kind: 'oneway', x: 1500, y: 320, w: 130 },
      { kind: 'oneway', x: 3080, y: 336, w: 130 },
      { kind: 'moving', x: 2100, y: 336, w: 120, axis: 'y', range: -56, durationMs: 2200 },
      { kind: 'spring', x: 350, y: 391 },
      { kind: 'spring', x: 2950, y: 391 },
      { kind: 'breakable', x: 950, y: 380, loot: 'ammo' },
      { kind: 'breakable', x: 2050, y: 380, loot: 'hp' },
      { kind: 'warp', x: 700, y: 300, pairId: 'ridge' },
      { kind: 'warp', x: 1950, y: 300, pairId: 'ridge' },
    ],
    // §55 重用評估：險徑沿用 arena 主題道具（磁晶簇質感）。
    decor: [
      { key: 'prop-arena-3', x: 350 },
      { key: 'prop-arena-4', x: 900 },
      { key: 'prop-arena-1', x: 1450 },
      { key: 'prop-arena-2', x: 2000 },
      { key: 'prop-arena-3', x: 2550 },
      { key: 'prop-arena-4', x: 3100 },
    ],
    // §24 彩蛋十一：依序連吞 spora→boomy（毒爆雲之後的配方預告）。
    easterEggs: [{ trigger: 'eat-sequence', reward: 'gold-star', sequence: ['spora', 'boomy'] }],
    // §66 雙精英：磁暴巨核（前段，磁場週期縮時 ×1.4）＋鑽岩老兵（後段，潛速 ×1.4），
    // 房距 1200 ≥ 2×門距。
    elites: [
      {
        kind: 'magno',
        x: 1300,
        hp: 22,
        scale: 1.55,
        tint: 0x7a88e0,
        speedMul: 1.4,
        rewardFlavor: 'glowy',
      },
      {
        kind: 'drilly',
        x: 2500,
        hp: 20,
        scale: 1.5,
        tint: 0xc89058,
        speedMul: 1.4,
        rewardFlavor: 'boomy',
      },
    ],
    boss: null,
    tutorial: false,
    // 卡點一（§66）：中點重生錨——死亡自此重生，落點位於雙精英房界外。
    checkpointX: 1850,
  },
  // L12 稜晶王殿：第三魔王稜晶雙子 Prismix（§67 分裂型三階段）；魔王關特殊體系首發
  //（§68 前室廊道／增益二選一／arena 高風險位投放）。
  {
    id: 12,
    nameZh: '稜晶王殿',
    bgKey: 'bg-prism',
    worldWidth: 854,
    killQuota: 0,
    spawnIntervalMs: 3000,
    maxOnScreen: 2,
    safeZoneTailPx: 0,
    // 補生全可吸（§26 飢荒保證律）；mirri 佔比最高供迴旋味與鏡蟲主題呼應。
    enemyMix: [
      { kind: 'jelly', weight: 0.3 },
      { kind: 'floaty', weight: 0.3 },
      { kind: 'mirri', weight: 0.4 },
    ],
    platforms: [],
    elements: [],
    decor: [
      { key: 'prop-arena-1', x: 110 },
      { key: 'prop-arena-2', x: 320 },
      { key: 'prop-arena-3', x: 540 },
      { key: 'prop-arena-4', x: 750 },
    ],
    // §24 彩蛋十二：雙子連破——P2 兩具均在場時 1s 窗內相繼擊破（§69 觸發器）。
    easterEggs: [{ trigger: 'twin-finish', reward: 'gold-star' }],
    elites: [],
    boss: 'prismix',
    tutorial: false,
    // 魔王關體系（§68）：前室 400px＋護盾泡/星力果二選一；P2 高風險位刷疾風靴。
    anteroomPx: 400,
    anteroomBuffs: ['shield', 'power'],
    arenaBuff: 'swift',
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

// 卡點關中點重生（§66）：已推進越過 checkpoint 才自 checkpoint 重生，否則整關重試。
export function checkpointRespawnX(level: LevelSpec, farthestX: number): number | null {
  if (level.checkpointX === undefined || farthestX < level.checkpointX) return null;
  return level.checkpointX;
}
