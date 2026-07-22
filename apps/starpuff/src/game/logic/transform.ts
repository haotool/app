import type { MagazineSlot, StarFlavor } from '../core/config';
import type { TransformForm } from '../core/types';

// 星化變身純狀態機（GAME_DESIGN §57 觸發面由 §109 取代，不 import phaser），vitest 對象。
// 觸發語意（§109）：彈匣同系可變身星 ≥3 且在地面，SP 鍵點按＝立即變身（0.6s 長按門檻
// 廢除——情境鍵本身已表達意圖）；變身期間吸入停用、B 鍵改役形態技，再按 SP 提前解除
//（不返彈）。SP 點按裁決見 logic/starburst.ts resolveSpPress。
// anti-softlock：變身永不為破關必需，全關卡純標準星保底線不變。

export type { TransformForm } from '../core/types';

export const TRANSFORM = {
  durationMs: 10_000,
  requiredStars: 3,
} as const;

// 形態規格表（表驅動，禁止散落 scene）：每形態至少改變 移動/攻擊/防禦 兩項。
export interface TransformFormSpec {
  nameZh: string;
  tint: number;
  moveSpeedMul: number;
  // 攻擊：volt 帶電接觸傷害＋鏈電束；gale 穿透風刃＋落地衝擊；shell 下砸範圍倍率。
  contactDamage: number;
  beam: boolean;
  windBlade: boolean;
  landingImpact: boolean;
  slamRadiusMul: number;
  // 防禦：shell 受傷減半＋反彈彈幕。
  halveDamage: boolean;
  reflectProjectiles: boolean;
  // 移動：gale 近自由飛行（拍翅無上限＋升力增強）。
  freeFlight: boolean;
}

export const TRANSFORM_FORMS: Record<TransformForm, TransformFormSpec> = {
  volt: {
    nameZh: '雷化',
    tint: 0xffe28a,
    moveSpeedMul: 1.15,
    contactDamage: 2,
    beam: true,
    windBlade: false,
    landingImpact: false,
    slamRadiusMul: 1,
    halveDamage: false,
    reflectProjectiles: false,
    freeFlight: false,
  },
  gale: {
    nameZh: '風化',
    tint: 0xc8dcf5,
    moveSpeedMul: 1,
    contactDamage: 0,
    beam: false,
    windBlade: true,
    landingImpact: true,
    slamRadiusMul: 1,
    halveDamage: false,
    reflectProjectiles: false,
    freeFlight: true,
  },
  shell: {
    nameZh: '殼化',
    tint: 0x7fd8c8,
    moveSpeedMul: 0.8,
    contactDamage: 0,
    beam: false,
    windBlade: false,
    landingImpact: false,
    slamRadiusMul: 2,
    halveDamage: true,
    reflectProjectiles: true,
    freeFlight: false,
  },
} as const;

// 雷化鏈電束（§57）：點按發出短程束——最近敵主傷＋跳電波及，束體視覺停留由呈現層承擔。
export const VOLT_BEAM = {
  rangePx: 170,
  damage: 3,
  chainCount: 2,
  chainDamage: 2,
  cooldownMs: 900,
} as const;

// 風化穿透風刃（§57）：點按發射高穿透直射刃。
export const GALE_BLADE = {
  damage: 4,
  speed: 640,
  pierceCount: 99,
  cooldownMs: 350,
} as const;

// 風化飛行（§57）：拍翅無上限＋升力增強（近自由飛行）；落地小範圍衝擊。
export const GALE_FLIGHT = {
  floatLift: -330,
  landingRadiusPx: 44,
  landingDamage: 1,
} as const;

// 殼化反彈（§57/§58）：被反彈的彈幕命中魔王回傷（反傷計入傷害管線）。
export const SHELL_REFLECT = {
  damage: 3,
  speed: 340,
} as const;

// 觸發味 → 形態對應：gusty 吞入歸 floaty 味（§52），自然併入風化來源。
const FORM_BY_FLAVOR: Partial<Record<StarFlavor, TransformForm>> = {
  zappy: 'volt',
  floaty: 'gale',
  shelly: 'shell',
};

// 變身資格（§57）：彈匣全數同系可變身味、非金非混，同系星彈合計 ≥3 發——
// 強化槽為連吞兩發合成（§23），計 2 發（三連吞 [強化,單發] 即達標）。
export function eligibleForm(magazine: readonly MagazineSlot[]): TransformForm | null {
  const first = magazine[0];
  if (!first) return null;
  const form = FORM_BY_FLAVOR[first.flavor];
  if (!form) return null;
  let stars = 0;
  for (const slot of magazine) {
    if (slot.gold || slot.mix !== undefined || slot.flavor !== first.flavor) return null;
    stars += slot.charged ? 2 : 1;
  }
  return stars >= TRANSFORM.requiredStars ? form : null;
}

export interface TransformState {
  form: TransformForm | null;
  remainingMs: number;
}

export function createTransformState(): TransformState {
  return { form: null, remainingMs: 0 };
}

export function startTransform(form: TransformForm): TransformState {
  return { form, remainingMs: TRANSFORM.durationMs };
}

export function endTransform(): TransformState {
  return createTransformState();
}

export interface TransformTick {
  state: TransformState;
  // 本 tick 計時耗盡自動解除；呈現層據此播解除演出。
  expired: boolean;
}

export function tickTransform(state: TransformState, deltaMs: number): TransformTick {
  if (!state.form) return { state, expired: false };
  const remainingMs = state.remainingMs - deltaMs;
  if (remainingMs <= 0) return { state: endTransform(), expired: true };
  return { state: { form: state.form, remainingMs }, expired: false };
}

export function transformProgress(state: TransformState): number {
  if (!state.form) return 0;
  return Math.max(0, Math.min(1, state.remainingMs / TRANSFORM.durationMs));
}

// 殼化受傷減半（§57）：整數 HP 下以 0.5 傷害池累積，滿 1 才實扣——兩次 1 傷合計扣 1。
export function absorbHalvedDamage(pool: number, damage: number): { pool: number; damage: number } {
  const total = pool + damage / 2;
  const dealt = Math.floor(total);
  return { pool: total - dealt, damage: dealt };
}
