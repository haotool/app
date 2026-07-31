import { getMix, type MagazineSlot, type StarFlavor } from '../core/config';
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

// 新形態攻擊彈（§119）：走 stars 池的偽星彈（沿風刃管線）；count>1 為扇形分裂；
// flavor 決定命中效果表（焰彈借爆裂味小爆、稜片借標準味素身），傷害/穿透由本表覆寫。
export interface FormShotSpec {
  damage: number;
  speed: number;
  pierceCount: number;
  count: number;
  spreadVy: number;
  cooldownMs: number;
  flavor: StarFlavor;
  // 焰系燒毀優勢（§119）：burn 命中使冰史萊姆熔解不分裂（W2 稅票同源消費）。
  burn: boolean;
  // 稜系破鏡優勢（§123 W3 消費）：prism 命中使複製噗破鏡像。
  prism?: boolean;
}

// 形態規格表（表驅動，禁止散落 scene）：每形態語彙 ≤4（§119 攻/防/機動/特守門）。
export interface TransformFormSpec {
  nameZh: string;
  tint: number;
  moveSpeedMul: number;
  // 攻擊：volt 帶電接觸傷害＋鏈電束；gale 穿透風刃＋落地衝擊；shell 下砸範圍倍率＋滾殼衝撞。
  contactDamage: number;
  beam: boolean;
  windBlade: boolean;
  landingImpact: boolean;
  slamRadiusMul: number;
  chargeDash: boolean;
  // 防禦：volt 受擊放電反擊次數；gale 落地滾翻免傷窗；shell/tide/gravity 入殼護體次數
  //（受身入殼／泡泡護盾／星體護衛共用 tuck 計數）＋受傷減半＋反彈。
  dischargeCharges: number;
  landingRollMs: number;
  tuckCharges: number;
  halveDamage: boolean;
  reflectProjectiles: boolean;
  // 機動：volt 磁力域免疫（磁彎折不作用，L8/L11 優勢解）；gale 近自由飛行＋滑翔。
  magnetImmune: boolean;
  freeFlight: boolean;
  glide: boolean;
  // §119 新形態語彙：shot＝B 點按攻擊彈（ember/prism）；tapStrike＝B 點按世界結算技
  //（tide/gravity，GameScene 經 SKILL_TRANSFORM_STRIKE 路由）；airDash/blinkPx＝空中跳
  // 槽位機動（焰衝刺／鏡步瞬移）；deflectProjectiles＝潮環撥開投射物（不反打）；
  // gravityFlipImmune＝引力方向切換抗性（L27/L28 W3 消費）。
  shot: FormShotSpec | null;
  tapStrike: 'tide-pull' | 'gravity-well' | null;
  airDash: boolean;
  blinkPx: number;
  deflectProjectiles: boolean;
  // negateProjectiles＝稜化反射抵銷（折射銷毀魔王彈幕，不回傷——與殼化反彈區辨）；
  // bubbleImmune＝泡泡上浮免疫（顯式欄位，不與 deflectProjectiles 隱性耦合）。
  negateProjectiles: boolean;
  bubbleImmune: boolean;
  gravityFlipImmune: boolean;
}

// 既有三形態零值基底（§119 擴欄）：新語彙欄位缺省關閉，行為零回歸。
const FORM_EXT_BASE = {
  shot: null,
  tapStrike: null,
  airDash: false,
  blinkPx: 0,
  deflectProjectiles: false,
  negateProjectiles: false,
  bubbleImmune: false,
  gravityFlipImmune: false,
} as const;

export const TRANSFORM_FORMS: Record<TransformForm, TransformFormSpec> = {
  volt: {
    ...FORM_EXT_BASE,
    nameZh: '雷化',
    tint: 0xffe28a,
    moveSpeedMul: 1.15,
    contactDamage: 2,
    beam: true,
    windBlade: false,
    landingImpact: false,
    slamRadiusMul: 1,
    chargeDash: false,
    dischargeCharges: 2,
    landingRollMs: 0,
    tuckCharges: 0,
    halveDamage: false,
    reflectProjectiles: false,
    magnetImmune: true,
    freeFlight: false,
    glide: false,
  },
  gale: {
    ...FORM_EXT_BASE,
    nameZh: '風化',
    tint: 0xc8dcf5,
    moveSpeedMul: 1,
    contactDamage: 0,
    beam: false,
    windBlade: true,
    landingImpact: true,
    slamRadiusMul: 1,
    chargeDash: false,
    dischargeCharges: 0,
    landingRollMs: 300,
    tuckCharges: 0,
    halveDamage: false,
    reflectProjectiles: false,
    magnetImmune: false,
    freeFlight: true,
    glide: true,
  },
  shell: {
    ...FORM_EXT_BASE,
    nameZh: '殼化',
    tint: 0x7fd8c8,
    moveSpeedMul: 0.8,
    contactDamage: 0,
    beam: false,
    windBlade: false,
    landingImpact: false,
    slamRadiusMul: 2,
    chargeDash: true,
    dischargeCharges: 0,
    landingRollMs: 0,
    tuckCharges: 1,
    halveDamage: true,
    reflectProjectiles: true,
    magnetImmune: false,
    freeFlight: false,
    glide: false,
  },
  // 焰化 Ember（§119，L21 解鎖）：無防禦語彙——走位換輸出；焰彈小爆＋落地熔岩爆＋
  // 空中焰衝刺；burn 對冰史萊姆（W2 稅票）燒毀優勢。
  ember: {
    ...FORM_EXT_BASE,
    nameZh: '焰化',
    tint: 0xff8a5c,
    moveSpeedMul: 1.15,
    contactDamage: 0,
    beam: false,
    windBlade: false,
    landingImpact: true,
    slamRadiusMul: 1,
    chargeDash: false,
    dischargeCharges: 0,
    landingRollMs: 0,
    tuckCharges: 0,
    halveDamage: false,
    reflectProjectiles: false,
    magnetImmune: false,
    freeFlight: false,
    glide: false,
    shot: {
      damage: 4,
      speed: 560,
      pierceCount: 0,
      count: 1,
      spreadVy: 0,
      cooldownMs: 320,
      flavor: 'puffy',
      burn: true,
    },
    airDash: true,
  },
  // 潮化 Tide（§119，L23 解鎖）：水引拉近＋一次性泡泡護盾＋霜滑翔＋潮環撥開投射物。
  tide: {
    ...FORM_EXT_BASE,
    nameZh: '潮化',
    tint: 0x7fd8e8,
    moveSpeedMul: 1,
    contactDamage: 0,
    beam: false,
    windBlade: false,
    landingImpact: false,
    slamRadiusMul: 1,
    chargeDash: false,
    dischargeCharges: 0,
    landingRollMs: 0,
    tuckCharges: 1,
    halveDamage: false,
    reflectProjectiles: false,
    magnetImmune: false,
    freeFlight: false,
    glide: true,
    tapStrike: 'tide-pull',
    deflectProjectiles: true,
    bubbleImmune: true,
  },
  // 稜化 Prism（§119，L25 解鎖）：三向稜光碎片＋反射抵銷＋鏡步瞬移＋彩虹光束
  //（B 長按釋放，可貫穿）。
  prism: {
    ...FORM_EXT_BASE,
    nameZh: '稜化',
    tint: 0xe0b8f0,
    moveSpeedMul: 1,
    contactDamage: 0,
    beam: false,
    windBlade: false,
    landingImpact: false,
    slamRadiusMul: 1,
    chargeDash: false,
    dischargeCharges: 0,
    landingRollMs: 0,
    tuckCharges: 0,
    halveDamage: false,
    reflectProjectiles: false,
    negateProjectiles: true,
    magnetImmune: false,
    freeFlight: false,
    glide: false,
    shot: {
      damage: 3,
      speed: 540,
      pierceCount: 1,
      count: 3,
      spreadVy: 80,
      cooldownMs: 420,
      flavor: 'jelly',
      burn: false,
      // 稜片帶 prism 標記（§123）：命中複製噗即破鏡像。
      prism: true,
    },
    blinkPx: 96,
  },
  // 引力化 Gravity（§119，L27 解鎖）：虛空引拉＋星體護衛 ×3（tuck 計數）＋錨墜
  //（下砸範圍強化）＋引力井滯留牽引；方向切換抗性由 W3 消費。
  gravity: {
    ...FORM_EXT_BASE,
    nameZh: '引力化',
    tint: 0x8a6ae0,
    moveSpeedMul: 0.9,
    contactDamage: 0,
    beam: false,
    windBlade: false,
    landingImpact: false,
    slamRadiusMul: 1.8,
    chargeDash: false,
    dischargeCharges: 0,
    landingRollMs: 0,
    tuckCharges: 3,
    halveDamage: false,
    reflectProjectiles: false,
    magnetImmune: false,
    freeFlight: false,
    glide: false,
    tapStrike: 'gravity-well',
    gravityFlipImmune: true,
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

// 風刃彈規格鏡像（§119 單一發射管線）：值全數派生自 GALE_BLADE，零第二份數字。
export const GALE_SHOT: FormShotSpec = {
  damage: GALE_BLADE.damage,
  speed: GALE_BLADE.speed,
  pierceCount: GALE_BLADE.pierceCount,
  count: 1,
  spreadVy: 0,
  cooldownMs: GALE_BLADE.cooldownMs,
  flavor: 'floaty',
  burn: false,
};

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

// 雷化受擊放電反擊（§110）：實扣傷害瞬間對半徑內小怪放電，每形態期 2 次。
export const VOLT_DISCHARGE = {
  radiusPx: 120,
  damage: 1,
} as const;

// 風化滑翔（§110）：空中按住跳鍵＝緩降（下落速度帽）＋水平漂移 ×1.6。
export const GALE_GLIDE = {
  fallCapVy: 90,
  driftMul: 1.6,
} as const;

// 風化落地滾翻（§110）：落地瞬間自動免傷窗（值入 spec.landingRollMs=300）。

// 殼化受身入殼（§110）：受擊自動入殼全免＋短免傷，每形態期 1 次。
export const SHELL_TUCK = {
  invulnMs: 500,
} as const;

// 殼化滾殼衝撞（§110）：B 點按前滾衝撞；衝撞中按跳＝低弧跳保持衝撞態。
export const SHELL_CHARGE = {
  speed: 400,
  durationMs: 700,
  damage: 2,
  cooldownMs: 900,
  hopVy: -260,
} as const;

// 滑翔緩降帽（§110 純函式）：僅下落段收斂至帽值，上升段不干預。
export function glideFallVy(vy: number): number {
  return vy > GALE_GLIDE.fallCapVy ? GALE_GLIDE.fallCapVy : vy;
}

// 焰衝刺（§119）：空中跳槽位＝水平衝刺（消耗拍翅次數）；無免傷（走位換輸出）。
export const EMBER_DASH = {
  speedX: 430,
  liftVy: -110,
} as const;

// 熔岩爆（§119）：焰化落地小範圍燒灼爆（burn 結算，範圍/傷害高於風化落地衝擊）。
export const MAGMA_POP = {
  radiusPx: 70,
  damage: 2,
} as const;

// 水引（§119）：面向側域內小怪拉向玩家（B 點按，世界結算走 starCombat）。
// pullOnlyKinds＝供給味清單（PR #886 收斂）：僅補給型小怪只拉不傷（碎光命中確認），
// 其餘輕傷＋未死拉近——isInhalable 對 24 種中 17 種恆真，當判準會使潮引近乎全面零傷。
export const TIDE_PULL = {
  rangePx: 200,
  damage: 2,
  pullSpeed: 300,
  cooldownMs: 700,
  // 潮流滯留（#948）：修前單發 2 傷／0.7s CD ＝ 2.9 DPS，是四形態技唯一的異常
  // 值——焰彈 12.5、引力井 11.7、稜片 21.4。formstrike 探針量到潮化對 108+ HP
  // 魔王需 54 次施放（約 38 秒完美貼身），而形態期只有 10 秒，「優勢解」名不副實。
  // 沿引力井逐跳模式改為持續段：2 傷 ×(1+3) ＝ 8／0.7s ＝ 11.4 DPS，對齊同儕
  // 而非超越（刻意不取稜片的 21.4——潮化的價值在牽引控場，不該同時是最高輸出）。
  ticks: 3,
  tickMs: 180,
  pullOnlyKinds: ['cargo', 'ticketa', 'foamy', 'frosty', 'manta'],
} as const;

// 鏡步（§119）：空中跳槽位＝面向側短距瞬移（殘影演出，消耗拍翅次數）。
export const PRISM_STEP = {
  distancePx: 96,
} as const;

// 彩虹光束（§119）：B 長按釋放——面向側走廊貫穿判定；長按門檻沿殼盾情境同源
//（INHALE.holdThresholdMs 之上取 400ms 明確分離點按）。
export const RAINBOW_BEAM = {
  holdMs: 400,
  rangePx: 420,
  corridorHalfPx: 46,
  damage: 5,
  cooldownMs: 1100,
} as const;

// 引力井（§119）：B 點按於面向側生成滯留牽引井——初爆輕傷＋週期把域內小怪拉向井心。
export const GRAVITY_WELL = {
  offsetPx: 120,
  radiusPx: 130,
  damage: 2,
  pullSpeed: 240,
  tickMs: 200,
  ticks: 6,
  cooldownMs: 1200,
  // 懸浮魔王本體的柱狀垂直容許（#951）：井心 castY 取玩家 y，懸浮魔王恆在其上方
  // ——Gravion HOVER_Y 250 ±BOB_AMP 10 對地面玩家 y 376 即 dy ∈ [116,136]，對
  // radiusPx 130 的 2D 判定是結構性邊界超界（dy>130 時任何水平位置皆無解，命中由
  // bob 相位決定而非操作，實測 hitRate 0.2~0.33）。故本體改柱狀：水平沿 radiusPx、
  // 垂直放寬至本值。小怪維持 2D 圓域——與玩家同地平面，圓域語意正確，零回歸。
  bossColumnHalfPx: 180,
} as const;

// 觸發味 → 形態對應：gusty 吞入歸 floaty 味（§52），自然併入風化來源。
// §119 零新味裁決：焰化歸重鑽味（貨櫃丁供給）、潮化歸孢子味（潮灣三新怪供給）、
// 稜化歸流光味、引力化歸迴旋味——四新形態全數映射既有味系。
// export 供 level-audit transform probe 反查供給味（零第二份映射）。
export const FORM_BY_FLAVOR: Partial<Record<StarFlavor, TransformForm>> = {
  zappy: 'volt',
  floaty: 'gale',
  shelly: 'shell',
  drilly: 'ember',
  spora: 'tide',
  glowy: 'prism',
  boomy: 'gravity',
};

// 形態解鎖關（§119）：基礎三形態恆開；新四形態自其引入關起可用（含該關本身）。
export const FORM_INTRO_LEVEL: Partial<Record<TransformForm, number>> = {
  ember: 21,
  tide: 23,
  prism: 25,
  gravity: 27,
};

// 解鎖集派生（§119）：以「可觸及最高關」（max(當前關, 最高通關+1)）判定，
// 不動 save schema；回頭重玩早期關可沿用已解鎖形態。
export function unlockedTransformForms(highestReachableLevel: number): Set<TransformForm> {
  const unlocked = new Set<TransformForm>();
  for (const form of Object.keys(TRANSFORM_FORMS) as TransformForm[]) {
    const intro = FORM_INTRO_LEVEL[form];
    if (intro === undefined || highestReachableLevel >= intro) unlocked.add(form);
  }
  return unlocked;
}

// 形態 → 供給味反查（#953）：由 FORM_BY_FLAVOR 派生，不維護第二份映射。
// 供 consumeForTransform 以形態定位該扣哪些槽。
const FLAVOR_BY_FORM = Object.fromEntries(
  Object.entries(FORM_BY_FLAVOR).map(([flavor, form]) => [form, flavor as StarFlavor]),
) as Record<TransformForm, StarFlavor>;

export function transformFlavor(form: TransformForm): StarFlavor {
  return FLAVOR_BY_FORM[form];
}

// 變身資格（§57／#953 放寬）：**同味計數 ≥3** 即成立，不再要求整匣純度。
//
// 修前要求「彈匣全數同味且非金非混」——任一異味槽即否決，故 3 迴旋味＋2 果凍味
// 不成立。門檻寫 3 實際卻要求「零雜質」，玩家遂感受為「非得連吞不可」。改為逐味
// 統計星單位（強化槽計 2，§23 連吞合成），取達標且已解鎖者。金星不計入任何味系，
// 但**不再否決**整匣——它只是無法貢獻資格的槽。
//
// 合成星（#955）：計入其配方 pair 的**兩個來源味各 1 單位**。合成是自動觸發的
// （素頂槽遇配方夥伴即合成），修前它會把兩顆星轉成「對資格毫無貢獻」的槽——等於
// 系統無預警沒收變身進度，與 §953 放寬資格的意圖直接衝突。改為保留來源味歸屬後，
// 合成純粹是升級而非取捨，玩家不必為了湊變身而避開合成。
//
// 並列裁決（決定性）：取星單位最多者；同數時取「在彈匣中最早出現」者（自底部＝最舊），
// 使結果不依賴物件順序以外的任何狀態，e2e 與 HUD 可重現。
// unlocked（§119）：給定時未解鎖形態不列入候選；缺省不設限（既有呼叫零回歸）。
export function eligibleForm(
  magazine: readonly MagazineSlot[],
  unlocked?: ReadonlySet<TransformForm>,
): TransformForm | null {
  const units = new Map<StarFlavor, number>();
  const firstIndex = new Map<StarFlavor, number>();
  const credit = (flavor: StarFlavor, amount: number, index: number): void => {
    const form = FORM_BY_FLAVOR[flavor];
    if (!form) return;
    if (unlocked && !unlocked.has(form)) return;
    units.set(flavor, (units.get(flavor) ?? 0) + amount);
    if (!firstIndex.has(flavor)) firstIndex.set(flavor, index);
  };
  magazine.forEach((slot, index) => {
    // 金星不屬任何味系：不計入、亦不否決。
    if (slot.gold) return;
    if (slot.mix !== undefined) {
      // 合成槽歸屬雙來源味各 1 單位（#955）；合成槽恆非強化（合成分支要求素頂槽）。
      for (const flavor of getMix(slot.mix).pair) credit(flavor, 1, index);
      return;
    }
    credit(slot.flavor, slot.charged ? 2 : 1, index);
  });
  let best: { flavor: StarFlavor; units: number; index: number } | null = null;
  for (const [flavor, count] of units) {
    if (count < TRANSFORM.requiredStars) continue;
    const index = firstIndex.get(flavor) ?? 0;
    if (best === null || count > best.units || (count === best.units && index < best.index)) {
      best = { flavor, units: count, index };
    }
  }
  return best ? (FORM_BY_FLAVOR[best.flavor] ?? null) : null;
}

// 變身消耗（#948／#953 改）：自底部（最舊）扣滿 requiredStars 個星單位即止，保留
// 其餘——頂槽（下一發）優先留給玩家。強化槽計 2、不做部分消耗。
//
// #953：資格放寬後彈匣可含異味，故**只扣中選味系**的槽——修前無差別自底部扣，
// 放寬後會扣掉與本次變身無關的星（例如 [果凍,迴旋,迴旋,迴旋] 變引力化會先吃掉果凍）。
//
// #955 兩段扣除：合成星既計入資格，就必須可被消耗，否則會出現「資格成立卻扣不滿」
// 的死結。但合成星價值高於素星，故**素星優先、合成星保底**——僅在素星不足時才動。
export function consumeForTransform(
  magazine: readonly MagazineSlot[],
  form: TransformForm,
): readonly MagazineSlot[] {
  const flavor = transformFlavor(form);
  const contributesAsMix = (slot: MagazineSlot): boolean =>
    !slot.gold && slot.mix !== undefined && getMix(slot.mix).pair.includes(flavor);
  const isPlainMatch = (slot: MagazineSlot): boolean =>
    !slot.gold && slot.mix === undefined && slot.flavor === flavor;
  const doomed = new Set<number>();
  let units = 0;
  // 第一段：素星（含強化）自底部扣。
  magazine.forEach((slot, index) => {
    if (units >= TRANSFORM.requiredStars || !isPlainMatch(slot)) return;
    units += slot.charged ? 2 : 1;
    doomed.add(index);
  });
  // 第二段：素星不足時才動合成星（各計 1 單位）。
  magazine.forEach((slot, index) => {
    if (units >= TRANSFORM.requiredStars || !contributesAsMix(slot)) return;
    units += 1;
    doomed.add(index);
  });
  return magazine.filter((_, index) => !doomed.has(index));
}

export interface TransformState {
  form: TransformForm | null;
  remainingMs: number;
  // 每形態期防禦計數（§110）：雷化放電反擊剩餘次數／殼化受身入殼剩餘次數。
  dischargeLeft: number;
  tuckLeft: number;
}

export function createTransformState(): TransformState {
  return { form: null, remainingMs: 0, dischargeLeft: 0, tuckLeft: 0 };
}

export function startTransform(form: TransformForm): TransformState {
  const spec = TRANSFORM_FORMS[form];
  return {
    form,
    remainingMs: TRANSFORM.durationMs,
    dischargeLeft: spec.dischargeCharges,
    tuckLeft: spec.tuckCharges,
  };
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
  return { state: { ...state, remainingMs }, expired: false };
}

// 雷化放電反擊裁決（§110）：僅雷化且有剩餘次數時觸發；觸發即扣次。
export function consumeDischarge(state: TransformState): {
  state: TransformState;
  triggered: boolean;
} {
  if (state.form !== 'volt' || state.dischargeLeft <= 0) return { state, triggered: false };
  return { state: { ...state, dischargeLeft: state.dischargeLeft - 1 }, triggered: true };
}

// 護體裁決（§110 受身入殼→§119 泛化）：殼化受身入殼／潮化泡泡護盾／引力化星體護衛
// 共用 tuck 計數——有剩餘次數即觸發、扣次、本次傷害全免；次數由 spec.tuckCharges 種入。
export function consumeTuck(state: TransformState): {
  state: TransformState;
  triggered: boolean;
} {
  if (!state.form || state.tuckLeft <= 0) return { state, triggered: false };
  return { state: { ...state, tuckLeft: state.tuckLeft - 1 }, triggered: true };
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
