import { describe, expect, it, vi } from 'vitest';
import { clearRatewiseCaches, isRatewiseCache } from '../cacheOwnership';

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
});
