/**
 * converterStore 刷卡估算欄位測試（ADR-002 Phase 1）：
 * cardFeePercent 夾限與持久化、cardRateEnabled 開關、rateSource='card' 全鏈路與歷史分類。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { categorizeHistoryEntry, useConverterStore } from '../converterStore';
import { CARD_FEE_PERCENT_DEFAULT, DEFAULT_RATE_SOURCE } from '../../features/ratewise/constants';
import { CARD_ESTIMATE_PROVIDER_ID } from '../../config/rateProviders';
import { CONVERTER_STORE_KEY } from '../../features/ratewise/storage-keys';
import { getUnitExchangeRateWithBasis } from '../../utils/exchangeRateCalculation';
import type { RateDetails } from '../../utils/offlineStorage';
import type { ConversionHistoryEntry } from '../../features/ratewise/types';

describe('converterStore — 刷卡估算欄位', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useConverterStore.setState({
      rateSource: DEFAULT_RATE_SOURCE,
      rateType: 'spot',
      providerPreference: {
        mode: 'manual',
        manualProvider: { sourceKind: 'bank', providerId: 'bot' },
      },
      cardRateEnabled: false,
      cardFeePercent: CARD_FEE_PERCENT_DEFAULT,
    });
  });

  it('預設：cardRateEnabled=false、cardFeePercent=1.5', () => {
    expect(useConverterStore.getState().cardRateEnabled).toBe(false);
    expect(useConverterStore.getState().cardFeePercent).toBe(1.5);
  });

  it('setCardFeePercent 夾限 0–3 並對齊 0.1 步進', () => {
    const { setCardFeePercent } = useConverterStore.getState();

    setCardFeePercent(2.2);
    expect(useConverterStore.getState().cardFeePercent).toBe(2.2);

    setCardFeePercent(5);
    expect(useConverterStore.getState().cardFeePercent).toBe(3);

    setCardFeePercent(-1);
    expect(useConverterStore.getState().cardFeePercent).toBe(0);

    setCardFeePercent(1.25);
    expect(useConverterStore.getState().cardFeePercent).toBe(1.3);

    setCardFeePercent(Number.NaN);
    expect(useConverterStore.getState().cardFeePercent).toBe(CARD_FEE_PERCENT_DEFAULT);
  });

  it('浮點步進不累積誤差（1.1 + 0.1 → 1.2，非 1.2000000000000002）', () => {
    const { setCardFeePercent } = useConverterStore.getState();
    setCardFeePercent(1.1 + 0.1);
    expect(useConverterStore.getState().cardFeePercent).toBe(1.2);
  });

  it('cardFeePercent 持久化進 ratewise-converter（storage-keys 慣例）', () => {
    useConverterStore.getState().setCardFeePercent(2.5);
    useConverterStore.getState().setCardRateEnabled(true);

    const persisted = JSON.parse(window.localStorage.getItem(CONVERTER_STORE_KEY) ?? '{}') as {
      state?: { cardFeePercent?: number; cardRateEnabled?: boolean };
    };
    expect(persisted.state?.cardFeePercent).toBe(2.5);
    expect(persisted.state?.cardRateEnabled).toBe(true);
  });

  it('__validateAndSanitize 修復損毀欄位（非 boolean／超界手續費）', () => {
    useConverterStore.setState({
      cardRateEnabled: 'yes' as unknown as boolean,
      cardFeePercent: 99,
    });
    useConverterStore.getState().__validateAndSanitize();

    expect(useConverterStore.getState().cardRateEnabled).toBe(false);
    expect(useConverterStore.getState().cardFeePercent).toBe(3);
  });

  it('setRateSource(card) 建立 card-estimate provider ref 且 sanitize 後保留', () => {
    useConverterStore.getState().setRateSource('card');

    const state = useConverterStore.getState();
    expect(state.rateSource).toBe('card');
    expect(state.providerPreference.manualProvider).toEqual({
      sourceKind: 'card',
      providerId: CARD_ESTIMATE_PROVIDER_ID,
    });

    useConverterStore.getState().__validateAndSanitize();
    expect(useConverterStore.getState().rateSource).toBe('card');
  });

  it('S1：persisted cash 切 card 後 rateType 正規化為 spot，估算基準為即期賣出（值-標籤耦合）', () => {
    const details: Record<string, RateDetails> = {
      USD: { name: '美元', spot: { buy: 30.87, sell: 30.97 }, cash: { buy: 30.4, sell: 31.4 } },
    };
    useConverterStore.setState({ rateType: 'cash', rateSource: DEFAULT_RATE_SOURCE });

    useConverterStore.getState().setRateSource('card');

    const state = useConverterStore.getState();
    expect(state.rateSource).toBe('card');
    expect(state.rateType).toBe('spot');

    // 即期存在時估算值 = 即期賣出 30.97 × 1.015，非現金賣出 31.4（高估 1–2% 的回歸鎖定）。
    const { rate } = getUnitExchangeRateWithBasis(
      'USD',
      'TWD',
      details,
      state.rateType,
      'auto',
      null,
      {
        rateSource: 'card',
        exchangeShopRate: null,
        cardFeePercent: 1.5,
      },
    );
    expect(rate).toBeCloseTo(30.97 * 1.015, 8);
  });

  it('S1：persisted card＋cash 於 hydrate sanitize 時正規化為 spot', () => {
    // persist 同時保存 providerPreference（sanitize 的 rateSource 推導 SSOT），需一併模擬。
    useConverterStore.setState({
      rateSource: 'card',
      rateType: 'cash',
      providerPreference: {
        mode: 'manual',
        manualProvider: { sourceKind: 'card', providerId: CARD_ESTIMATE_PROVIDER_ID },
      },
    });
    useConverterStore.getState().__validateAndSanitize();

    expect(useConverterStore.getState().rateSource).toBe('card');
    expect(useConverterStore.getState().rateType).toBe('spot');
  });

  it('S1：card 下 setRateType(cash) 被正規化擋下（維持 spot）', () => {
    useConverterStore.getState().setRateSource('card');
    useConverterStore.getState().setRateType('cash');

    expect(useConverterStore.getState().rateType).toBe('spot');
  });

  it('categorizeHistoryEntry：sourceKind=card → card（不誤標 spot/cash）', () => {
    const entry: ConversionHistoryEntry = {
      from: 'TWD',
      to: 'JPY',
      amount: '1000',
      result: '4800',
      time: '剛剛',
      timestamp: Date.now(),
      rateType: 'spot',
      sourceKind: 'card',
      providerId: CARD_ESTIMATE_PROVIDER_ID,
      providerSelectionMode: 'manual',
      rateMode: 'auto',
      schemaVersion: 2,
    };
    expect(categorizeHistoryEntry(entry)).toBe('card');
  });
});
