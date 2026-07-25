// 慈悲補血愛心決策（GAME_DESIGN §62／v19 #819 卡 9 去 RNG，不 import phaser），vitest 對象。
// 保底機制非資源農場：低血且久戰才觸發，冷卻與每命上限硬性；生成與否為確定性
// pity 決策——首次符合門檻固定生成，之後依受傷次數或低血持續時間累積保底；
// RNG 僅由呼叫端決定生成位置。時鐘由呼叫端注入以利測試。適用一般關與魔王關（含 EX）。

export const MERCY_HEAL = {
  // 每 5 秒評估一次。
  evaluateIntervalMs: 5000,
  // 血量門檻：HP ≤ 總血量 1/3。
  hpRatioMax: 1 / 3,
  // 本關經過時間 ≥ 60 秒才開始評估。
  minElapsedMs: 60_000,
  // 距上次愛心生成 ≥ 45 秒。
  cooldownMs: 45_000,
  // 每關每命上限。
  maxPerLife: 2,
  // 拾取回復量。
  healHp: 1,
  // pity 保底（v19 卡 9）：第二顆起需自上次生成累積受傷 ≥2 次，或低血狀態累計 ≥30s。
  pityHurts: 2,
  pityLowHpMs: 30_000,
  // 魔王房 override（§54/§62 難度稽核）：boss 戰典型長度 20-60s，一般門檻（60s）
  // 形同虛設——放寬為絕對血量 ≤2、12s 起評、18s 冷卻；保底門檻同步收緊
  // （受傷 1 次或低血累計 15s，對應原 60% 高機率的確定性語意）；上限沿用。
  bossHpMax: 2,
  bossMinElapsedMs: 12_000,
  bossCooldownMs: 18_000,
  bossPityHurts: 1,
  bossPityLowHpMs: 15_000,
  // EX 變體上限（主計畫 §7.4）：EX 保持硬核，每命僅 1 顆；生存段固定愛心走獨立管線不計。
  exMaxPerLife: 1,
} as const;

export interface MercyState {
  sinceEvalMs: number;
  // 上次生成當下的關卡經過時間；未生成過為 -Infinity（冷卻條件恆成立）。
  lastSpawnElapsedMs: number;
  spawned: number;
  // pity 保底計量（v19 卡 9）：自上次生成起的受傷次數與低血累計時間；生成即歸零。
  hurtsSinceSpawn: number;
  lowHpMsSinceSpawn: number;
  // 上一 tick 血量（受傷偵測基準）；NaN＝尚未觀測（首 tick 只記錄不計傷）。
  lastHp: number;
}

export function createMercyState(): MercyState {
  return {
    sinceEvalMs: 0,
    lastSpawnElapsedMs: Number.NEGATIVE_INFINITY,
    spawned: 0,
    hurtsSinceSpawn: 0,
    lowHpMsSinceSpawn: 0,
    lastHp: Number.NaN,
  };
}

export interface MercyTick {
  deltaMs: number;
  // 本關（本命）經過時間；死亡重試由呼叫端重建狀態歸零。
  elapsedMs: number;
  hp: number;
  maxHp: number;
  // 魔王房（含 EX）走 override 門檻（§54）。
  bossRoom?: boolean;
  // EX 變體（§7.4）：每命上限收緊為 1。
  exMode?: boolean;
}

export interface MercyResult {
  state: MercyState;
  spawn: boolean;
}

// 逐幀推進：每 tick 累積 pity 計量（受傷偵測＋低血時間）；評估間隔到期才做生成決策，
// 任一門檻不過僅重置評估計時（保底計量不消耗）。
export function advanceMercyHeal(state: MercyState, tick: MercyTick): MercyResult {
  const boss = tick.bossRoom === true;
  const hpOk = boss
    ? tick.hp <= MERCY_HEAL.bossHpMax
    : tick.hp <= tick.maxHp * MERCY_HEAL.hpRatioMax;
  // 受傷偵測：HP 較上次觀測下降即計一次（單次多傷計 1）；回血僅更新基準。
  const hurts =
    Number.isFinite(state.lastHp) && tick.hp < state.lastHp
      ? state.hurtsSinceSpawn + 1
      : state.hurtsSinceSpawn;
  const lowHpMs =
    tick.hp > 0 && hpOk ? state.lowHpMsSinceSpawn + tick.deltaMs : state.lowHpMsSinceSpawn;
  const accrued: MercyState = {
    ...state,
    hurtsSinceSpawn: hurts,
    lowHpMsSinceSpawn: lowHpMs,
    lastHp: tick.hp,
  };

  const sinceEvalMs = state.sinceEvalMs + tick.deltaMs;
  if (sinceEvalMs < MERCY_HEAL.evaluateIntervalMs) {
    return { state: { ...accrued, sinceEvalMs }, spawn: false };
  }
  const rearmed: MercyState = { ...accrued, sinceEvalMs: 0 };
  const minElapsedMs = boss ? MERCY_HEAL.bossMinElapsedMs : MERCY_HEAL.minElapsedMs;
  const cooldownMs = boss ? MERCY_HEAL.bossCooldownMs : MERCY_HEAL.cooldownMs;
  const maxPerLife = tick.exMode === true ? MERCY_HEAL.exMaxPerLife : MERCY_HEAL.maxPerLife;
  const eligible =
    tick.hp > 0 &&
    hpOk &&
    tick.elapsedMs >= minElapsedMs &&
    state.spawned < maxPerLife &&
    tick.elapsedMs - state.lastSpawnElapsedMs >= cooldownMs;
  // pity 決策（v19 卡 9）：首顆固定生成；之後受傷數或低血累計任一達標即保底。
  const pityHurts = boss ? MERCY_HEAL.bossPityHurts : MERCY_HEAL.pityHurts;
  const pityLowHpMs = boss ? MERCY_HEAL.bossPityLowHpMs : MERCY_HEAL.pityLowHpMs;
  const pityCharged = state.spawned === 0 || hurts >= pityHurts || lowHpMs >= pityLowHpMs;
  if (!eligible || !pityCharged) return { state: rearmed, spawn: false };
  return {
    state: {
      sinceEvalMs: 0,
      lastSpawnElapsedMs: tick.elapsedMs,
      spawned: state.spawned + 1,
      hurtsSinceSpawn: 0,
      lowHpMsSinceSpawn: 0,
      lastHp: tick.hp,
    },
    spawn: true,
  };
}
