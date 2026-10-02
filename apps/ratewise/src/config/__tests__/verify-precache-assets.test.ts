import { describe, expect, it, vi } from 'vitest';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function loadVerifyPrecacheModule() {
  const modulePath = path.resolve(__dirname, '../../../../../scripts/verify-precache-assets.mjs');
  return import(pathToFileURL(modulePath).href);
}

describe('verify-precache-assets script', () => {
  it.each([9000, 20000])('HEAD 延遲或逾時（%s ms）後，GET 仍能成功', async (headDelay) => {
    const { probe } = await loadVerifyPrecacheModule();
    vi.useFakeTimers();
    const timeout = vi.spyOn(AbortSignal, 'timeout').mockImplementation((milliseconds) => {
      const controller = new AbortController();
      setTimeout(() => controller.abort('timeout'), milliseconds);
      return controller.signal;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, options: RequestInit) =>
          new Promise((resolve, reject) => {
            options.signal?.addEventListener('abort', () => reject(new Error('request aborted')), {
              once: true,
            });
            setTimeout(
              () =>
                resolve({
                  ok: options.method === 'GET',
                  status: options.method === 'GET' ? 200 : 405,
                }),
              options.method === 'HEAD' ? headDelay : 2000,
            );
          }),
      ),
    );
    try {
      const result = probe('https://example.com/assets/main.js');
      await vi.advanceTimersByTimeAsync(Math.min(headDelay, 10000) + 2000);
      expect(await result).toEqual({ ok: true, status: 200 });
      expect(timeout).toHaveBeenCalledTimes(2);
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });

  it('僅重試原始 404，恢復才成功，querystring 成功不能掩蓋持續缺檔', async () => {
    const { probeLiveAssets } = await loadVerifyPrecacheModule();
    const transient = 'https://example.com/assets/transient.js';
    const missing = 'https://example.com/offline.html';
    const forbidden = 'https://example.com/assets/forbidden.js';
    const counts = new Map<string, number>();
    const probe = vi.fn((url: string) => {
      const count = (counts.get(url) ?? 0) + 1;
      counts.set(url, count);
      const status =
        url.includes('?') || (url === transient && count === 3)
          ? 200
          : url === forbidden
            ? 403
            : 404;
      return Promise.resolve({ ok: status === 200, status });
    });
    const wait = vi.fn((_milliseconds: number) => Promise.resolve());
    const results = await probeLiveAssets([transient, missing, forbidden], probe, wait);
    expect(results.get(transient).ok).toBe(true);
    expect(results.get(missing)).toEqual({ ok: false, status: 404 });
    expect(counts.get(transient)).toBe(3);
    expect(counts.get(missing)).toBe(5);
    expect(counts.get(forbidden)).toBe(1);
    expect(wait.mock.calls.map(([ms]) => ms)).toEqual([15000, 30000, 60000, 75000]);
  });

  it('should default to the /ratewise/ subpath for local and live validation', async () => {
    const script = await loadVerifyPrecacheModule();

    expect(script.getDefaultBaseUrl('local')).toBe('http://127.0.0.1:4173/ratewise/');
    expect(script.getDefaultBaseUrl('live')).toBe('https://app.haotool.org/ratewise/');
  });

  it('should normalize duplicated trailing slashes in the base URL', async () => {
    const script = await loadVerifyPrecacheModule();

    expect(script.normalizeBase('https://app.haotool.org/ratewise//')).toBe(
      'https://app.haotool.org/ratewise/',
    );
    expect(script.normalizeBase('http://127.0.0.1:4173/ratewise')).toBe(
      'http://127.0.0.1:4173/ratewise/',
    );
  });

  it('should keep the /ratewise/ base path when resolving precache asset URLs', async () => {
    const script = await loadVerifyPrecacheModule();

    expect(
      script.resolvePrecacheAssetUrl(
        'assets/vendor-router-runtime.js',
        'https://app.haotool.org/ratewise/',
      ),
    ).toBe('https://app.haotool.org/ratewise/assets/vendor-router-runtime.js');
    expect(
      script.resolvePrecacheAssetUrl('/assets/app.css', 'http://127.0.0.1:4173/ratewise/'),
    ).toBe('http://127.0.0.1:4173/ratewise/assets/app.css');
  });

  it('should extract shell assets from subpath HTML without leaking the /ratewise prefix', async () => {
    const script = await loadVerifyPrecacheModule();
    const html = [
      '<link rel="stylesheet" href="/ratewise/assets/app.css">',
      '<script type="module" src="/ratewise/assets/app.js"></script>',
    ].join('\n');

    expect(script.parseShellAssetUrls(html)).toEqual(['assets/app.css', 'assets/app.js']);
  });

  it('should validate local precache assets from dist files instead of requiring a localhost preview server', async () => {
    const script = await loadVerifyPrecacheModule();

    expect(script.shouldProbePrecacheAssetsOverHttp('local')).toBe(false);
    expect(script.shouldProbePrecacheAssetsOverHttp('live')).toBe(true);
    expect(script.resolveLocalPrecacheAssetPath('assets/app.css', '/repo/apps/ratewise/dist')).toBe(
      path.resolve('/repo/apps/ratewise/dist', 'assets/app.css'),
    );
  });

  it('should define tier-1 precache guardrails for shell assets and forbidden runtime-only resources', async () => {
    const script = await loadVerifyPrecacheModule();

    expect(script.MAX_PRECACHE_ENTRY_COUNT).toBe(110);
    expect(script.MAX_PRECACHE_BYTES).toBe(3 * 1024 * 1024);
    expect(script.REQUIRED_PRECACHE_URLS).toEqual(
      expect.arrayContaining([
        'index.html',
        'offline.html',
        'favicon.svg',
        'favicon.ico',
        'apple-touch-icon.png',
        'icons/haorate-icon-192x192.png',
        'fonts/nunito-wordmark-900.woff2',
      ]),
    );
    expect(
      script.FORBIDDEN_PRECACHE_PATTERNS.some((pattern: RegExp) =>
        pattern.test('screenshots/a.png'),
      ),
    ).toBe(true);
    expect(
      script.FORBIDDEN_PRECACHE_PATTERNS.some((pattern: RegExp) =>
        pattern.test('usd-twd/index.html'),
      ),
    ).toBe(true);
  });

  it('requires the hash-named loader-data manifest in precache (offline SPA nav)', async () => {
    const script = await loadVerifyPrecacheModule();
    expect(script.REQUIRED_PRECACHE_SUBSTRINGS).toContain('static-loader-data-manifest');
  });

  it('forbids Tier 2 runtime assets (api JSON, nested index.html, raster images) in precache', async () => {
    const script = await loadVerifyPrecacheModule();
    const isForbidden = (url: string): boolean =>
      script.FORBIDDEN_PRECACHE_PATTERNS.some((pattern: RegExp) => pattern.test(url));
    expect(isForbidden('api/latest.json')).toBe(true);
    expect(isForbidden('api/pairs/usd-twd.json')).toBe(true);
    expect(isForbidden('api/v3/contract.schema.json')).toBe(true);
    expect(isForbidden('about/index.html')).toBe(true);
    expect(isForbidden('faq/index.html')).toBe(true);
    expect(isForbidden('og-image.jpg')).toBe(true);
    // 根 index.html 與 shell 圖示不得被視為禁止項。
    expect(isForbidden('index.html')).toBe(false);
  });
});
