import { describe, expect, it, vi } from 'vitest';
import {
  clearRatewiseCaches,
  clearRatewiseRuntimeCaches,
  isRatewiseCache,
} from '../cacheOwnership';

const scope = 'https://app.haotool.org/ratewise/';
describe('RateWise cache ownership', () => {
  it('依完整 scope 保護其他 app，包括 ratewise 名稱相似的 scope', () => {
    expect(isRatewiseCache(`workbox-precache-v2-${scope}`, scope)).toBe(true);
    for (const other of ['starpuff/', 'other/ratewise/', 'ratewise-extra/']) {
      expect(isRatewiseCache(`workbox-precache-v2-https://app.haotool.org/${other}`, scope)).toBe(
        false,
      );
    }
  });

  it('舊共用快取逐筆清自身 URL，保留其他 app 與來源的內容', async () => {
    const requests = [
      { url: `${scope}index.html` },
      { url: 'https://app.haotool.org/starpuff/index.html' },
      { url: 'https://app.haotool.org/ratewise-extra/index.html' },
      { url: 'https://other.example/ratewise/index.html' },
    ];
    const cache = {
      keys: vi.fn().mockResolvedValue(requests),
      delete: vi.fn().mockResolvedValue(true),
    };
    const storage = {
      keys: vi
        .fn()
        .mockResolvedValue([
          'html-cache',
          'ratewise-font-cache',
          'critical-launch-cache',
          'workbox-precache-v2-https://app.haotool.org/starpuff/',
        ]),
      open: vi.fn().mockResolvedValue(cache),
      delete: vi.fn().mockResolvedValue(true),
    };
    expect(await clearRatewiseCaches(storage as unknown as CacheStorage, scope)).toBe(2);
    expect(storage.delete).toHaveBeenCalledTimes(2);
    expect(storage.delete).toHaveBeenCalledWith('ratewise-font-cache');
    expect(storage.delete).toHaveBeenCalledWith('critical-launch-cache');
    expect(cache.delete).toHaveBeenCalledExactlyOnceWith(requests[0]);
  });
  it('root scope shared cleanup respects narrower peer precache scopes, including budget subset', async () => {
    const own = { url: 'https://app.haotool.org/index.html' };
    const foreign = { url: 'https://app.haotool.org/starpuff/index.html' };
    const cache = {
      keys: vi.fn().mockResolvedValue([own, foreign]),
      delete: vi.fn().mockResolvedValue(true),
    };
    const storage = {
      keys: vi
        .fn()
        .mockResolvedValue([
          'image-cache',
          'workbox-precache-v2-https://app.haotool.org/starpuff/',
        ]),
      open: vi.fn().mockResolvedValue(cache),
      delete: vi.fn().mockResolvedValue(true),
    };
    await clearRatewiseCaches(storage as unknown as CacheStorage, 'https://app.haotool.org/', [
      'image-cache',
    ]);
    expect(cache.delete).toHaveBeenCalledExactlyOnceWith(own);
    expect(storage.delete).not.toHaveBeenCalled();
  });
  it.each(['present', 'evicted', 'unreadable'])(
    'runtime cleanup protects all last-shell backups (%s)',
    async (state) => {
      const current = `workbox-precache-v2-${scope}`;
      const obsolete = `workbox-precache-v1-${scope}`;
      const backups = [
        'ratewise-html-cache',
        'html-cache',
        'ratewise-critical-launch-cache',
        'critical-launch-cache',
      ];
      const match =
        state === 'unreadable'
          ? vi.fn().mockRejectedValue(new Error('read failed'))
          : vi
              .fn()
              .mockResolvedValue(state === 'present' ? new Response('current shell') : undefined);
      const cache = { match, keys: vi.fn().mockResolvedValue([]) };
      const storage = {
        keys: vi
          .fn()
          .mockResolvedValue([
            current,
            obsolete,
            ...backups,
            'ratewise-runtime',
            'workbox-precache-v2-https://app.haotool.org/starpuff/',
          ]),
        open: vi.fn().mockResolvedValue(cache),
        delete: vi.fn().mockResolvedValue(true),
      };
      await clearRatewiseRuntimeCaches(storage as unknown as CacheStorage, scope);
      expect(match).toHaveBeenCalledExactlyOnceWith(`${scope}index.html`, { ignoreSearch: true });
      expect(storage.open.mock.calls[0]).toEqual([current]);
      expect(storage.delete).toHaveBeenCalledWith('ratewise-runtime');
      for (const name of backups) {
        if (state === 'present' && name !== 'html-cache')
          expect(storage.delete).toHaveBeenCalledWith(name);
        else expect(storage.delete).not.toHaveBeenCalledWith(name);
      }
      expect(storage.delete).not.toHaveBeenCalledWith(current);
      expect(storage.delete).not.toHaveBeenCalledWith(obsolete);
    },
  );
});
