import { describe, expect, it } from 'vitest';
import {
  BUFF_SPECS,
  buffAccelMul,
  buffDamageMul,
  buffSpeedMul,
  consumeShieldBlock,
  createBuffState,
  pickupBuff,
  tickBuff,
} from './buffs';

describe('BUFF_SPECS 表（§68）', () => {
  it('時效落於 10–15s 帶且效果為有界加成（非無敵）', () => {
    for (const spec of Object.values(BUFF_SPECS)) {
      expect(spec.durationMs).toBeGreaterThanOrEqual(10_000);
      expect(spec.durationMs).toBeLessThanOrEqual(15_000);
      expect(spec.damageMul).toBeLessThanOrEqual(1.5);
      expect(spec.speedMul).toBeLessThanOrEqual(1.3);
    }
    expect(BUFF_SPECS.shield.blocksOneHit).toBe(true);
    expect(BUFF_SPECS.power.damageMul).toBe(1.5);
    expect(BUFF_SPECS.swift.speedMul).toBe(1.3);
    expect(BUFF_SPECS.swift.accelMul).toBe(1.4);
  });
});

describe('增益狀態機（§68）', () => {
  it('拾取啟動時效；同時僅存一個、後拾覆蓋重計', () => {
    let state = pickupBuff(createBuffState(), 'shield');
    expect(state).toEqual({ id: 'shield', remainingMs: 15_000 });
    state = tickBuff(state, 5_000).state;
    state = pickupBuff(state, 'power');
    expect(state).toEqual({ id: 'power', remainingMs: 10_000 });
  });

  it('計時期滿失效並回報 expired 單次', () => {
    let result = tickBuff(pickupBuff(createBuffState(), 'power'), 9_999);
    expect(result.expired).toBe(false);
    result = tickBuff(result.state, 1);
    expect(result.expired).toBe(true);
    expect(result.state.id).toBeNull();
    expect(tickBuff(result.state, 1000).expired).toBe(false);
  });

  it('護盾吸收 1 次即失效；非護盾不格擋', () => {
    const shielded = pickupBuff(createBuffState(), 'shield');
    const blocked = consumeShieldBlock(shielded);
    expect(blocked.blocked).toBe(true);
    expect(blocked.state.id).toBeNull();
    expect(consumeShieldBlock(blocked.state).blocked).toBe(false);
    expect(consumeShieldBlock(pickupBuff(createBuffState(), 'swift')).blocked).toBe(false);
  });

  it('倍率查詢：無 buff 恆 1；power/swift 各自生效', () => {
    const none = createBuffState();
    expect([buffDamageMul(none), buffSpeedMul(none), buffAccelMul(none)]).toEqual([1, 1, 1]);
    const power = pickupBuff(none, 'power');
    expect(buffDamageMul(power)).toBe(1.5);
    expect(buffSpeedMul(power)).toBe(1);
    const swift = pickupBuff(none, 'swift');
    expect(buffSpeedMul(swift)).toBe(1.3);
    expect(buffAccelMul(swift)).toBe(1.4);
  });
});
