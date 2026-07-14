// 遊戲數值 SSOT（GAME_DESIGN §5–§7、§20–§21，凍結）。
// 純資料模組（不 import phaser）：vitest node 環境可直接載入驗證。
// v3 橫式畫布（§21）：854×480，Scale.FIT + CENTER_BOTH。
export const CANVAS = {
  width: 854,
  height: 480,
} as const;

export const GRAVITY_Y = 900;

export const PLAYER = {
  moveSpeed: 220,
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

// 吞噬賦星（§20）：吞下的怪決定星彈屬性，最後吞下者覆蓋既有彈藥屬性。
export type StarFlavor = 'jelly' | 'floaty' | 'puffy';

export interface StarFlavorSpec {
  damage: number;
  speed: number;
  pierceCount: number;
  // 屬性顯示色：HUD 彈藥星上色用；標準星的星彈藝術已是金黃，發射時不套 tint。
  tint: number;
  aoeRadiusPx: number;
  aoeDamage: number;
  sfxPitch: number;
}

export const STAR_FLAVORS: Record<StarFlavor, StarFlavorSpec> = {
  jelly: {
    damage: 5,
    speed: 520,
    pierceCount: 1,
    tint: 0xffd966,
    aoeRadiusPx: 0,
    aoeDamage: 0,
    sfxPitch: 1,
  },
  floaty: {
    damage: 5,
    speed: 650,
    pierceCount: 2,
    tint: 0xa78bfa,
    aoeRadiusPx: 0,
    aoeDamage: 0,
    sfxPitch: 1.15,
  },
  puffy: {
    damage: 5,
    speed: 520,
    pierceCount: 0,
    tint: 0xff8a80,
    aoeRadiusPx: 60,
    aoeDamage: 2,
    sfxPitch: 0.85,
  },
} as const;

// 吞噬連鎖（§23）：彈匣槽位各自帶屬性與強化態，後進先出發射。
export interface MagazineSlot {
  flavor: StarFlavor;
  charged: boolean;
  gold: boolean;
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

// 下衝擊（§23）：空中 down+B 快速下墜，落地 60px 衝擊波（傷害 2、擊退），零彈藥消耗。
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

export const ENEMY = {
  hp: 1,
  touchDamage: 1,
} as const;

// 魔王戰數值（§6）由 pure logic 的 bossFsm.ts 持有；Phaser GameConfig 由 main.ts 組裝。
