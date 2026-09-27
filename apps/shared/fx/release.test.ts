import { describe, expect, it } from 'vitest';
import { hashBytes, fetchVerifiedObject } from './release';

describe('immutable release transport', () => {
  it('rejects a corrupt CDN 200 and tries the same immutable raw path', async () => {
    const body = JSON.stringify({ version: 3 });
    const sha256 = await hashBytes(body);
    const requested: string[] = [];
    const data = await fetchVerifiedObject(
      { path: `objects/${sha256}.json`, sha256 },
      ['https://cdn.test/', 'https://raw.test/'],
      (input) => {
        requested.push(
          input instanceof URL ? input.href : typeof input === 'string' ? input : input.url,
        );
        return Promise.resolve(new Response(requested.length === 1 ? '{"version":2}' : body));
      },
    );
    expect(data).toEqual({ version: 3 });
    expect(requested).toEqual([
      `https://cdn.test/objects/${sha256}.json`,
      `https://raw.test/objects/${sha256}.json`,
    ]);
  });
});

import { FxReleaseError, loadRelease, restoreRelease } from './release';
import { normalizeBankSnapshot } from './index';

describe('release atomic unit', () => {
  it('classifies an unpublished current pointer separately from integrity failures', async () => {
    const notPublished = await loadRelease(['https://cdn.test/'], () =>
      Promise.resolve(new Response('', { status: 404 })),
    ).catch((error: unknown) => error);
    expect(notPublished).toBeInstanceOf(FxReleaseError);
    expect((notPublished as FxReleaseError).kind).toBe('unpublished');

    const corrupt = await loadRelease(['https://cdn.test/'], () =>
      Promise.resolve(new Response('{"schemaVersion":"3.0"}')),
    ).catch((error: unknown) => error);
    expect(corrupt).toBeInstanceOf(FxReleaseError);
    expect((corrupt as FxReleaseError).kind).toBe('integrity');
  });

  it('loads latest without fetching missing historical objects and rejects partial latest', async () => {
    const time = '2026-09-21T01:00:00Z';
    const snapshot = {
      schemaVersion: '3.0',
      providerId: 'bot',
      quotes: normalizeBankSnapshot({
        timestamp: time,
        sourcePublishedAt: time,
        details: { USD: { cash: { buy: '31', sell: '32' } } },
      }),
    };
    const bytes = JSON.stringify(snapshot),
      sha256 = await hashBytes(bytes);
    const manifest = {
      schemaVersion: '3.0',
      generatedAt: time,
      providers: [
        {
          providerId: 'bot',
          snapshot: { path: `objects/${sha256}.json`, sha256 },
          checkStatus: 'ok',
          lastSuccessfulCheckAt: time,
        },
      ],
      history: [
        {
          providerId: 'bot',
          date: '2020-01-01',
          snapshot: { path: `objects/${'0'.repeat(64)}.json`, sha256: '0'.repeat(64) },
        },
      ],
      deprecation: { activatedAt: null, sunsetAt: null, replacement: 'https://example.test/' },
    };
    const manifestText = JSON.stringify(manifest),
      manifestHash = await hashBytes(manifestText);
    const current = {
      schemaVersion: '3.0',
      releaseId: manifestHash,
      manifest: { path: `releases/${manifestHash}.json`, sha256: manifestHash },
    };
    const requests: string[] = [];
    let corrupt = false;
    const fetcher: typeof fetch = (input) => {
      const path =
        input instanceof URL ? input.href : typeof input === 'string' ? input : input.url;
      requests.push(path);
      return Promise.resolve(
        new Response(
          path.endsWith('current.json')
            ? JSON.stringify(current)
            : path.includes('releases/')
              ? manifestText
              : corrupt
                ? '{}'
                : bytes,
        ),
      );
    };
    const previous = await loadRelease(['https://cdn.test/', 'https://raw.test/'], fetcher);
    expect(previous.snapshots[0]?.quotes[0]?.rate).toBe('31');
    expect(requests.some((path) => path.includes('00000000'))).toBe(false);
    corrupt = true;
    await expect(loadRelease(['https://cdn.test/', 'https://raw.test/'], fetcher)).rejects.toThrow(
      'Unavailable verified object',
    );
    expect(previous.snapshots[0]?.quotes[0]?.rate).toBe('31');
  });

  it('rejects a locally persisted snapshot whose bytes belong to another release', async () => {
    const time = '2026-09-21T01:00:00Z';
    const makeSnapshot = (sell: string) => ({
      schemaVersion: '3.0' as const,
      providerId: 'bot',
      quotes: normalizeBankSnapshot({
        timestamp: time,
        sourcePublishedAt: time,
        details: { USD: { cash: { buy: '31', sell } } },
      }),
    });
    const snapshotA = JSON.stringify(makeSnapshot('32'));
    const snapshotB = JSON.stringify(makeSnapshot('33'));
    const snapshotAHash = await hashBytes(snapshotA);
    const manifest = {
      schemaVersion: '3.0' as const,
      generatedAt: time,
      providers: [
        {
          providerId: 'bot',
          snapshot: { path: `objects/${snapshotAHash}.json`, sha256: snapshotAHash },
          checkStatus: 'ok' as const,
          lastSuccessfulCheckAt: time,
        },
      ],
      history: [],
      deprecation: { activatedAt: null, sunsetAt: null, replacement: 'https://example.test/' },
    };
    const manifestBytes = JSON.stringify(manifest);
    const manifestHash = await hashBytes(manifestBytes);
    const current = {
      schemaVersion: '3.0' as const,
      releaseId: manifestHash,
      manifest: { path: `releases/${manifestHash}.json`, sha256: manifestHash },
    };
    const restored = await restoreRelease({
      current,
      manifest,
      snapshots: [makeSnapshot('33')],
      manifestBytes,
      snapshotBytes: [snapshotA],
    });
    expect(
      restored?.snapshots[0]?.quotes.find((quote) => quote.providerSide === 'sell')?.sourceQuote
        .sell,
    ).toBe('32');
    expect(
      await restoreRelease({
        current: { ...current, releaseId: '0'.repeat(64) },
        manifestBytes,
        snapshotBytes: [snapshotA],
      }),
    ).toBeNull();
    expect(
      await restoreRelease({
        current,
        manifest,
        snapshots: [makeSnapshot('33')],
        manifestBytes,
        snapshotBytes: [snapshotB],
      }),
    ).toBeNull();
  });
});
