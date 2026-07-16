import { beforeEach, describe, expect, it } from 'vitest';
import {
  MARKET_PREFS_STORAGE_KEY,
  MARKET_PREFS_STORAGE_VERSION,
  parsePersistedMarketPrefs,
  useMarketPrefsStore,
} from './marketPrefsStore';

function resetStore() {
  window.localStorage.removeItem(MARKET_PREFS_STORAGE_KEY);
  useMarketPrefsStore.setState({ favorites: [] });
}

describe('useMarketPrefsStore', () => {
  beforeEach(resetStore);

  it('starts with no favorites', () => {
    expect(useMarketPrefsStore.getState().favorites).toEqual([]);
  });

  it('toggles a symbol into and out of favorites', () => {
    useMarketPrefsStore.getState().toggleFavorite('BTCUSDT');
    expect(useMarketPrefsStore.getState().favorites).toEqual(['BTCUSDT']);

    useMarketPrefsStore.getState().toggleFavorite('ETHUSDT');
    expect(useMarketPrefsStore.getState().favorites).toEqual(['BTCUSDT', 'ETHUSDT']);

    useMarketPrefsStore.getState().toggleFavorite('BTCUSDT');
    expect(useMarketPrefsStore.getState().favorites).toEqual(['ETHUSDT']);
  });

  it('persists favorites to localStorage', () => {
    useMarketPrefsStore.getState().toggleFavorite('SOLUSDT');

    const raw = window.localStorage.getItem(MARKET_PREFS_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw ?? '{}') as { state: unknown; version: number };
    expect(stored.version).toBe(MARKET_PREFS_STORAGE_VERSION);
    expect(stored.state).toEqual({ favorites: ['SOLUSDT'] });
  });

  it('hydrates persisted favorites for the current version', async () => {
    window.localStorage.setItem(
      MARKET_PREFS_STORAGE_KEY,
      JSON.stringify({
        state: { favorites: ['ETHUSDT'] },
        version: MARKET_PREFS_STORAGE_VERSION,
      }),
    );

    await useMarketPrefsStore.persist.rehydrate();
    expect(useMarketPrefsStore.getState().favorites).toEqual(['ETHUSDT']);
  });

  it('resets to defaults when hydrating a stale persisted version', async () => {
    window.localStorage.setItem(
      MARKET_PREFS_STORAGE_KEY,
      JSON.stringify({ state: { favorites: ['BTCUSDT'] }, version: 0 }),
    );

    await useMarketPrefsStore.persist.rehydrate();
    expect(useMarketPrefsStore.getState().favorites).toEqual([]);
  });
});

describe('parsePersistedMarketPrefs', () => {
  it('accepts a valid favorites payload and dedupes entries', () => {
    expect(parsePersistedMarketPrefs({ favorites: ['BTCUSDT', 'ETHUSDT', 'BTCUSDT'] })).toEqual({
      favorites: ['BTCUSDT', 'ETHUSDT'],
    });
  });

  it('rejects unknown symbols so corrupted data resets safely', () => {
    expect(parsePersistedMarketPrefs({ favorites: ['SHIBUSDT'] })).toBeNull();
  });

  it('rejects malformed payloads', () => {
    expect(parsePersistedMarketPrefs(null)).toBeNull();
    expect(parsePersistedMarketPrefs({ favorites: 'BTCUSDT' })).toBeNull();
    expect(parsePersistedMarketPrefs(42)).toBeNull();
  });
});
