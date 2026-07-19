import { beforeEach, describe, expect, it } from 'vitest';
import {
  MARKET_PREFS_STORAGE_KEY,
  MARKET_PREFS_STORAGE_VERSION,
  parsePersistedMarketPrefs,
  useMarketPrefsStore,
} from './marketPrefsStore';

function resetStore() {
  window.localStorage.removeItem(MARKET_PREFS_STORAGE_KEY);
  useMarketPrefsStore.setState({
    favorites: [],
    indicators: [],
    macd: true,
    trendLines: false,
    supportResistance: false,
  });
}

describe('useMarketPrefsStore', () => {
  beforeEach(resetStore);

  it('starts with no favorites and no indicators', () => {
    expect(useMarketPrefsStore.getState().favorites).toEqual([]);
    expect(useMarketPrefsStore.getState().indicators).toEqual([]);
  });

  it('enables MACD by default and keeps trend tools off', () => {
    expect(useMarketPrefsStore.getState().macd).toBe(true);
    expect(useMarketPrefsStore.getState().trendLines).toBe(false);
    expect(useMarketPrefsStore.getState().supportResistance).toBe(false);
  });

  it('toggles the chart analysis switches', () => {
    useMarketPrefsStore.getState().toggleMacd();
    useMarketPrefsStore.getState().toggleTrendLines();
    useMarketPrefsStore.getState().toggleSupportResistance();
    expect(useMarketPrefsStore.getState().macd).toBe(false);
    expect(useMarketPrefsStore.getState().trendLines).toBe(true);
    expect(useMarketPrefsStore.getState().supportResistance).toBe(true);

    useMarketPrefsStore.getState().toggleMacd();
    expect(useMarketPrefsStore.getState().macd).toBe(true);
  });

  it('toggles a symbol into and out of favorites', () => {
    useMarketPrefsStore.getState().toggleFavorite('BTCUSDT');
    expect(useMarketPrefsStore.getState().favorites).toEqual(['BTCUSDT']);

    useMarketPrefsStore.getState().toggleFavorite('ETHUSDT');
    expect(useMarketPrefsStore.getState().favorites).toEqual(['BTCUSDT', 'ETHUSDT']);

    useMarketPrefsStore.getState().toggleFavorite('BTCUSDT');
    expect(useMarketPrefsStore.getState().favorites).toEqual(['ETHUSDT']);
  });

  it('toggles indicators on and off', () => {
    useMarketPrefsStore.getState().toggleIndicator('ma7');
    useMarketPrefsStore.getState().toggleIndicator('ema12');
    expect(useMarketPrefsStore.getState().indicators).toEqual(['ma7', 'ema12']);

    useMarketPrefsStore.getState().toggleIndicator('ma7');
    expect(useMarketPrefsStore.getState().indicators).toEqual(['ema12']);
  });

  it('persists favorites, indicators and analysis switches to localStorage', () => {
    useMarketPrefsStore.getState().toggleFavorite('SOLUSDT');
    useMarketPrefsStore.getState().toggleIndicator('ma25');
    useMarketPrefsStore.getState().toggleMacd();
    useMarketPrefsStore.getState().toggleTrendLines();

    const raw = window.localStorage.getItem(MARKET_PREFS_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw ?? '{}') as { state: unknown; version: number };
    expect(stored.version).toBe(MARKET_PREFS_STORAGE_VERSION);
    expect(stored.state).toEqual({
      favorites: ['SOLUSDT'],
      indicators: ['ma25'],
      macd: false,
      trendLines: true,
      supportResistance: false,
    });
  });

  it('hydrates persisted prefs for the current version', async () => {
    window.localStorage.setItem(
      MARKET_PREFS_STORAGE_KEY,
      JSON.stringify({
        state: {
          favorites: ['ETHUSDT'],
          indicators: ['ma7', 'ema26'],
          macd: false,
          trendLines: true,
          supportResistance: true,
        },
        version: MARKET_PREFS_STORAGE_VERSION,
      }),
    );

    await useMarketPrefsStore.persist.rehydrate();
    expect(useMarketPrefsStore.getState().favorites).toEqual(['ETHUSDT']);
    expect(useMarketPrefsStore.getState().indicators).toEqual(['ma7', 'ema26']);
    expect(useMarketPrefsStore.getState().macd).toBe(false);
    expect(useMarketPrefsStore.getState().trendLines).toBe(true);
    expect(useMarketPrefsStore.getState().supportResistance).toBe(true);
  });

  it('migrates v1 payloads keeping favorites and defaulting indicators', async () => {
    window.localStorage.setItem(
      MARKET_PREFS_STORAGE_KEY,
      JSON.stringify({ state: { favorites: ['BTCUSDT'] }, version: 1 }),
    );

    await useMarketPrefsStore.persist.rehydrate();
    expect(useMarketPrefsStore.getState().favorites).toEqual(['BTCUSDT']);
    expect(useMarketPrefsStore.getState().indicators).toEqual([]);
    expect(useMarketPrefsStore.getState().macd).toBe(true);
  });

  it('migrates v2 payloads keeping data and defaulting the analysis switches', async () => {
    window.localStorage.setItem(
      MARKET_PREFS_STORAGE_KEY,
      JSON.stringify({
        state: { favorites: ['BTCUSDT'], indicators: ['ma7'] },
        version: 2,
      }),
    );

    await useMarketPrefsStore.persist.rehydrate();
    expect(useMarketPrefsStore.getState().favorites).toEqual(['BTCUSDT']);
    expect(useMarketPrefsStore.getState().indicators).toEqual(['ma7']);
    expect(useMarketPrefsStore.getState().macd).toBe(true);
    expect(useMarketPrefsStore.getState().trendLines).toBe(false);
    expect(useMarketPrefsStore.getState().supportResistance).toBe(false);
  });

  it('resets to defaults when hydrating a stale persisted version', async () => {
    window.localStorage.setItem(
      MARKET_PREFS_STORAGE_KEY,
      JSON.stringify({ state: { favorites: ['BTCUSDT'] }, version: 0 }),
    );

    await useMarketPrefsStore.persist.rehydrate();
    expect(useMarketPrefsStore.getState().favorites).toEqual([]);
    expect(useMarketPrefsStore.getState().indicators).toEqual([]);
  });
});

describe('parsePersistedMarketPrefs', () => {
  it('accepts a valid payload and dedupes entries', () => {
    expect(
      parsePersistedMarketPrefs({
        favorites: ['BTCUSDT', 'ETHUSDT', 'BTCUSDT'],
        indicators: ['ma7', 'ma7', 'ema12'],
        macd: false,
        trendLines: true,
        supportResistance: true,
      }),
    ).toEqual({
      favorites: ['BTCUSDT', 'ETHUSDT'],
      indicators: ['ma7', 'ema12'],
      macd: false,
      trendLines: true,
      supportResistance: true,
    });
  });

  it('defaults missing fields for legacy payloads', () => {
    expect(parsePersistedMarketPrefs({ favorites: ['BTCUSDT'] })).toEqual({
      favorites: ['BTCUSDT'],
      indicators: [],
      macd: true,
      trendLines: false,
      supportResistance: false,
    });
  });

  it('rejects unknown symbols or indicators so corrupted data resets safely', () => {
    expect(parsePersistedMarketPrefs({ favorites: ['SHIBUSDT'] })).toBeNull();
    expect(parsePersistedMarketPrefs({ favorites: [], indicators: ['rsi14'] })).toBeNull();
  });

  it('rejects malformed payloads', () => {
    expect(parsePersistedMarketPrefs(null)).toBeNull();
    expect(parsePersistedMarketPrefs({ favorites: 'BTCUSDT' })).toBeNull();
    expect(parsePersistedMarketPrefs(42)).toBeNull();
  });
});
