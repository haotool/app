// 遊戲數值 SSOT（GAME_DESIGN §5–§7、§20–§21，凍結）。
// 純資料模組（不 import phaser）：vitest node 環境可直接載入驗證。
// v4 響應寬幅（§28）：邏輯高固定 480，邏輯寬依殼比例 854–1200 動態。
export const VIEW = {
  minWidth: 854,
  maxWidth: 1200,
  height: 480,
} as const;

// 殼（旋轉後）尺寸 → 邏輯寬：clamp(round(aspect×480), 854, 1200)；量測不足時回退最小寬。
export function computeLogicalWidth(shellW: number, shellH: number): number {
  if (shellW <= 0 || shellH <= 0) return VIEW.minWidth;
  const raw = Math.round((shellW / shellH) * VIEW.height);
  return Math.min(VIEW.maxWidth, Math.max(VIEW.minWidth, raw));
}

export const GRAVITY_Y = 900;

export const PLAYER = {
  moveSpeed: 220,
  // v6 手感（§41）：水平速度加減速曲線——起步約 0.16s 達全速、鬆手約 0.11s 停定，
  // 反向轉身以加減速率疊加保持靈敏。
  accelPxPerSec2: 1400,
  decelPxPerSec2: 2000,
  jumpVelocity: -420,
  floatLift: -260,
  maxHp: 5,
  invulnerableMs: 1500,
  maxFlaps: 3,
} as const;

// 觸控寬容度硬規則（GAME_DESIGN §15.1，全關卡生效）。
export const FORGIVENESS = {
  coyoteMs: 150,
  jumpBufferMs: 160,
  hurtboxWidthRatio: 0.75,
  hurtboxHeightRatio: 0.8,
  hurtLockMs: 250,
} as const;

export const INHALE = {
  holdThresholdMs: 150,
  rangePx: 140,
} as const;

export const STAR = {
  maxAmmo: 3,
} as const;

// 吞噬賦星（§20/§40/§47/§53）：吞下的怪決定星彈屬性，最後吞下者覆蓋既有彈藥屬性。
// v6 新增殼盾星（shelly）與雷鏈星（zappy）；v7 新增重鑽星（drilly）與流光星（glowy）；
// v8 新增孢子星（spora）與迴旋星（boomy），星彈擴為九系。
export type StarFlavor =
  | 'jelly'
  | 'floaty'
  | 'puffy'
  | 'shelly'
  | 'zappy'
  | 'drilly'
  | 'glowy'
  | 'spora'
  | 'boomy';

export interface StarFlavorSpec {
  damage: number;
  speed: number;
  pierceCount: number;
  // 屬性顯示色：HUD 彈藥星上色用；標準星的星彈藝術已是金黃，發射時不套 tint。
  tint: number;
  aoeRadiusPx: number;
  aoeDamage: number;
  // 雷鏈（§40）：命中後跳電至半徑內最近 chainCount 隻小怪，各受 chainDamage。
  chainCount: number;
  chainRadiusPx: number;
  chainDamage: number;
  // 孢子緩速（§53）：命中緩速 slowMs 並每 tick 結算 dotDamage 輕持續傷；0 為無效果。
  slowMs: number;
  dotDamage: number;
  // 迴旋（§53）：去而復返雙判定彈道；回程由 boomerangVelocity 純函式驅動。
  boomerang: boolean;
  sfxPitch: number;
}

// 九系共用零值基底：各系僅覆寫有效欄位，避免表格噪音。
const FLAVOR_BASE = {
  aoeRadiusPx: 0,
  aoeDamage: 0,
  chainCount: 0,
  chainRadiusPx: 0,
  chainDamage: 0,
  slowMs: 0,
  dotDamage: 0,
  boomerang: false,
} as const;

export const STAR_FLAVORS: Record<StarFlavor, StarFlavorSpec> = {
  jelly: { ...FLAVOR_BASE, damage: 5, speed: 520, pierceCount: 1, tint: 0xffd966, sfxPitch: 1 },
  floaty: {
    ...FLAVOR_BASE,
    damage: 5,
    speed: 650,
    pierceCount: 2,
    tint: 0xa78bfa,
    sfxPitch: 1.15,
  },
  puffy: {
    ...FLAVOR_BASE,
    damage: 5,
    speed: 520,
    pierceCount: 0,
    tint: 0xff8a80,
    aoeRadiusPx: 60,
    aoeDamage: 2,
    sfxPitch: 0.85,
  },
  shelly: {
    ...FLAVOR_BASE,
    damage: 5,
    speed: 480,
    pierceCount: 0,
    tint: 0x7fd8c8,
    sfxPitch: 0.95,
  },
  zappy: {
    ...FLAVOR_BASE,
    damage: 5,
    speed: 585,
    pierceCount: 0,
    tint: 0xffe28a,
    chainCount: 2,
    chainRadiusPx: 160,
    chainDamage: 3,
    sfxPitch: 1.25,
  },
  // 重鑽星（§47 Drilly）：低速高傷、穿透 2——貼近鑽地者「硬掘」性格。
  drilly: {
    ...FLAVOR_BASE,
    damage: 7,
    speed: 430,
    pierceCount: 2,
    tint: 0xd8a26b,
    sfxPitch: 0.75,
  },
  // 流光星（§47 Glowy）：中速、命中處留 90px 光域對域內敵持續結算（GameScene 呈現）。
  glowy: {
    ...FLAVOR_BASE,
    damage: 5,
    speed: 540,
    pierceCount: 0,
    tint: 0xffe9a8,
    aoeRadiusPx: 90,
    aoeDamage: 2,
    sfxPitch: 1.1,
  },
  // 孢子星（§53 Spora）：命中緩速 2.2s＋輕持續傷（每 tick 1，走 enemies 中央結算）。
  spora: {
    ...FLAVOR_BASE,
    damage: 4,
    speed: 500,
    pierceCount: 0,
    tint: 0xa8d8a0,
    slowMs: 2200,
    dotDamage: 1,
    sfxPitch: 0.9,
  },
  // 迴旋星（§53 Boomy）：去程＋回程雙判定；回程由 GameScene 逐幀轉向（boomerangVelocity）。
  boomy: {
    ...FLAVOR_BASE,
    damage: 5,
    speed: 520,
    pierceCount: 1,
    tint: 0xe8a878,
    boomerang: true,
    sfxPitch: 1.05,
  },
} as const;

// 吞噬連鎖（§23/§46）：彈匣槽位各自帶屬性與強化態，後進先出發射；
// mix 為混合星配方 id（§46 雙味混合），混合槽為終態（不可再強化/再混）。
export interface MagazineSlot {
  flavor: StarFlavor;
  charged: boolean;
  gold: boolean;
  mix?: MixId;
}

// 雙味混合星彈（§46/§53）：依序吞兩隻不同怪且配方存在 → 頂槽合成混合星（佔 1 槽）。
// 硬規則：混合星永不為破關必需——基礎星彈恆可通關（anti-softlock）。
export type MixId =
  | 'swiftlight'
  | 'bigblast'
  | 'voltseeker'
  | 'thunderburst'
  | 'shardrill'
  | 'gleamfield'
  | 'sporeblast'
  | 'voltsaw'
  | 'galewheel';

export interface StarMixSpec extends StarFlavorSpec {
  id: MixId;
  nameZh: string;
  // 無序配對：吞入順序不影響配方成立。
  pair: readonly [StarFlavor, StarFlavor];
  // 追蹤（§46 追電星）：飛行中朝最近小怪轉向。
  homing: boolean;
  // 散射（§46 碎鑽星）：發射時分裂為 N 發小幅上下扇形。
  scatterCount: number;
  // 凍結場（§46 凝光星）：命中處生成光域，域內小怪凍結。
  freezeRadiusPx: number;
  freezeMs: number;
}

const MIX_BASE = {
  ...FLAVOR_BASE,
  homing: false,
  scatterCount: 0,
  freezeRadiusPx: 0,
  freezeMs: 0,
} as const;

// 九組配方（§46 六式＋§53 三式）：效果自 穿透/追蹤/散射/爆炸/凍結場/連鎖電/緩速/迴旋
// 擇優組合，各具獨特 tint 與 sfxPitch；視覺拖尾由發射端依 tint 上色。
export const STAR_MIXES: readonly StarMixSpec[] = [
  {
    ...MIX_BASE,
    id: 'swiftlight',
    nameZh: '疾光星',
    pair: ['jelly', 'floaty'],
    damage: 5,
    speed: 780,
    pierceCount: 3,
    tint: 0xfff1c4,
    sfxPitch: 1.35,
  },
  {
    ...MIX_BASE,
    id: 'bigblast',
    nameZh: '巨爆星',
    pair: ['jelly', 'puffy'],
    damage: 6,
    speed: 480,
    pierceCount: 0,
    tint: 0xff9d7a,
    sfxPitch: 0.7,
    aoeRadiusPx: 110,
    aoeDamage: 4,
  },
  {
    ...MIX_BASE,
    id: 'voltseeker',
    nameZh: '追電星',
    pair: ['floaty', 'zappy'],
    damage: 5,
    speed: 560,
    pierceCount: 0,
    tint: 0xc9b8ff,
    sfxPitch: 1.3,
    chainCount: 2,
    chainRadiusPx: 160,
    chainDamage: 3,
    homing: true,
  },
  {
    ...MIX_BASE,
    id: 'thunderburst',
    nameZh: '雷爆星',
    pair: ['puffy', 'zappy'],
    damage: 6,
    speed: 520,
    pierceCount: 0,
    tint: 0xffd24d,
    sfxPitch: 0.9,
    aoeRadiusPx: 70,
    aoeDamage: 3,
    chainCount: 3,
    chainRadiusPx: 180,
    chainDamage: 3,
  },
  {
    ...MIX_BASE,
    id: 'shardrill',
    nameZh: '碎鑽星',
    pair: ['shelly', 'drilly'],
    damage: 6,
    speed: 470,
    pierceCount: 1,
    tint: 0x9adfd2,
    sfxPitch: 0.8,
    scatterCount: 3,
  },
  {
    ...MIX_BASE,
    id: 'gleamfield',
    nameZh: '凝光星',
    pair: ['drilly', 'glowy'],
    damage: 5,
    speed: 520,
    pierceCount: 0,
    tint: 0xfff7d6,
    sfxPitch: 1.15,
    freezeRadiusPx: 100,
    freezeMs: 1500,
  },
  // 毒爆雲（§53）：AoE 爆炸＋域內緩速持續傷（爆炸＋緩速場）。
  {
    ...MIX_BASE,
    id: 'sporeblast',
    nameZh: '毒爆雲',
    pair: ['spora', 'puffy'],
    damage: 5,
    speed: 480,
    pierceCount: 0,
    tint: 0xbce8a0,
    sfxPitch: 0.75,
    aoeRadiusPx: 90,
    aoeDamage: 3,
    slowMs: 2600,
    dotDamage: 1,
  },
  // 電鋸迴旋（§53）：迴旋雙判定＋每次命中跳電（迴旋＋連鎖電，回程同樣鏈電）。
  {
    ...MIX_BASE,
    id: 'voltsaw',
    nameZh: '電鋸迴旋',
    pair: ['boomy', 'zappy'],
    damage: 5,
    speed: 480,
    pierceCount: 1,
    tint: 0xf5d878,
    sfxPitch: 1.28,
    boomerang: true,
    chainCount: 2,
    chainRadiusPx: 160,
    chainDamage: 3,
  },
  // 迴風刃（§53 第三式裁量）：高速長弧迴旋、雙程各穿透 2——廣域掃割手感。
  {
    ...MIX_BASE,
    id: 'galewheel',
    nameZh: '迴風刃',
    pair: ['boomy', 'floaty'],
    damage: 5,
    speed: 620,
    pierceCount: 2,
    tint: 0xc8dcf5,
    sfxPitch: 1.4,
    boomerang: true,
  },
] as const;

// 散射扇形（§46 碎鑽星）：分裂彈上下錯開的垂直初速間距。
export const SCATTER_FAN_VY = 90;

// 孢子緩速（§53）：緩速期水平速度上限與持續傷 tick 間隔（enemies.update 中央結算）。
export const SPORA_SLOW = {
  speedCapPx: 60,
  dotTickMs: 700,
} as const;

// 迴旋彈道（§53）：去程勻減速至折返點反向，總程 2×turnMs；逾時由發射端回收。
// 去程距離 = speed×turnMs/2（迴旋星 520×0.9/2 ≈ 234px）。
export const BOOMERANG = {
  turnMs: 900,
  lifetimeMs: 2200,
} as const;

// 無序配對查表：吞入順序無關；查無配方回 null（沿用 §23 推新槽規則）。
export function findMix(a: StarFlavor, b: StarFlavor): StarMixSpec | null {
  return (
    STAR_MIXES.find(
      (mix) => (mix.pair[0] === a && mix.pair[1] === b) || (mix.pair[0] === b && mix.pair[1] === a),
    ) ?? null
  );
}

export function getMix(id: MixId): StarMixSpec {
  const mix = STAR_MIXES.find((spec) => spec.id === id);
  if (!mix) throw new Error(`未定義的混合配方 id：${id}`);
  return mix;
}

// 強化星（§23）：同種連吞 ×2 該槽升級；金邊 tint 同時用於 HUD 槽位金邊與金星彈。
export const CHARGED_STAR = {
  damageMultiplier: 1.6,
  sizeMultiplier: 1.4,
  pitchMultiplier: 0.85,
  tint: 0xffc93c,
} as const;

// 星暴（§23）：彈匣全滿長按 B 0.8s，清場全小怪 + 魔王 12 傷，清空彈匣。
export const STARSTORM = {
  holdMs: 800,
  bossDamage: 12,
} as const;

// 下衝擊（§44）：空中「下＋跳躍鍵」快速下墜（吞含狀態不影響觸發），
// 落地 60px 衝擊波（傷害 2、擊退），零彈藥消耗。
export const SLAM = {
  fallVelocityY: 700,
  radiusPx: 60,
  damage: 2,
  cooldownMs: 1200,
  knockbackSpeed: 260,
  knockbackLift: -180,
} as const;

// 金星彈（§24 第三關彩蛋）：單發傷害 20。
export const GOLD_STAR = {
  damage: 20,
} as const;

// 彩蛋 HP 上限（§24）：彩虹果凍可將 HP 上限自 5 提升至 6。
export const EGG_HP_CAP = 6;

export const ENEMY = {
  hp: 1,
  touchDamage: 1,
} as const;

// 魔王戰數值（§6）由 pure logic 的 bossFsm.ts 持有；Phaser GameConfig 由 main.ts 組裝。
