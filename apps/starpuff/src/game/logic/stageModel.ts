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
