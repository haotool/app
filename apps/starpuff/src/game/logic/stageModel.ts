// v4 平台元素純邏輯（GAME_DESIGN §29，pure TS 不 import phaser），vitest 對象。
// 數值定案：彈簧 -640 超級跳、冷卻 300ms；下落穿透窗 250ms（recon-v4 C 節）。

export const SPRING_VELOCITY_Y = -640;
export const SPRING_COOLDOWN_MS = 300;
export const DROP_THROUGH_MS = 250;
export const BRICK_SIZE = 40;

// 彈簧觸發閘（recon C.3 防連彈）：上升中不觸發，冷卻期內不重複。
export function canSpringLaunch(nowMs: number, lockedUntilMs: number, velocityY: number): boolean {
  return nowMs >= lockedUntilMs && velocityY >= 0;
}

// 下落穿透（§29）：站在單向平台上搖桿下 + 跳觸發；地面與一般平台不受影響。
export function shouldDropThrough(
  down: boolean,
  jumpPressed: boolean,
  onOneWayPlatform: boolean,
): boolean {
  return down && jumpPressed && onOneWayPlatform;
}

// AABB 邊界（§43 掃掠背擋共用形狀）。
export interface BoundsRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

// 星星門到達判定（§43）：門/彈簧為 direct pair overlap，Phaser 4 實測間歇漏檢，
// 本函式為必要幾何背擋。三重判定：站於門心右側（含 spawnGate 時已越門）、
// 前後幀跨越門心 x（含等值，高速隧穿）、玩家 AABB 與門判定區相交（停在門區左半）。
export function crossedGate(
  prevX: number,
  currX: number,
  gateX: number,
  player: BoundsRect,
  zone: BoundsRect,
): boolean {
  if (currX >= gateX) return true;
  if ((prevX - gateX) * (currX - gateX) <= 0) return true;
  return (
    player.right > zone.left &&
    player.left < zone.right &&
    player.top < zone.bottom &&
    player.bottom > zone.top
  );
}

// 彈簧掃掠命中（§43）：以前後幀掃掠 x 區間補判高速穿越；縱向以腳底帶（簧頂 -8 至
// 簧底 +10）判定；重複觸發由 canSpringLaunch 的 lockedUntil 冷卻閘去重。
export function springSweepHit(
  prevX: number,
  currX: number,
  halfWidth: number,
  bottom: number,
  spring: BoundsRect,
): boolean {
  const sweptLeft = Math.min(prevX, currX) - halfWidth;
  const sweptRight = Math.max(prevX, currX) + halfWidth;
  return (
    sweptRight > spring.left - 6 &&
    sweptLeft < spring.right + 6 &&
    bottom >= spring.top - 8 &&
    bottom <= spring.bottom + 10
  );
}

// 佈景密度（§32）：任一視窗寬內道具數上限（同屏 ≤6 驗證用）。
export function maxDecorInWindow(xs: readonly number[], windowPx: number): number {
  const sorted = [...xs].sort((a, b) => a - b);
  let max = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    let count = 0;
    for (let j = i; j < sorted.length && (sorted[j] ?? 0) - (sorted[i] ?? 0) <= windowPx; j += 1) {
      count += 1;
    }
    max = Math.max(max, count);
  }
  return max;
}
