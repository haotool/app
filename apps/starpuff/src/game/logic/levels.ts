import type { SaveData } from '../core/save';
import type { BossKind, EnemyKind, LevelId } from '../core/types';
import type { BuffId } from './buffs';
import { canInhale } from './combat';
// 威脅分類 SSOT（#812 救援低威脅偏好）；difficulty→levels 僅 type import，無執行期環。
import { ENEMY_THREAT } from './difficulty';
import type { EasterEggSpec } from './eggs';
import type { MeteorSpec } from './meteor';
import type { TideSpec } from './tide';

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

// arena 相對平台（#960）：魔王 arena 的世界寬＝前室 + **動態視寬**，故靜態 x 在不同
// 視窗下會偏移；本型別以 arena 中心的固定像素 offset 定位，由 createTerrain 於建立時
// 解析為世界座標。固定像素與玩家跳躍射程使用同一單位，避免窄/寬視窗改變可玩性。
export interface ArenaPlatformSpec {
  // 距 arena 中心的水平像素偏移（負為左、正為右）。
  //
  // #964：修前為 xRatio 比例定位，但跳躍射程是**固定像素**（單跳 205px），比例
  // 定位使間距隨視寬膨脹——xRatio 0.25/0.75 在 854 視寬相距 427px、1200 相距 600px，
  // 皆遠超單跳射程，平台遂完全跨不過去。幾何須與跳躍能力同單位，故改固定像素。
  offsetPx: number;
  y: number;
  w: number;
}

// L30 幾何 SSOT：只保留一塊更低的中央單向平台；地面是主要通關路線，平台是
// 讀招後的換位/越王輔助，不再用左右踏腳石把玩家導向固定跳鏈。y 是平台中心，
// top=248，讓站台高度貼近劉董頭頂但仍保留玩家身體的讀招距離；w 只覆蓋中央輸出區。
export const L30_ARENA_PLATFORMS = [
  { offsetPx: 0, y: 256, w: 280 },
] as const satisfies readonly ArenaPlatformSpec[];

// v4 平台元素（§29）：data-driven 進關卡資料，由 systems/stage.ts 建立與更新。
// oneway/moving 座標同 PlatformSpec 中心點制；moving 的 range 為 tween 目標軸向位移（可負）。
// v8 上升氣流柱（§51）：zone 型非碰撞，x 為柱心、topY 為升力終止高、w 為柱寬。
// v10 星門折躍（§66）：同 pairId 成對傳送；純邏輯見 logic/warp.ts，資料不變式見 levels.test。
// v11 熱泉噴口（§72）：updraft 增 periodMs/dutyPct 選配——缺省恆常供力（L5 零回歸）、
// 有值＝間歇噴發；純邏輯見 logic/updraft.ts ventPhase。
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
  | { kind: 'updraft'; x: number; topY: number; w: number; periodMs?: number; dutyPct?: number }
  | { kind: 'warp'; x: number; y: number; pairId: string };

// 主題道具佈景（§31/§32）：純裝飾無碰撞，key 對應 assets.ts 的 prop-<theme>-<1..4>。
export interface DecorSpec {
  key: string;
  x: number;
}

// v20 MechanicProgressionMatrix（§110/機制 brief §6.1）：機制×教學鏈 SSOT。
// teaches＝本關首次教學的機制；bossApplies＝魔王關驗收運用的機制；
// 教學前置完整性（任一關驗收機制必已在較早關教過）由 levels.test 圖遍歷守門。
export type MechanicId =
  | 'inhale-shoot'
  | 'shell-shield'
  | 'slam'
  | 'transform'
  | 'starburst'
  | 'updraft'
  | 'magnet'
  | 'mirror'
  | 'warp'
  | 'tide'
  | 'vent'
  | 'lowgrav'
  | 'meteor'
  // §119 星海終局篇新形態教學位點：焰化（L21）/潮化（L23）/稜化（L25）/引力化（L27）。
  | 'ember-form'
  | 'tide-form'
  | 'prism-form'
  | 'gravity-form';

// v20 教學供給（§110 L3 變身首教）：進關即於固定位點生成的保證同系供給個體。
export interface DrillSpawnSpec {
  kind: EnemyKind;
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
// v10（§67）：checkpointX 為卡點關中點重生錨（死亡自此重生，killCount／彩蛋／計時不重置）。
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
  // arena 相對平台（#960）：僅魔王關適用（需 arenaLeft/視寬解析）；缺省無。
  arenaPlatforms?: readonly ArenaPlatformSpec[];
  elements: readonly StageElementSpec[];
  decor: readonly DecorSpec[];
  easterEggs: readonly EasterEggSpec[];
  elites: readonly EliteSpec[];
  boss: BossKind | null;
  tutorial: boolean;
  hint?: string;
  // v20 教學矩陣（§110）：teaches 首教機制／bossApplies 魔王驗收機制／drillSpawns 教學供給。
  teaches?: readonly MechanicId[];
  bossApplies?: readonly MechanicId[];
  drillSpawns?: readonly DrillSpawnSpec[];
  checkpointX?: number;
  // v10 魔王關體系（§69）：anteroomPx 為前室廊道寬（runtime 世界寬＝前室＋動態視寬）；
  // anteroomBuffs 為前室二選一台座、arenaBuff 為高風險位投放（EX 不投放）。
  anteroomPx?: number;
  // 關門鎖定後的入場讀招保護窗：涵蓋相機切換、入場演出與第一個可讀攻擊；
  // 由 BossRoom 在鎖門當幀注入，避免玩家在責任交接期間先吃到不可讀傷害。
  arenaEntryGraceMs?: number;
  anteroomBuffs?: readonly BuffId[];
  arenaBuff?: BuffId;
  // v12（§82）：arena 增益投放階段（缺省 P2；Voidra P2 為生存段改 P3 投放）。
  arenaBuffPhase?: 'p2' | 'p3';
  // v11 糖漿潮汐（§71）：關卡級週期漲落；dry-window 不變式見 levels.test。
  tide?: TideSpec;
  // v12 低重力（§81）：關卡級重力係數（缺省 1.0＝既有零回歸），GameScene 進關單點注入；
  // 值域 [0.5, 1.0] 由 levels.test 守門（主計畫 §10.2-6）。
  gravityScale?: number;
  // v12 流星雨（§79）：關卡級環境彈幕；預警/排除帶不變式見 logic/meteor.ts 與 levels.test。
  meteor?: MeteorSpec;
  // §127 關卡收尾演出（L29 市場開盤倒數＝L30 伏筆）：LEVEL_GATE_OPENED 時由
  // sceneEvents 資料驅動分派，禁止 GameScene 依關號硬編。
  outroCinematic?: 'market-open';
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
    teaches: ['inhale-shoot'],
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
    // #811 殼殼首遇教學（機制 brief §6.1：L2 首教殼盾＋暈窗吞＋下砸）。
    hint: '殼殼衝刺後會暈眩——趁暈眩吸入！',
    teaches: ['shell-shield', 'slam'],
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
    // §109／#954 取捨教學（L3 明示一次）：滿匣按 SP 兌換星暴，或留著同系 3 發變身。
    hint: '彈匣集滿 5 發可按 SP 結晶成蓄能星；同系 3 發則可按變身鍵星化',
    // §110 變身首教（機制 brief §6.1）：進關前段保證 3 隻同系（floaty→風化）供給。
    teaches: ['transform', 'starburst'],
    drillSpawns: [
      { kind: 'floaty', x: 460 },
      { kind: 'floaty', x: 530 },
      { kind: 'floaty', x: 600 },
    ],
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
    // §110 魔王驗收（機制 brief §6.1）：一區基礎技全驗收＋變身優勢情境（殼化反彈線）。
    bossApplies: ['inhale-shoot', 'shell-shield', 'slam', 'starburst', 'transform'],
    // 魔王關體系 retrofit（§86／主計畫 §7.1 v11+ 擇機項）：前室 400px＋護盾泡/星力果
    // 二選一；P2 高風險位刷疾風靴（沿 L12 攻壓型魔王組合）。
    anteroomPx: 400,
    anteroomBuffs: ['shield', 'power'],
    arenaBuff: 'swift',
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
    // §52 入編＋§107 供給節奏調參（issue #805）：gusty 主場收斂 30→25%、spora 20→15%
    //（高空盤旋/遠端紮根名義可吸但不可及）；讓渡給地面帶 jelly/floaty 各 +5%。
    // 可吸佔比 0.8 不變（gusty/floaty/spora/jelly）。
    enemyMix: [
      { kind: 'gusty', weight: 0.25 },
      { kind: 'spora', weight: 0.15 },
      { kind: 'spiky', weight: 0.2 },
      { kind: 'floaty', weight: 0.2 },
      { kind: 'jelly', weight: 0.2 },
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
    teaches: ['updraft'],
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
    // §110 魔王驗收：氣流空戰＋變身優勢情境（風化貼打／雷化斷召，§58 攻略線）。
    bossApplies: ['updraft', 'transform'],
    // 魔王關體系 retrofit（§86／主計畫 §7.1 v11+ 擇機項）：前室 400px＋護盾泡/疾風靴
    // 二選一；P2 高風險位刷星力果（空戰輸出窗短，沿 L16 組合語彙）。
    anteroomPx: 400,
    anteroomBuffs: ['shield', 'swift'],
    arenaBuff: 'power',
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
    hint: '同系星彈集滿 3 發，按變身鍵星化（空中也可以）',
    teaches: ['magnet'],
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
    teaches: ['mirror'],
  },
  // v10 三區完結（§66）——L10 幽光晶湖：星門折躍首發（三區新機制 2/2）×鏡蟲潛行混編；
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
    // §66 入編：mirri/glowy 雙主場（幽光湖語彙）；可吸佔比 0.85（spiky 不可吸）。
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
      // 折躍專屬高台（§66 彩蛋台）：僅星門可達，主線地面雙層不依賴。
      { x: 2050, y: 208, w: 130 },
      { x: 2500, y: 336, w: 140 },
      { x: 2950, y: 272, w: 130 },
    ],
    // 星門跳入制（§66）：門心高於就地站立中心 80px——站立不觸發、單跳可入、
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
    // §66：鏡光燈長老——脈衝週期縮時 1.4 倍，擊敗掉迴旋味（與在編 zappy 湊電鋸迴旋）。
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
    teaches: ['warp'],
  },
  // L11 磁晶險徑：磁力域（重用 v9 Magno）×星門折躍（重用 L10）複合考驗關（卡點一）；
  // 雙精英＋中點 checkpoint 首發（§67）。
  {
    id: 11,
    nameZh: '磁晶險徑',
    bgKey: 'bg-magnetic',
    worldWidth: 3700,
    killQuota: 13,
    spawnIntervalMs: 1100,
    maxOnScreen: 5,
    safeZoneTailPx: 480,
    // §67 入編：magno/mirri/drilly 三新舊怪複合；可吸佔比 0.73（drilly 破土窗保守不計）。
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
    // §67 雙精英：磁暴巨核（前段，磁場週期縮時 ×1.4）＋鑽岩老兵（後段，潛速 ×1.4），
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
    // 卡點一（§67）：中點重生錨——死亡自此重生，落點位於雙精英房界外。
    checkpointX: 1850,
  },
  // L12 稜晶王殿：第三魔王稜晶雙子 Prismix（§68 分裂型三階段）；魔王關特殊體系首發
  //（§69 前室廊道／增益二選一／arena 高風險位投放）。
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
    // §24 彩蛋十二：雙子連破——P2 兩具均在場時 1s 窗內相繼擊破（§70 觸發器）。
    easterEggs: [{ trigger: 'twin-finish', reward: 'gold-star' }],
    elites: [],
    boss: 'prismix',
    tutorial: false,
    // §110 魔王驗收：磁力域（雷化免疫優勢）＋鏡性反制＋變身優勢情境。
    bossApplies: ['magnet', 'mirror', 'transform'],
    // 魔王關體系（§69）：前室 400px＋護盾泡/星力果二選一；P2 高風險位刷疾風靴。
    anteroomPx: 400,
    anteroomBuffs: ['shield', 'power'],
    arenaBuff: 'swift',
  },
  // v11 四區焙糖火山（§72）——L13 焙糖丘陵：熱泉噴口首發（週期 updraft，本區新機制 1/2）
  // ×Bubbla/Splatta 亮相；噴口托跳為捷徑非必需（緩衝關，CV-3 區入口降壓）。
  {
    id: 13,
    nameZh: '焙糖丘陵',
    bgKey: 'bg-kiln',
    worldWidth: 3300,
    killQuota: 11,
    spawnIntervalMs: 1400,
    maxOnScreen: 5,
    safeZoneTailPx: 480,
    // §73 入編：bubbla 主場 25%＋splatta 15%；可吸佔比 0.55（jelly/floaty/splatta 恆可吸，
    // bubbla 躍出窗保守不計、spiky 不可吸）。
    enemyMix: [
      { kind: 'bubbla', weight: 0.25 },
      { kind: 'jelly', weight: 0.2 },
      { kind: 'floaty', weight: 0.2 },
      { kind: 'splatta', weight: 0.15 },
      { kind: 'spiky', weight: 0.2 },
    ],
    // §72 垂直分層：208 高台僅噴發窗可達（主線地面雙層即可，沿 §51 慣例）。
    platforms: [
      { x: 480, y: 336, w: 150 },
      { x: 900, y: 208, w: 130 },
      { x: 1350, y: 336, w: 140 },
      { x: 1900, y: 208, w: 130 },
      { x: 2350, y: 300, w: 140 },
      { x: 2850, y: 336, w: 140 },
    ],
    // 熱泉噴口（§72）：週期 2600ms、噴發佔比 0.31（≈0.8s）；上方 160px 內無天花板、
    // 柱頂 ≥100 沿 §51 不變式。
    elements: [
      { kind: 'updraft', x: 900, topY: 150, w: 96, periodMs: 2600, dutyPct: 0.31 },
      { kind: 'updraft', x: 1900, topY: 150, w: 96, periodMs: 2600, dutyPct: 0.31 },
      { kind: 'updraft', x: 2600, topY: 170, w: 96, periodMs: 3200, dutyPct: 0.31 },
      { kind: 'oneway', x: 680, y: 320, w: 140 },
      { kind: 'oneway', x: 2150, y: 336, w: 140 },
      { kind: 'spring', x: 1550, y: 391 },
      { kind: 'breakable', x: 1100, y: 380, loot: 'ammo' },
      { kind: 'breakable', x: 2450, y: 380, loot: 'hp' },
    ],
    // §55 重用評估：窯道具（props-kiln）W3 交付前沿用 meadow 主題（丘陵語彙相容）。
    decor: [
      { key: 'prop-kiln-1', x: 300 },
      { key: 'prop-kiln-2', x: 850 },
      { key: 'prop-kiln-3', x: 1400 },
      { key: 'prop-kiln-4', x: 1950 },
      { key: 'prop-kiln-1', x: 2500 },
      { key: 'prop-kiln-2', x: 3000 },
    ],
    // §24 彩蛋十三：開局反向走到最左緣（與 L1 同型「回聲彩蛋」，老玩家會心一擊）。
    easterEggs: [{ trigger: 'reach-x', reward: 'hp-up', maxX: 60 }],
    // §73：焦糖泡霸——躍出節奏縮時 1.5 倍，擊敗掉雷鏈味。
    elites: [
      {
        kind: 'bubbla',
        x: 1700,
        hp: 18,
        scale: 1.5,
        tint: 0xe89040,
        speedMul: 1.5,
        rewardFlavor: 'zappy',
      },
    ],
    boss: null,
    tutorial: false,
    hint: '熱泉噴發時乘蒸汽升空（捷徑，主線不依賴）',
    teaches: ['vent'],
  },
  // L14 熔糖河谷：糖漿潮汐首發（關卡級機制，本區新機制 2/2）——漲潮強制走平台層、
  // 退潮窗主地面恆可通行（dry-window 55%，等窗推進為合法保底 §0.1-6）。
  {
    id: 14,
    nameZh: '熔糖河谷',
    bgKey: 'bg-valley',
    worldWidth: 3600,
    killQuota: 12,
    spawnIntervalMs: 1250,
    maxOnScreen: 5,
    safeZoneTailPx: 480,
    // §73 入編：可吸佔比 0.50（splatta/gusty/spora 恆可吸；bubbla/shelly 條件可吸保守不計）。
    enemyMix: [
      { kind: 'bubbla', weight: 0.2 },
      { kind: 'splatta', weight: 0.2 },
      { kind: 'gusty', weight: 0.15 },
      { kind: 'spora', weight: 0.15 },
      { kind: 'chompy', weight: 0.15 },
      { kind: 'shelly', weight: 0.15 },
    ],
    // 平台層頂恆高於漲頂 24px（§71 不變式）：漲頂 y=352 → 平台中心 y ≤ 336（頂 ≤328）。
    platforms: [
      { x: 420, y: 336, w: 150 },
      { x: 820, y: 272, w: 140 },
      { x: 1250, y: 336, w: 150 },
      { x: 1700, y: 300, w: 140 },
      { x: 2150, y: 336, w: 150 },
      { x: 2600, y: 272, w: 140 },
      { x: 3050, y: 336, w: 150 },
    ],
    elements: [
      { kind: 'oneway', x: 620, y: 320, w: 140 },
      { kind: 'oneway', x: 1480, y: 320, w: 140 },
      { kind: 'oneway', x: 2380, y: 320, w: 140 },
      { kind: 'oneway', x: 2850, y: 336, w: 140 },
      { kind: 'spring', x: 1050, y: 391 },
      { kind: 'spring', x: 3250, y: 391 },
      // 退潮期河床露出破磚（§72 秘密）。
      { kind: 'breakable', x: 1900, y: 380, loot: 'hp' },
      { kind: 'breakable', x: 900, y: 380, loot: 'ammo' },
    ],
    decor: [
      { key: 'prop-kiln-3', x: 320 },
      { key: 'prop-kiln-4', x: 870 },
      { key: 'prop-kiln-1', x: 1420 },
      { key: 'prop-kiln-2', x: 1970 },
      { key: 'prop-kiln-3', x: 2520 },
      { key: 'prop-kiln-4', x: 3070 },
    ],
    // §24 彩蛋十四：浪頂浮台（y=272）連站 3 次。
    easterEggs: [{ trigger: 'stand-count', reward: 'full-magazine', platformY: 272, count: 3 }],
    // §73：糖漿投擲隊長——拋射節奏縮時 1.5 倍，擊敗掉重鑽味。
    elites: [
      {
        kind: 'splatta',
        x: 1800,
        hp: 20,
        scale: 1.5,
        tint: 0xa86838,
        speedMul: 1.5,
        rewardFlavor: 'drilly',
      },
    ],
    boss: null,
    tutorial: false,
    // 糖漿潮汐（§71）：週期 9s、漲潮佔比 45%、漲頂 y=352；漲潮前 1s 冒泡 telegraph。
    tide: { maxY: 352, periodMs: 9000, dutyPct: 0.45 },
    hint: '漲潮前河面冒泡，退潮窗地面可通行',
    teaches: ['tide'],
  },
  // L15 沸糖窯道：潮汐×噴口複合 gauntlet（純組合零新造，▲卡點二）——漲潮期最快線為
  // 噴口浮跳鏈（非必需），主地面每週期退潮窗恆可通行；雙精英＋中點 checkpoint（§67 沿用）。
  {
    id: 15,
    nameZh: '沸糖窯道',
    bgKey: 'bg-kilnway',
    worldWidth: 3800,
    killQuota: 14,
    spawnIntervalMs: 1100,
    maxOnScreen: 5,
    safeZoneTailPx: 480,
    // §73 入編：可吸佔比 0.62（splatta/boomy/zappy/puffy/magno 恆可吸；
    // bubbla/drilly 條件可吸保守不計、chompy 不可吸；magno 依 v9 定稿恆可吸計入）。
    enemyMix: [
      { kind: 'bubbla', weight: 0.15 },
      { kind: 'splatta', weight: 0.15 },
      { kind: 'boomy', weight: 0.15 },
      { kind: 'chompy', weight: 0.13 },
      { kind: 'zappy', weight: 0.12 },
      { kind: 'puffy', weight: 0.1 },
      { kind: 'drilly', weight: 0.1 },
      { kind: 'magno', weight: 0.1 },
    ],
    platforms: [
      { x: 430, y: 336, w: 150 },
      { x: 850, y: 272, w: 140 },
      { x: 1300, y: 336, w: 150 },
      { x: 1750, y: 300, w: 140 },
      { x: 2250, y: 336, w: 150 },
      { x: 2700, y: 272, w: 140 },
      { x: 3150, y: 336, w: 150 },
      { x: 3450, y: 300, w: 130 },
    ],
    // 複合 gauntlet：週期噴口 ×3（浮跳鏈為最佳線捷徑）＋單向/彈簧/破磚支線。
    elements: [
      { kind: 'updraft', x: 1000, topY: 150, w: 96, periodMs: 2600, dutyPct: 0.31 },
      { kind: 'updraft', x: 2000, topY: 150, w: 96, periodMs: 2600, dutyPct: 0.31 },
      { kind: 'updraft', x: 2950, topY: 170, w: 96, periodMs: 3200, dutyPct: 0.31 },
      { kind: 'oneway', x: 620, y: 320, w: 140 },
      { kind: 'oneway', x: 1520, y: 320, w: 140 },
      { kind: 'oneway', x: 2480, y: 320, w: 140 },
      { kind: 'spring', x: 350, y: 391 },
      { kind: 'spring', x: 3300, y: 391 },
      { kind: 'breakable', x: 1150, y: 380, loot: 'ammo' },
      { kind: 'breakable', x: 2150, y: 380, loot: 'hp' },
    ],
    decor: [
      { key: 'prop-kiln-1', x: 350 },
      { key: 'prop-kiln-2', x: 900 },
      { key: 'prop-kiln-3', x: 1450 },
      { key: 'prop-kiln-4', x: 2000 },
      { key: 'prop-kiln-1', x: 2550 },
      { key: 'prop-kiln-2', x: 3100 },
    ],
    // §24 彩蛋十五：甜點三重奏——依序連吞爆裂味→孢子味→爆裂味（bubbla→splatta→puffy）。
    easterEggs: [
      { trigger: 'eat-sequence', reward: 'gold-star', sequence: ['puffy', 'spora', 'puffy'] },
    ],
    // §73 雙精英：窯火重殼（前段，衝刺 ×1.5）＋沸糖狂花（後段，攻速 ×1.7），
    // 房距 1400 ≥ 2×門距。
    elites: [
      {
        kind: 'shelly',
        x: 1250,
        hp: 24,
        scale: 1.55,
        tint: 0xd87848,
        speedMul: 1.5,
        rewardFlavor: 'glowy',
      },
      {
        kind: 'chompy',
        x: 2650,
        hp: 26,
        scale: 1.5,
        tint: 0xc85838,
        speedMul: 1.7,
        rewardFlavor: 'boomy',
      },
    ],
    boss: null,
    tutorial: false,
    // 卡點二（§67 沿用）：中點重生錨——落點位於雙精英房界外。
    checkpointX: 1900,
    // 潮汐與 L14 同參數（複合關不加密，壓力來自噴口疊加）。
    tide: { maxY: 352, periodMs: 9000, dutyPct: 0.45 },
  },
  // L16 熔糖王窯：第四魔王 Syrona（§74 場控型三階段）——魔王與 biome hazard 綁定
  //（P2 潮汐入 arena、P3 大沸騰）；浮台/噴口由呈現層依動態視寬佈建（§28）。
  {
    id: 16,
    nameZh: '熔糖王窯',
    bgKey: 'bg-kilnhall',
    worldWidth: 854,
    killQuota: 0,
    spawnIntervalMs: 3000,
    maxOnScreen: 2,
    safeZoneTailPx: 0,
    // 補生全可吸或條件可吸（§26 飢荒保證律）：jelly/floaty 恆可吸佔 0.6、
    // bubbla 主題供彈（躍出窗可吸，爆裂味）。
    enemyMix: [
      { kind: 'jelly', weight: 0.3 },
      { kind: 'bubbla', weight: 0.4 },
      { kind: 'floaty', weight: 0.3 },
    ],
    platforms: [],
    elements: [],
    decor: [
      { key: 'prop-kiln-1', x: 110 },
      { key: 'prop-kiln-2', x: 320 },
      { key: 'prop-kiln-3', x: 540 },
      { key: 'prop-kiln-4', x: 750 },
    ],
    // §24 彩蛋十六：窯風三連——乘噴口升空期間命中 Syrona 累計 3 次（§75 觸發器）。
    easterEggs: [{ trigger: 'vent-hit-count', reward: 'heal' }],
    elites: [],
    boss: 'syrona',
    tutorial: false,
    // §110 魔王驗收：潮汐讀拍＋噴口乘流（登頂皇冠）＋變身優勢情境。
    bossApplies: ['tide', 'vent', 'transform'],
    // 魔王關體系（§69 沿用）：前室 400px＋護盾泡/疾風靴二選一；P2 噴口上方刷星力果。
    anteroomPx: 400,
    anteroomBuffs: ['shield', 'swift'],
    arenaBuff: 'power',
  },
  // v12 五區星核聖域（§84）——L17 星屑浮橋：低重力首發（gravityScale 0.55，本區
  // 新機制 1/2）×Twinkla 亮相；月步跳感、最高星橋低重力大跳可達（緩衝關 CV-3 降壓）。
  {
    id: 17,
    nameZh: '星屑浮橋',
    bgKey: 'bg-astral',
    worldWidth: 3400,
    killQuota: 11,
    spawnIntervalMs: 1350,
    maxOnScreen: 5,
    safeZoneTailPx: 480,
    // §80 入編：twinkla 主場 25%；可吸佔比 0.75（jelly/floaty/puffy/glowy 恆可吸，
    // twinkla 實體窗保守不計）。
    enemyMix: [
      { kind: 'twinkla', weight: 0.25 },
      { kind: 'jelly', weight: 0.2 },
      { kind: 'floaty', weight: 0.2 },
      { kind: 'puffy', weight: 0.2 },
      { kind: 'glowy', weight: 0.15 },
    ],
    // 低重力垂直分層（§81）：y=208 最高星橋由低重力大跳＋拍翅可達（gravityScale ≤0.7
    // 視為升降服務，levels.test 守門），主線地面雙層恆可通行。
    platforms: [
      { x: 520, y: 336, w: 150 },
      { x: 950, y: 272, w: 140 },
      { x: 1400, y: 336, w: 150 },
      { x: 2000, y: 208, w: 130 },
      { x: 2500, y: 336, w: 140 },
      { x: 2950, y: 272, w: 130 },
    ],
    elements: [
      { kind: 'oneway', x: 700, y: 320, w: 140 },
      { kind: 'oneway', x: 1700, y: 336, w: 140 },
      { kind: 'oneway', x: 2750, y: 320, w: 130 },
      { kind: 'moving', x: 2250, y: 320, w: 120, axis: 'x', range: 150, durationMs: 2400 },
      { kind: 'spring', x: 1150, y: 391 },
      { kind: 'breakable', x: 850, y: 380, loot: 'ammo' },
      { kind: 'breakable', x: 2350, y: 380, loot: 'hp' },
    ],
    // §84 重用評估：聖域沿用 arena/throne 主題道具混排（星晶/星柱語彙相容）。
    decor: [
      { key: 'prop-arena-1', x: 320 },
      { key: 'prop-throne-2', x: 870 },
      { key: 'prop-arena-3', x: 1420 },
      { key: 'prop-throne-4', x: 1970 },
      { key: 'prop-arena-1', x: 2520 },
      { key: 'prop-throne-2', x: 3070 },
    ],
    // §24 彩蛋十七：最高星橋（y=208，低重力大跳可達）連站 2 次。
    easterEggs: [{ trigger: 'stand-count', reward: 'hp-up', platformY: 208, count: 2 }],
    // §80：星屑幽長——隱現週期縮時 1.4 倍，擊敗掉孢子味。
    elites: [
      {
        kind: 'twinkla',
        x: 1800,
        hp: 20,
        scale: 1.5,
        tint: 0xf0d890,
        speedMul: 1.4,
        rewardFlavor: 'spora',
      },
    ],
    boss: null,
    tutorial: false,
    gravityScale: 0.55,
    hint: '低重力星域：跳得更高、飄得更遠',
    teaches: ['lowgrav'],
  },
  // L18 流星原野：流星雨首發（關卡級環境彈幕，本區新機制 2/2）×低重力閃避——
  // 預警落點→隕星墜落（可擊碎）；地面路徑恆可達（主線不依賴 §0.1-6）。
  {
    id: 18,
    nameZh: '流星原野',
    bgKey: 'bg-meteorfield',
    worldWidth: 3700,
    killQuota: 13,
    spawnIntervalMs: 1200,
    maxOnScreen: 5,
    safeZoneTailPx: 480,
    // §80 入編：cometa 主場 22%；可吸佔比 0.67（cometa/gusty/zappy/mirri 恆可吸，
    // twinkla 實體窗保守不計、spiky 不可吸）。
    enemyMix: [
      { kind: 'cometa', weight: 0.22 },
      { kind: 'spiky', weight: 0.18 },
      { kind: 'gusty', weight: 0.15 },
      { kind: 'zappy', weight: 0.15 },
      { kind: 'mirri', weight: 0.15 },
      { kind: 'twinkla', weight: 0.15 },
    ],
    // 流星雨關平台層 ≥272（無高台）：低重力大跳即可全層通行。
    platforms: [
      { x: 450, y: 336, w: 150 },
      { x: 850, y: 300, w: 140 },
      { x: 1300, y: 336, w: 150 },
      { x: 1750, y: 272, w: 140 },
      { x: 2250, y: 336, w: 150 },
      { x: 2700, y: 300, w: 140 },
      { x: 3150, y: 336, w: 150 },
    ],
    elements: [
      { kind: 'oneway', x: 650, y: 320, w: 140 },
      { kind: 'oneway', x: 1520, y: 320, w: 140 },
      { kind: 'oneway', x: 2900, y: 336, w: 140 },
      { kind: 'spring', x: 1050, y: 391 },
      { kind: 'spring', x: 3300, y: 391 },
      { kind: 'breakable', x: 1150, y: 380, loot: 'ammo' },
      { kind: 'breakable', x: 2450, y: 380, loot: 'hp' },
    ],
    decor: [
      { key: 'prop-throne-1', x: 350 },
      { key: 'prop-arena-2', x: 900 },
      { key: 'prop-throne-3', x: 1450 },
      { key: 'prop-arena-4', x: 2000 },
      { key: 'prop-throne-1', x: 2550 },
      { key: 'prop-arena-2', x: 3100 },
    ],
    // §24 彩蛋十八：雙風合鳴——連吞兩隻疾風味（cometa/gusty/floaty 皆計）。
    easterEggs: [
      { trigger: 'eat-sequence', reward: 'full-magazine', sequence: ['floaty', 'floaty'] },
    ],
    // §80：彗核疾魚——俯衝 1.4 倍，擊敗掉重鑽味。
    elites: [
      {
        kind: 'cometa',
        x: 1850,
        hp: 22,
        scale: 1.5,
        tint: 0x78c8f0,
        speedMul: 1.4,
        rewardFlavor: 'drilly',
      },
    ],
    boss: null,
    tutorial: false,
    gravityScale: 0.55,
    meteor: { intervalMs: 4500, waveSize: 2 },
    hint: '流星落點有預警圈，離開圈內就安全',
    teaches: ['meteor'],
  },
  // L19 星核前庭：全區機制回收終試（純組合零新造，▲卡點三）——星門折躍＋熱泉噴口＋
  // 輕低重力＋流星雨四機制分段客串；唯一六同屏關；同房雙精英「雙生鏡衛」變式。
  {
    id: 19,
    nameZh: '星核前庭',
    bgKey: 'bg-starcourt',
    worldWidth: 4000,
    killQuota: 15,
    spawnIntervalMs: 1000,
    maxOnScreen: 6,
    safeZoneTailPx: 480,
    // §84 入編：十種混編全機制回收；恆可吸佔比 0.62（cometa/spora/boomy/mirri/magno/
    // splatta；bubbla/twinkla/drilly 條件可吸保守不計、chompy 不可吸）。
    enemyMix: [
      { kind: 'cometa', weight: 0.12 },
      { kind: 'spora', weight: 0.12 },
      { kind: 'bubbla', weight: 0.1 },
      { kind: 'boomy', weight: 0.1 },
      { kind: 'mirri', weight: 0.1 },
      { kind: 'twinkla', weight: 0.1 },
      { kind: 'magno', weight: 0.1 },
      { kind: 'chompy', weight: 0.1 },
      { kind: 'drilly', weight: 0.08 },
      { kind: 'splatta', weight: 0.08 },
    ],
    // 輕低重力（0.85 不視為升降服務）：y=208 折躍高台由星門服務（沿 L10 慣例）。
    platforms: [
      { x: 480, y: 336, w: 150 },
      { x: 900, y: 272, w: 140 },
      { x: 1350, y: 336, w: 150 },
      { x: 1900, y: 208, w: 130 },
      { x: 2400, y: 336, w: 150 },
      { x: 2900, y: 272, w: 140 },
      { x: 3400, y: 336, w: 150 },
    ],
    // 四機制客串：星門捷徑跳過流星走廊＋週期噴口鏈＋單向/彈簧/破磚支線。
    elements: [
      { kind: 'updraft', x: 1150, topY: 150, w: 96, periodMs: 2600, dutyPct: 0.31 },
      { kind: 'updraft', x: 3050, topY: 170, w: 96, periodMs: 3200, dutyPct: 0.31 },
      { kind: 'oneway', x: 680, y: 320, w: 140 },
      { kind: 'oneway', x: 2150, y: 320, w: 140 },
      { kind: 'oneway', x: 3650, y: 336, w: 130 },
      { kind: 'spring', x: 350, y: 391 },
      { kind: 'spring', x: 3800, y: 391 },
      { kind: 'breakable', x: 780, y: 380, loot: 'ammo' },
      { kind: 'breakable', x: 2050, y: 380, loot: 'hp' },
      { kind: 'warp', x: 850, y: 300, pairId: 'court' },
      { kind: 'warp', x: 1900, y: 100, pairId: 'court' },
    ],
    decor: [
      { key: 'prop-arena-3', x: 380 },
      { key: 'prop-throne-4', x: 930 },
      { key: 'prop-arena-1', x: 1480 },
      { key: 'prop-throne-2', x: 2030 },
      { key: 'prop-arena-3', x: 2580 },
      { key: 'prop-throne-4', x: 3130 },
      { key: 'prop-arena-1', x: 3680 },
    ],
    // §24 彩蛋十九：星光三重奏——依序連吞迴旋味→流光味→流光味（mirri→twinkla→glowy）。
    easterEggs: [
      { trigger: 'eat-sequence', reward: 'gold-star', sequence: ['boomy', 'glowy', 'glowy'] },
    ],
    // §84 同房雙精英（20 關唯一變式）：雙生鏡衛・左／右——同房 x 對稱行動、
    // HP 各 24；掉 glowy＋zappy 味（湊凝光/追電配方）。
    elites: [
      {
        kind: 'mirri',
        x: 2620,
        hp: 24,
        scale: 1.5,
        tint: 0xcfd8f0,
        speedMul: 1.4,
        rewardFlavor: 'glowy',
      },
      {
        kind: 'mirri',
        x: 2680,
        hp: 24,
        scale: 1.5,
        tint: 0xb8c8e8,
        speedMul: 1.4,
        rewardFlavor: 'zappy',
      },
    ],
    boss: null,
    tutorial: false,
    // 卡點三（§67 沿用）：中點重生錨——落點位於雙生鏡衛房界外。
    checkpointX: 2000,
    gravityScale: 0.85,
    meteor: { intervalMs: 5200, waveSize: 2 },
    hint: '全機制終試：折躍、噴口、低重力與流星雨',
  },
  // L20 蝕星之心：最終魔王蝕星魔核 Voidra（§82 場控收束型三段）——arena →
  // P2 定點轟炸生存段 → P3 低重力終局；魔王關體系沿用（§69 前室/增益/彩蛋）。
  {
    id: 20,
    nameZh: '蝕星之心',
    bgKey: 'bg-voidcore',
    worldWidth: 854,
    killQuota: 0,
    spawnIntervalMs: 2800,
    maxOnScreen: 2,
    safeZoneTailPx: 0,
    // 補生全可吸（§26 飢荒保證律）：glowy 供流光味與星域主題呼應。
    enemyMix: [
      { kind: 'jelly', weight: 0.4 },
      { kind: 'floaty', weight: 0.3 },
      { kind: 'glowy', weight: 0.3 },
    ],
    platforms: [],
    elements: [],
    decor: [
      { key: 'prop-throne-1', x: 110 },
      { key: 'prop-throne-2', x: 320 },
      { key: 'prop-throne-3', x: 540 },
      { key: 'prop-throne-4', x: 750 },
    ],
    // §24 彩蛋二十：星核共鳴——P2 生存段 5 枚星屑全收（§83 觸發器）。
    easterEggs: [{ trigger: 'survive-collect', reward: 'full-magazine' }],
    elites: [],
    boss: 'voidra',
    tutorial: false,
    // §110 魔王驗收：低重力＋流星讀影（P2 生存段）＋變身優勢情境。
    bossApplies: ['lowgrav', 'meteor', 'transform'],
    // 魔王關體系（§69 沿用）：前室 400px＋星力果/疾風靴二選一；P3 高風險位刷護盾泡
    //（P2 為生存段不投放，arenaBuffPhase 改 P3）。
    anteroomPx: 400,
    anteroomBuffs: ['power', 'swift'],
    arenaBuff: 'shield',
    arenaBuffPhase: 'p3',
  },
  // §121 星海終局篇（六區星海港域）——L21 星港集散地：貨櫃推進（cargo 緩推）×
  // 掃描光（scanna）走動關；焰化取得——重鑽味雙供給（cargo 恆可吸＋drilly 破土窗）、
  // 中段形態練習區保證 3 隻貨櫃丁（週期折返留駐，沿 L3 安全房模式）。
  {
    id: 21,
    nameZh: '星港集散地',
    bgKey: 'bg-starport',
    worldWidth: 3800,
    killQuota: 14,
    spawnIntervalMs: 900,
    maxOnScreen: 6,
    safeZoneTailPx: 480,
    // §120 入編：cargo 主場＋ticketa/scanna 新怪同場、十一種混編（終局章接續 L19 密度）；
    // 恆可吸佔比 0.58（cargo/ticketa/jelly/floaty/puffy/glowy/boomy；drilly 保守不計）。
    enemyMix: [
      { kind: 'cargo', weight: 0.22 },
      { kind: 'ticketa', weight: 0.13 },
      { kind: 'scanna', weight: 0.13 },
      { kind: 'drilly', weight: 0.11 },
      { kind: 'chompy', weight: 0.11 },
      { kind: 'spiky', weight: 0.07 },
      { kind: 'jelly', weight: 0.06 },
      { kind: 'floaty', weight: 0.05 },
      { kind: 'puffy', weight: 0.04 },
      { kind: 'glowy', weight: 0.04 },
      { kind: 'boomy', weight: 0.04 },
    ],
    // 208 貨櫃頂台由蒸氣閥服務（§72 慣例）；主線地面雙層恆可通行。
    platforms: [
      { x: 480, y: 336, w: 150 },
      { x: 900, y: 208, w: 130 },
      { x: 1350, y: 336, w: 150 },
      { x: 1800, y: 272, w: 140 },
      { x: 2300, y: 336, w: 150 },
      { x: 2750, y: 300, w: 140 },
      { x: 3200, y: 336, w: 150 },
    ],
    // §29 複合陣：貨運廊道——蒸氣閥 ×2（週期氣壓柱）＋吊掛貨櫃移動平台 ×3＋支線。
    elements: [
      { kind: 'updraft', x: 900, topY: 150, w: 96, periodMs: 2600, dutyPct: 0.31 },
      { kind: 'updraft', x: 3050, topY: 170, w: 96, periodMs: 3200, dutyPct: 0.31 },
      { kind: 'oneway', x: 680, y: 320, w: 140 },
      { kind: 'oneway', x: 1580, y: 320, w: 140 },
      { kind: 'oneway', x: 2980, y: 336, w: 130 },
      { kind: 'moving', x: 1150, y: 320, w: 120, axis: 'x', range: 150, durationMs: 2400 },
      { kind: 'moving', x: 2050, y: 320, w: 120, axis: 'x', range: 160, durationMs: 2400 },
      { kind: 'moving', x: 3450, y: 328, w: 120, axis: 'y', range: -56, durationMs: 2200 },
      { kind: 'spring', x: 360, y: 391 },
      { kind: 'spring', x: 2550, y: 391 },
      { kind: 'breakable', x: 1350, y: 380, loot: 'ammo' },
      { kind: 'breakable', x: 2450, y: 380, loot: 'hp' },
    ],
    // §55 重用評估：星港沿用 throne/arena 主題道具混排（星柱/星燈——港區機械語彙相容）。
    decor: [
      { key: 'prop-throne-1', x: 350 },
      { key: 'prop-arena-2', x: 900 },
      { key: 'prop-throne-3', x: 1450 },
      { key: 'prop-arena-4', x: 2000 },
      { key: 'prop-throne-1', x: 2550 },
      { key: 'prop-arena-2', x: 3100 },
      { key: 'prop-throne-3', x: 3650 },
    ],
    // §24 彩蛋二十一：開局反向走到世界最左緣（回聲彩蛋，與 L1/L13 同型）。
    easterEggs: [{ trigger: 'reach-x', reward: 'hp-up', maxX: 60 }],
    // §120 雙精英（全數置於練習區之後）：巨貨櫃長（掉重鑽味＝焰化補給）＋
    // 緋紅掃描長（掉雷鏈味），房距 600 ≥ 門距；練習區前跑道零精英門，
    // 保障「≤30s 湊齊變身」的觸發密度契約。
    elites: [
      {
        kind: 'cargo',
        x: 2200,
        hp: 24,
        scale: 1.55,
        tint: 0xc87848,
        speedMul: 1.3,
        rewardFlavor: 'drilly',
      },
      {
        kind: 'scanna',
        x: 2800,
        hp: 20,
        scale: 1.5,
        tint: 0xd8607a,
        speedMul: 1.4,
        rewardFlavor: 'zappy',
      },
    ],
    boss: null,
    tutorial: false,
    // 卡點（§67 沿用）：終局章走動關世界寬 3800＋雙精英——中點重生錨落於精英房界外。
    checkpointX: 1850,
    hint: '連吞 3 隻貨櫃丁——地面按 SP 焰化變身',
    // §119 焰化首教：中段形態練習區保證 3 隻貨櫃丁（重鑽味 ×3 直達資格），
    // 位點在首個精英門之前（開放跑道）。
    teaches: ['ember-form'],
    drillSpawns: [
      { kind: 'cargo', x: 1560 },
      { kind: 'cargo', x: 1640 },
      { kind: 'cargo', x: 1720 },
    ],
  },
  // §122 星海終局篇（六區星海港域）——L22 關稅要塞：關稅巨獸 Tariffang——
  // 貨物稽查（貨櫃地形改寫）× 加收費用（命中即生追蹤稅票）× 全面封關（閘門＋衝撞）；
  // 魔王關體系沿用（§69 前室/增益/彩蛋）。
  {
    id: 22,
    nameZh: '關稅要塞',
    bgKey: 'bg-starport',
    worldWidth: 854,
    killQuota: 0,
    spawnIntervalMs: 3000,
    maxOnScreen: 2,
    safeZoneTailPx: 0,
    // 補生全可吸（§26）＋觸發密度契約（§119）：cargo 0.5（重鑽味＝焰化供給主軸），
    // 常態補給下 ≤30s 可湊齊焰化 ×3——燒稅票優勢情境的星味供給保證。
    enemyMix: [
      { kind: 'cargo', weight: 0.5 },
      { kind: 'jelly', weight: 0.3 },
      { kind: 'floaty', weight: 0.2 },
    ],
    platforms: [],
    elements: [],
    decor: [
      { key: 'prop-starport-1', x: 110 },
      { key: 'prop-starport-2', x: 320 },
      { key: 'prop-starport-3', x: 540 },
      { key: 'prop-starport-4', x: 750 },
    ],
    // §24 彩蛋二十二：巨獸可擊打後 5 秒內首次命中（與 L4/L7 同型）。
    easterEggs: [{ trigger: 'crown-early-hit', reward: 'heal', windowMs: 5000 }],
    elites: [],
    boss: 'tariffang',
    tutorial: false,
    // §110 魔王驗收：焰化燒稅票（優勢情境）＋變身。
    bossApplies: ['ember-form', 'transform'],
    // 魔王關體系（§69 沿用）：前室 400px＋護盾/星力二選一；P2 高風險位刷疾風靴。
    anteroomPx: 400,
    anteroomBuffs: ['shield', 'power'],
    arenaBuff: 'swift',
  },
  // §121 星海終局篇（七區冰晶潮域）——L23 冰晶潮灣：水流浮力（週期浮力柱）×
  // 冰面滑行（frosty）×潮汐走動關；潮化取得——孢子味三新怪供給（foamy/frosty/manta），
  // 中段形態練習區保證 3 隻孢子菇（定點紮根留駐）。
  {
    id: 23,
    nameZh: '冰晶潮灣',
    bgKey: 'bg-tidebay',
    worldWidth: 3900,
    killQuota: 14,
    spawnIntervalMs: 850,
    maxOnScreen: 6,
    safeZoneTailPx: 480,
    // §120 入編：潮系四供給（frosty/foamy/manta/spora 合佔 56%）＋九種混編；
    // 恆可吸佔比 0.76（spiky/chompy 不可吸、bubbla 躍出窗保守不計）。
    enemyMix: [
      { kind: 'frosty', weight: 0.17 },
      { kind: 'foamy', weight: 0.14 },
      { kind: 'manta', weight: 0.13 },
      { kind: 'spora', weight: 0.12 },
      { kind: 'bubbla', weight: 0.1 },
      { kind: 'jelly', weight: 0.1 },
      { kind: 'floaty', weight: 0.1 },
      { kind: 'spiky', weight: 0.09 },
      { kind: 'chompy', weight: 0.05 },
    ],
    // 平台層頂恆高於漲頂 24px（§71 不變式）：漲頂 y=352 → 平台中心 y ≤ 336；
    // 208 高台由週期浮力柱服務（§72 慣例）。
    platforms: [
      { x: 460, y: 336, w: 150 },
      { x: 900, y: 208, w: 130 },
      { x: 1350, y: 336, w: 150 },
      { x: 1850, y: 272, w: 140 },
      { x: 2350, y: 336, w: 150 },
      { x: 2800, y: 208, w: 130 },
      { x: 3250, y: 300, w: 140 },
      { x: 3600, y: 336, w: 130 },
    ],
    // 水流浮力柱（§121）：週期湧升沿熱泉噴口管線（periodMs/dutyPct），托跳為捷徑非必需。
    elements: [
      { kind: 'updraft', x: 900, topY: 150, w: 96, periodMs: 2800, dutyPct: 0.35 },
      { kind: 'updraft', x: 2800, topY: 150, w: 96, periodMs: 2800, dutyPct: 0.35 },
      { kind: 'oneway', x: 660, y: 320, w: 140 },
      { kind: 'oneway', x: 1600, y: 320, w: 140 },
      { kind: 'oneway', x: 3050, y: 336, w: 130 },
      { kind: 'moving', x: 2100, y: 320, w: 120, axis: 'x', range: 150, durationMs: 2400 },
      { kind: 'spring', x: 350, y: 391 },
      { kind: 'spring', x: 3450, y: 391 },
      { kind: 'breakable', x: 1100, y: 380, loot: 'ammo' },
      { kind: 'breakable', x: 2550, y: 380, loot: 'hp' },
    ],
    // §55 重用評估：潮灣沿用 arena 主題道具（水晶/星柱——冰晶質感）。
    decor: [
      { key: 'prop-arena-1', x: 380 },
      { key: 'prop-arena-2', x: 930 },
      { key: 'prop-arena-3', x: 1480 },
      { key: 'prop-arena-4', x: 2030 },
      { key: 'prop-arena-1', x: 2580 },
      { key: 'prop-arena-2', x: 3130 },
      { key: 'prop-arena-3', x: 3680 },
    ],
    // §24 彩蛋二十三：浪頂浮台（y=272）連站 3 次（與 L14 同型）。
    easterEggs: [{ trigger: 'stand-count', reward: 'full-magazine', platformY: 272, count: 3 }],
    // §120 雙精英（全數置於練習區之後）：寒霜史萊姆王（掉孢子味＝潮化補給）＋
    // 深潮魟后（掉流光味），房距 600 ≥ 門距；練習區前跑道零精英門。
    elites: [
      {
        kind: 'frosty',
        x: 2250,
        hp: 22,
        scale: 1.55,
        tint: 0x9ad8f0,
        speedMul: 1.4,
        rewardFlavor: 'spora',
      },
      {
        kind: 'manta',
        x: 2850,
        hp: 20,
        scale: 1.5,
        tint: 0x5a98c8,
        speedMul: 1.4,
        rewardFlavor: 'glowy',
      },
    ],
    boss: null,
    tutorial: false,
    // 卡點（§67 沿用）：終局章走動關世界寬 3900＋雙精英——中點重生錨落於精英房界外。
    checkpointX: 1900,
    // 糖漿潮汐管線重用（§71）：冰潮視覺由素材車換裝；dry-window 55% 等窗保底不變。
    tide: { maxY: 352, periodMs: 9000, dutyPct: 0.45 },
    hint: '連吞 3 隻潮系怪——地面按 SP 潮化變身',
    // §119 潮化首教：中段形態練習區保證 3 隻泡泡機（孢子味 ×3 直達資格），
    // 位點在首個精英門之前（開放跑道）；泡泡不傷人——練習區低壓（孢子菇叢集
    // 的孢子雲範圍拒止實測為死亡坑，取證後換品種）。
    teaches: ['tide-form'],
    drillSpawns: [
      { kind: 'foamy', x: 1600 },
      { kind: 'foamy', x: 1680 },
      { kind: 'foamy', x: 1760 },
    ],
  },
  // §122 星海終局篇（七區冰晶潮域）——L24 潮汐王庭：潮汐女王 Maridella——
  // 潮線改道（水流推移＋箭頭提示）× 海嘯階梯（缺口牆）× 深海月蝕（三水球環爆）；
  // 魔王關體系沿用（§69 前室/增益/彩蛋）。
  {
    id: 24,
    nameZh: '潮汐王庭',
    bgKey: 'bg-tidebay',
    worldWidth: 854,
    killQuota: 0,
    spawnIntervalMs: 2900,
    maxOnScreen: 2,
    safeZoneTailPx: 0,
    // 補生全可吸（§26）＋觸發密度契約（§119）：潮系雙供給 0.55（foamy/frosty＝
    // 孢子味＝潮化）＋P2 潮湧召喚 foamy 加持——穩控優勢情境的星味供給保證。
    enemyMix: [
      { kind: 'foamy', weight: 0.3 },
      { kind: 'frosty', weight: 0.25 },
      { kind: 'jelly', weight: 0.25 },
      { kind: 'floaty', weight: 0.2 },
    ],
    platforms: [],
    elements: [],
    decor: [
      { key: 'prop-tidebay-1', x: 110 },
      { key: 'prop-tidebay-2', x: 320 },
      { key: 'prop-tidebay-3', x: 540 },
      { key: 'prop-tidebay-4', x: 750 },
    ],
    // §24 彩蛋二十四：女王可擊打後 5 秒內首次命中（與 L4/L7 同型）。
    easterEggs: [{ trigger: 'crown-early-hit', reward: 'full-magazine', windowMs: 5000 }],
    elites: [],
    boss: 'maridella',
    tutorial: false,
    // §110 魔王驗收：潮化穩控（優勢情境）＋變身。
    bossApplies: ['tide-form', 'transform'],
    // 魔王關體系（§69 沿用）：前室 400px＋護盾/疾風二選一；P2 高風險位刷星力果。
    anteroomPx: 400,
    anteroomBuffs: ['shield', 'swift'],
    arenaBuff: 'power',
  },
  // §123 星海終局篇（八區鏡界塔域）——L25 鏡界資料塔：反射（prismbee）×複製體
  //（copypuff 鏡像模仿）×資料聚集（datamote 障礙）走動關；稜化取得——流光味雙供給
  //（prismbee/datamote 恆可吸＋glowy/twinkla 舊識），中段形態練習區保證 3 隻資料塵
  //（聚攏留駐低壓——無攻擊語彙，沿 L23 取證教訓選最低壓品種）。
  {
    id: 25,
    nameZh: '鏡界資料塔',
    bgKey: 'bg-mirrortower',
    worldWidth: 4000,
    killQuota: 15,
    spawnIntervalMs: 850,
    maxOnScreen: 6,
    safeZoneTailPx: 480,
    // §123 入編：鏡界三新怪同場＋mirri/scanna 鏡性舊識、十種混編；
    // 恆可吸佔比 0.64（prismbee/datamote/glowy/mirri/jelly/floaty；twinkla 保守不計）。
    enemyMix: [
      { kind: 'prismbee', weight: 0.16 },
      { kind: 'datamote', weight: 0.15 },
      { kind: 'copypuff', weight: 0.12 },
      { kind: 'glowy', weight: 0.09 },
      { kind: 'twinkla', weight: 0.09 },
      { kind: 'mirri', weight: 0.09 },
      { kind: 'scanna', weight: 0.08 },
      { kind: 'jelly', weight: 0.08 },
      { kind: 'floaty', weight: 0.07 },
      { kind: 'spiky', weight: 0.07 },
    ],
    // 208 鏡台由資料流升柱服務（§72 慣例）；主線地面雙層恆可通行。
    platforms: [
      { x: 480, y: 336, w: 150 },
      { x: 950, y: 208, w: 130 },
      { x: 1400, y: 336, w: 150 },
      { x: 1900, y: 272, w: 140 },
      { x: 2400, y: 336, w: 150 },
      { x: 2900, y: 208, w: 130 },
      { x: 3350, y: 300, w: 140 },
      { x: 3700, y: 336, w: 130 },
    ],
    // §29 複合陣：鏡廊迴路——資料流升柱 ×2（週期氣壓柱，208 鏡台服務）＋鏡門折躍
    //（§66 warp 重用：鏡面傳送語彙）＋移動鏡台 ×2＋單向 ×3＋支線。
    elements: [
      { kind: 'updraft', x: 950, topY: 150, w: 96, periodMs: 2800, dutyPct: 0.33 },
      { kind: 'updraft', x: 2900, topY: 150, w: 96, periodMs: 3000, dutyPct: 0.33 },
      { kind: 'warp', x: 800, y: 300, pairId: 'mirrorgate' },
      { kind: 'warp', x: 1900, y: 180, pairId: 'mirrorgate' },
      { kind: 'oneway', x: 700, y: 320, w: 140 },
      { kind: 'oneway', x: 1650, y: 320, w: 140 },
      { kind: 'oneway', x: 3100, y: 336, w: 130 },
      { kind: 'moving', x: 1150, y: 320, w: 120, axis: 'x', range: 150, durationMs: 2400 },
      { kind: 'moving', x: 2150, y: 320, w: 120, axis: 'y', range: -48, durationMs: 2200 },
      { kind: 'spring', x: 360, y: 391 },
      { kind: 'breakable', x: 1250, y: 380, loot: 'ammo' },
      { kind: 'breakable', x: 2650, y: 380, loot: 'hp' },
    ],
    // §55 重用評估：鏡界塔專屬道具（B03 素材 prop-mirror-1..4）。
    decor: [
      { key: 'prop-mirror-1', x: 380 },
      { key: 'prop-mirror-2', x: 930 },
      { key: 'prop-mirror-3', x: 1480 },
      { key: 'prop-mirror-4', x: 2030 },
      { key: 'prop-mirror-1', x: 2580 },
      { key: 'prop-mirror-2', x: 3130 },
      { key: 'prop-mirror-3', x: 3680 },
    ],
    // §24 彩蛋二十五：開局反向走到世界最左緣（回聲彩蛋，與 L1/L21 同型）。
    easterEggs: [{ trigger: 'reach-x', reward: 'hp-up', maxX: 60 }],
    // §123 雙精英（全數置於練習區之後）：鏡衛蜂后（掉流光味＝稜化補給）＋
    // 映像噗長（掉雷鏈味），房距 600 ≥ 門距；練習區前跑道零精英門，
    // 保障「≤30s 湊齊變身」的觸發密度契約。
    elites: [
      {
        kind: 'prismbee',
        x: 2300,
        hp: 20,
        scale: 1.5,
        tint: 0xe87ab8,
        speedMul: 1.3,
        rewardFlavor: 'glowy',
      },
      {
        kind: 'copypuff',
        x: 2900,
        hp: 26,
        scale: 1.55,
        tint: 0x9a88d8,
        speedMul: 1.3,
        rewardFlavor: 'zappy',
      },
    ],
    boss: null,
    tutorial: false,
    // 卡點（§67 沿用）：終局章走動關世界寬 4000＋雙精英——中點重生錨落於精英房界外。
    checkpointX: 1950,
    hint: '連吞 3 隻流光味怪——地面按 SP 稜化變身',
    // §119 稜化首教：中段形態練習區保證 3 隻資料塵（流光味 ×3 直達資格），
    // 位點在首個精英門之前（開放跑道）；資料塵無攻擊——練習區低壓。
    teaches: ['prism-form'],
    drillSpawns: [
      { kind: 'datamote', x: 1620 },
      { kind: 'datamote', x: 1700 },
      { kind: 'datamote', x: 1780 },
    ],
  },
  // §123 星海終局篇（八區鏡界塔域）——L26 鏡界聖殿：鏡界館長 Reflector——
  // 鏡面回彈（固定射線提前顯示）× 假噗噗分身（玩家鏡影）× 全景反射（鏡板折射彈幕）；
  // 魔王關體系沿用（§69 前室/增益/彩蛋）。
  {
    id: 26,
    nameZh: '鏡界聖殿',
    bgKey: 'bg-mirrortower',
    worldWidth: 854,
    killQuota: 0,
    spawnIntervalMs: 2900,
    maxOnScreen: 2,
    safeZoneTailPx: 0,
    // 補生全可吸（§26）＋觸發密度契約（§119）：流光味雙供給 0.55（glowy/datamote）
    // ——借鏡反打優勢情境的星味供給保證。
    enemyMix: [
      { kind: 'glowy', weight: 0.3 },
      { kind: 'datamote', weight: 0.25 },
      { kind: 'jelly', weight: 0.25 },
      { kind: 'floaty', weight: 0.2 },
    ],
    platforms: [],
    elements: [],
    decor: [
      { key: 'prop-mirror-1', x: 110 },
      { key: 'prop-mirror-2', x: 320 },
      { key: 'prop-mirror-3', x: 540 },
      { key: 'prop-mirror-4', x: 750 },
    ],
    // §24 彩蛋二十六：館長可擊打後 5 秒內首次命中（與 L4/L22 同型）。
    easterEggs: [{ trigger: 'crown-early-hit', reward: 'heal', windowMs: 5000 }],
    elites: [],
    boss: 'reflector',
    tutorial: false,
    // §110 魔王驗收：稜化借鏡反打（優勢情境）＋變身。
    bossApplies: ['prism-form', 'transform'],
    // 魔王關體系（§69 沿用）：前室 400px＋護盾/星力二選一；P2 高風險位刷疾風靴。
    anteroomPx: 400,
    anteroomBuffs: ['shield', 'power'],
    arenaBuff: 'swift',
  },
  // §123 星海終局篇（九區引力深域）——L27 黑洞外環：重力場（gravitybub 漂移）×
  // 瞬移裂隙（riftling）×軌道突進（orbiton）走動關＋遠景市場黑洞（L29/L30 伏筆，
  // bearlet 下跌箭頭前置教學）；引力化取得——迴旋味三供給（gravitybub/orbiton/
  // riftling），中段形態練習區保證 3 隻重力泡（場只拉不傷——練習區低壓）。
  {
    id: 27,
    nameZh: '黑洞外環',
    bgKey: 'bg-voidring',
    worldWidth: 4100,
    killQuota: 15,
    spawnIntervalMs: 800,
    maxOnScreen: 6,
    safeZoneTailPx: 480,
    // §123 入編：引力三新怪＋bearlet 前置教學、十種混編；
    // 恆可吸佔比 0.80（bearlet 不可吸、twinkla 保守不計）。
    enemyMix: [
      { kind: 'gravitybub', weight: 0.15 },
      { kind: 'orbiton', weight: 0.14 },
      { kind: 'riftling', weight: 0.13 },
      { kind: 'bearlet', weight: 0.1 },
      { kind: 'twinkla', weight: 0.1 },
      { kind: 'boomy', weight: 0.09 },
      { kind: 'cometa', weight: 0.08 },
      { kind: 'jelly', weight: 0.08 },
      { kind: 'floaty', weight: 0.07 },
      { kind: 'zappy', weight: 0.06 },
    ],
    // 208 環帶台由引力上升流服務（§72 慣例）；主線地面雙層恆可通行。
    platforms: [
      { x: 470, y: 336, w: 150 },
      { x: 920, y: 208, w: 130 },
      { x: 1380, y: 336, w: 150 },
      { x: 1880, y: 272, w: 140 },
      { x: 2380, y: 336, w: 150 },
      { x: 2880, y: 208, w: 130 },
      { x: 3330, y: 300, w: 140 },
      { x: 3750, y: 336, w: 130 },
    ],
    // §29 複合陣：外環軌道——引力上升流 ×2（週期氣壓柱）＋裂隙折躍（§66 warp 重用：
    // 空間裂縫語彙，與 riftling 瞬移主題呼應）＋移動平台 ×2＋單向＋支線。
    elements: [
      { kind: 'updraft', x: 920, topY: 150, w: 96, periodMs: 2800, dutyPct: 0.33 },
      { kind: 'updraft', x: 2880, topY: 150, w: 96, periodMs: 3000, dutyPct: 0.33 },
      { kind: 'warp', x: 780, y: 300, pairId: 'riftgate' },
      { kind: 'warp', x: 1880, y: 180, pairId: 'riftgate' },
      { kind: 'oneway', x: 680, y: 320, w: 140 },
      { kind: 'oneway', x: 1620, y: 320, w: 140 },
      { kind: 'oneway', x: 3080, y: 336, w: 130 },
      { kind: 'moving', x: 1150, y: 320, w: 120, axis: 'x', range: 150, durationMs: 2400 },
      { kind: 'moving', x: 2130, y: 320, w: 120, axis: 'x', range: 160, durationMs: 2400 },
      { kind: 'spring', x: 360, y: 391 },
      { kind: 'spring', x: 3550, y: 391 },
      { kind: 'breakable', x: 1280, y: 380, loot: 'ammo' },
      { kind: 'breakable', x: 2620, y: 380, loot: 'hp' },
    ],
    // §55 重用評估：黑洞外環專屬道具（B03 素材 prop-voidring-1..4）。
    decor: [
      { key: 'prop-voidring-1', x: 380 },
      { key: 'prop-voidring-2', x: 940 },
      { key: 'prop-voidring-3', x: 1500 },
      { key: 'prop-voidring-4', x: 2060 },
      { key: 'prop-voidring-1', x: 2620 },
      { key: 'prop-voidring-2', x: 3180 },
      { key: 'prop-voidring-3', x: 3740 },
    ],
    // §24 彩蛋二十七：浪頂環帶台（y=272）連站 3 次（與 L14/L23 同型）。
    easterEggs: [{ trigger: 'stand-count', reward: 'full-magazine', platformY: 272, count: 3 }],
    // §123 雙精英（全數置於練習區之後）：軌道統領（掉迴旋味＝引力化補給）＋
    // 大熊市（掉雷鏈味），房距 600 ≥ 門距；練習區前跑道零精英門。
    elites: [
      {
        kind: 'orbiton',
        x: 2350,
        hp: 20,
        scale: 1.5,
        tint: 0x6a58b8,
        speedMul: 1.4,
        rewardFlavor: 'boomy',
      },
      {
        kind: 'bearlet',
        x: 2950,
        hp: 26,
        scale: 1.6,
        tint: 0xa86858,
        speedMul: 1.3,
        rewardFlavor: 'zappy',
      },
    ],
    boss: null,
    tutorial: false,
    // 卡點（§67 沿用）：終局章走動關世界寬 4100＋雙精英——中點重生錨落於精英房界外。
    checkpointX: 2000,
    hint: '吞 3 隻迴旋味怪——按變身鍵引力化',
    // §119 引力化首教：中段形態練習區保證 3 隻重力泡（迴旋味 ×3 直達資格），
    // 位點在首個精英門之前（開放跑道）；重力場只拉不傷——練習區低壓。
    teaches: ['gravity-form'],
    drillSpawns: [
      { kind: 'gravitybub', x: 1650 },
      { kind: 'gravitybub', x: 1730 },
      { kind: 'gravitybub', x: 1810 },
    ],
  },
  // §123 星海終局篇（九區引力深域）——L28 引力王座：引力侯爵 Gravion——
  // 重力切換（方向力場＋箭頭預告）× 軌道星體（可破屏障公轉）× 黑洞壓縮（側牆＋
  // 星彈彎折）；魔王關體系沿用（§69 前室/增益/彩蛋）。
  {
    id: 28,
    nameZh: '引力王座',
    bgKey: 'bg-voidring',
    worldWidth: 854,
    killQuota: 0,
    spawnIntervalMs: 2800,
    maxOnScreen: 2,
    safeZoneTailPx: 0,
    // 補生全可吸（§26）＋觸發密度契約（§119）：迴旋味雙供給 0.55（boomy/gravitybub）
    // ——引力化抗性優勢情境的星味供給保證。
    enemyMix: [
      { kind: 'boomy', weight: 0.3 },
      { kind: 'gravitybub', weight: 0.25 },
      { kind: 'jelly', weight: 0.25 },
      { kind: 'floaty', weight: 0.2 },
    ],
    platforms: [],
    elements: [],
    decor: [
      { key: 'prop-voidring-1', x: 110 },
      { key: 'prop-voidring-2', x: 320 },
      { key: 'prop-voidring-3', x: 540 },
      { key: 'prop-voidring-4', x: 750 },
    ],
    // §24 彩蛋二十八：侯爵可擊打後 5 秒內首次命中（與 L4/L26 同型）。
    easterEggs: [{ trigger: 'crown-early-hit', reward: 'full-magazine', windowMs: 5000 }],
    elites: [],
    boss: 'gravion',
    tutorial: false,
    // §110 魔王驗收：引力化抗性（優勢情境）＋變身。
    bossApplies: ['gravity-form', 'transform'],
    // 魔王關體系（§69 沿用）：前室 400px＋星力/疾風二選一；P2 高風險位刷護盾泡。
    anteroomPx: 400,
    anteroomBuffs: ['power', 'swift'],
    arenaBuff: 'shield',
  },
  // §127 星海終局篇（十區崩盤終章）——L29 崩盤前夜：半毀星港交易大廳的混合挑戰
  // 走動關——回收 21-28 全章核心機制（貨櫃阻路／潮流改向／鏡面假身區／黑洞段
  // 引力上升流）各取一段＋市場隕落（流星雨崩盤語彙）；敵人全混編既有品種零新怪；
  // 收尾＝「市場即將開盤」倒數＋遠景劉董入金（outroCinematic，L30 伏筆）。
  {
    id: 29,
    nameZh: '崩盤前夜',
    bgKey: 'bg-crasheve',
    worldWidth: 4300,
    killQuota: 16,
    spawnIntervalMs: 760,
    maxOnScreen: 6,
    safeZoneTailPx: 480,
    // 十種回收混編零新怪（PRD 主編制：cargo/frosty/prismbee/gravitybub/bearlet/
    // scanna/orbiton；輔以 riftling/twinkla/jelly 舊識——沿 L27 十種密度口徑）；
    // 恆可吸佔比 0.76（bearlet/scanna 不可吸、twinkla 保守不計）。權重取向
    //（mid bot 實測回調）：威脅分由低 HP 可吸遠程（orbiton/riftling）承擔，
    // 高 HP（cargo/scanna）與正面反彈（prismbee）壓低——潮汐×流星疊加關的
    // 擊殺經濟優先。
    enemyMix: [
      { kind: 'cargo', weight: 0.1 },
      { kind: 'frosty', weight: 0.1 },
      { kind: 'prismbee', weight: 0.08 },
      { kind: 'gravitybub', weight: 0.12 },
      { kind: 'bearlet', weight: 0.1 },
      { kind: 'scanna', weight: 0.08 },
      { kind: 'orbiton', weight: 0.16 },
      { kind: 'riftling', weight: 0.14 },
      { kind: 'twinkla', weight: 0.06 },
      { kind: 'jelly', weight: 0.06 },
    ],
    // 平台全層頂 ≤328（潮汐漲頂 352-24 不變式）；全數跳鏈可達（≤82px 爬升）——
    // 潮汐關洪水錨不得依賴週期氣壓柱才可達（208 高台實測為漲潮期溺水帶根因），
    // 氣壓柱降為機動輔助。
    platforms: [
      { x: 470, y: 336, w: 150 },
      { x: 920, y: 272, w: 130 },
      { x: 1380, y: 336, w: 150 },
      { x: 1880, y: 272, w: 140 },
      { x: 2400, y: 336, w: 150 },
      { x: 2900, y: 272, w: 130 },
      { x: 3350, y: 300, w: 140 },
      { x: 3900, y: 336, w: 130 },
    ],
    // 四段回收（§127）：段1 貨櫃阻路（可破壞貨櫃磚）→ 段2 潮流改向（關卡級潮汐）
    // → 段3 鏡面假身區（prismbee 帶＋鏡門折躍）→ 段4 黑洞前兆（引力上升流 ×2）。
    elements: [
      { kind: 'updraft', x: 920, topY: 150, w: 96, periodMs: 2800, dutyPct: 0.33 },
      { kind: 'updraft', x: 2900, topY: 150, w: 96, periodMs: 3000, dutyPct: 0.33 },
      { kind: 'warp', x: 2250, y: 300, pairId: 'mirrorgate' },
      { kind: 'warp', x: 2700, y: 300, pairId: 'mirrorgate' },
      { kind: 'oneway', x: 680, y: 320, w: 140 },
      { kind: 'oneway', x: 3080, y: 336, w: 130 },
      { kind: 'moving', x: 1150, y: 320, w: 120, axis: 'x', range: 150, durationMs: 2400 },
      { kind: 'moving', x: 3550, y: 320, w: 120, axis: 'x', range: 160, durationMs: 2400 },
      { kind: 'spring', x: 360, y: 391 },
      { kind: 'spring', x: 3750, y: 391 },
      { kind: 'breakable', x: 640, y: 380, loot: 'ammo' },
      { kind: 'breakable', x: 1080, y: 380, loot: 'hp' },
    ],
    // 崩盤前夜專屬道具（B04 素材 prop-crasheve-1..4）。
    decor: [
      { key: 'prop-crasheve-1', x: 380 },
      { key: 'prop-crasheve-2', x: 900 },
      { key: 'prop-crasheve-3', x: 1420 },
      { key: 'prop-crasheve-4', x: 1980 },
      { key: 'prop-crasheve-1', x: 2520 },
      { key: 'prop-crasheve-2', x: 3060 },
      { key: 'prop-crasheve-3', x: 3620 },
      { key: 'prop-crasheve-4', x: 4140 },
    ],
    // §24 彩蛋二十九：浪頂平台（y=272）連站 3 次（與 L27 同型）。
    easterEggs: [{ trigger: 'stand-count', reward: 'full-magazine', platformY: 272, count: 3 }],
    // §127 雙精英：軌道統領（掉流光味＝稜化補給）＋大熊市（掉雷鏈味）——
    // 均取 L27 已驗證品種；稜蜂精英為 mid bot 不可解反射牆（正面反彈自傷×
    // 軟鎖門×checkpoint 前全重置，實測 0% 根因）已排除。房距 1870 ≥ 門距、
    // 均落 checkpoint 與鏡門 ±300 帶外；強度較 W3 保守（潮汐×流星疊加回調）。
    elites: [
      {
        kind: 'orbiton',
        x: 1280,
        hp: 16,
        scale: 1.5,
        tint: 0x6a58b8,
        speedMul: 1.15,
        rewardFlavor: 'glowy',
      },
      {
        kind: 'bearlet',
        x: 3150,
        hp: 22,
        scale: 1.6,
        tint: 0xa86858,
        speedMul: 1.2,
        rewardFlavor: 'zappy',
      },
    ],
    boss: null,
    tutorial: false,
    // 卡點（§67 沿用）：終章走動關世界寬 4300——中點重生錨落於精英房與鏡門界外。
    checkpointX: 2150,
    hint: '崩盤前夜——撐過四段市場亂流，等開盤鐘響',
    // 潮流改向（L23 回收）與市場隕落（L18/L19 流星雨回收）：兩機制全關疊加為
    // 本關獨有壓力源——參數較單機制關保守（乾窗 65%、單發隕星），mid bot 實測回調。
    tide: { maxY: 352, periodMs: 10_000, dutyPct: 0.35 },
    meteor: { intervalMs: 6400, waveSize: 1 },
    // 收尾演出（PRD §6.2 伏筆）：市場開盤倒數＋遠景劉董按下入金。
    outroCinematic: 'market-open',
  },
  // §127 星海終局篇（十區崩盤終章）——L30 崩盤王座：最終魔王劉董・崩盤之王——
  // 三市場攻擊（思考泡泡預告即機制）× 全屏下跌箭頭（≥1 通行路線恆開）× 牛熊
  // 召喚 × P3 終局（熔斷倒數／最後轉帳黑洞）；魔王關體系沿用（§69 前室/增益/彩蛋）。
  {
    id: 30,
    nameZh: '崩盤王座',
    bgKey: 'bg-market',
    worldWidth: 854,
    killQuota: 0,
    spawnIntervalMs: 2800,
    maxOnScreen: 2,
    safeZoneTailPx: 0,
    // 補生全可吸（§26）；zappy 列首位保留雷味輸出，並加入 shelly 作為可讀的
    // 防守變身供給。五種供給等量輪替，權重僅影響常態補生；minionDrop 依陣列序
    // 輪替，讓玩家能在不同嘗試用攻擊或殼化防守解題。
    enemyMix: [
      { kind: 'zappy', weight: 0.2 },
      { kind: 'shelly', weight: 0.2 },
      { kind: 'jelly', weight: 0.2 },
      { kind: 'floaty', weight: 0.2 },
      { kind: 'boomy', weight: 0.2 },
    ],
    platforms: [],
    // L30 收斂幾何：只留一塊較低中央台；左右平台移除，保留「地面走位＋中央台
    // 讀招換位」兩條可理解路線。平台不作無敵點，箭雨/市場招仍會迫使玩家離台。
    arenaPlatforms: L30_ARENA_PLATFORMS,
    elements: [],
    decor: [
      { key: 'prop-market-1', x: 110 },
      { key: 'prop-market-2', x: 320 },
      { key: 'prop-market-3', x: 540 },
      { key: 'prop-market-4', x: 750 },
    ],
    // §24 彩蛋三十：劉董可擊打後 5 秒內首次命中（與 L28 同型）。
    easterEggs: [{ trigger: 'crown-early-hit', reward: 'full-magazine', windowMs: 5000 }],
    elites: [],
    boss: 'liudong',
    tutorial: false,
    // §110 魔王驗收：七形態變身各有優勢情境（§126.4 對應表）。
    bossApplies: ['gravity-form', 'transform'],
    // 魔王關體系（§69 沿用）：前室 400px＋護盾/星力二選一；P2 高風險位再刷護盾泡，
    // 玩家可依熟悉度選擇一次性容錯或輸出，P3 仍保留變身與技巧通關空間。
    anteroomPx: 400,
    // 入場演出與第一個市場招式必須先可讀再可傷；數值屬 L30 關卡流程 SSOT。
    arenaEntryGraceMs: 7000,
    anteroomBuffs: ['shield', 'power'],
    arenaBuff: 'shield',
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
  // 走動關飢荒救援計時（§107）：飢荒持續累計、中斷歸零。
  starvingMs: number;
  gateOpen: boolean;
}

// initialKills（§105 D5）：教學關死亡重試的配額結轉種子；開門判定仍由 recordKill
// 推進（結轉值經 carryKillsOnDeath 夾限恆低於配額，不可能帶開門態重生）。
export function createLevelRun(id: LevelId, initialKills = 0): LevelRunState {
  return {
    levelId: id,
    killCount: Math.max(0, initialKills),
    spawnTimerMs: 0,
    starvingMs: 0,
    gateOpen: false,
  };
}

// 教學關死亡懲罰軟化（§105 D5 保守調參）：只在 tutorial 關生效——死亡重試保留
// 一半擊殺配額（向下取整、夾限至配額-1）；其餘關卡維持全重置（含卡點關的
// checkpoint 路徑本就不重啟）。
export function carryKillsOnDeath(level: LevelSpec, killCount: number): number {
  if (!level.tutorial) return 0;
  return Math.min(level.killQuota - 1, Math.max(0, Math.floor(killCount / 2)));
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
  // 滿潮生成降載（§107，issue #806）：滿潮期暫停走動關一般補生（計時照走、凍在
  // 滿格，退潮首 tick 即補）；飢荒救援與魔王關供給不受閘。
  floodHold?: boolean;
}

export interface LevelSpawnResult {
  state: LevelRunState;
  spawn: boolean;
  // #812：本次 spawn 是否為走動關飢荒救援（呼叫端據此走可及性保證生成路徑）。
  rescue?: boolean;
}

// 走動關飢荒救援閾值（§107，issue #804）：零彈且同屏無可吸怪持續達此值 → 強制補生
// 可吸怪（無視同屏上限——上限被紮根/不可吸個體佔滿正是飢荒根因）。閾值長於全部走動關
// spawnIntervalMs（1000–2600），一般節流仍是主要供給路徑，救援僅在停轉時兜底。
export const STARVATION_RESCUE_MS = 4000;

// spawn 節流：間隔到期且未達同屏上限才生成；開門後停止（尾端 release）。
// 達上限時 timer 停在間隔值，空位一出現即刻補生。
// 反卡死保證律（§26）：boss 期彈藥飢荒立即補生，不等生成間隔。
// 走動關救援律（§107）：飢荒持續達 STARVATION_RESCUE_MS 強制補生，中斷歸零重計。
export function advanceLevelSpawn(state: LevelRunState, tick: LevelSpawnTick): LevelSpawnResult {
  const level = getLevel(state.levelId);
  if (tick.starving && level.boss) {
    return { state: { ...state, spawnTimerMs: 0 }, spawn: true };
  }
  const starvingMs = tick.starving && !state.gateOpen ? state.starvingMs + tick.deltaMs : 0;
  if (!level.boss && !state.gateOpen && starvingMs >= STARVATION_RESCUE_MS) {
    return { state: { ...state, spawnTimerMs: 0, starvingMs: 0 }, spawn: true, rescue: true };
  }
  const spawnTimerMs = Math.min(state.spawnTimerMs + tick.deltaMs, level.spawnIntervalMs);
  if (state.gateOpen || spawnTimerMs < level.spawnIntervalMs) {
    return { state: { ...state, spawnTimerMs, starvingMs }, spawn: false };
  }
  if (tick.aliveEnemies >= level.maxOnScreen || (tick.floodHold && !level.boss)) {
    return { state: { ...state, spawnTimerMs, starvingMs }, spawn: false };
  }
  return { state: { ...state, spawnTimerMs: 0, starvingMs }, spawn: true };
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

// ===== #812 救援可及性保證（擴充 §107.1）=====
// 救援不只保證「生成」還保證「可及」：玩家前方近距、低威脅品種優先、單席、逾時重定位。
// 生成帶 100–150px（審查收斂）：吸入錐 140px——原 160–240 帶全在錐外需位移追擊，
// 漂移型品種（floaty）逃錐比走近快。生成帶貼近吸入錐：地面品種帶內即可吸；懸浮救援
//（y=300、dy≈60）即吸水平上限 ≈126.5px，帶尾至多 ~0.1s 走位即入錐；100 下限留接觸緩衝。
export const RESCUE_AHEAD_MIN_PX = 100;
export const RESCUE_AHEAD_MAX_PX = 150;
// 重定位窗 8s→5s（審查收斂）：恢復機構上限＝觸發 4s＋重定位窗＋取得 ~1s——8s 窗
// 上限 13s 超 p95 門檻；5s 窗約 10s 對齊，且封殺漂移型救援（floaty）飄離窗。
export const RESCUE_REPOSITION_MS = 5000;
// 飢荒判定的可及半徑（#812）：名義可吸但距玩家超此值的個體不阻斷救援計時
//（可吸≠可及；400px≈1.8s 步行——移動型可吸個體在此圈內的追擊可於 2s 級完成，
// 600px 實測會讓玩家追移動目標 5s+ 而救援不觸發，尾部延遲主因）。
export const RESCUE_REACH_PX = 400;
// 近域供給的可及頂線（#812 審查收斂）：高空定飄個體（floaty/zappy/glowy 生成帶
// y=240）在站立吸入錐外、需跳拍追擊——y 高於此線不得阻斷救援計時；救援懸浮品種
// 定高 300 恆在帶內（驗屍：L11 自然 floaty@240 擋救援 26s 為 >10s 尾部主因）。
export const RESCUE_REACH_Y_TOP = 280;

// 滿潮救援排除位移壓迫型個體（#812/§107.3）：gusty 側風推移會把避難玩家推落水。
const FLOOD_RESCUE_EXCLUDED: readonly EnemyKind[] = ['gusty'];

// 救援品種抽選：恆可吸 ∩ 低威脅（ENEMY_THREAT safe——無放電/俯衝/拋射側傷）優先；
// 無 safe 候選時回落恆可吸全集（anti-softlock 優先於威脅偏好）。
export function pickRescueKind(level: LevelSpec, rand01: number, floodHold: boolean): EnemyKind {
  const inhalable = level.enemyMix.filter((entry) => canInhale(entry.kind));
  const pool = floodHold
    ? inhalable.filter((entry) => !FLOOD_RESCUE_EXCLUDED.includes(entry.kind))
    : inhalable;
  if (pool.length === 0) return 'jelly';
  const safe = pool.filter((entry) => ENEMY_THREAT[entry.kind] === 'safe');
  const picked = safe.length > 0 ? safe : pool;
  return pickEnemyKind({ ...level, enemyMix: picked }, rand01);
}

// 救援生成位：玩家前方（推進向）160–240px；越界或落尾端安全區改由後方等距補位。
export function rescueSpawnX(playerX: number, rand01: number, level: LevelSpec): number {
  const offset = RESCUE_AHEAD_MIN_PX + rand01 * (RESCUE_AHEAD_MAX_PX - RESCUE_AHEAD_MIN_PX);
  const margin = 60;
  const ahead = playerX + offset;
  if (ahead <= level.worldWidth - margin && !isInSafeTail(level, ahead)) return ahead;
  return Math.max(margin, playerX - offset);
}

// 尾端安全區：星星門前禁 spawn 的喘息帶。
export function isInSafeTail(level: LevelSpec, x: number): boolean {
  return level.safeZoneTailPx > 0 && x >= level.worldWidth - level.safeZoneTailPx;
}

// 卡點關中點重生（§67）：已推進越過 checkpoint 才自 checkpoint 重生，否則整關重試。
export function checkpointRespawnX(level: LevelSpec, farthestX: number): number | null {
  if (level.checkpointX === undefined || farthestX < level.checkpointX) return null;
  return level.checkpointX;
}

// 魔王關清單由 LEVELS 派生（§86 星核制霸判定基底，禁止第二份硬編清單）。
export const BOSS_LEVEL_IDS: readonly LevelId[] = LEVELS.filter((level) => level.boss !== null).map(
  (level) => level.id,
);

// 星核制霸（§86）：全魔王 EX 變體制霸才成立；獎勵為純呈現層 cosmetic（零平衡影響）。
export function exConquestDone(save: SaveData): boolean {
  return BOSS_LEVEL_IDS.every((id) => save.levels[id]?.exCleared === true);
}
