// 鏡像殘影純邏輯（GAME_DESIGN §5 / #813 W2）：Prismix P2 生成玩家鏡影——
// 水平反向移動、觸傷 1、6s 壽命、1 發星彈即破（mirri 鏡性課的魔王級運用）。
// 不 import phaser，vitest 對象；呈現層（systems/prismix.ts）持有 sprite 與群組接線。

export const MIRROR_SHADOW = {
  // 壽命 6s（§5 定值）：期滿自然消散。
  lifespanMs: 6000,
  // 觸傷 1＝魔王體傷同級（走既有 shockwaves 觸傷管線）。
  touchDamage: 1,
  // 1 發星彈即破（走既有 shields 星彈屏障管線）。
  hp: 1,
  // 垂直跟隨平滑係數（px/s 上限）：殘影縱向逼近玩家高度，不瞬移。
  followYMaxPxPerSec: 320,
} as const;

// 生成位：玩家鏡射於 arena 中線另一側（鏡像語彙；貼身直傷不可讀）。
export function shadowSpawnX(arenaCenterX: number, playerX: number): number {
  return 2 * arenaCenterX - playerX;
}

// 水平反向移動（§5）：玩家每幀位移取負向套用——向遠離殘影方向移動即加速分離。
export function stepShadowX(shadowX: number, playerDeltaX: number): number {
  return shadowX - playerDeltaX;
}

// 垂直跟隨：速度上限逼近玩家高度（連續移動，杜絕瞬移）。
export function stepShadowY(shadowY: number, playerY: number, deltaMs: number): number {
  const maxStep = (MIRROR_SHADOW.followYMaxPxPerSec * deltaMs) / 1000;
  const diff = playerY - shadowY;
  if (Math.abs(diff) <= maxStep) return playerY;
  return shadowY + Math.sign(diff) * maxStep;
}

export function shadowActive(spawnAtMs: number, nowMs: number): boolean {
  return spawnAtMs >= 0 && nowMs - spawnAtMs < MIRROR_SHADOW.lifespanMs;
}
