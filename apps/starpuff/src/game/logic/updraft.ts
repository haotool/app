// 上升氣流純邏輯（GAME_DESIGN §51，不 import phaser），vitest 對象。
// zone 型非碰撞：進入柱域獲得向上加速度、升速夾限；柱頂以上不再供力自然拋出。

export const UPDRAFT = {
  liftPxPerSec2: 1600,
  // 最大上升速度（負值向上）：低於跳躍初速絕對值，柱內懸浮可控。
  maxRiseSpeed: -330,
} as const;

export interface UpdraftZone {
  x: number;
  topY: number;
  w: number;
}

// 柱域判定：水平落於柱寬內、垂直於柱頂與地面頂之間。
export function isInUpdraft(
  playerX: number,
  playerY: number,
  zone: UpdraftZone,
  groundTop: number,
): boolean {
  if (Math.abs(playerX - zone.x) > zone.w / 2) return false;
  return playerY >= zone.topY && playerY <= groundTop;
}

// 升力結算（anti-softlock §56）：頭頂受阻（卡頂）不供力，交還重力自然回落；
// 其餘逐幀向上加速並夾限至 maxRiseSpeed。
export function updraftLift(vy: number, deltaMs: number, blockedUp: boolean): number {
  if (blockedUp) return vy;
  const next = vy - UPDRAFT.liftPxPerSec2 * (deltaMs / 1000);
  return Math.max(next, UPDRAFT.maxRiseSpeed);
}
