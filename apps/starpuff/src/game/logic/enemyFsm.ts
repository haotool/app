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
