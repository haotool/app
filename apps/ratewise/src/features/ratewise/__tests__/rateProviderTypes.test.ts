/**
 * Rate Provider Types - Unit Tests
 *
 * 驗證 provider 領域型別與相容轉換函式：
 * 1. toLegacyRateSource：從 RateProviderRef 轉回 legacy RateSource
 * 2. 型別組合：RateProviderRef / RateProviderPreference / ResolvedRateProvider
 *
 * 注意：本檔僅針對純函式與型別，不應引入 React / store / DOM。
 */

import { describe, it, expect } from 'vitest';
import type { RateSource } from '../types';
import {
  toLegacyRateSource,
  type ProviderSelectionMode,
  type RateProviderId,
  type RateProviderPreference,
  type RateProviderRef,
  type RateSourceKind,
  type ResolvedRateProvider,
} from '../rateProviderTypes';

describe('rateProviderTypes - 型別宣告', () => {
  it('應允許組合 RateProviderRef 與 RateProviderPreference', () => {
    const ref: RateProviderRef = {
      sourceKind: 'bank',
      providerId: 'bot',
    };
    const preference: RateProviderPreference = {
      mode: 'manual',
      manualProvider: ref,
    };

    expect(preference.manualProvider).toEqual({
      sourceKind: 'bank',
      providerId: 'bot',
    });
  });

  it('應允許 ProviderSelectionMode 為 best 或 manual', () => {
    const modes: ProviderSelectionMode[] = ['best', 'manual'];
    expect(modes).toHaveLength(2);
  });

  it('應允許 RateProviderId 接受擴充字串（例如未來新增的 provider）', () => {
    const known: RateProviderId = 'bot';
    const moneybox: RateProviderId = 'moneybox';
    const future: RateProviderId = 'future-shop';
    expect([known, moneybox, future]).toEqual(['bot', 'moneybox', 'future-shop']);
  });

  it('應允許 ResolvedRateProvider 攜帶選擇結果與原因', () => {
    const resolved: ResolvedRateProvider = {
      selectionMode: 'best',
      sourceKind: 'exchange-shop',
      providerId: 'moneybox',
      reason: 'best-rate',
    };
    expect(resolved.reason).toBe('best-rate');
  });
});

describe('toLegacyRateSource', () => {
  it('應將 sourceKind=bank 對應到 legacy RateSource=bank', () => {
    const ref: RateProviderRef = { sourceKind: 'bank', providerId: 'bot' };
    expect(toLegacyRateSource(ref)).toBe<RateSource>('bank');
  });

  it('應將 sourceKind=exchange-shop 對應到 legacy RateSource=exchange-shop', () => {
    const ref: RateProviderRef = {
      sourceKind: 'exchange-shop',
      providerId: 'moneybox',
    };
    expect(toLegacyRateSource(ref)).toBe<RateSource>('exchange-shop');
  });

  it('忽略 providerId，只取 sourceKind 作為 legacy 對應', () => {
    const ref: RateProviderRef = {
      sourceKind: 'exchange-shop',
      providerId: 'future-shop',
    };
    expect(toLegacyRateSource(ref)).toBe('exchange-shop');
  });
});

describe('round-trip 相容轉換', () => {
  it('ref → legacy 應保留 sourceKind', () => {
    const refs: RateProviderRef[] = [
      { sourceKind: 'bank', providerId: 'bot' },
      { sourceKind: 'exchange-shop', providerId: 'moneybox' },
    ];
    for (const ref of refs) {
      expect(toLegacyRateSource(ref)).toBe(ref.sourceKind);
    }
  });
});

describe('RateSourceKind 與 legacy RateSource 的等價性', () => {
  it('RateSourceKind 應可指派給 legacy RateSource', () => {
    const kind: RateSourceKind = 'bank';
    const legacy: RateSource = kind;
    expect(legacy).toBe('bank');
  });
});
