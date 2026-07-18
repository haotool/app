// Noctra 盤旋航線與返空歸位純邏輯（GAME_DESIGN §54/§64，不 import phaser），vitest 對象。
// §64 P0 熱修根因：盤旋駕駛以凍結相位的絕對座標直寫 sprite，俯衝/俯掠/長暈接管結束
// 當幀位置跳回相位點（可達數百 px）——玩家所見「返空瞬移」。修法：目標仍由相位導出，
// 位置以速度上限逐幀逼近（單 tick 位移 ≤ maxSpeed×dt），一般與 EX 共用。

export const NOCTRA_FLIGHT = {
  // 常態盤旋高度與側緣邊距（§63 難度根修值，自 systems/noctra.ts 收斂至 logic）。
  hoverY: 246,
  sideMarginX: 190,
  // 掃速 0.0007（§63）：峰值橫移低於玩家走速；y 呼吸 ±14。
  swayFreq: 0.0007,
  bobFreq: 0.0021,
  bobAmpPx: 14,
  // 歸位速度上限：高於最寬幅（1200）盤旋峰值橫移（~287px/s）確保貼軌恆跟上，
  // 且有限（禁止瞬移）；speedFactor 縮放由呼叫端乘入。
  maxSpeedPxPerSec: 340,
} as const;

export interface FlightPoint {
  x: number;
  y: number;
}

// 盤旋相位 → 目標座標；相位由呼叫端持有（tween 接管期間凍結）。
export function hoverPatternPoint(hoverMs: number, viewWidth: number): FlightPoint {
  const span = viewWidth / 2 - NOCTRA_FLIGHT.sideMarginX;
  return {
    x: viewWidth / 2 + Math.sin(hoverMs * NOCTRA_FLIGHT.swayFreq) * span,
    y: NOCTRA_FLIGHT.hoverY + Math.sin(hoverMs * NOCTRA_FLIGHT.bobFreq) * NOCTRA_FLIGHT.bobAmpPx,
  };
}

// 速度上限逼近：單 tick 位移 ≤ maxSpeed×dt；步長內直接貼合目標（不過衝）。
export function approachPoint(
  current: FlightPoint,
  target: FlightPoint,
  maxSpeedPxPerSec: number,
  deltaMs: number,
): FlightPoint {
  const step = (maxSpeedPxPerSec * Math.max(0, deltaMs)) / 1000;
  const dx = target.x - current.x;
  const dy = target.y - current.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= step) return { x: target.x, y: target.y };
  if (step <= 0) return { x: current.x, y: current.y };
  const ratio = step / distance;
  return { x: current.x + dx * ratio, y: current.y + dy * ratio };
}
