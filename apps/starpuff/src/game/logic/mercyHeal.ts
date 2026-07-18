// 慈悲補血愛心決策（GAME_DESIGN §62，不 import phaser），vitest 對象。
// 保底機制非資源農場：低血且久戰才有機率觸發，冷卻與每命上限硬性；RNG 與時鐘
// 全數由呼叫端注入以利測試。適用一般關與魔王關（含 EX）。

export const MERCY_HEAL = {
  // 每 5 秒評估一次。
  evaluateIntervalMs: 5000,
  // 血量門檻：HP ≤ 總血量 1/3。
  hpRatioMax: 1 / 3,
  // 本關經過時間 ≥ 60 秒才開始評估。
  minElapsedMs: 60_000,
  // 距上次愛心生成 ≥ 45 秒。
  cooldownMs: 45_000,
  // 通過全部門檻後的觸發機率。
  chance: 0.35,
  // 每關每命上限。
  maxPerLife: 2,
  // 拾取回復量。
  healHp: 1,
  // 魔王房 override（§54/§62 難度稽核）：boss 戰典型長度 20-60s，一般門檻（60s）
  // 形同虛設——放寬為絕對血量 ≤2、12s 起評、18s 冷卻、60% 機率；上限沿用。
  bossHpMax: 2,
  bossMinElapsedMs: 12_000,
  bossCooldownMs: 18_000,
  bossChance: 0.6,
} as const;

export interface MercyState {
  sinceEvalMs: number;
  // 上次生成當下的關卡經過時間；未生成過為 -Infinity（冷卻條件恆成立）。
  lastSpawnElapsedMs: number;
  spawned: number;
}

export function createMercyState(): MercyState {
  return { sinceEvalMs: 0, lastSpawnElapsedMs: Number.NEGATIVE_INFINITY, spawned: 0 };
}

export interface MercyTick {
  deltaMs: number;
  // 本關（本命）經過時間；死亡重試由呼叫端重建狀態歸零。
  elapsedMs: number;
  hp: number;
  maxHp: number;
  rng: () => number;
  // 魔王房（含 EX）走 override 門檻（§54）。
  bossRoom?: boolean;
}

export interface MercyResult {
  state: MercyState;
  spawn: boolean;
}

// 逐幀推進：評估間隔到期才擲骰；任一門檻不過僅重置評估計時（不消耗機率）。
export function advanceMercyHeal(state: MercyState, tick: MercyTick): MercyResult {
  const sinceEvalMs = state.sinceEvalMs + tick.deltaMs;
  if (sinceEvalMs < MERCY_HEAL.evaluateIntervalMs) {
    return { state: { ...state, sinceEvalMs }, spawn: false };
  }
  const rearmed: MercyState = { ...state, sinceEvalMs: 0 };
  const boss = tick.bossRoom === true;
  const hpOk = boss
    ? tick.hp <= MERCY_HEAL.bossHpMax
    : tick.hp <= tick.maxHp * MERCY_HEAL.hpRatioMax;
  const minElapsedMs = boss ? MERCY_HEAL.bossMinElapsedMs : MERCY_HEAL.minElapsedMs;
  const cooldownMs = boss ? MERCY_HEAL.bossCooldownMs : MERCY_HEAL.cooldownMs;
  const chance = boss ? MERCY_HEAL.bossChance : MERCY_HEAL.chance;
  const eligible =
    tick.hp > 0 &&
    hpOk &&
    tick.elapsedMs >= minElapsedMs &&
    state.spawned < MERCY_HEAL.maxPerLife &&
    tick.elapsedMs - state.lastSpawnElapsedMs >= cooldownMs;
  if (!eligible || tick.rng() >= chance) return { state: rearmed, spawn: false };
  return {
    state: {
      sinceEvalMs: 0,
      lastSpawnElapsedMs: tick.elapsedMs,
      spawned: state.spawned + 1,
    },
    spawn: true,
  };
}
