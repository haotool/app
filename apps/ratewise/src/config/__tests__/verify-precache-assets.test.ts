import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function loadVerifyPrecacheModule() {
  const modulePath = path.resolve(__dirname, '../../../../../scripts/verify-precache-assets.mjs');
  return import(pathToFileURL(modulePath).href);
}

describe('verify-precache-assets script', () => {
  it('should default to the RateWise subpath for local and live validation', async () => {
    const script = await loadVerifyPrecacheModule();

    expect(script.getDefaultBaseUrl('local')).toBe('http://127.0.0.1:4173/ratewise/');
    expect(script.getDefaultBaseUrl('live')).toBe('https://app.haotool.org/ratewise/');
  });

  it('should keep the RateWise base path when resolving precache asset URLs', async () => {
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
});
