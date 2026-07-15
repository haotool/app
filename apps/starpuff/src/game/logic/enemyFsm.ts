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
