// 新怪時序狀態機純邏輯（GAME_DESIGN §30，不 import phaser），vitest 對象。
// 時序常數依 bossFsm 慣例由本模組持有（§30 SSOT）；呈現層速度/著色留在 enemies.ts。

// 殼殼 Shelly 三態：巡邏 walk →（首發受擊）→ 縮殼旋轉 spin 1.5s（無敵）→ 暈眩 stun 1s
// （可吸/可擊殺）→ 復原 walk。
export const SHELLY_FSM = {
  spinMs: 1500,
  stunMs: 1000,
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
// 抖動）→ 俯衝 dive 0.6s（朝鎖定點高速撲擊）→ 回升 recover 0.9s → drift。
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
): GustyTick {
  const next = stateMs + deltaMs;
  if (state === 'drift' && shouldDive) return { state: 'windup', stateMs: 0, entered: 'windup' };
  if (state === 'windup' && next >= GUSTY_FSM.windupMs)
    return { state: 'dive', stateMs: 0, entered: 'dive' };
  if (state === 'dive' && next >= GUSTY_FSM.diveMs)
    return { state: 'recover', stateMs: 0, entered: 'recover' };
  if (state === 'recover' && next >= GUSTY_FSM.recoverMs)
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
