import { beforeEach, describe, expect, it } from 'vitest';
import {
  MARKET_PREFS_STORAGE_KEY,
  MARKET_PREFS_STORAGE_VERSION,
  parsePersistedMarketPrefs,
  useMarketPrefsStore,
} from './marketPrefsStore';

function resetStore() {
  window.localStorage.removeItem(MARKET_PREFS_STORAGE_KEY);
  useMarketPrefsStore.setState({ favorites: [], indicators: [] });
}

describe('useMarketPrefsStore', () => {
  beforeEach(resetStore);

  it('starts with no favorites and no indicators', () => {
    expect(useMarketPrefsStore.getState().favorites).toEqual([]);
    expect(useMarketPrefsStore.getState().indicators).toEqual([]);
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

  it('persists favorites and indicators to localStorage', () => {
    useMarketPrefsStore.getState().toggleFavorite('SOLUSDT');
    useMarketPrefsStore.getState().toggleIndicator('ma25');

    const raw = window.localStorage.getItem(MARKET_PREFS_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw ?? '{}') as { state: unknown; version: number };
    expect(stored.version).toBe(MARKET_PREFS_STORAGE_VERSION);
    expect(stored.state).toEqual({ favorites: ['SOLUSDT'], indicators: ['ma25'] });
  });

  it('hydrates persisted prefs for the current version', async () => {
    window.localStorage.setItem(
      MARKET_PREFS_STORAGE_KEY,
      JSON.stringify({
        state: { favorites: ['ETHUSDT'], indicators: ['ma7', 'ema26'] },
        version: MARKET_PREFS_STORAGE_VERSION,
      }),
    );

    await useMarketPrefsStore.persist.rehydrate();
    expect(useMarketPrefsStore.getState().favorites).toEqual(['ETHUSDT']);
    expect(useMarketPrefsStore.getState().indicators).toEqual(['ma7', 'ema26']);
  });

  it('migrates v1 payloads keeping favorites and defaulting indicators', async () => {
    window.localStorage.setItem(
      MARKET_PREFS_STORAGE_KEY,
      JSON.stringify({ state: { favorites: ['BTCUSDT'] }, version: 1 }),
    );

    await useMarketPrefsStore.persist.rehydrate();
    expect(useMarketPrefsStore.getState().favorites).toEqual(['BTCUSDT']);
    expect(useMarketPrefsStore.getState().indicators).toEqual([]);
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
      }),
    ).toEqual({ favorites: ['BTCUSDT', 'ETHUSDT'], indicators: ['ma7', 'ema12'] });
  });

  it('defaults indicators for v1 payloads without the field', () => {
    expect(parsePersistedMarketPrefs({ favorites: ['BTCUSDT'] })).toEqual({
      favorites: ['BTCUSDT'],
      indicators: [],
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
