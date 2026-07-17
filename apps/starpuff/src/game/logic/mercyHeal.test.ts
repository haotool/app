import { describe, expect, it } from 'vitest';
import { MERCY_HEAL, advanceMercyHeal, createMercyState, type MercyState } from './mercyHeal';

// 標準可觸發情境：低血（1/5 ≤ 1/3）、久戰（≥60s）、RNG 必中。
const baseTick = {
  deltaMs: MERCY_HEAL.evaluateIntervalMs,
  elapsedMs: 90_000,
  hp: 1,
  maxHp: 5,
  rng: () => 0,
};

describe('advanceMercyHeal 慈悲補血決策（§62）', () => {
  it('評估間隔未到不擲骰；到期且全門檻通過即生成', () => {
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

  it('冷卻 45s：生成後 45s 內不再生成，期滿恢復', () => {
    let state: MercyState = createMercyState();
    state = advanceMercyHeal(state, { ...baseTick, elapsedMs: 60_000 }).state;
    expect(state.spawned).toBe(1);
    const tooSoon = advanceMercyHeal(state, { ...baseTick, elapsedMs: 104_999 });
    expect(tooSoon.spawn).toBe(false);
    const ready = advanceMercyHeal(tooSoon.state, { ...baseTick, elapsedMs: 105_000 });
    expect(ready.spawn).toBe(true);
  });

  it('每命上限 2 次：第三次評估即使全門檻通過亦不生成', () => {
    let state: MercyState = createMercyState();
    state = advanceMercyHeal(state, { ...baseTick, elapsedMs: 60_000 }).state;
    state = advanceMercyHeal(state, { ...baseTick, elapsedMs: 120_000 }).state;
    expect(state.spawned).toBe(2);
    const capped = advanceMercyHeal(state, { ...baseTick, elapsedMs: 300_000 });
    expect(capped.spawn).toBe(false);
    expect(capped.state.spawned).toBe(2);
  });

  it('RNG 注入：0.35 為機率上界（rng<0.35 中、≥0.35 不中）；未中不消耗次數', () => {
    const state = createMercyState();
    const miss = advanceMercyHeal(state, { ...baseTick, rng: () => 0.35 });
    expect(miss.spawn).toBe(false);
    expect(miss.state.spawned).toBe(0);
    const hit = advanceMercyHeal(state, { ...baseTick, rng: () => 0.349 });
    expect(hit.spawn).toBe(true);
  });

  it('門檻不過僅重置評估計時（不擲骰不消耗）；每命狀態由呼叫端重建歸零', () => {
    const state = createMercyState();
    const skipped = advanceMercyHeal(state, { ...baseTick, hp: 5 });
    expect(skipped.state.sinceEvalMs).toBe(0);
    expect(skipped.state.spawned).toBe(0);
    expect(createMercyState().spawned).toBe(0);
  });
});
