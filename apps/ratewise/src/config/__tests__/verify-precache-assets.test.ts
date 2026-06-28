import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function loadVerifyPrecacheModule() {
  const modulePath = path.resolve(__dirname, '../../../../../scripts/verify-precache-assets.mjs');
  return import(pathToFileURL(modulePath).href);
}

describe('verify-precache-assets script', () => {
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

    expect(script.MAX_PRECACHE_ENTRY_COUNT).toBe(100);
    expect(script.MAX_PRECACHE_BYTES).toBe(3 * 1024 * 1024);
    expect(script.REQUIRED_PRECACHE_URLS).toEqual(
      expect.arrayContaining([
        'index.html',
        'offline.html',
        'favicon.svg',
        'favicon.ico',
        'apple-touch-icon.png',
        'icons/ratewise-icon-192x192.png',
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
    expect(isForbidden('about/index.html')).toBe(true);
    expect(isForbidden('faq/index.html')).toBe(true);
    expect(isForbidden('og-image.jpg')).toBe(true);
    // 根 index.html 與 shell 圖示不得被視為禁止項。
    expect(isForbidden('index.html')).toBe(false);
  });
});
