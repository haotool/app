/**
 * converterStore 冷載 rehydrate 契約（issue #666 盤點揭露）。
 *
 * localStorage 為同步 storage：persist 的 onRehydrateStorage 後置回呼於 create() 內
 * 同步觸發，此時模組綁定 useConverterStore 仍在 TDZ；舊寫法經模組綁定呼叫
 * getState() 會拋 ReferenceError 且被 middleware 靜默吞掉——一次性遷移與 sanitize
 * 於冷載全滅、hasHydrated() 恆 false（真瀏覽器 production build 同樣重現）。
 *
 * 本檔以 vi.resetModules + 動態 import 重演「模組首次載入」的真實冷載路徑
 * （不直接呼叫 __migrateFromLegacy，鑑別回呼是否真的執行）；
 * 壞版（還原模組綁定寫法）三條測試全紅。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const STORE_MODULE = '../converterStore';
const STORE_KEY = 'ratewise-converter';
const WAVE_A_KEY = 'ratewise:converterV2';

async function importFreshStore() {
  const mod = await import(STORE_MODULE);
  return mod.useConverterStore;
}

describe('converterStore 冷載 rehydrate（onRehydrateStorage TDZ 契約）', () => {
  beforeEach(() => {
    vi.resetModules();
    window.localStorage.clear();
  });

  it('模組首次載入即完成 hydration（hasHydrated=true、onFinishHydration 已觸發）', async () => {
    window.localStorage.setItem(
      STORE_KEY,
      JSON.stringify({ state: { singleConverterVariant: 'v2' }, version: 0 }),
    );

    const useConverterStore = await importFreshStore();

    expect(useConverterStore.persist.hasHydrated()).toBe(true);
    expect(useConverterStore.getState().singleConverterVariant).toBe('v2');
  });

  it('wave-A legacy converter key 於冷載自動遷移併入 store 並刪除舊 key', async () => {
    window.localStorage.setItem(WAVE_A_KEY, 'v2');

    const useConverterStore = await importFreshStore();

    expect(useConverterStore.getState().singleConverterVariant).toBe('v2');
    expect(window.localStorage.getItem(WAVE_A_KEY)).toBeNull();
    const persisted = JSON.parse(window.localStorage.getItem(STORE_KEY) ?? '{}') as {
      state?: { singleConverterVariant?: string };
    };
    expect(persisted.state?.singleConverterVariant).toBe('v2');
  });

  it('損毀 persisted 欄位於冷載自動 sanitize 回合法值', async () => {
    window.localStorage.setItem(
      STORE_KEY,
      JSON.stringify({
        state: { rateType: 'INVALID', favorites: ['USD', 'BOGUS', 'TWD'] },
        version: 0,
      }),
    );

    const useConverterStore = await importFreshStore();

    const state = useConverterStore.getState();
    expect(state.rateType).toBe('spot');
    expect(state.favorites).toEqual(['USD']);
  });
});
