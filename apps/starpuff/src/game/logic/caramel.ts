// 焦糖化純邏輯（GAME_DESIGN §5 / #813 W2）：Syrona 糖漿波沾身減速 30%/3s。
// 反制：乘噴口氣流吹乾即解除；雷化放電瞬除（變身優勢解）。
// 不 import phaser，vitest 對象；GameScene 持有狀態並與 buff 移速倍率疊乘注入。

export const CARAMEL = {
  // 減速 30%（§5 定值）：移速倍率 0.7。
  slowMul: 0.7,
  durationMs: 3000,
  // 琥珀色（腳部沾糖視覺 tint）。
  tint: 0xd98e2b,
} as const;

export interface CaramelState {
  remainingMs: number;
}

export const CARAMEL_CLEAR: CaramelState = { remainingMs: 0 };

// 沾身重置滿窗（重複沾波刷新，不疊加）。
export function applyCaramel(): CaramelState {
  return { remainingMs: CARAMEL.durationMs };
}

export function tickCaramel(state: CaramelState, deltaMs: number): CaramelState {
  if (state.remainingMs <= 0) return state;
  return { remainingMs: Math.max(0, state.remainingMs - deltaMs) };
}

export function caramelActive(state: CaramelState): boolean {
  return state.remainingMs > 0;
}

export function caramelSpeedMul(state: CaramelState): number {
  return caramelActive(state) ? CARAMEL.slowMul : 1;
}
