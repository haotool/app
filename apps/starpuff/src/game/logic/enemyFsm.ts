// 新怪時序狀態機純邏輯（GAME_DESIGN §30，不 import phaser），vitest 對象。
// 時序常數依 bossFsm 慣例由本模組持有（§30 SSOT）；呈現層速度/著色留在 enemies.ts。

// 殼殼 Shelly 三態：巡邏 walk →（首發受擊）→ 縮殼旋轉 spin 1.5s（無敵）→ 暈眩 stun 1.6s
// （可吸/可擊殺）→ 復原 walk。
// #811：暈眩窗 1.0s→1.6s——正確時機吞食成功率 11% 遠低於門檻 60%，執行窗過短為根因。
export const SHELLY_FSM = {
  spinMs: 1500,
  stunMs: 1600,
} as const;

export type ShellyState = 'walk' | 'spin' | 'stun';

export interface ShellyTick {
  state: ShellyState;
  stateMs: number;
  // 本 tick 發生的轉移目標；呈現層據此執行進場動作（停速/著色/復原外觀）。
  entered: ShellyState | null;
}

export function tickShelly(state: ShellyState, stateMs: number, deltaMs: number): ShellyTick {
  const next = stateMs + deltaMs;
  if (state === 'spin' && next >= SHELLY_FSM.spinMs)
    return { state: 'stun', stateMs: 0, entered: 'stun' };
  if (state === 'stun' && next >= SHELLY_FSM.stunMs)
    return { state: 'walk', stateMs: 0, entered: 'walk' };
  return { state, stateMs: next, entered: null };
}

// 受擊決策（§30 HP 2 段）：walk 首發轉縮殼（不扣血）、spin 期無敵、stun 期正常結算。
export type ShellyHitOutcome = 'enter-spin' | 'immune' | 'vulnerable';

export function resolveShellyHit(state: ShellyState): ShellyHitOutcome {
  if (state === 'spin') return 'immune';
  return state === 'walk' ? 'enter-spin' : 'vulnerable';
}

// 雷雷 Zappy 放電週期：每 3s 放電（discharge 當 tick 計時歸零重啟週期）、
// 末段 0.5s 前搖 windup（定身 + 80ms 明暗交替閃爍預警）、其餘時間 chase 追蹤。
export const ZAPPY_FSM = {
  intervalMs: 3000,
  windupMs: 500,
  flickerMs: 80,
} as const;

export type ZappyPhase = 'chase' | 'windup' | 'discharge';

export interface ZappyTick {
  zapMs: number;
  phase: ZappyPhase;
  // windup 期閃爍亮暗：true 亮白、false 暗黃；其餘相位恆 false。
  flickerBright: boolean;
}

export function tickZappy(zapMs: number, deltaMs: number): ZappyTick {
  const next = zapMs + deltaMs;
  if (next >= ZAPPY_FSM.intervalMs) return { zapMs: 0, phase: 'discharge', flickerBright: false };
  if (next >= ZAPPY_FSM.intervalMs - ZAPPY_FSM.windupMs) {
    return {
      zapMs: next,
      phase: 'windup',
      flickerBright: Math.floor(next / ZAPPY_FSM.flickerMs) % 2 === 0,
    };
  }
  return { zapMs: next, phase: 'chase', flickerBright: false };
}

// 鑽地者 Drilly 三態（§47）：潛地 burrow 2.2s（僅露鰭移動，不可吸不可傷）→
// 前搖 windup 0.5s（定點抖動 + 落點預警）→ 破土 surfaced 1.4s（躍出攻擊，可吸可傷）→ 回潛。
export const DRILLY_FSM = {
  burrowMs: 2200,
  windupMs: 500,
  surfacedMs: 1400,
} as const;

export type DrillyState = 'burrow' | 'windup' | 'surfaced';

export interface DrillyTick {
  state: DrillyState;
  stateMs: number;
  entered: DrillyState | null;
}

export function tickDrilly(state: DrillyState, stateMs: number, deltaMs: number): DrillyTick {
  const next = stateMs + deltaMs;
  if (state === 'burrow' && next >= DRILLY_FSM.burrowMs)
    return { state: 'windup', stateMs: 0, entered: 'windup' };
  if (state === 'windup' && next >= DRILLY_FSM.windupMs)
    return { state: 'surfaced', stateMs: 0, entered: 'surfaced' };
  if (state === 'surfaced' && next >= DRILLY_FSM.surfacedMs)
    return { state: 'burrow', stateMs: 0, entered: 'burrow' };
  return { state, stateMs: next, entered: null };
}

// 受擊決策（§47）：潛地/前搖免傷（半入地），破土窗正常結算。
export type DrillyHitOutcome = 'immune' | 'vulnerable';

export function resolveDrillyHit(state: DrillyState): DrillyHitOutcome {
  return state === 'surfaced' ? 'vulnerable' : 'immune';
}

// 提燈者 Glowy 週期（§47）：緩慢漂浮 drift → 末段 0.9s 預警圈擴張 windup
// （progress 0..1 供呈現層畫圈）→ 週期滿釋放範圍脈衝 pulse（半徑 80，走 hazards 管線）。
export const GLOWY_FSM = {
  intervalMs: 4000,
  windupMs: 900,
  pulseRadiusPx: 80,
} as const;

export type GlowyPhase = 'drift' | 'windup' | 'pulse';

export interface GlowyTick {
  glowMs: number;
  phase: GlowyPhase;
  // windup 期預警圈擴張進度 0..1；其餘相位恆 0。
  progress: number;
}

export function tickGlowy(glowMs: number, deltaMs: number): GlowyTick {
  const next = glowMs + deltaMs;
  if (next >= GLOWY_FSM.intervalMs) return { glowMs: 0, phase: 'pulse', progress: 0 };
  const windupStart = GLOWY_FSM.intervalMs - GLOWY_FSM.windupMs;
  if (next >= windupStart) {
    return { glowMs: next, phase: 'windup', progress: (next - windupStart) / GLOWY_FSM.windupMs };
  }
  return { glowMs: next, phase: 'drift', progress: 0 };
}

// 孢子菇 Spora 週期（§52）：定點紮根 idle → 末段 0.7s 預警圈擴張 windup → 週期滿向上
// 噴孢子雲 burst（雲滯留 cloudMs 區域拒止，走 hazards 管線）；沿 glowy 單計時器模式。
export const SPORA_FSM = {
  intervalMs: 3600,
  windupMs: 700,
  cloudMs: 1600,
  cloudRadiusPx: 66,
  cloudOffsetY: -64,
} as const;

export type SporaPhase = 'idle' | 'windup' | 'burst';

export interface SporaTick {
  sporaMs: number;
  phase: SporaPhase;
  // windup 期預警擴張進度 0..1；其餘相位恆 0。
  progress: number;
}

export function tickSpora(sporaMs: number, deltaMs: number): SporaTick {
  const next = sporaMs + deltaMs;
  if (next >= SPORA_FSM.intervalMs) return { sporaMs: 0, phase: 'burst', progress: 0 };
  const windupStart = SPORA_FSM.intervalMs - SPORA_FSM.windupMs;
  if (next >= windupStart) {
    return { sporaMs: next, phase: 'windup', progress: (next - windupStart) / SPORA_FSM.windupMs };
  }
  return { sporaMs: next, phase: 'idle', progress: 0 };
}

// 風飄鳥 Gusty 四態（§52）：水平漂移 drift →（玩家進觸發域）→ 前搖 windup 0.5s（懸停
// 抖動）→ 俯衝 dive 0.6s（朝鎖定點高速撲擊）→ 回升 recover →（時滿且回抵航高）→ drift。
// #832：recover→drift 需 atBaseY 成立（比照 cometa #822）——純時間切換會讓深俯衝後
// 自低空直接再漂移，貼地壓迫玩家。
export const GUSTY_FSM = {
  windupMs: 500,
  diveMs: 600,
  recoverMs: 900,
  triggerRangePx: 200,
  diveSpeed: 340,
  // 側風（§52）：drift 期近域對玩家的水平位移推移（positional drift，不與速度控制器對抗）。
  windRangeX: 130,
  windRangeY: 90,
  windDriftPxPerSec: 60,
} as const;

export type GustyState = 'drift' | 'windup' | 'dive' | 'recover';

export interface GustyTick {
  state: GustyState;
  stateMs: number;
  entered: GustyState | null;
}

export function tickGusty(
  state: GustyState,
  stateMs: number,
  deltaMs: number,
  shouldDive: boolean,
  atBaseY: boolean,
): GustyTick {
  const next = stateMs + deltaMs;
  if (state === 'drift' && shouldDive) return { state: 'windup', stateMs: 0, entered: 'windup' };
  if (state === 'windup' && next >= GUSTY_FSM.windupMs)
    return { state: 'dive', stateMs: 0, entered: 'dive' };
  if (state === 'dive' && next >= GUSTY_FSM.diveMs)
    return { state: 'recover', stateMs: 0, entered: 'recover' };
  if (state === 'recover' && next >= GUSTY_FSM.recoverMs && atBaseY)
    return { state: 'drift', stateMs: 0, entered: 'drift' };
  return { state, stateMs: next, entered: null };
}

// 側風推移方向（§52）：drift 期玩家位於作用域內時，被推離 gusty 的水平方向；域外為 0。
export function gustWindPush(
  playerX: number,
  playerY: number,
  gustyX: number,
  gustyY: number,
): -1 | 0 | 1 {
  if (Math.abs(playerX - gustyX) > GUSTY_FSM.windRangeX) return 0;
  if (Math.abs(playerY - gustyY) > GUSTY_FSM.windRangeY) return 0;
  return playerX < gustyX ? -1 : 1;
}

// 迴力殼 Boomy 四態（§52）：巡邏 walk → 週期滿前搖 windup 0.5s（定身舉殼）→ 投擲 throw
//（生成迴旋殼刃，去而復返雙判定）→ 冷卻 cool 1.4s → walk。
// 殼刃彈道：去程 360×0.8/2 ≈ 144px；壽命 2×turnMs＋緩衝，逾時必回收（anti-softlock）。
export const BOOMY_FSM = {
  walkMs: 2200,
  windupMs: 500,
  coolMs: 1400,
  shellSpeed: 360,
  shellTurnMs: 800,
  shellLifeMs: 2000,
} as const;

export type BoomyState = 'walk' | 'windup' | 'throw' | 'cool';

export interface BoomyTick {
  state: BoomyState;
  stateMs: number;
  entered: BoomyState | null;
}

export function tickBoomy(state: BoomyState, stateMs: number, deltaMs: number): BoomyTick {
  const next = stateMs + deltaMs;
  if (state === 'walk' && next >= BOOMY_FSM.walkMs)
    return { state: 'windup', stateMs: 0, entered: 'windup' };
  if (state === 'windup' && next >= BOOMY_FSM.windupMs)
    return { state: 'throw', stateMs: 0, entered: 'throw' };
  // throw 為單幀事件態：呈現層生成殼刃後即入冷卻。
  if (state === 'throw') return { state: 'cool', stateMs: 0, entered: 'cool' };
  if (state === 'cool' && next >= BOOMY_FSM.coolMs)
    return { state: 'walk', stateMs: 0, entered: 'walk' };
  return { state, stateMs: next, entered: null };
}

// 磁極獸 Magno 週期（§59）：緩行 idle → 末段前搖 windup 0.7s（預警圈擴張）→ 磁場 field
// 1.9s（吸偏玩家飛行中星彈＋星彈免傷殼面，鼓勵近戰/下砸/變身應對）→ 回 idle。
export const MAGNO_FSM = {
  idleMs: 2400,
  windupMs: 700,
  fieldMs: 1900,
  fieldRadiusPx: 150,
  pullAccelPxPerSec2: 1500,
} as const;

export type MagnoPhase = 'idle' | 'windup' | 'field';

export interface MagnoTick {
  magnoMs: number;
  phase: MagnoPhase;
  // windup 期預警擴張進度 0..1；其餘相位恆 0。
  progress: number;
}

export function tickMagno(magnoMs: number, deltaMs: number): MagnoTick {
  const total = MAGNO_FSM.idleMs + MAGNO_FSM.windupMs + MAGNO_FSM.fieldMs;
  const next = magnoMs + deltaMs;
  if (next >= total) return { magnoMs: 0, phase: 'idle', progress: 0 };
  if (next >= MAGNO_FSM.idleMs + MAGNO_FSM.windupMs) {
    return { magnoMs: next, phase: 'field', progress: 0 };
  }
  if (next >= MAGNO_FSM.idleMs) {
    return {
      magnoMs: next,
      phase: 'windup',
      progress: (next - MAGNO_FSM.idleMs) / MAGNO_FSM.windupMs,
    };
  }
  return { magnoMs: next, phase: 'idle', progress: 0 };
}

// 星彈受擊決策（§59）：磁場期星彈被磁殼吸附失效（僅星彈；下砸/波及照常結算）。
export type MagnoStarHitOutcome = 'immune' | 'vulnerable';

export function resolveMagnoStarHit(phase: MagnoPhase): MagnoStarHitOutcome {
  return phase === 'field' ? 'immune' : 'vulnerable';
}

// 磁場吸偏（§59）：域內星彈速度向磁極獸逐幀彎折；域外或重合不動。純函式供 vitest。
export function magnetPull(
  starX: number,
  starY: number,
  vx: number,
  vy: number,
  magnoX: number,
  magnoY: number,
  deltaMs: number,
): { vx: number; vy: number } {
  const dx = magnoX - starX;
  const dy = magnoY - starY;
  const dist = Math.hypot(dx, dy);
  if (dist === 0 || dist > MAGNO_FSM.fieldRadiusPx) return { vx, vy };
  const accel = (MAGNO_FSM.pullAccelPxPerSec2 * deltaMs) / 1000;
  return { vx: vx + (dx / dist) * accel, vy: vy + (dy / dist) * accel };
}

// 鏡面蟲 Mirri 三態（§59）：巡邏 roam 2.4s（末段 0.4s 鏡面預告閃爍）→ 鏡面 mirror 1.5s
//（反射玩家星彈為傷害彈）→ 冷卻 cool 1.1s（黯淡明確可打）→ roam。
export const MIRRI_FSM = {
  roamMs: 2400,
  preflickerMs: 400,
  mirrorMs: 1500,
  coolMs: 1100,
  flickerMs: 90,
  reflectSpeed: 300,
  reflectLifeMs: 1400,
} as const;

export type MirriState = 'roam' | 'mirror' | 'cool';

export interface MirriTick {
  state: MirriState;
  stateMs: number;
  entered: MirriState | null;
  // roam 末段鏡面預告：true 亮銀、false 原色；其餘相位恆 false。
  flickerBright: boolean;
}

export function tickMirri(state: MirriState, stateMs: number, deltaMs: number): MirriTick {
  const next = stateMs + deltaMs;
  if (state === 'roam' && next >= MIRRI_FSM.roamMs) {
    return { state: 'mirror', stateMs: 0, entered: 'mirror', flickerBright: false };
  }
  if (state === 'mirror' && next >= MIRRI_FSM.mirrorMs) {
    return { state: 'cool', stateMs: 0, entered: 'cool', flickerBright: false };
  }
  if (state === 'cool' && next >= MIRRI_FSM.coolMs) {
    return { state: 'roam', stateMs: 0, entered: 'roam', flickerBright: false };
  }
  const flickerBright =
    state === 'roam' &&
    next >= MIRRI_FSM.roamMs - MIRRI_FSM.preflickerMs &&
    Math.floor(next / MIRRI_FSM.flickerMs) % 2 === 0;
  return { state, stateMs: next, entered: null, flickerBright };
}

// 星彈受擊決策（§59）：鏡面態反射（反射彈有傷害）；其餘照常結算。
export type MirriStarHitOutcome = 'reflect' | 'vulnerable';

export function resolveMirriStarHit(state: MirriState): MirriStarHitOutcome {
  return state === 'mirror' ? 'reflect' : 'vulnerable';
}

// 焦糖泡 Bubbla 四態（§73）：糖漿中潛伏 submerged（僅露頂，不可吸不可傷）→ 漣漪前搖
// ripple 0.6s（telegraph）→ 拋物躍出 leap（頂點滯空 0.4s，可吸可傷窗）→ 回潛 dive。
export const BUBBLA_FSM = {
  submergedMs: 2200,
  rippleMs: 600,
  // leap = 上升 0.5s ＋ 頂點滯空 0.4s ＋ 下落 0.5s。
  leapMs: 1400,
  leapRiseMs: 500,
  leapHangMs: 400,
  leapHeightPx: 96,
  diveMs: 500,
} as const;

export type BubblaState = 'submerged' | 'ripple' | 'leap' | 'dive';

export interface BubblaTick {
  state: BubblaState;
  stateMs: number;
  entered: BubblaState | null;
}

// speedMul（§48 精英倍率）：僅縮短潛伏期提高躍出頻率；telegraph（漣漪）與
// 躍出窗時長不縮，維持可讀性與可吸窗公平（審查修復）。
export function tickBubbla(
  state: BubblaState,
  stateMs: number,
  deltaMs: number,
  speedMul = 1,
): BubblaTick {
  const next = stateMs + deltaMs;
  if (state === 'submerged' && next >= BUBBLA_FSM.submergedMs / speedMul)
    return { state: 'ripple', stateMs: 0, entered: 'ripple' };
  if (state === 'ripple' && next >= BUBBLA_FSM.rippleMs)
    return { state: 'leap', stateMs: 0, entered: 'leap' };
  if (state === 'leap' && next >= BUBBLA_FSM.leapMs)
    return { state: 'dive', stateMs: 0, entered: 'dive' };
  if (state === 'dive' && next >= BUBBLA_FSM.diveMs)
    return { state: 'submerged', stateMs: 0, entered: 'submerged' };
  return { state, stateMs: next, entered: null };
}

// 受擊決策（§73）：僅躍出窗正常結算，其餘半潛免傷（沿 drilly 慣例）。
export type BubblaHitOutcome = 'immune' | 'vulnerable';

export function resolveBubblaHit(state: BubblaState): BubblaHitOutcome {
  return state === 'leap' ? 'vulnerable' : 'immune';
}

// 躍出拋物高度（相對潛伏基準的位移，負值向上）：升坡→頂點滯空→落坡，純函式供呈現層。
export function bubblaLeapOffsetY(leapMs: number): number {
  const { leapRiseMs, leapHangMs, leapMs: totalMs, leapHeightPx } = BUBBLA_FSM;
  const clamped = Math.max(0, Math.min(leapMs, totalMs));
  if (clamped <= leapRiseMs) {
    const progress = clamped / leapRiseMs;
    // easeOut 升坡：起跳快、近頂緩；+0 防 -0 汙染呼叫端比較。
    return -leapHeightPx * (1 - (1 - progress) * (1 - progress)) + 0;
  }
  if (clamped <= leapRiseMs + leapHangMs) return -leapHeightPx;
  const fallMs = totalMs - leapRiseMs - leapHangMs;
  const progress = (clamped - leapRiseMs - leapHangMs) / fallMs;
  // easeIn 落坡：離頂緩、落地快；+0 防 -0 汙染呼叫端比較。
  return -leapHeightPx * (1 - progress * progress) + 0;
}

// 熔糖投手 Splatta 四態（§73）：緩走 patrol → 舉勺瞄準 aim 0.5s → 投擲 lob（單幀事件態，
// 呈現層生成拋物糖球；落地留 1.2s 灼燙糖斑走 hazards 管線）→ 冷卻 cool 1.6s → patrol。
export const SPLATTA_FSM = {
  patrolMs: 2400,
  aimMs: 500,
  coolMs: 1600,
  walkSpeed: 55,
  // 拋物糖球初速與壽命（逾時必回收，anti-softlock §56）。
  blobSpeedX: 180,
  blobSpeedY: -320,
  blobLifeMs: 2400,
  // 灼燙糖斑滯留時長與尺寸。
  spotMs: 1200,
  spotRadiusPx: 26,
} as const;

export type SplattaState = 'patrol' | 'aim' | 'lob' | 'cool';

export interface SplattaTick {
  state: SplattaState;
  stateMs: number;
  entered: SplattaState | null;
}

// speedMul（§48 精英倍率）：縮短巡邏與冷卻提高拋射頻率；舉勺前搖（telegraph）
// 不縮，維持可讀性（審查修復）。
export function tickSplatta(
  state: SplattaState,
  stateMs: number,
  deltaMs: number,
  speedMul = 1,
): SplattaTick {
  const next = stateMs + deltaMs;
  if (state === 'patrol' && next >= SPLATTA_FSM.patrolMs / speedMul)
    return { state: 'aim', stateMs: 0, entered: 'aim' };
  if (state === 'aim' && next >= SPLATTA_FSM.aimMs)
    return { state: 'lob', stateMs: 0, entered: 'lob' };
  // lob 為單幀事件態：呈現層生成糖球後即入冷卻（沿 boomy throw 慣例）。
  if (state === 'lob') return { state: 'cool', stateMs: 0, entered: 'cool' };
  if (state === 'cool' && next >= SPLATTA_FSM.coolMs / speedMul)
    return { state: 'patrol', stateMs: 0, entered: 'patrol' };
  return { state, stateMs: next, entered: null };
}

// 星屑幽靈 Twinkla 三態（§80）：虛化 phased 2.0s（半透明、不可吸不可傷、穿身無害）→
// 星光聚攏前搖 shimmer 0.5s（telegraph）→ 實體 solid 1.8s（緩慢追飄，可吸可傷窗）→ 回虛化。
export const TWINKLA_FSM = {
  phasedMs: 2000,
  shimmerMs: 500,
  solidMs: 1800,
  driftSpeed: 30,
  chaseSpeed: 60,
} as const;

export type TwinklaState = 'phased' | 'shimmer' | 'solid';

export interface TwinklaTick {
  state: TwinklaState;
  stateMs: number;
  entered: TwinklaState | null;
}

// speedMul（§48 精英倍率）：僅縮短虛化期提高現身頻率（星屑幽長 ×1.4）；
// telegraph（shimmer）與實體窗時長不縮，維持可讀性與可吸窗公平（沿 bubbla 慣例）。
export function tickTwinkla(
  state: TwinklaState,
  stateMs: number,
  deltaMs: number,
  speedMul = 1,
): TwinklaTick {
  const next = stateMs + deltaMs;
  if (state === 'phased' && next >= TWINKLA_FSM.phasedMs / speedMul)
    return { state: 'shimmer', stateMs: 0, entered: 'shimmer' };
  if (state === 'shimmer' && next >= TWINKLA_FSM.shimmerMs)
    return { state: 'solid', stateMs: 0, entered: 'solid' };
  if (state === 'solid' && next >= TWINKLA_FSM.solidMs)
    return { state: 'phased', stateMs: 0, entered: 'phased' };
  return { state, stateMs: next, entered: null };
}

// 受擊決策（§80）：僅實體窗正常結算，虛化/前搖穿身免傷（沿 drilly 慣例）。
export type TwinklaHitOutcome = 'immune' | 'vulnerable';

export function resolveTwinklaHit(state: TwinklaState): TwinklaHitOutcome {
  return state === 'solid' ? 'vulnerable' : 'immune';
}

// 彗尾飛魚 Cometa 四態（§80）：高處巡游 glide →（玩家進觸發域）→ 鎖定前搖 lock 0.55s
//（閃爍，鎖定後不修正）→ 斜向俯衝 dash 0.6s（420px/s，沿路拖 damaging 彗尾）→
// 回升 recover →（時滿且回抵航高 baseY）→ glide。恆可吸（疾風味）。
// #822：切回 glide 需 atBaseY 成立——純時間切換會讓深俯衝後自低空直接再俯衝，
// 壓縮 telegraph 迴避窗。
export const COMETA_FSM = {
  lockMs: 550,
  dashMs: 600,
  recoverMs: 900,
  triggerRangePx: 230,
  dashSpeed: 420,
  // 彗尾段生成節拍與壽命（走 hazards 管線，逾時必回收 §56）。
  tailIntervalMs: 90,
  tailLifeMs: 500,
} as const;

export type CometaState = 'glide' | 'lock' | 'dash' | 'recover';

export interface CometaTick {
  state: CometaState;
  stateMs: number;
  entered: CometaState | null;
}

export function tickCometa(
  state: CometaState,
  stateMs: number,
  deltaMs: number,
  shouldDash: boolean,
  atBaseY: boolean,
): CometaTick {
  const next = stateMs + deltaMs;
  if (state === 'glide' && shouldDash) return { state: 'lock', stateMs: 0, entered: 'lock' };
  if (state === 'lock' && next >= COMETA_FSM.lockMs)
    return { state: 'dash', stateMs: 0, entered: 'dash' };
  if (state === 'dash' && next >= COMETA_FSM.dashMs)
    return { state: 'recover', stateMs: 0, entered: 'recover' };
  if (state === 'recover' && next >= COMETA_FSM.recoverMs && atBaseY)
    return { state: 'glide', stateMs: 0, entered: 'glide' };
  return { state, stateMs: next, entered: null };
}

// 迴旋彈道（§52/§53 共用）：去程勻減速、turnMs 折返點反向，2×turnMs 回到原點等速；
// 敵方殼刃與玩家迴旋星同走此純函式，回程亦有判定。
export function boomerangVelocity(
  elapsedMs: number,
  directionX: 1 | -1,
  speed: number,
  turnMs: number,
): number {
  const progress = Math.max(-1, 1 - elapsedMs / turnMs);
  return speed * directionX * progress;
}

// 迴旋彈體逐幀驅動（§52 殼刃／§53 迴旋星單一實作）：推進計時並寫入水平速度，
// 回傳推進後計時；壽命裁決與自旋留在呼叫端。body 以結構型別注入，維持 logic 層零 phaser。
export interface BoomerangBody {
  setVelocityX(value: number): unknown;
}

export function tickBoomerangBody(
  body: BoomerangBody,
  boomMs: number,
  directionX: 1 | -1,
  speed: number,
  turnMs: number,
  deltaMs: number,
): number {
  const next = boomMs + deltaMs;
  body.setVelocityX(boomerangVelocity(next, directionX, speed, turnMs));
  return next;
}

// ===== §120 星海終局篇新怪 =====

// 貨櫃丁 Cargo：緩推巡邏（週期折返＋碰牆 bounce 反彈）——形態練習區留駐供給
//（遠域純週期折返不長程漂移，drillSpawns 保證同系供給不散場）；玩家入近域
// 才緩推逼近（aggro）——供給會送上門，變身觸發密度契約的供給節奏由此承擔。
export const CARGO_FSM = {
  walkSpeed: 45,
  flipMs: 2600,
  aggroRangePx: 900,
} as const;

// 巡邏方向（純函式）：週期折返；牆面反彈由 body.bounce 承擔。
export function cargoPatrolDirection(cycleMs: number): 1 | -1 {
  return Math.floor(cycleMs / CARGO_FSM.flipMs) % 2 === 0 ? 1 : -1;
}

// 票券蝠 Ticketa：雙軌飛行——fly 期沿當前軌帶漂移，尾段由呈現層 WARN 預警承載
// 可讀前搖（finaleEnemies TICKETA_WARN_MS 懸停＋閃爍 telegraph，#899/#904）；
// shift＝換軌俯掠位移本身（穿越玩家空域即攻擊語彙），非前搖，無投射物。
export const TICKETA_FSM = {
  flyMs: 2400,
  shiftMs: 600,
  bandHighY: 190,
  bandLowY: 300,
  flySpeed: 90,
  shiftSpeed: 260,
} as const;

export type TicketaState = 'fly' | 'shift';

export interface TicketaTick {
  state: TicketaState;
  stateMs: number;
  entered: TicketaState | null;
}

export function tickTicketa(state: TicketaState, stateMs: number, deltaMs: number): TicketaTick {
  const next = stateMs + deltaMs;
  if (state === 'fly' && next >= TICKETA_FSM.flyMs)
    return { state: 'shift', stateMs: 0, entered: 'shift' };
  if (state === 'shift' && next >= TICKETA_FSM.shiftMs)
    return { state: 'fly', stateMs: 0, entered: 'fly' };
  return { state, stateMs: next, entered: null };
}

// 掃描眼 Scanna：定點懸浮掃描 scan → 鎖定 aim 0.8s（telegraph 掃描線漸亮，鎖定後不修正）
// → 直線光 fire（單幀事件態，光束走 hazards 管線）→ 冷卻 cool → scan。不可吸（掩體/殼盾反制）。
export const SCANNA_FSM = {
  scanMs: 2600,
  aimMs: 800,
  coolMs: 1400,
  beamLengthPx: 320,
  beamLifeMs: 350,
} as const;

export type ScannaState = 'scan' | 'aim' | 'fire' | 'cool';

export interface ScannaTick {
  state: ScannaState;
  stateMs: number;
  entered: ScannaState | null;
}

export function tickScanna(state: ScannaState, stateMs: number, deltaMs: number): ScannaTick {
  const next = stateMs + deltaMs;
  if (state === 'scan' && next >= SCANNA_FSM.scanMs)
    return { state: 'aim', stateMs: 0, entered: 'aim' };
  if (state === 'aim' && next >= SCANNA_FSM.aimMs)
    return { state: 'fire', stateMs: 0, entered: 'fire' };
  // fire 為單幀事件態：呈現層生成光束後即入冷卻（沿 boomy throw 慣例）。
  if (state === 'fire') return { state: 'cool', stateMs: 0, entered: 'cool' };
  if (state === 'cool' && next >= SCANNA_FSM.coolMs)
    return { state: 'scan', stateMs: 0, entered: 'scan' };
  return { state, stateMs: next, entered: null };
}

// 泡泡機 Foamy：定點吐泡——idle → windup 0.6s（telegraph 鼓脹抖動）→ spit（單幀事件態，
// 吐漂浮泡泡走 hazards 管線；泡泡不傷人、觸碰使玩家上浮，潮化免疫）→ cool → idle。
export const FOAMY_FSM = {
  idleMs: 2200,
  windupMs: 600,
  coolMs: 900,
  bubbleSpeedX: 70,
  bubbleRiseVy: -36,
  bubbleLifeMs: 2600,
  bubbleLiftVy: -300,
} as const;

export type FoamyState = 'idle' | 'windup' | 'spit' | 'cool';

export interface FoamyTick {
  state: FoamyState;
  stateMs: number;
  entered: FoamyState | null;
}

export function tickFoamy(state: FoamyState, stateMs: number, deltaMs: number): FoamyTick {
  const next = stateMs + deltaMs;
  if (state === 'idle' && next >= FOAMY_FSM.idleMs)
    return { state: 'windup', stateMs: 0, entered: 'windup' };
  if (state === 'windup' && next >= FOAMY_FSM.windupMs)
    return { state: 'spit', stateMs: 0, entered: 'spit' };
  if (state === 'spit') return { state: 'cool', stateMs: 0, entered: 'cool' };
  if (state === 'cool' && next >= FOAMY_FSM.coolMs)
    return { state: 'idle', stateMs: 0, entered: 'idle' };
  return { state, stateMs: next, entered: null };
}

// 冰史萊姆 Frosty：冰面滑行（恆速滑動＋碰牆反彈）；受擊分裂——本體被擊殺分裂為
// 兩隻迷你體（不再分裂），焰系 burn 命中即熔解不分裂（§119 燒毀優勢）。
export const FROSTY_FSM = {
  slideSpeed: 120,
  miniScale: 0.65,
  splitCount: 2,
  splitVx: 90,
} as const;

// 分裂裁決（純函式）：迷你體與 burn 擊殺不分裂。
export function resolveFrostySplit(burn: boolean, mini: boolean): boolean {
  return !burn && !mini;
}

// 潮汐魟 Manta：低空巡游 cruise → 鎖定 aim 0.65s（telegraph）→ 扇形水刃 volley
//（單幀事件態，三發扇形走 hazards 管線）→ 冷卻 cool → cruise。
export const MANTA_FSM = {
  cruiseMs: 2600,
  aimMs: 650,
  coolMs: 1100,
  cruiseSpeed: 75,
  bladeSpeed: 220,
  bladeLifeMs: 1500,
  bladeFanVy: 70,
} as const;

export type MantaState = 'cruise' | 'aim' | 'volley' | 'cool';

export interface MantaTick {
  state: MantaState;
  stateMs: number;
  entered: MantaState | null;
}

export function tickManta(state: MantaState, stateMs: number, deltaMs: number): MantaTick {
  const next = stateMs + deltaMs;
  if (state === 'cruise' && next >= MANTA_FSM.cruiseMs)
    return { state: 'aim', stateMs: 0, entered: 'aim' };
  if (state === 'aim' && next >= MANTA_FSM.aimMs)
    return { state: 'volley', stateMs: 0, entered: 'volley' };
  if (state === 'volley') return { state: 'cool', stateMs: 0, entered: 'cool' };
  if (state === 'cool' && next >= MANTA_FSM.coolMs)
    return { state: 'cruise', stateMs: 0, entered: 'cruise' };
  return { state, stateMs: next, entered: null };
}

// ===== §123 星海終局篇 W3 新怪 =====

// 複製噗 Copypuff：鏡像模仿玩家水平動作（照鏡子——玩家位移取反向套用）；不可吸。
// 稜化攻擊（prism 旗標）命中 → 破鏡像 broken（停走可打窗，行為解除非免傷——
// 基礎星彈恆可正常擊殺，破鏡像是優勢解非必需解）。
export const COPYPUFF_FSM = {
  brokenMs: 1400,
  // 鏡像位移倍率：玩家逐幀位移 × 倍率反向套用（positional，不與重力對抗）。
  mirrorMul: 0.9,
  maxMirrorPxPerFrame: 8,
} as const;

export type CopypuffState = 'mimic' | 'broken';

export interface CopypuffTick {
  state: CopypuffState;
  stateMs: number;
  entered: CopypuffState | null;
}

export function tickCopypuff(state: CopypuffState, stateMs: number, deltaMs: number): CopypuffTick {
  const next = stateMs + deltaMs;
  if (state === 'broken' && next >= COPYPUFF_FSM.brokenMs)
    return { state: 'mimic', stateMs: 0, entered: 'mimic' };
  return { state, stateMs: next, entered: null };
}

// 鏡像水平位移（純函式）：玩家位移反向 × 倍率，單幀夾限防瞬移；+0 防 -0 汙染
// 呼叫端比較（沿 bubblaLeapOffsetY 慣例）。
export function copypuffMirrorDx(playerDx: number): number {
  const mirrored = -playerDx * COPYPUFF_FSM.mirrorMul;
  return (
    Math.max(
      -COPYPUFF_FSM.maxMirrorPxPerFrame,
      Math.min(COPYPUFF_FSM.maxMirrorPxPerFrame, mirrored),
    ) + 0
  );
}

// 稜蜂 Prismbee：懸浮巡飛 hover → 鎖定 aim 0.7s（telegraph 閃爍）→ 直線衝刺 dart →
// 冷卻 cool → hover。正面反射直線星彈（面向側命中）、側背面脆弱；死亡射三彩色碎片。
export const PRISMBEE_FSM = {
  hoverMs: 2400,
  aimMs: 700,
  dartMs: 500,
  coolMs: 1100,
  hoverSpeed: 70,
  dartSpeed: 330,
  // 死亡三彩碎片（走 hazards 管線，逾時必回收 §56）。
  shardSpeed: 240,
  shardLifeMs: 900,
  shardFanVy: 90,
} as const;

export type PrismbeeState = 'hover' | 'aim' | 'dart' | 'cool';

export interface PrismbeeTick {
  state: PrismbeeState;
  stateMs: number;
  entered: PrismbeeState | null;
}

export function tickPrismbee(state: PrismbeeState, stateMs: number, deltaMs: number): PrismbeeTick {
  const next = stateMs + deltaMs;
  if (state === 'hover' && next >= PRISMBEE_FSM.hoverMs)
    return { state: 'aim', stateMs: 0, entered: 'aim' };
  if (state === 'aim' && next >= PRISMBEE_FSM.aimMs)
    return { state: 'dart', stateMs: 0, entered: 'dart' };
  if (state === 'dart' && next >= PRISMBEE_FSM.dartMs)
    return { state: 'cool', stateMs: 0, entered: 'cool' };
  if (state === 'cool' && next >= PRISMBEE_FSM.coolMs)
    return { state: 'hover', stateMs: 0, entered: 'hover' };
  return { state, stateMs: next, entered: null };
}

// 星彈受擊決策（§123）：正面（面向側來彈）反射、側背面正常結算——側擊即反制。
export type PrismbeeStarHitOutcome = 'reflect' | 'vulnerable';

export function resolvePrismbeeStarHit(facing: 1 | -1, starDx: number): PrismbeeStarHitOutcome {
  return Math.sign(starDx) === facing ? 'reflect' : 'vulnerable';
}

// 重力泡 Gravitybub：漂浮 idle → 前搖 windup 0.7s（預警圈擴張）→ 重力場 field 1.9s
//（域內玩家受水平 positional 拉力朝泡漂移）→ 回 idle。沿 magno 單計時器模式。
export const GRAVITYBUB_FSM = {
  idleMs: 2300,
  windupMs: 700,
  fieldMs: 1900,
  fieldRadiusPx: 140,
  // 拉力恆低於玩家全速（交叉不變式 16）：漂移是壓力非禁錮。
  pullPxPerSec: 70,
} as const;

export type GravitybubPhase = 'idle' | 'windup' | 'field';

export interface GravitybubTick {
  bubMs: number;
  phase: GravitybubPhase;
  // windup 期預警擴張進度 0..1；其餘相位恆 0。
  progress: number;
}

export function tickGravitybub(bubMs: number, deltaMs: number): GravitybubTick {
  const total = GRAVITYBUB_FSM.idleMs + GRAVITYBUB_FSM.windupMs + GRAVITYBUB_FSM.fieldMs;
  const next = bubMs + deltaMs;
  if (next >= total) return { bubMs: 0, phase: 'idle', progress: 0 };
  if (next >= GRAVITYBUB_FSM.idleMs + GRAVITYBUB_FSM.windupMs) {
    return { bubMs: next, phase: 'field', progress: 0 };
  }
  if (next >= GRAVITYBUB_FSM.idleMs) {
    return {
      bubMs: next,
      phase: 'windup',
      progress: (next - GRAVITYBUB_FSM.idleMs) / GRAVITYBUB_FSM.windupMs,
    };
  }
  return { bubMs: next, phase: 'idle', progress: 0 };
}

// 重力場拉向（§123）：field 期域內玩家被拉向泡的水平方向；域外為 0（沿 gustWindPush 模式）。
export function gravityBubPull(
  playerX: number,
  playerY: number,
  bubX: number,
  bubY: number,
): -1 | 0 | 1 {
  const dx = playerX - bubX;
  const dy = playerY - bubY;
  if (dx * dx + dy * dy > GRAVITYBUB_FSM.fieldRadiusPx * GRAVITYBUB_FSM.fieldRadiusPx) return 0;
  if (dx === 0) return 0;
  return playerX > bubX ? -1 : 1;
}

// 軌道怪 Orbiton：逼近 approach →（抵軌道半徑）→ 繞行 orbit 三圈 → 前搖 windup 0.7s
//（定格閃爍 telegraph）→ 突進 dash（鎖定前搖結束當下玩家位置，之後不修正）→
// 回復 recover → approach。
export const ORBITON_FSM = {
  // 繞行三圈：orbitMs × angular ≈ 3×2π（4200 × 0.0045 = 18.9 rad ≈ 3 圈）。
  orbitMs: 4200,
  orbitRadiusPx: 120,
  orbitAngularPerMs: 0.0045,
  windupMs: 700,
  dashMs: 550,
  recoverMs: 900,
  approachSpeed: 90,
  dashSpeed: 360,
} as const;

export type OrbitonState = 'approach' | 'orbit' | 'windup' | 'dash' | 'recover';

export interface OrbitonTick {
  state: OrbitonState;
  stateMs: number;
  entered: OrbitonState | null;
}

export function tickOrbiton(
  state: OrbitonState,
  stateMs: number,
  deltaMs: number,
  nearOrbit: boolean,
): OrbitonTick {
  const next = stateMs + deltaMs;
  if (state === 'approach' && nearOrbit) return { state: 'orbit', stateMs: 0, entered: 'orbit' };
  if (state === 'orbit' && next >= ORBITON_FSM.orbitMs)
    return { state: 'windup', stateMs: 0, entered: 'windup' };
  if (state === 'windup' && next >= ORBITON_FSM.windupMs)
    return { state: 'dash', stateMs: 0, entered: 'dash' };
  if (state === 'dash' && next >= ORBITON_FSM.dashMs)
    return { state: 'recover', stateMs: 0, entered: 'recover' };
  if (state === 'recover' && next >= ORBITON_FSM.recoverMs)
    return { state: 'approach', stateMs: 0, entered: 'approach' };
  return { state, stateMs: next, entered: null };
}

// 裂隙怪 Riftling：緩飄 idle → 裂縫預告 rift 0.7s（目的地裂縫 telegraph，讀裂縫即預判）→
// 瞬移 blink（單幀事件態：跳至裂縫點）→ 冷卻 cool → idle。
export const RIFTLING_FSM = {
  idleMs: 1600,
  riftMs: 700,
  coolMs: 1100,
  driftSpeed: 30,
  // 單次瞬移步長上限（朝玩家方向夾限）。
  blinkRangePx: 150,
} as const;

export type RiftlingState = 'idle' | 'rift' | 'blink' | 'cool';

export interface RiftlingTick {
  state: RiftlingState;
  stateMs: number;
  entered: RiftlingState | null;
}

export function tickRiftling(state: RiftlingState, stateMs: number, deltaMs: number): RiftlingTick {
  const next = stateMs + deltaMs;
  if (state === 'idle' && next >= RIFTLING_FSM.idleMs)
    return { state: 'rift', stateMs: 0, entered: 'rift' };
  if (state === 'rift' && next >= RIFTLING_FSM.riftMs)
    return { state: 'blink', stateMs: 0, entered: 'blink' };
  // blink 為單幀事件態：呈現層瞬移後即入冷卻（沿 boomy throw 慣例）。
  if (state === 'blink') return { state: 'cool', stateMs: 0, entered: 'cool' };
  if (state === 'cool' && next >= RIFTLING_FSM.coolMs)
    return { state: 'idle', stateMs: 0, entered: 'idle' };
  return { state, stateMs: next, entered: null };
}

// 瞬移目的地（純函式）：朝玩家方向、步長夾限 blinkRangePx。
export function riftlingBlinkX(selfX: number, targetX: number): number {
  const dx = targetX - selfX;
  const step = Math.max(-RIFTLING_FSM.blinkRangePx, Math.min(RIFTLING_FSM.blinkRangePx, dx));
  return selfX + step;
}

// 小熊市 Bearlet：緩走 waddle → 舉箭前搖 windup 0.65s（telegraph 閃爍）→ 拋下跌箭頭
// toss（單幀事件態，紅色下跌箭頭拋物墜落——L30 熊市怪前置教學）→ 冷卻 cool → waddle。
// 不可吸（無星味）；星彈可正常擊殺（HP 4，「清除」反制）。
export const BEARLET_FSM = {
  waddleMs: 2400,
  windupMs: 650,
  coolMs: 1200,
  walkSpeed: 48,
  // 下跌箭頭拋物初速與壽命（逾時必回收 §56）。
  arrowSpeedX: 120,
  arrowSpeedY: -260,
  arrowLifeMs: 2200,
} as const;

export type BearletState = 'waddle' | 'windup' | 'toss' | 'cool';

export interface BearletTick {
  state: BearletState;
  stateMs: number;
  entered: BearletState | null;
}

export function tickBearlet(state: BearletState, stateMs: number, deltaMs: number): BearletTick {
  const next = stateMs + deltaMs;
  if (state === 'waddle' && next >= BEARLET_FSM.waddleMs)
    return { state: 'windup', stateMs: 0, entered: 'windup' };
  if (state === 'windup' && next >= BEARLET_FSM.windupMs)
    return { state: 'toss', stateMs: 0, entered: 'toss' };
  if (state === 'toss') return { state: 'cool', stateMs: 0, entered: 'cool' };
  if (state === 'cool' && next >= BEARLET_FSM.coolMs)
    return { state: 'waddle', stateMs: 0, entered: 'waddle' };
  return { state, stateMs: next, entered: null };
}

// 牛市怪 Bull Run（§126，PRD §6.6）：緩走 prowl → 蓄力 charge 0.75s（定身閃爍
// telegraph）→ 衝刺 dash（鎖定方向不修正）→ 撞牆反彈入二次加速 redash（呈現層
// 翻向增速）→ 回復 recover。反制：跳越衝刺線／星彈命中蓄力期即中斷（雷化鏈電
// 波及＝群體中斷優勢）／殼化反彈／風化空中迴避。
export const BULLRUN_FSM = {
  prowlMs: 1800,
  chargeMs: 750,
  // 單段衝刺時長上限（未撞牆的斷尾保險，§56 有界）。
  dashMaxMs: 1600,
  recoverMs: 1100,
  walkSpeed: 46,
  dashSpeed: 300,
  // 二次加速倍率（撞牆反彈後）。
  redashSpeedMul: 1.25,
} as const;

export type BullrunState = 'prowl' | 'charge' | 'dash' | 'redash' | 'recover';

export interface BullrunTick {
  state: BullrunState;
  stateMs: number;
  entered: BullrunState | null;
}

// hitWall：呈現層回報本 tick 撞牆（blocked.left/right）——dash 入二次加速、redash 收尾。
export function tickBullrun(
  state: BullrunState,
  stateMs: number,
  deltaMs: number,
  hitWall: boolean,
): BullrunTick {
  const next = stateMs + deltaMs;
  if (state === 'prowl' && next >= BULLRUN_FSM.prowlMs)
    return { state: 'charge', stateMs: 0, entered: 'charge' };
  if (state === 'charge' && next >= BULLRUN_FSM.chargeMs)
    return { state: 'dash', stateMs: 0, entered: 'dash' };
  if (state === 'dash') {
    if (hitWall) return { state: 'redash', stateMs: 0, entered: 'redash' };
    if (next >= BULLRUN_FSM.dashMaxMs) return { state: 'recover', stateMs: 0, entered: 'recover' };
  }
  if (state === 'redash' && (hitWall || next >= BULLRUN_FSM.dashMaxMs))
    return { state: 'recover', stateMs: 0, entered: 'recover' };
  if (state === 'recover' && next >= BULLRUN_FSM.recoverMs)
    return { state: 'prowl', stateMs: 0, entered: 'prowl' };
  return { state, stateMs: next, entered: null };
}

// 熊市怪 Bear Market（§126，PRD §6.6）：緩走 prowl → 拍地前搖 slamwind 0.7s
//（telegraph 閃爍）→ 拍地 slam（雙側地面波＋召下跌小箭頭，單幀事件態）→ 冷卻 cool；
// 低血（≤40%）一次性冬眠 hibernate 1.4s（定身大 telegraph）→ 全場震波 quake
//（單幀事件態，跳躍迴避）→ 甦醒 wake。反制：跳越波列／雷化鏈電速清／風化越頂／
// 殼化反彈。
export const BEARMARKET_FSM = {
  prowlMs: 2200,
  slamwindMs: 700,
  coolMs: 1400,
  hibernateMs: 1400,
  wakeMs: 1000,
  walkSpeed: 40,
  // 低血冬眠觸發閾值（HP 比例；一次性由呈現層 hibernated 旗標鎖存）。
  hibernateHpRatio: 0.4,
  // 拍地波與全場震波參數（呈現層生成）。
  slamWaveSpeed: 180,
  slamWaveLifeMs: 1400,
  quakeWaveSpeed: 240,
  quakeWaveLifeMs: 2600,
} as const;

export type BearmarketState =
  | 'prowl'
  | 'slamwind'
  | 'slam'
  | 'cool'
  | 'hibernate'
  | 'quake'
  | 'wake';

export interface BearmarketTick {
  state: BearmarketState;
  stateMs: number;
  entered: BearmarketState | null;
}

// lowHpPending：呈現層回報「HP 已低於閾值且尚未冬眠過」——prowl/cool 期優先入冬眠。
export function tickBearmarket(
  state: BearmarketState,
  stateMs: number,
  deltaMs: number,
  lowHpPending: boolean,
): BearmarketTick {
  const next = stateMs + deltaMs;
  if ((state === 'prowl' || state === 'cool') && lowHpPending)
    return { state: 'hibernate', stateMs: 0, entered: 'hibernate' };
  if (state === 'prowl' && next >= BEARMARKET_FSM.prowlMs)
    return { state: 'slamwind', stateMs: 0, entered: 'slamwind' };
  if (state === 'slamwind' && next >= BEARMARKET_FSM.slamwindMs)
    return { state: 'slam', stateMs: 0, entered: 'slam' };
  if (state === 'slam') return { state: 'cool', stateMs: 0, entered: 'cool' };
  if (state === 'cool' && next >= BEARMARKET_FSM.coolMs)
    return { state: 'prowl', stateMs: 0, entered: 'prowl' };
  if (state === 'hibernate' && next >= BEARMARKET_FSM.hibernateMs)
    return { state: 'quake', stateMs: 0, entered: 'quake' };
  if (state === 'quake') return { state: 'wake', stateMs: 0, entered: 'wake' };
  if (state === 'wake' && next >= BEARMARKET_FSM.wakeMs)
    return { state: 'prowl', stateMs: 0, entered: 'prowl' };
  return { state, stateMs: next, entered: null };
}
