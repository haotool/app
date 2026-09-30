// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const gate = vi.hoisted(() => ({ enabled: true }));
vi.mock('@app/shared/fx/public', () => ({ isFxV3Public: () => gate.enabled }));
vi.mock('@app/shared/fx/release', () => ({
  ACTIVE_RELEASE_KEY: 'ratewise.fx.v3.active',
  fetchVerifiedObject: vi.fn(),
  loadRelease: vi.fn(),
  restoreRelease: vi.fn((value: unknown) => Promise.resolve(value)),
}));
vi.mock('@app/shared/fx', () => ({
  compareCodePoints: (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0),
  validateProviderSnapshot: () => true,
}));

import { fetchVerifiedObject, loadRelease, restoreRelease } from '@app/shared/fx/release';
import {
  clearFxV3Storage,
  fetchFxHistory,
  readActiveRelease,
  refreshActiveRelease,
} from '../fxSnapshotService';

const release = { current: { releaseId: 'current' }, snapshots: [], manifest: { providers: [] } };
const keys = () =>
  Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter(
    (key): key is string => key !== null,
  );
const saveHistory = (key: string, savedAt: number) =>
  localStorage.setItem(key, JSON.stringify({ savedAt, rows: [] }));

beforeEach(() => {
  localStorage.clear();
  clearFxV3Storage();
  gate.enabled = true;
  vi.mocked(loadRelease).mockResolvedValue(release as never);
  vi.mocked(restoreRelease).mockImplementation((value) => Promise.resolve(value as never));
  vi.mocked(fetchVerifiedObject).mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe('FX v3 storage retention', () => {
  it('keeps the newest four history keys and evicts older entries', async () => {
    saveHistory('ratewise.fx.v3.history:old:series', 0);
    for (let i = 0; i < 6; i++) saveHistory(`ratewise.fx.v3.history:current:series-${i}`, i + 1);

    await refreshActiveRelease();

    const currentKeys = keys();
    expect(currentKeys).toContain('ratewise.fx.v3.active');
    expect(currentKeys.filter((key) => key.startsWith('ratewise.fx.v3.history:'))).toHaveLength(4);
    expect(currentKeys.some((key) => key.includes(':old:'))).toBe(false);
    expect(currentKeys).not.toContain('ratewise.fx.v3.history:current:series-0');
    expect(currentKeys).toContain('ratewise.fx.v3.history:current:series-5');
  });

  it('retains recent history keys across releases within the fixed bound', async () => {
    saveHistory('ratewise.fx.v3.history:old:series', 0);
    for (let i = 1; i <= 3; i++) saveHistory(`ratewise.fx.v3.history:current:series-${i}`, i);

    await refreshActiveRelease();

    expect(keys().filter((key) => key.startsWith('ratewise.fx.v3.history:'))).toHaveLength(4);
    expect(keys()).toContain('ratewise.fx.v3.history:old:series');
  });

  it('evicts oldest history by saved time even when storage enumerates keys out of order', async () => {
    const names = ['a', 'b', 'c', 'd', 'e', 'f'];
    names.forEach((name, index) => saveHistory(`ratewise.fx.v3.history:${name}:series`, index + 1));
    const shuffled = [...names].reverse().map((name) => `ratewise.fx.v3.history:${name}:series`);
    vi.spyOn(localStorage, 'key').mockImplementation((index) => shuffled[index] ?? null);

    await refreshActiveRelease();

    expect(localStorage.getItem('ratewise.fx.v3.history:a:series')).toBeNull();
    expect(localStorage.getItem('ratewise.fx.v3.history:b:series')).toBeNull();
    expect(localStorage.getItem('ratewise.fx.v3.history:c:series')).not.toBeNull();
    expect(localStorage.getItem('ratewise.fx.v3.history:d:series')).not.toBeNull();
    expect(localStorage.getItem('ratewise.fx.v3.history:f:series')).not.toBeNull();
  });

  it('evicts oldest history and retries an active release write after quota', async () => {
    saveHistory('ratewise.fx.v3.history:old:series', 1);
    localStorage.setItem('split-meow-storage', 'settings');
    const setItem = vi.spyOn(localStorage, 'setItem');
    setItem.mockImplementationOnce(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });

    await expect(refreshActiveRelease()).resolves.toBe(release);
    expect(localStorage.getItem('ratewise.fx.v3.history:old:series')).toBeNull();
    expect(localStorage.getItem('ratewise.fx.v3.active')).toBe(JSON.stringify(release));
    expect(localStorage.getItem('split-meow-storage')).toBe('settings');
  });

  it('keeps the previous active release when quota persists after history eviction', async () => {
    const previous = JSON.stringify({ previous: true });
    localStorage.setItem('ratewise.fx.v3.active', previous);
    saveHistory('ratewise.fx.v3.history:old:series', 1);
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });

    await expect(refreshActiveRelease()).resolves.toBe(release);

    expect(localStorage.getItem('ratewise.fx.v3.history:old:series')).toBeNull();
    expect(localStorage.getItem('ratewise.fx.v3.active')).toBe(previous);
  });

  it('keeps the previous history window when saving its replacement hits persistent quota', async () => {
    const history = {
      current: { releaseId: 'current' },
      snapshots: [{ quotes: [{ quoteSeriesId: 'series', providerId: 'bot' }] }],
      manifest: {
        history: [{ providerId: 'bot', date: '2026-09-01', snapshot: {} }],
      },
    };
    const key = 'ratewise.fx.v3.history:current:series';
    const previous = JSON.stringify({
      savedAt: 1,
      rows: [{ date: '2026-09-01', rate: '41', quoteId: 'previous', sourcePublishedAt: null }],
    });
    localStorage.setItem('ratewise.fx.v3.active', JSON.stringify(history));
    localStorage.setItem(key, previous);
    vi.mocked(restoreRelease).mockResolvedValue(history as never);
    vi.mocked(fetchVerifiedObject).mockResolvedValue({
      providerId: 'bot',
      quotes: [
        {
          quoteSeriesId: 'series',
          rate: '42',
          quoteId: 'replacement',
          sourceQuote: { sourcePublishedAt: null },
        },
      ],
    } as never);
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });

    await expect(fetchFxHistory('series')).resolves.toMatchObject([{ rate: '42' }]);

    expect(localStorage.getItem(key)).toBe(previous);
  });

  it('serves history from the in-memory release when storage cannot persist it', async () => {
    const history = {
      current: { releaseId: 'memory' },
      snapshots: [{ quotes: [{ quoteSeriesId: 'series', providerId: 'bot' }] }],
      manifest: { history: [{ providerId: 'bot', date: '2026-09-01', snapshot: {} }] },
    };
    vi.mocked(loadRelease).mockResolvedValue(history as never);
    vi.mocked(fetchVerifiedObject).mockResolvedValue({
      providerId: 'bot',
      quotes: [
        {
          quoteSeriesId: 'series',
          rate: '42',
          quoteId: 'q',
          sourceQuote: { sourcePublishedAt: null },
        },
      ],
    } as never);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });

    await refreshActiveRelease();

    await expect(fetchFxHistory('series')).resolves.toMatchObject([{ rate: '42' }]);
  });

  it('keeps serving the verified release after remount when storage cannot persist it', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    await refreshActiveRelease();
    vi.mocked(restoreRelease).mockResolvedValue(null as never);

    await expect(readActiveRelease()).resolves.toBe(release);
  });

  it('clears the v3 namespace on rollback without touching user settings', () => {
    localStorage.setItem('ratewise.fx.v3.active', '{}');
    localStorage.setItem('ratewise.fx.v3.history:old:series', '[]');
    localStorage.setItem('converter-settings', '{}');
    gate.enabled = false;

    clearFxV3Storage();

    expect(keys().some((key) => key.startsWith('ratewise.fx.v3.'))).toBe(false);
    expect(localStorage.getItem('converter-settings')).toBe('{}');
  });
});
