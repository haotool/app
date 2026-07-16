// 追電星導引純邏輯（GAME_DESIGN §46，不 import phaser），vitest 對象。
// Scene 只負責讀寫 body velocity；轉向數學集中於此。

export const HOMING_RANGE_PX = 320;
export const HOMING_TURN_RAD_PER_MS = 0.006;

export interface HomingCandidate {
  x: number;
  y: number;
}

// 鎖敵：範圍內最近者；無候選回 null。
export function nearestInRange<T extends HomingCandidate>(
  x: number,
  y: number,
  candidates: readonly T[],
  rangePx: number,
): T | null {
  let nearest: T | null = null;
  let bestSq = rangePx * rangePx;
  for (const candidate of candidates) {
    const dSq = (candidate.x - x) ** 2 + (candidate.y - y) ** 2;
    if (dSq < bestSq) {
      bestSq = dSq;
      nearest = candidate;
    }
  }
  return nearest;
}

// 限速轉向：現速度向量朝目標方位旋轉至多 maxTurnRad，速率維持不變。
export function steerTowardTarget(
  vx: number,
  vy: number,
  fromX: number,
  fromY: number,
  targetX: number,
  targetY: number,
  fallbackSpeed: number,
  maxTurnRad: number,
): { vx: number; vy: number } {
  const speed = Math.hypot(vx, vy) || fallbackSpeed;
  const current = Math.atan2(vy, vx);
  const desired = Math.atan2(targetY - fromY, targetX - fromX);
  let diff = desired - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const step = Math.min(Math.abs(diff), maxTurnRad) * Math.sign(diff);
  const angle = current + step;
  return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
}
