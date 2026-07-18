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

// 站台判定沉降帶（§77）：腳底允許在台頂上方 6px（擠壓迴圈懸浮）至下方 8px（分離殘量）。
const REST_ABOVE_PX = 6;
const REST_BELOW_PX = 8;
// 沉降速度上限：擠壓迴圈回落速度實測 15-30，高速下墜路過（>90）不得誤判為站台。
const REST_MAX_VY = 90;

// 站台判定（§77 熱修）：落地擠壓迴圈使接觸旗標以 ~20Hz 抖動，純旗標判定讓下穿
// 變成機率行為。接觸旗標或「沉降幾何」（腳底貼近台頂且微速下沉）擇一成立。
export function restingOnOneWay(
  player: {
    contactDown: boolean;
    velocityY: number;
    bottom: number;
    left: number;
    right: number;
  },
  rect: BoundsRect,
): boolean {
  if (player.right <= rect.left || player.left >= rect.right) return false;
  if (player.bottom < rect.top - REST_ABOVE_PX || player.bottom > rect.top + REST_BELOW_PX) {
    return false;
  }
  return player.contactDown || (player.velocityY >= 0 && player.velocityY <= REST_MAX_VY);
}

// 單向著地帶（§77 熱修）：低速維持 +6 緊帶防側切；單步位移大於帶寬時依位移放寬，
// 接住下砸（~11.7px/步）與高處落下，杜絕高速隧穿單向平台。
export function oneWayLandBand(stepDeltaY: number): number {
  return Math.max(REST_ABOVE_PX, stepDeltaY + 2);
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

// 精英房箝制（§48）：精英追擊不越房界——越界回夾並朝房內反向（比照巡邏折返），
// 玩家離房後精英不出房追殺，60s 逾時開門保險恆有效。
export function clampEliteX(
  x: number,
  velocityX: number,
  left: number,
  right: number,
): { x: number; velocityX: number } {
  if (x < left) return { x: left, velocityX: Math.abs(velocityX) };
  if (x > right) return { x: right, velocityX: -Math.abs(velocityX) };
  return { x, velocityX };
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
