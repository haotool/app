import { describe, expect, it } from 'vitest';
import { MERCY_HEAL, advanceMercyHeal, createMercyState, type MercyState } from './mercyHeal';

// 標準可觸發情境：低血（1/5 ≤ 1/3）、久戰（≥60s）；v19 去 RNG（#819 卡 9）——
// 生成與否為確定性 pity 決策，RNG 僅由呼叫端決定生成位置。
const baseTick = {
  deltaMs: MERCY_HEAL.evaluateIntervalMs,
  elapsedMs: 90_000,
  hp: 1,
  maxHp: 5,
};

// 保底充能輔助：以低血 tick 連續推進累計 lowHpMs（每 tick 一次評估間隔）。
function accrueLowHp(state: MercyState, fromElapsedMs: number, ticks: number): MercyState {
  let next = state;
  for (let i = 1; i <= ticks; i++) {
    next = advanceMercyHeal(next, {
      ...baseTick,
      elapsedMs: fromElapsedMs + i * MERCY_HEAL.evaluateIntervalMs,
    }).state;
  }
  return next;
}

describe('advanceMercyHeal 慈悲補血決策（§62／v19 pity）', () => {
  it('評估間隔未到不評估；到期且全門檻通過時首顆固定生成（無 RNG）', () => {
    const state = createMercyState();
    const early = advanceMercyHeal(state, { ...baseTick, deltaMs: 4999 });
    expect(early.spawn).toBe(false);
    expect(early.state.sinceEvalMs).toBe(4999);
    const due = advanceMercyHeal(early.state, { ...baseTick, deltaMs: 1 });
    expect(due.spawn).toBe(true);
    expect(due.state.spawned).toBe(1);
    expect(due.state.lastSpawnElapsedMs).toBe(90_000);
  });

  it('血量門檻邊界：HP ≤ maxHp/3 才觸發（5 血制門檻 1，6 血制門檻 2）', () => {
    const state = createMercyState();
    expect(advanceMercyHeal(state, { ...baseTick, hp: 2, maxHp: 5 }).spawn).toBe(false);
    expect(advanceMercyHeal(state, { ...baseTick, hp: 1, maxHp: 5 }).spawn).toBe(true);
    expect(advanceMercyHeal(state, { ...baseTick, hp: 2, maxHp: 6 }).spawn).toBe(true);
    expect(advanceMercyHeal(state, { ...baseTick, hp: 0, maxHp: 5 }).spawn).toBe(false);
  });

  it('時間門檻：本關經過 <60s 不觸發，60s 起可觸發', () => {
    const state = createMercyState();
    expect(advanceMercyHeal(state, { ...baseTick, elapsedMs: 59_999 }).spawn).toBe(false);
    expect(advanceMercyHeal(state, { ...baseTick, elapsedMs: 60_000 }).spawn).toBe(true);
  });

  it('冷卻 45s：保底已充能仍須冷卻期滿才生成第二顆', () => {
    let state: MercyState = createMercyState();
    state = advanceMercyHeal(state, { ...baseTick, elapsedMs: 60_000 }).state;
    expect(state.spawned).toBe(1);
    // 低血累計 30s（6 tick × 5s）充飽時間保底；冷卻 45s 未滿仍不得生成。
    state = accrueLowHp(state, 60_000, 6);
    expect(state.lowHpMsSinceSpawn).toBeGreaterThanOrEqual(MERCY_HEAL.pityLowHpMs);
    const tooSoon = advanceMercyHeal(state, { ...baseTick, elapsedMs: 104_999 });
    expect(tooSoon.spawn).toBe(false);
    const ready = advanceMercyHeal(tooSoon.state, { ...baseTick, elapsedMs: 105_000 });
    expect(ready.spawn).toBe(true);
  });

  it('pity 時間保底：無受傷且低血累計 <30s 時，冷卻期滿亦不生成', () => {
    let state: MercyState = createMercyState();
    state = advanceMercyHeal(state, { ...baseTick, elapsedMs: 60_000 }).state;
    // 僅累計 10s 低血（2 tick），冷卻期已滿——保底未充能不生成。
    state = accrueLowHp(state, 60_000, 2);
    const blocked = advanceMercyHeal(state, { ...baseTick, elapsedMs: 150_000 });
    expect(blocked.spawn).toBe(false);
    expect(blocked.state.spawned).toBe(1);
  });

  it('pity 受傷保底：自上次生成起受傷 ≥2 次即保底生成第二顆', () => {
    let state: MercyState = createMercyState();
    state = advanceMercyHeal(state, { ...baseTick, hp: 3, maxHp: 9, elapsedMs: 60_000 }).state;
    expect(state.spawned).toBe(1);
    // 受傷 2 次（HP 3→2→1）；低血累計僅 10s（不足時間保底），受傷數即保底。
    state = advanceMercyHeal(state, { ...baseTick, hp: 2, maxHp: 9, elapsedMs: 65_000 }).state;
    state = advanceMercyHeal(state, { ...baseTick, hp: 1, maxHp: 9, elapsedMs: 70_000 }).state;
    expect(state.hurtsSinceSpawn).toBe(2);
    const ready = advanceMercyHeal(state, { ...baseTick, hp: 1, maxHp: 9, elapsedMs: 105_000 });
    expect(ready.spawn).toBe(true);
  });

  it('回血不計受傷：HP 回升後再下降才累計一次', () => {
    let state: MercyState = createMercyState();
    state = advanceMercyHeal(state, { ...baseTick, hp: 2, maxHp: 6, elapsedMs: 60_000 }).state;
    expect(state.spawned).toBe(1);
    // 拾取回血 2→3（不計）、再受傷 3→2（計 1 次）。
    state = advanceMercyHeal(state, { ...baseTick, hp: 3, maxHp: 6, elapsedMs: 65_000 }).state;
    expect(state.hurtsSinceSpawn).toBe(0);
    state = advanceMercyHeal(state, { ...baseTick, hp: 2, maxHp: 6, elapsedMs: 70_000 }).state;
    expect(state.hurtsSinceSpawn).toBe(1);
  });

  it('每命上限 2 次：第三次評估即使全門檻通過亦不生成', () => {
    let state: MercyState = createMercyState();
    state = advanceMercyHeal(state, { ...baseTick, elapsedMs: 60_000 }).state;
    state = accrueLowHp(state, 60_000, 6);
    state = advanceMercyHeal(state, { ...baseTick, elapsedMs: 120_000 }).state;
    expect(state.spawned).toBe(2);
    state = accrueLowHp(state, 120_000, 6);
    const capped = advanceMercyHeal(state, { ...baseTick, elapsedMs: 300_000 });
    expect(capped.spawn).toBe(false);
    expect(capped.state.spawned).toBe(2);
  });

  it('門檻不過僅重置評估計時（不消耗）；每命狀態由呼叫端重建歸零', () => {
    const state = createMercyState();
    const skipped = advanceMercyHeal(state, { ...baseTick, hp: 5 });
    expect(skipped.state.sinceEvalMs).toBe(0);
    expect(skipped.state.spawned).toBe(0);
    expect(createMercyState().spawned).toBe(0);
  });
});

describe('魔王房 override（§54 難度稽核／v19 pity）', () => {
  it('boss 房：HP ≤2 絕對門檻、12s 起評；首顆固定生成', () => {
    const state = createMercyState();
    // 一般門檻不過（hp 2 > 5/3、elapsed 25s < 60s），boss 房通過。
    expect(advanceMercyHeal(state, { ...baseTick, hp: 2, elapsedMs: 25_000 }).spawn).toBe(false);
    expect(
      advanceMercyHeal(state, { ...baseTick, hp: 2, elapsedMs: 25_000, bossRoom: true }).spawn,
    ).toBe(true);
    // boss 房時間門檻：12s 邊界。
    expect(
      advanceMercyHeal(state, { ...baseTick, hp: 1, elapsedMs: 11_999, bossRoom: true }).spawn,
    ).toBe(false);
  });

  it('boss 房 pity：受傷 1 次即保底；冷卻 18s 期滿才生成', () => {
    let state = createMercyState();
    state = advanceMercyHeal(state, {
      ...baseTick,
      hp: 2,
      elapsedMs: 25_000,
      bossRoom: true,
    }).state;
    expect(state.spawned).toBe(1);
    // 受傷 1 次（HP 2→1）即達 boss 房保底門檻。
    state = advanceMercyHeal(state, {
      ...baseTick,
      hp: 1,
      elapsedMs: 30_000,
      bossRoom: true,
    }).state;
    expect(state.hurtsSinceSpawn).toBe(1);
    expect(
      advanceMercyHeal(state, { ...baseTick, hp: 1, elapsedMs: 42_999, bossRoom: true }).spawn,
    ).toBe(false);
    expect(
      advanceMercyHeal(state, { ...baseTick, hp: 1, elapsedMs: 43_000, bossRoom: true }).spawn,
    ).toBe(true);
  });

  it('boss 房 pity 時間保底：無受傷時低血累計 ≥15s 保底', () => {
    let state = createMercyState();
    state = advanceMercyHeal(state, {
      ...baseTick,
      hp: 1,
      elapsedMs: 25_000,
      bossRoom: true,
    }).state;
    expect(state.spawned).toBe(1);
    // 低血累計 15s（3 tick × 5s）達 boss 房時間保底。
    for (let i = 1; i <= 3; i++) {
      state = advanceMercyHeal(state, {
        ...baseTick,
        hp: 1,
        elapsedMs: 25_000 + i * MERCY_HEAL.evaluateIntervalMs,
        bossRoom: true,
      }).state;
    }
    expect(state.lowHpMsSinceSpawn).toBeGreaterThanOrEqual(MERCY_HEAL.bossPityLowHpMs);
    expect(
      advanceMercyHeal(state, { ...baseTick, hp: 1, elapsedMs: 50_000, bossRoom: true }).spawn,
    ).toBe(true);
  });

  it('EX 上限 1（§7.4 主計畫）：EX 魔王房首顆後不再生成；一般房上限 2 不變', () => {
    let ex = createMercyState();
    ex = advanceMercyHeal(ex, {
      ...baseTick,
      elapsedMs: 25_000,
      bossRoom: true,
      exMode: true,
    }).state;
    expect(ex.spawned).toBe(1);
    // 保底充能＋冷卻期滿仍不生成（EX 每命僅 1 顆）。
    ex = advanceMercyHeal(ex, {
      ...baseTick,
      hp: 0.5,
      elapsedMs: 30_000,
      bossRoom: true,
      exMode: true,
    }).state;
    expect(
      advanceMercyHeal(ex, { ...baseTick, elapsedMs: 90_000, bossRoom: true, exMode: true }).spawn,
    ).toBe(false);
    // 非 EX 魔王房沿用上限 2：受傷保底後第二顆照發。
    let normal = createMercyState();
    normal = advanceMercyHeal(normal, {
      ...baseTick,
      hp: 2,
      elapsedMs: 25_000,
      bossRoom: true,
    }).state;
    normal = advanceMercyHeal(normal, {
      ...baseTick,
      hp: 1,
      elapsedMs: 30_000,
      bossRoom: true,
    }).state;
    expect(advanceMercyHeal(normal, { ...baseTick, elapsedMs: 90_000, bossRoom: true }).spawn).toBe(
      true,
    );
  });
});
