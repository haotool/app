import {
  CHARGED_STAR,
  GOLD_STAR,
  INHALE,
  STAR,
  STARSTORM,
  STAR_FLAVORS,
  type MagazineSlot,
  type StarFlavor,
} from '../core/config';

// 吞噬連鎖技能純邏輯（GAME_DESIGN §23，不 import phaser），vitest 對象。
// 彈匣為槽位堆疊：後進先出發射；同種連吞 ×2 頂槽升級強化星。

export interface SwallowResult {
  magazine: readonly MagazineSlot[];
  charged: boolean;
}

// 頂槽同種且未強化 → 連吞升級 charged；滿匣改吞 → 覆蓋頂槽（§20 最後吞下者覆蓋）。
export function swallowIntoMagazine(
  magazine: readonly MagazineSlot[],
  kind: StarFlavor,
): SwallowResult {
  const top = magazine[magazine.length - 1];
  if (top?.flavor === kind && !top.charged && !top.gold) {
    return { magazine: [...magazine.slice(0, -1), { ...top, charged: true }], charged: true };
  }
  const slot: MagazineSlot = { flavor: kind, charged: false, gold: false };
  if (magazine.length >= STAR.maxAmmo) {
    return { magazine: [...magazine.slice(0, -1), slot], charged: false };
  }
  return { magazine: [...magazine, slot], charged: false };
}

export interface PopResult {
  magazine: readonly MagazineSlot[];
  slot: MagazineSlot | null;
}

export function popTopSlot(magazine: readonly MagazineSlot[]): PopResult {
  return { magazine: magazine.slice(0, -1), slot: magazine[magazine.length - 1] ?? null };
}

// 金星彈（§24 第三關彩蛋）：置入頂槽；滿匣時覆蓋頂槽。
export function pushGoldStar(magazine: readonly MagazineSlot[]): readonly MagazineSlot[] {
  const slot: MagazineSlot = { flavor: 'jelly', charged: false, gold: true };
  if (magazine.length >= STAR.maxAmmo) return [...magazine.slice(0, -1), slot];
  return [...magazine, slot];
}

// 星星雨（§24 第二關彩蛋）：空槽以標準星補滿，既有槽位不動。
export function fillMagazine(magazine: readonly MagazineSlot[]): readonly MagazineSlot[] {
  const filled = [...magazine];
  while (filled.length < STAR.maxAmmo)
    filled.push({ flavor: 'jelly', charged: false, gold: false });
  return filled;
}

export function starDamage(slot: MagazineSlot): number {
  if (slot.gold) return GOLD_STAR.damage;
  const base = STAR_FLAVORS[slot.flavor].damage;
  return slot.charged ? base * CHARGED_STAR.damageMultiplier : base;
}

export function starPitch(slot: MagazineSlot): number {
  const base = STAR_FLAVORS[slot.flavor].sfxPitch;
  return slot.charged ? base * CHARGED_STAR.pitchMultiplier : base;
}

// 星暴充能（§23）：滿匣且持續按住才累積；任一條件中斷即歸零。
export function advanceStarstormHold(
  holdMs: number,
  deltaMs: number,
  held: boolean,
  full: boolean,
): number {
  return held && full ? holdMs + deltaMs : 0;
}

export function starstormReady(holdMs: number): boolean {
  return holdMs >= STARSTORM.holdMs;
}

export function starstormProgress(holdMs: number): number {
  return Math.min(1, holdMs / STARSTORM.holdMs);
}

// B 鍵按下當幀的動作決策（§23）：空中下+B 優先下衝擊（CD 中不誤射）；
// 滿匣延遲至放開結算，區分點按發射與長按星暴。
export type ActionCommand = 'slam' | 'fire' | 'defer' | 'none';

export function resolveActionPress(opts: {
  airborne: boolean;
  down: boolean;
  slamCooldownMs: number;
  ammo: number;
}): ActionCommand {
  if (opts.airborne && opts.down) return opts.slamCooldownMs <= 0 ? 'slam' : 'none';
  if (opts.ammo <= 0) return 'none';
  return opts.ammo >= STAR.maxAmmo ? 'defer' : 'fire';
}

// 滿匣延遲發射：放開時短於吸入閾值視為點按 → 發射。
export function shouldFireOnRelease(holdMs: number): boolean {
  return holdMs < INHALE.holdThresholdMs;
}
