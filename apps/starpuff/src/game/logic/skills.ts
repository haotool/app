import {
  CHARGED_STAR,
  GOLD_STAR,
  INHALE,
  STAR,
  STARSTORM,
  STAR_FLAVORS,
  findMix,
  getMix,
  type MagazineSlot,
  type StarFlavor,
} from '../core/config';

// 吞噬連鎖技能純邏輯（GAME_DESIGN §23，不 import phaser），vitest 對象。
// 彈匣為槽位堆疊：後進先出發射；同種連吞 ×2 頂槽升級強化星。

export interface SwallowResult {
  magazine: readonly MagazineSlot[];
  charged: boolean;
  // 本次吞入合成的混合配方 id（§46）；未合成為 null。
  mixed: string | null;
}

// 頂槽同種且未強化 → 連吞升級 charged（§23）；
// 頂槽異種且素槽（未強化/非金/非混）且配方存在 → 合成混合星佔原槽（§46）；
// 其餘推新槽；滿匣改吞 → 覆蓋頂槽（§20 最後吞下者覆蓋，混合槽被覆蓋即取消）。
export function swallowIntoMagazine(
  magazine: readonly MagazineSlot[],
  kind: StarFlavor,
): SwallowResult {
  const top = magazine[magazine.length - 1];
  if (top && !top.charged && !top.gold && top.mix === undefined) {
    if (top.flavor === kind) {
      return {
        magazine: [...magazine.slice(0, -1), { ...top, charged: true }],
        charged: true,
        mixed: null,
      };
    }
    const mix = findMix(top.flavor, kind);
    if (mix) {
      const slot: MagazineSlot = { flavor: top.flavor, charged: false, gold: false, mix: mix.id };
      return { magazine: [...magazine.slice(0, -1), slot], charged: false, mixed: mix.id };
    }
  }
  const slot: MagazineSlot = { flavor: kind, charged: false, gold: false };
  if (magazine.length >= STAR.maxAmmo) {
    return { magazine: [...magazine.slice(0, -1), slot], charged: false, mixed: null };
  }
  return { magazine: [...magazine, slot], charged: false, mixed: null };
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

// 槽位有效彈道規格（§46 單一出口）：混合槽讀配方表，其餘讀屬性表。
export function slotSpec(slot: MagazineSlot): (typeof STAR_FLAVORS)[StarFlavor] {
  return slot.mix !== undefined ? getMix(slot.mix) : STAR_FLAVORS[slot.flavor];
}

export function starDamage(slot: MagazineSlot): number {
  if (slot.gold) return GOLD_STAR.damage;
  const base = slotSpec(slot).damage;
  return slot.charged ? base * CHARGED_STAR.damageMultiplier : base;
}

export function starPitch(slot: MagazineSlot): number {
  const base = slotSpec(slot).sfxPitch;
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

// 星暴無敵窗（§64）：與受擊 i-frame 為獨立計時、結算時取較大值生效——
// 不疊加、期間受擊不重啟；受擊判定沿用 combat.resolveHit 單一出口。
export function effectiveInvulnMs(hitInvulnMs: number, stormInvulnMs: number): number {
  return Math.max(hitInvulnMs, stormInvulnMs);
}

export function starstormProgress(holdMs: number): number {
  return Math.min(1, holdMs / STARSTORM.holdMs);
}

// B 鍵按下當幀的動作決策（§23/§40/§57）：滿匣延遲至放開結算，區分點按發射與長按星暴；
// 頂槽殼盾星同走延遲，長按改舉盾；變身資格成立（同系 ≥3 星）同走延遲，長按改星化。
// v7 起下衝擊改由跳躍鍵矩陣觸發（resolveJumpPress）。
export type ActionCommand = 'fire' | 'defer' | 'none';

export function resolveActionPress(opts: {
  ammo: number;
  topIsShelly?: boolean;
  transformEligible?: boolean;
}): ActionCommand {
  if (opts.ammo <= 0) return 'none';
  return opts.ammo >= STAR.maxAmmo || opts.topIsShelly === true || opts.transformEligible === true
    ? 'defer'
    : 'fire';
}

// 跳躍鍵輸入矩陣（§44，v7）：空中「下＋跳」＝下衝擊（吞含/puffed 狀態不影響；
// CD 中回落一般跳躍鏈不吞輸入）；地面「下＋跳」交由跳躍鏈——站單向平台時
// stage 層 shouldDropThrough（down+jump）裁決為下落穿透並覆蓋跳躍脈衝（§29 既有
// 優先序），主地面無蹲下語義、照常起跳（無衝突）。
// §71 熱修：落地擠壓迴圈使接觸旗標抖動，「假空中」幀曾誤觸下砸並貫穿平台；
// coyote 窗（recentlyGroundedMs > 0）內視同在地，下砸僅在真空中成立。
export type JumpPressCommand = 'slam' | 'jump';

export function resolveJumpPress(opts: {
  airborne: boolean;
  down: boolean;
  slamCooldownMs: number;
  recentlyGroundedMs: number;
}): JumpPressCommand {
  return opts.airborne && opts.down && opts.slamCooldownMs <= 0 && opts.recentlyGroundedMs <= 0
    ? 'slam'
    : 'jump';
}

// 滿匣延遲發射：放開時短於吸入閾值視為點按 → 發射。
export function shouldFireOnRelease(holdMs: number): boolean {
  return holdMs < INHALE.holdThresholdMs;
}

// 殼盾（§40）：頂槽殼盾星長按舉正面護盾——格擋一次即消耗頂槽並反擊星爆，CD 4s。
// 滿彈匣長按維持星暴優先（§23 肌肉記憶不變），故 eligible 僅在未滿匣成立。
export const SHELL_SHIELD = {
  cooldownMs: 4000,
  blockInvulnMs: 800,
  counterRadiusPx: 90,
  counterDamage: 3,
} as const;

export interface ShieldState {
  raised: boolean;
  cooldownMs: number;
}

export function createShieldState(): ShieldState {
  return { raised: false, cooldownMs: 0 };
}

export function isTopShelly(magazine: readonly MagazineSlot[]): boolean {
  const top = magazine[magazine.length - 1];
  return top?.flavor === 'shelly' && !top.gold;
}

// 殼盾情境（§40 輸入矩陣）：頂槽殼盾星且未滿匣——此情境下長按語意固定為舉盾，
// 盾 CD 中或舉盾中皆不得回落為吸入（點按發射不受影響）；滿匣長按維持星暴優先。
export function shieldEligible(magazine: readonly MagazineSlot[]): boolean {
  return isTopShelly(magazine) && magazine.length < STAR.maxAmmo;
}

// 逐幀推進：held 為長按達閾值（同吸入 150ms），eligible 為頂槽殼盾星且未滿匣；
// CD 中不可舉盾，放開或條件消失即放下。
export function advanceShield(
  state: ShieldState,
  tick: { deltaMs: number; held: boolean; eligible: boolean },
): ShieldState {
  const cooldownMs = Math.max(0, state.cooldownMs - tick.deltaMs);
  return { raised: tick.held && tick.eligible && cooldownMs <= 0, cooldownMs };
}

// 成功格擋：放下護盾並進 CD；頂槽消耗與反擊星爆由呼叫端結算。
export function resolveShieldBlock(): ShieldState {
  return { raised: false, cooldownMs: SHELL_SHIELD.cooldownMs };
}

// 正面判定（§40 正面護盾）：傷害來源位於面向側；同 x 視為正面（貼身重疊保護）。
export function isFrontalHit(facing: 1 | -1, playerX: number, sourceX: number): boolean {
  return sourceX === playerX || Math.sign(sourceX - playerX) === facing;
}

// 雷鏈目標選擇（§40）：命中點半徑內取最近 count 隻，由近至遠排序；純函式供 vitest。
export interface ChainCandidate {
  x: number;
  y: number;
}

export function pickChainTargets<T extends ChainCandidate>(
  originX: number,
  originY: number,
  candidates: readonly T[],
  count: number,
  radiusPx: number,
): T[] {
  return candidates
    .map((candidate) => ({
      candidate,
      distSq: (candidate.x - originX) ** 2 + (candidate.y - originY) ** 2,
    }))
    .filter((entry) => entry.distSq <= radiusPx * radiusPx)
    .sort((a, b) => a.distSq - b.distSq)
    .slice(0, Math.max(0, count))
    .map((entry) => entry.candidate);
}
