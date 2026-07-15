import {
  AIR_DASH,
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

// B 鍵按下當幀的動作決策（§23/§40）：空中下+B 優先下衝擊（CD 中不誤射）；
// 滿匣延遲至放開結算，區分點按發射與長按星暴；頂槽殼盾星同走延遲，長按改舉盾。
export type ActionCommand = 'slam' | 'fire' | 'defer' | 'none';

export function resolveActionPress(opts: {
  airborne: boolean;
  down: boolean;
  slamCooldownMs: number;
  ammo: number;
  topIsShelly?: boolean;
}): ActionCommand {
  if (opts.airborne && opts.down) return opts.slamCooldownMs <= 0 ? 'slam' : 'none';
  if (opts.ammo <= 0) return 'none';
  return opts.ammo >= STAR.maxAmmo || opts.topIsShelly === true ? 'defer' : 'fire';
}

// 滿匣延遲發射：放開時短於吸入閾值視為點按 → 發射。
export function shouldFireOnRelease(holdMs: number): boolean {
  return holdMs < INHALE.holdThresholdMs;
}

// 空中疾衝（§30）：雙擊偵測 + CD 純狀態機。sinceTapMs 只累計「空中」按壓，
// 落地即重置（地面按 A 為跳躍，不列入雙擊首擊）。
export interface AirDashState {
  sinceTapMs: number;
  dashLeftMs: number;
  cooldownMs: number;
}

export function createAirDashState(): AirDashState {
  return { sinceTapMs: Number.POSITIVE_INFINITY, dashLeftMs: 0, cooldownMs: 0 };
}

export interface AirDashTick {
  deltaMs: number;
  jumpPressed: boolean;
  airborne: boolean;
}

export interface AirDashResult {
  state: AirDashState;
  trigger: boolean;
}

export function advanceAirDash(state: AirDashState, tick: AirDashTick): AirDashResult {
  const next: AirDashState = {
    sinceTapMs: state.sinceTapMs + tick.deltaMs,
    dashLeftMs: Math.max(0, state.dashLeftMs - tick.deltaMs),
    cooldownMs: Math.max(0, state.cooldownMs - tick.deltaMs),
  };
  if (!tick.airborne) {
    next.sinceTapMs = Number.POSITIVE_INFINITY;
    return { state: next, trigger: false };
  }
  if (!tick.jumpPressed) return { state: next, trigger: false };
  if (
    next.sinceTapMs <= AIR_DASH.doubleTapWindowMs &&
    next.cooldownMs <= 0 &&
    next.dashLeftMs <= 0
  ) {
    return {
      state: {
        sinceTapMs: Number.POSITIVE_INFINITY,
        dashLeftMs: AIR_DASH.durationMs,
        cooldownMs: AIR_DASH.cooldownMs,
      },
      trigger: true,
    };
  }
  next.sinceTapMs = 0;
  return { state: next, trigger: false };
}

export function isAirDashing(state: AirDashState): boolean {
  return state.dashLeftMs > 0;
}

// 疾衝退還拍翅（§30 手感）：雙擊第二拍觸發疾衝當幀，退還首拍實際消耗的拍翅次數；
// 首拍未耗拍翅（coyote 跳、buffer 記帳）不退，避免憑空生出額度。
export function refundDashFlap(flapsUsed: number, firstTapFlapped: boolean): number {
  return firstTapFlapped ? Math.max(0, flapsUsed - 1) : flapsUsed;
}

// 疾衝水平速度：180px / 0.18s = 1000px/s。
export function airDashSpeed(): number {
  return (AIR_DASH.distancePx / AIR_DASH.durationMs) * 1000;
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
