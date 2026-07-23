// 果凍回彈純邏輯（GAME_DESIGN §5 / #813）：Jellord P2 起踩踏落點地面果凍化 3s，
// 玩家踩上被彈起（非傷害）；果凍地形＝免費跳台，彈起可接漂浮控高。
// 不 import phaser，vitest 對象；呈現層（systems/boss.ts）持有視覺與清單。

export const JELLY_PATCH = {
  // 果凍化持續 3s（§5 定值）。
  lifetimeMs: 3000,
  // 落點半寬：涵蓋魔王踩踏著地帶。
  halfWidthPx: 75,
  // 彈起初速：高於一般跳（-420）、低於彈簧超級跳（-640），可接漂浮控高。
  bounceVy: -560,
  // 地面帶：玩家中心 y 距地表在此範圍內視為踩上果凍。
  groundBandPx: 60,
  // 重複觸發保護：彈起後短窗內不再結算。
  cooldownMs: 200,
} as const;

export interface JellyPatch {
  x: number;
  createdAtMs: number;
}

export function isPatchActive(patch: JellyPatch, nowMs: number): boolean {
  return nowMs - patch.createdAtMs < JELLY_PATCH.lifetimeMs;
}

export function prunePatches(patches: readonly JellyPatch[], nowMs: number): JellyPatch[] {
  return patches.filter((patch) => isPatchActive(patch, nowMs));
}

// 剩餘壽命比例（1 → 0）：供呈現層淡出。
export function patchRemainingRatio(patch: JellyPatch, nowMs: number): number {
  return Math.max(0, 1 - (nowMs - patch.createdAtMs) / JELLY_PATCH.lifetimeMs);
}

// 踩上果凍彈起結算：站上/落向地面帶且水平位於果凍範圍內回傳彈起初速，否則 null。
// vy < 0（上升中）不觸發——彈起後自然單發，cooldown 由呈現層守門。
export function jellyBounceVy(
  patches: readonly JellyPatch[],
  nowMs: number,
  playerX: number,
  playerY: number,
  groundTopY: number,
  playerVy: number,
): number | null {
  if (playerVy < 0) return null;
  if (playerY < groundTopY - JELLY_PATCH.groundBandPx) return null;
  for (const patch of patches) {
    if (!isPatchActive(patch, nowMs)) continue;
    if (Math.abs(playerX - patch.x) <= JELLY_PATCH.halfWidthPx) return JELLY_PATCH.bounceVy;
  }
  return null;
}
