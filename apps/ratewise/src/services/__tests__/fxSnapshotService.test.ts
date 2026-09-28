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

beforeEach(() => {
  localStorage.clear();
  gate.enabled = true;
  vi.mocked(loadRelease).mockResolvedValue(release as never);
});
afterEach(() => vi.restoreAllMocks());

describe('FX v3 storage retention', () => {
  it('keeps the newest four history keys and evicts older entries', async () => {
    for (const key of [
      'ratewise.fx.v3.history:old:series',
      ...Array.from({ length: 6 }, (_, i) => `ratewise.fx.v3.history:current:series-${i}`),
    ])
      localStorage.setItem(key, '[]');

    await refreshActiveRelease();

    const currentKeys = keys();
    expect(currentKeys).toContain('ratewise.fx.v3.active');
    expect(currentKeys.filter((key) => key.startsWith('ratewise.fx.v3.history:'))).toHaveLength(4);
    expect(currentKeys.some((key) => key.includes(':old:'))).toBe(false);
    expect(currentKeys).not.toContain('ratewise.fx.v3.history:current:series-0');
    expect(currentKeys).toContain('ratewise.fx.v3.history:current:series-5');
  });

  it('retains recent history keys across releases within the fixed bound', async () => {
    for (const key of [
      'ratewise.fx.v3.history:old:series',
      'ratewise.fx.v3.history:current:series-1',
      'ratewise.fx.v3.history:current:series-2',
      'ratewise.fx.v3.history:current:series-3',
    ])
      localStorage.setItem(key, '[]');

    await refreshActiveRelease();

    expect(keys().filter((key) => key.startsWith('ratewise.fx.v3.history:'))).toHaveLength(4);
    expect(keys()).toContain('ratewise.fx.v3.history:old:series');
  });

  it('drops only FX cache keys when storage quota is exceeded', async () => {
    localStorage.setItem('ratewise.fx.v3.history:current:series', '[]');
    localStorage.setItem('split-meow-storage', 'settings');
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });

    await expect(refreshActiveRelease()).resolves.toBe(release);
    expect(localStorage.getItem('split-meow-storage')).toBe('settings');
    expect(keys().some((key) => key.startsWith('ratewise.fx.v3.'))).toBe(false);
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
