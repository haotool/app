// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONVERTER_STORE_KEY, STORAGE_KEYS } from '../../features/ratewise/storage-keys';

afterEach(() => {
  localStorage.clear();
  vi.resetModules();
});

describe('converterStore 冷載 hydrate', () => {
  it('首次 import 即遷移舊幣別與模式並清除舊 key', async () => {
    localStorage.setItem(STORAGE_KEYS.FROM_CURRENCY, 'USD');
    localStorage.setItem(STORAGE_KEYS.CURRENCY_CONVERTER_MODE, 'multi');
    const { useConverterStore } = await import('../converterStore');
    expect(useConverterStore.persist.hasHydrated()).toBe(true);
    expect(useConverterStore.getState().fromCurrency).toBe('USD');
    expect(useConverterStore.getState().lastConverterView).toBe('multi');
    expect(localStorage.getItem(STORAGE_KEYS.FROM_CURRENCY)).toBeNull();
  });

  it('首次 import 即修復損毀持久欄位並完成 hydrate', async () => {
    localStorage.setItem(
      CONVERTER_STORE_KEY,
      JSON.stringify({
        state: {
          fromCurrency: 'INVALID',
          favorites: ['INVALID', 'JPY'],
          lastConverterView: 'broken',
        },
        version: 0,
      }),
    );
    const { useConverterStore } = await import('../converterStore');
    expect(useConverterStore.persist.hasHydrated()).toBe(true);
    expect(useConverterStore.getState().fromCurrency).toBe('TWD');
    expect(useConverterStore.getState().favorites).toEqual(['JPY']);
    expect(useConverterStore.getState().lastConverterView).toBe('single');
  });
});
