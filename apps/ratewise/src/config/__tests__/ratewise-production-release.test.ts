import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function loadRatewiseProductionReleaseModule() {
  const modulePath = path.resolve(
    __dirname,
    '../../../../../scripts/ratewise-production-release.mjs',
  );
  return import(pathToFileURL(modulePath).href);
}

describe('ratewise-production-release script', () => {
  it('should extract the app version from the real RateWise HTML entry point', async () => {
    const script = await loadRatewiseProductionReleaseModule();
    const html = [
      '<meta charset="UTF-8">',
      '<meta name="app-version" content="2.9.6">',
      '<meta name="build-time" content="2026-03-12T15:00:00.000Z">',
    ].join('\n');

    expect(script.extractAppVersion(html)).toBe('2.9.6');
    expect(script.isExpectedAppVersion(html, '2.9.6')).toBe(true);
    expect(script.isExpectedAppVersion(html, '2.9.5')).toBe(false);
  });

  it('should build a cache-busting probe URL for the real /ratewise/ entry path', async () => {
    const script = await loadRatewiseProductionReleaseModule();
    const probeUrlValue = script.buildVersionProbeUrl(
      'https://app.haotool.org/ratewise/',
      'probe-123',
    ) as string;
    const probeUrl = new URL(probeUrlValue);

    expect(probeUrl.origin).toBe('https://app.haotool.org');
    expect(probeUrl.pathname).toBe('/ratewise/');
    expect(probeUrl.searchParams.get('__release_probe__')).toBe('probe-123');
  });

  it('should build targeted Cloudflare purge payload instead of purge_everything', async () => {
    const script = await loadRatewiseProductionReleaseModule();
    const payload = script.buildRatewisePurgePayload('https://app.haotool.org');

    expect(payload).toEqual({
      files: [
        'https://app.haotool.org/ratewise/',
        'https://app.haotool.org/ratewise/sw.js',
        'https://app.haotool.org/ratewise/registerSW.js',
        'https://app.haotool.org/ratewise/manifest.webmanifest',
        'https://app.haotool.org/ratewise/offline.html',
      ],
      prefixes: [
        'app.haotool.org/ratewise/assets',
        'app.haotool.org/ratewise/workbox-',
        'app.haotool.org/ratewise/static-loader-data-manifest',
      ],
    });
  });
});
