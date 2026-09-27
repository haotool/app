import { describe, it, expect, vi, afterEach } from 'vitest';
import { isRateStale, fetchMoneyboxRate, RATE_TTL_MS } from '../exchangeRate';

describe('isRateStale', () => {
  const NOW = Date.parse('2026-07-16T12:00:00Z');

  it('null → true', () => {
    expect(isRateStale(null, NOW)).toBe(true);
  });

  it('7 小時前 → true；1 小時前 → false（TTL 6h）', () => {
    expect(isRateStale('2026-07-16T05:00:00Z', NOW)).toBe(true);
    expect(isRateStale('2026-07-16T11:00:00Z', NOW)).toBe(false);
  });

  it('恰好 TTL 邊界內不算過期', () => {
    expect(isRateStale(new Date(NOW - RATE_TTL_MS).toISOString(), NOW)).toBe(false);
  });

  it('不可解析字串 → true', () => {
    expect(isRateStale('not-a-date', NOW)).toBe(true);
  });
});

describe('fetchMoneyboxRate v3', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('reads the verified TWD to KRW quote without reversing sides', async () => {
    const { normalizeMoneyboxSnapshot } = await import('@app/shared/fx');
    const { hashBytes } = await import('@app/shared/fx/release');
    const time = '2026-07-15T14:58:17.205Z';
    const snapshot = {
      schemaVersion: '3.0',
      providerId: 'moneybox',
      quotes: normalizeMoneyboxSnapshot({
        timestamp: time,
        sourcePublishedAt: time,
        rates: { TWD: { buy: '46', sell: '45' } },
      }),
    };
    const snapshotText = JSON.stringify(snapshot);
    const snapshotHash = await hashBytes(snapshotText);
    const manifest = {
      schemaVersion: '3.0',
      generatedAt: time,
      providers: [
        {
          providerId: 'moneybox',
          snapshot: { path: `objects/${snapshotHash}.json`, sha256: snapshotHash },
          checkStatus: 'ok',
          lastSuccessfulCheckAt: time,
        },
      ],
      history: [],
      deprecation: { activatedAt: null, sunsetAt: null, replacement: 'https://example.com/v3' },
    };
    const manifestText = JSON.stringify(manifest),
      manifestHash = await hashBytes(manifestText);
    vi.stubGlobal(
      'fetch',
      vi.fn((input) => {
        const path =
          input instanceof URL ? input.href : typeof input === 'string' ? input : input.url;
        return Promise.resolve(
          new Response(
            path.endsWith('current.json')
              ? JSON.stringify({
                  schemaVersion: '3.0',
                  releaseId: manifestHash,
                  manifest: { path: `releases/${manifestHash}.json`, sha256: manifestHash },
                })
              : path.includes('releases/')
                ? manifestText
                : snapshotText,
          ),
        );
      }),
    );
    await expect(fetchMoneyboxRate(time)).resolves.toMatchObject({
      krwPerTwd: 45,
      updatedAtIso: time,
    });
  });

  it.each([
    ['failed provider check', 'failed', '2026-07-15T14:58:17.205Z'],
    ['stale source publication', 'ok', '2026-01-01T00:00:00Z'],
  ] as const)(
    'rejects a %s before updating the default rate',
    async (_label, checkStatus, time) => {
      const now = '2026-07-15T15:00:00Z';
      const { normalizeMoneyboxSnapshot } = await import('@app/shared/fx');
      const { hashBytes } = await import('@app/shared/fx/release');
      const snapshot = {
        schemaVersion: '3.0',
        providerId: 'moneybox',
        quotes: normalizeMoneyboxSnapshot({
          timestamp: now,
          sourcePublishedAt: time,
          lastSuccessfulCheckAt: now,
          rates: { TWD: { buy: '46', sell: '45' } },
        }),
      };
      const snapshotText = JSON.stringify(snapshot);
      const snapshotHash = await hashBytes(snapshotText);
      const manifest = {
        schemaVersion: '3.0',
        generatedAt: now,
        providers: [
          {
            providerId: 'moneybox',
            snapshot: { path: `objects/${snapshotHash}.json`, sha256: snapshotHash },
            checkStatus,
            lastSuccessfulCheckAt: now,
          },
        ],
        history: [],
        deprecation: { activatedAt: null, sunsetAt: null, replacement: 'https://example.com/v3' },
      };
      const manifestText = JSON.stringify(manifest);
      const manifestHash = await hashBytes(manifestText);
      vi.stubGlobal(
        'fetch',
        vi.fn((input) => {
          const path =
            input instanceof URL ? input.href : typeof input === 'string' ? input : input.url;
          return Promise.resolve(
            new Response(
              path.endsWith('current.json')
                ? JSON.stringify({
                    schemaVersion: '3.0',
                    releaseId: manifestHash,
                    manifest: { path: `releases/${manifestHash}.json`, sha256: manifestHash },
                  })
                : path.includes('releases/')
                  ? manifestText
                  : snapshotText,
            ),
          );
        }),
      );
      await expect(fetchMoneyboxRate(now)).rejects.toThrow(/unavailable|stale/i);
    },
  );
  it('does not accept unversioned legacy data as a new snapshot', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({ rates: { TWD: { sell: 45 } } })))),
    );
    await expect(fetchMoneyboxRate()).rejects.toThrow();
  });
});

describe('v3 activation gate', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('keeps a fresh installation usable with an explicitly unverified legacy reference', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input) => {
        const url =
          input instanceof URL ? input.href : typeof input === 'string' ? input : input.url;
        return Promise.resolve(
          url.endsWith('/providers/moneybox/latest.json')
            ? new Response(
                JSON.stringify({
                  schemaVersion: '2.0',
                  base: 'KRW',
                  source: 'MoneyBox',
                  timestamp: '2026-09-22T00:00:00Z',
                  rates: { TWD: { buy: 46, sell: 45 } },
                }),
              )
            : new Response('', { status: 404 }),
        );
      }),
    );
    await expect(fetchMoneyboxRate()).resolves.toMatchObject({
      krwPerTwd: 45,
      updatedAtIso: null,
      isFallback: true,
    });
    const { useStore } = await import('../../store/useStore');
    useStore.setState({
      krwPerTwd: null,
      rateUpdatedAt: null,
      rateUpdatedAtIso: null,
      rateFetchFailed: false,
    });
    await useStore.getState().refreshExchangeRate();
    expect(useStore.getState()).toMatchObject({
      krwPerTwd: 45,
      rateUpdatedAtIso: null,
      rateFetchFailed: true,
    });
  });

  it('fails closed when a published v3 object fails its hash check', async () => {
    const { hashBytes } = await import('@app/shared/fx/release');
    const time = '2026-09-22T00:00:00Z';
    const manifest = {
      schemaVersion: '3.0',
      generatedAt: time,
      providers: [
        {
          providerId: 'moneybox',
          snapshot: { path: `objects/${'a'.repeat(64)}.json`, sha256: 'a'.repeat(64) },
          checkStatus: 'ok',
          lastSuccessfulCheckAt: time,
        },
      ],
      history: [],
      deprecation: { activatedAt: null, sunsetAt: null, replacement: 'https://example.com/v3' },
    };
    const manifestText = JSON.stringify(manifest);
    const manifestHash = await hashBytes(manifestText);
    vi.stubGlobal(
      'fetch',
      vi.fn((input) => {
        const url =
          input instanceof URL ? input.href : typeof input === 'string' ? input : input.url;
        if (url.endsWith('/current.json'))
          return Promise.resolve(
            new Response(
              JSON.stringify({
                schemaVersion: '3.0',
                releaseId: manifestHash,
                manifest: { path: `releases/${manifestHash}.json`, sha256: manifestHash },
              }),
            ),
          );
        if (url.includes('/releases/')) return Promise.resolve(new Response(manifestText));
        if (url.includes('/objects/')) return Promise.resolve(new Response('{}'));
        if (url.endsWith('/providers/moneybox/latest.json'))
          return Promise.resolve(
            new Response(
              JSON.stringify({
                schemaVersion: '2.0',
                base: 'KRW',
                source: 'MoneyBox',
                timestamp: time,
                rates: { TWD: { buy: 46, sell: 45 } },
              }),
            ),
          );
        return Promise.resolve(new Response('', { status: 404 }));
      }),
    );
    await expect(fetchMoneyboxRate()).rejects.toThrow('Unavailable verified object');
  });
});
it('does not turn the opposite legacy side into a missing TWD-to-KRW price', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn((input) => {
      const url = input instanceof URL ? input.href : typeof input === 'string' ? input : input.url;
      return Promise.resolve(
        url.endsWith('/providers/moneybox/latest.json')
          ? new Response(
              JSON.stringify({
                schemaVersion: '2.0',
                base: 'KRW',
                source: 'MoneyBox',
                timestamp: '2026-09-22T00:00:00Z',
                rates: { TWD: { buy: 46, sell: null } },
              }),
            )
          : new Response('', { status: 404 }),
      );
    }),
  );
  try {
    await expect(fetchMoneyboxRate()).rejects.toThrow('Legacy TWD to KRW quote unavailable');
  } finally {
    vi.unstubAllGlobals();
  }
});
