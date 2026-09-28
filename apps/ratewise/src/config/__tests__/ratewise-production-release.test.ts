import { describe, expect, it, vi } from 'vitest';
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
  it('should extract the app version from the real HTML entry point', async () => {
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

  it('should ignore SemVer build metadata when matching the release version', async () => {
    const script = await loadRatewiseProductionReleaseModule();

    expect(script.matchesReleaseVersion('2.28.4+build.2336', '2.28.4')).toBe(true);
    expect(script.matchesReleaseVersion('2.28.4', '2.28.4')).toBe(true);
    expect(script.matchesReleaseVersion('2.28.4', '2.28.4+build.1')).toBe(true);
    expect(script.matchesReleaseVersion('2.28.5', '2.28.4')).toBe(false);
    expect(script.matchesReleaseVersion('2.28.4-rc.1', '2.28.4')).toBe(false);
    expect(script.matchesReleaseVersion('2.28.40', '2.28.4')).toBe(false);
    expect(script.matchesReleaseVersion(null, '2.28.4')).toBe(false);
    expect(
      script.isExpectedAppVersion(
        '<meta name="app-version" content="2.28.4+build.2336">',
        '2.28.4',
      ),
    ).toBe(true);
  });

  it('should finish waiting when production reports the version with build metadata', async () => {
    const script = await loadRatewiseProductionReleaseModule();
    const fetchImpl = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve('<meta name="app-version" content="2.28.4+build.9">'),
      }),
    );
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    try {
      const result = await script.waitForExpectedVersion('2.28.4', {
        fetchImpl,
        timeoutMs: 1000,
        intervalMs: 0,
      });
      expect(result).toEqual({ attempts: 1, version: '2.28.4+build.9' });
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    } finally {
      logSpy.mockRestore();
    }
  });
});
