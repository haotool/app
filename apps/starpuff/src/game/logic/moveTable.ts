// 魔王加權選招 SSOT（GAME_DESIGN §5 / #813）：招式序由固定循環改加權表驅動。
// 權重欄＋條件欄（HP 帶/玩家距離帶）、rng 注入可測、同 seed 可重放；
// 連續同招上限 2（防隨機劣化體感）。純邏輯不 import phaser，vitest 對象。

// 連續同招上限：recent 尾端同招達此數即禁再選（除非無其他候選）。
export const SAME_MOVE_CAP = 2;

// 距離帶門檻：與玩家距離超過此值視為 far；未知距離視為 far（保守放行遠程招）。
export const NEAR_BAND_PX = 300;

export type DistanceBand = 'near' | 'far';

export interface MoveContext {
  // 目前 HP 比例（0..1）。
  hpRatio: number;
  distanceBand: DistanceBand;
}

// 條件欄採宣告式（可序列化、可測），全部欄位為 AND 關係。
export interface MoveCondition {
  minHpRatio?: number;
  maxHpRatio?: number;
  band?: DistanceBand;
}

export interface WeightedMove<A extends string> {
  action: A;
  weight: number;
  condition?: MoveCondition;
}

export function distanceBandOf(distancePx: number | null): DistanceBand {
  if (distancePx === null) return 'far';
  return distancePx <= NEAR_BAND_PX ? 'near' : 'far';
}

export function moveAllowed(condition: MoveCondition | undefined, ctx: MoveContext): boolean {
  if (!condition) return true;
  if (condition.minHpRatio !== undefined && ctx.hpRatio < condition.minHpRatio) return false;
  if (condition.maxHpRatio !== undefined && ctx.hpRatio > condition.maxHpRatio) return false;
  if (condition.band !== undefined && ctx.distanceBand !== condition.band) return false;
  return true;
}

// mulberry32：注入式決定性 rng，同 seed 序列完全重放。
export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 加權選招：條件過濾 → 連續同招上限剔除 → 輪盤抽選。
// 過濾後無候選時回退整表（anti-softlock：永不空手）。
export function pickMove<A extends string>(
  table: readonly WeightedMove<A>[],
  ctx: MoveContext,
  recent: readonly A[],
  rng: () => number,
): A {
  if (table.length === 0) throw new Error('加權表不可為空');
  let candidates = table.filter((m) => m.weight > 0 && moveAllowed(m.condition, ctx));
  if (candidates.length === 0) candidates = [...table];
  const tail = recent[recent.length - 1];
  if (tail !== undefined && recent.length >= SAME_MOVE_CAP) {
    const capped = recent.slice(-SAME_MOVE_CAP).every((a) => a === tail);
    if (capped) {
      const others = candidates.filter((m) => m.action !== tail);
      if (others.length > 0) candidates = others;
    }
  }
  const total = candidates.reduce((sum, m) => sum + m.weight, 0);
  let roll = rng() * total;
  for (const move of candidates) {
    roll -= move.weight;
    if (roll < 0) return move.action;
  }
  const last = candidates[candidates.length - 1];
  if (!last) throw new Error('加權表不可為空');
  return last.action;
}
