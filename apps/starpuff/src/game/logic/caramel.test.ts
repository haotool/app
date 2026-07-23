import { describe, expect, it } from 'vitest';
import {
  CARAMEL,
  CARAMEL_CLEAR,
  applyCaramel,
  caramelActive,
  caramelSpeedMul,
  tickCaramel,
} from './caramel';

describe('焦糖化（§5 W2）', () => {
  it('規格定值：減速 30%（倍率 0.7）、持續 3s', () => {
    expect(CARAMEL.slowMul).toBeCloseTo(0.7, 5);
    expect(CARAMEL.durationMs).toBe(3000);
  });

  it('沾身滿窗、重複沾波刷新不疊加', () => {
    const state = applyCaramel();
    expect(state.remainingMs).toBe(CARAMEL.durationMs);
    const half = tickCaramel(state, 1500);
    expect(applyCaramel().remainingMs).toBe(CARAMEL.durationMs);
    expect(half.remainingMs).toBe(1500);
  });

  it('倒數期滿自然解除；未沾身恆為非活', () => {
    let state = applyCaramel();
    state = tickCaramel(state, 2999);
    expect(caramelActive(state)).toBe(true);
    state = tickCaramel(state, 1);
    expect(caramelActive(state)).toBe(false);
    expect(caramelActive(CARAMEL_CLEAR)).toBe(false);
  });

  it('移速倍率：沾身期 0.7、解除後 1', () => {
    expect(caramelSpeedMul(applyCaramel())).toBeCloseTo(CARAMEL.slowMul, 5);
    expect(caramelSpeedMul(CARAMEL_CLEAR)).toBe(1);
  });

  it('tick 不產生負值', () => {
    const state = tickCaramel(applyCaramel(), 99999);
    expect(state.remainingMs).toBe(0);
  });
});
