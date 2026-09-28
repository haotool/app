// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const gate = vi.hoisted(() => ({ enabled: true }));
vi.mock('@app/shared/fx/public', () => ({ isFxV3Public: () => gate.enabled }));
vi.mock('@app/shared/fx/release', () => ({
  ACTIVE_RELEASE_KEY: 'ratewise.fx.v3.active',
  loadRelease: vi.fn(),
  restoreRelease: vi.fn((value: unknown) => Promise.resolve(value)),
}));

import { loadRelease } from '@app/shared/fx/release';
import { clearFxV3Storage, refreshActiveRelease } from '../fxSnapshotService';

const release = { current: { releaseId: 'current' }, snapshots: [], manifest: { providers: [] } };
const keys = () =>
  Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter(
    (key): key is string => key !== null,
  );
const saveHistory = (key: string, savedAt: number) =>
  localStorage.setItem(key, JSON.stringify({ savedAt, rows: [] }));

beforeEach(() => {
  localStorage.clear();
  gate.enabled = true;
  vi.mocked(loadRelease).mockResolvedValue(release as never);
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
