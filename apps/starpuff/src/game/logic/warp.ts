// 星門折躍純邏輯（GAME_DESIGN §65，不 import phaser），vitest 對象。
// 成對傳送：同 pairId 兩門互為出口；進門保留速度向量、出門冷卻防彈跳循環。
// anti-softlock：warp 僅為捷徑與秘密，主線地面路徑恆可達星星門（levels.test 守門）。

export const WARP = {
  triggerRadiusPx: 40,
  cooldownMs: 500,
} as const;

export interface WarpGate {
  x: number;
  y: number;
  pairId: string;
}

// 同 pairId 的另一門；孤門（資料防呆）回 null。
export function warpExitOf(gates: readonly WarpGate[], entry: WarpGate): WarpGate | null {
  return gates.find((gate) => gate !== entry && gate.pairId === entry.pairId) ?? null;
}

export interface WarpResult {
  exit: WarpGate | null;
  lockedUntilMs: number;
}

// 進門判定單一出口：冷卻期內不觸發；命中觸發半徑內最近門並啟動全域冷卻。
export function tryWarp(
  gates: readonly WarpGate[],
  playerX: number,
  playerY: number,
  nowMs: number,
  lockedUntilMs: number,
): WarpResult {
  if (nowMs < lockedUntilMs) return { exit: null, lockedUntilMs };
  for (const gate of gates) {
    const dx = playerX - gate.x;
    const dy = playerY - gate.y;
    if (dx * dx + dy * dy > WARP.triggerRadiusPx * WARP.triggerRadiusPx) continue;
    const exit = warpExitOf(gates, gate);
    if (!exit) continue;
    return { exit, lockedUntilMs: nowMs + WARP.cooldownMs };
  }
  return { exit: null, lockedUntilMs };
}
