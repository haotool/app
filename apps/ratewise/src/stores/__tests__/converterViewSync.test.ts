// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from 'vitest';
import { useConverterStore } from '../converterStore';

describe('converterStore single↔multi rate sync (E4-T3)', () => {
  beforeEach(() => {
    useConverterStore.setState({
      rateType: 'spot',
      rateSource: 'bank',
      lastConverterView: 'single',
    });
  });

  it('setRateType 後 rateType 在 store 中可被 multi 頁讀取', () => {
    useConverterStore.getState().setRateType('cash');
    expect(useConverterStore.getState().rateType).toBe('cash');
  });

  it('setRateSource 後 rateSource 與 rateType 同步可被 single/multi 共用', () => {
    useConverterStore.getState().setRateSource('exchange-shop');
    const state = useConverterStore.getState();
    expect(state.rateSource).toBe('exchange-shop');
    expect(state.rateType).toBe('cash');
  });

  it('lastConverterView 仍可記錄使用者最後停留模式', () => {
    useConverterStore.getState().setLastConverterView('multi');
    expect(useConverterStore.getState().lastConverterView).toBe('multi');
  });
});
