import { describe, expect, it, vi } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, rmdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  legacyPayload,
  publishRelease,
  retainedHistory,
  sunsetAt,
} from '../publish-fx-release.mjs';
import { verifyDataRoot } from '../verify-fx-v3-release.mjs';
import { FX_PUBLISHER } from '../../apps/shared/fx/publisher-metadata.mjs';

describe('v3 publication', () => {
  it('writes content-addressed objects before moving current and carries failed providers', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fx-release-'));
    const time = '2026-09-21T01:00:00Z';
    try {
      const input = {
        timestamp: time,
        sourcePublishedAt: time,
        details: { USD: { cash: { buy: '31', sell: '32' }, spot: { buy: '31.5', sell: '31.8' } } },
      };
      const a = await publishRelease(dir, { bot: input }, time);
      const b = await publishRelease(dir, { bot: null }, '2026-09-21T01:05:00Z');
      expect(b.manifest.providers[0]!.snapshot).toEqual(a.manifest.providers[0]!.snapshot);
      expect(b.manifest.providers[0]!.checkStatus).toBe('failed');
      expect(JSON.parse(readFileSync(join(dir, 'current.json'), 'utf8')).releaseId).toBe(
        b.current.releaseId,
      );
      expect(readFileSync(join(dir, String(a.current.manifest.path)), 'utf8')).toContain(
        'schemaVersion',
      );
      const snapshot = b.snapshots.get('bot');
      expect(snapshot).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('publishes manifest-level publisher, provider attribution, rule and $schema once', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fx-release-manifest-'));
    const time = '2026-09-21T01:00:00Z';
    try {
      const { manifest, snapshots } = await publishRelease(
        dir,
        { bot: { timestamp: time, details: { USD: { cash: { buy: '31', sell: '32' } } } } },
        time,
      );
      const schemaUrl = 'https://app.haotool.org/ratewise/api/v3/contract.schema.json';
      expect(manifest).toMatchObject({
        $schema: schemaUrl,
        publisher: FX_PUBLISHER,
        calculationRule: expect.stringContaining('toAmount = fromAmount × rate'),
        quoteAvailability: 'indicative_not_transaction_guarantee',
      });
      expect(manifest.providers[0]).toMatchObject({
        providerId: 'bot',
        name: '臺灣銀行',
        kind: 'bank',
        sourceUrl: 'https://rate.bot.com.tw/xrt?Lang=zh-TW',
        termsUrl: null,
        redistributionStatus: 'unknown',
        attribution: '資料來源：臺灣銀行牌告匯率',
      });
      // PRD §18.5：恆 null 欄位不輸出，日後相容新增。
      expect(manifest.providers[0]).not.toHaveProperty('nextSourceCheckAt');
      expect(snapshots.get('bot')).toMatchObject({ $schema: schemaUrl, schemaVersion: '3.0' });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('keeps each provider on its own last check result instead of carried_forward', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fx-release-status-'));
    const time = '2026-09-21T01:00:00Z';
    try {
      const bot = {
        timestamp: time,
        sourcePublishedAt: time,
        details: { USD: { cash: { buy: '31', sell: '32' } } },
      };
      await publishRelease(dir, { bot }, time);
      const next = await publishRelease(
        dir,
        { moneybox: { timestamp: time, rates: { TWD: { buy: '46', sell: '45' } } } },
        '2026-09-21T01:05:00Z',
      );
      const status = Object.fromEntries(
        next.manifest.providers.map((p) => [p.providerId, p.checkStatus]),
      );
      expect(status).toEqual({ bot: 'ok', moneybox: 'ok' });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('stores response-generation publishedAt as unknown on the v3 current snapshot', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fx-release-published-at-'));
    const time = '2026-09-21T01:00:00.000Z';
    const input = {
      timestamp: time,
      fetchedAt: time,
      sourcePublishedAt: time,
      rates: { TWD: { buy: '46', sell: '45' } },
    };
    try {
      const result = await publishRelease(dir, { moneybox: input }, time);
      expect(input.sourcePublishedAt).toBe(time);
      const snapshot = result.snapshots.get('moneybox') as {
        quotes: { sourceQuote: { sourcePublishedAt: string | null } }[];
      };
      expect(snapshot.quotes[0]?.sourceQuote.sourcePublishedAt).toBeNull();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('does not write a new release when content and provider status are unchanged', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fx-release-churn-'));
    const time = '2026-09-21T01:00:00Z';
    try {
      const bot = {
        timestamp: time,
        sourcePublishedAt: time,
        details: { USD: { cash: { buy: '31', sell: '32' } } },
      };
      const first = await publishRelease(dir, { bot }, time);
      const pointer = readFileSync(join(dir, 'current.json'), 'utf8');
      const second = await publishRelease(dir, { bot }, '2026-09-21T01:05:00Z');
      expect(second.unchanged).toBe(true);
      expect(second.current.releaseId).toBe(first.current.releaseId);
      expect(readFileSync(join(dir, 'current.json'), 'utf8')).toBe(pointer);
      const failed = await publishRelease(dir, { bot: null }, '2026-09-21T01:10:00Z');
      expect(failed.unchanged).toBeUndefined();
      const stillFailed = await publishRelease(dir, { bot: null }, '2026-09-21T01:15:00Z');
      expect(stillFailed.unchanged).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('does not churn manifests when supplied history references are unchanged', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fx-release-history-stable-'));
    const time = '2026-09-21T01:00:00Z';
    const bot = {
      timestamp: time,
      sourcePublishedAt: time,
      details: { USD: { cash: { buy: '31', sell: '32' } } },
    };
    try {
      const initial = await publishRelease(dir, { bot }, time);
      const history = [
        {
          providerId: 'bot',
          date: '2026-09-21',
          snapshot: initial.manifest.providers[0]!.snapshot,
        },
      ];
      const first = await publishRelease(dir, { bot }, time, history);
      const next = await publishRelease(dir, { bot }, '2026-09-21T01:05:00Z', history);
      expect(first.manifest.history).toEqual(history);
      expect(next.manifest.history).toEqual(history);
      expect(next.unchanged).toBe(true);
      expect(next.current.releaseId).toBe(first.current.releaseId);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuses to advance current when a carried snapshot is missing and keeps legacy detail metadata', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fx-release-integrity-'));
    try {
      const time = '2026-09-21T01:00:00Z';
      const input = {
        timestamp: time,
        sourcePublishedAt: time,
        details: { USD: { name: '美金', cash: { buy: '31', sell: '32' } } },
      };
      const first = await publishRelease(dir, { bot: input }, time);
      const currentBefore = readFileSync(join(dir, 'current.json'), 'utf8');
      const snapshotRef = first.manifest.providers[0]!.snapshot;
      const snapshotPath = join(dir, String(snapshotRef.path));
      const { unlinkSync } = await import('node:fs');
      unlinkSync(snapshotPath);
      await expect(publishRelease(dir, { bot: null }, '2026-09-21T01:05:00Z')).rejects.toThrow(
        'ENOENT',
      );
      expect(readFileSync(join(dir, 'current.json'), 'utf8')).toBe(currentBefore);
      const legacy = legacyPayload(first.snapshots.get('bot'), input);
      expect(legacy.details['USD']!.name).toBe('美金');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it('refuses history references whose verified object belongs to another provider', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fx-release-history-'));
    try {
      const time = '2026-09-21T01:00:00Z';
      const input = {
        timestamp: time,
        sourcePublishedAt: time,
        details: { USD: { cash: { buy: '31', sell: '32' } } },
      };
      const first = await publishRelease(dir, { bot: input }, time);
      const currentBefore = readFileSync(join(dir, 'current.json'), 'utf8');
      await expect(
        publishRelease(dir, { bot: null }, '2026-09-21T01:05:00Z', [
          {
            providerId: 'moneybox',
            date: '2026-09-20',
            snapshot: first.manifest.providers[0]!.snapshot,
          },
        ]),
      ).rejects.toThrow('Invalid history snapshot');
      expect(readFileSync(join(dir, 'current.json'), 'utf8')).toBe(currentBefore);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it('retires no earlier than December 31 and thirty days after activation', () => {
    expect(sunsetAt(null)).toBeNull();
    expect(sunsetAt('2026-09-22T00:00:00Z')).toBe('2026-12-31T00:00:00.000Z');
    expect(sunsetAt('2026-12-20T00:00:00Z')).toBe('2027-01-19T00:00:00.000Z');
  });
});

it('rejects an unsupported persisted current schema without advancing it', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'fx-release-schema-'));
  const time = '2026-09-21T01:00:00Z';
  try {
    await publishRelease(
      dir,
      { bot: { timestamp: time, details: { USD: { cash: { buy: '31', sell: '32' } } } } },
      time,
    );
    const { writeFileSync } = await import('node:fs');
    const pointerPath = join(dir, 'current.json');
    const pointer = JSON.parse(readFileSync(pointerPath, 'utf8'));
    pointer.schemaVersion = '99.0';
    writeFileSync(pointerPath, JSON.stringify(pointer));
    const before = readFileSync(pointerPath, 'utf8');
    await expect(publishRelease(dir, { bot: null }, time)).rejects.toThrow(
      'Invalid previous pointer',
    );
    expect(readFileSync(pointerPath, 'utf8')).toBe(before);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

it('preserves current when referenced provider bytes or a new history object fail integrity', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'fx-release-corrupt-'));
  const time = '2026-09-21T01:00:00Z';
  try {
    const initial = await publishRelease(
      dir,
      { bot: { timestamp: time, details: { USD: { cash: { buy: '31', sell: '32' } } } } },
      time,
    );
    const before = readFileSync(join(dir, 'current.json'), 'utf8');
    await expect(
      publishRelease(dir, { bot: null }, time, [
        {
          providerId: 'bot',
          date: '2026-09-20',
          snapshot: { path: `objects/${'0'.repeat(64)}.json`, sha256: '0'.repeat(64) },
        },
      ]),
    ).rejects.toThrow();
    expect(readFileSync(join(dir, 'current.json'), 'utf8')).toBe(before);
    const { writeFileSync } = await import('node:fs');
    writeFileSync(join(dir, initial.manifest.providers[0]!.snapshot.path), '{}\n');
    await expect(publishRelease(dir, { bot: null }, time)).rejects.toThrow('Invalid object hash');
    expect(readFileSync(join(dir, 'current.json'), 'utf8')).toBe(before);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

it('rejects a history reference stored before its source date', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'fx-release-history-date-'));
  const time = '2026-09-21T01:00:00Z';
  try {
    const initial = await publishRelease(
      dir,
      {
        bot: {
          timestamp: time,
          sourcePublishedAt: time,
          details: { USD: { cash: { buy: '31', sell: '32' } } },
        },
      },
      time,
    );
    const before = readFileSync(join(dir, 'current.json'), 'utf8');
    await expect(
      publishRelease(dir, { bot: null }, time, [
        {
          providerId: 'bot',
          date: '2026-09-20',
          snapshot: initial.manifest.providers[0]!.snapshot,
        },
      ]),
    ).rejects.toThrow('History date mismatch');
    expect(readFileSync(join(dir, 'current.json'), 'utf8')).toBe(before);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

it('binds a history date to the provider local fetch date when publication time is unknown', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'fx-release-history-local-date-'));
  try {
    const initial = await publishRelease(
      dir,
      {
        bot: {
          timestamp: '2026-09-21T16:00:00Z',
          details: { USD: { cash: { buy: '31', sell: '32' } } },
        },
      },
      '2026-09-21T16:00:00Z',
    );
    await expect(
      publishRelease(dir, { bot: null }, '2026-09-22T00:00:00Z', [
        {
          providerId: 'bot',
          date: '2026-09-21',
          snapshot: initial.manifest.providers[0]!.snapshot,
        },
      ]),
    ).rejects.toThrow('History date mismatch');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

it('accepts a weekend history date carrying the previous published board', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'fx-release-history-carry-forward-'));
  try {
    const initial = await publishRelease(
      dir,
      {
        bot: {
          timestamp: '2026-09-18T08:00:00Z',
          sourcePublishedAt: '2026-09-18T08:00:00Z',
          details: { USD: { cash: { buy: '31', sell: '32' } } },
        },
      },
      '2026-09-18T08:05:00Z',
    );
    const next = await publishRelease(dir, { bot: null }, '2026-09-19T01:00:00Z', [
      {
        providerId: 'bot',
        date: '2026-09-19',
        snapshot: initial.manifest.providers[0]!.snapshot,
      },
    ]);
    expect(next.manifest.history).toHaveLength(1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

it('rejects a history date after the release calendar date', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'fx-release-history-future-date-'));
  try {
    const initial = await publishRelease(
      dir,
      {
        bot: {
          timestamp: '2026-09-18T08:00:00Z',
          details: { USD: { cash: { buy: '31', sell: '32' } } },
        },
      },
      '2026-09-18T08:05:00Z',
    );
    await expect(
      publishRelease(dir, { bot: null }, '2026-09-19T01:00:00Z', [
        {
          providerId: 'bot',
          date: '2026-09-20',
          snapshot: initial.manifest.providers[0]!.snapshot,
        },
      ]),
    ).rejects.toThrow('History date mismatch');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

it('rejects a delayed reattachment of an old snapshot', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'fx-release-history-delayed-'));
  try {
    const initial = await publishRelease(
      dir,
      {
        bot: {
          timestamp: '2026-09-01T08:00:00Z',
          details: { USD: { cash: { buy: '31', sell: '32' } } },
        },
      },
      '2026-09-01T08:05:00Z',
    );
    await expect(
      publishRelease(dir, { bot: null }, '2026-09-30T01:00:00Z', [
        {
          providerId: 'bot',
          date: '2026-09-29',
          snapshot: initial.manifest.providers[0]!.snapshot,
        },
      ]),
    ).rejects.toThrow('History date mismatch');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

it('preserves bank detail and side metadata for spot-only and missing-side legacy output', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'fx-release-legacy-'));
  const time = '2026-09-21T01:00:00Z';
  const input = {
    timestamp: time,
    details: {
      USD: {
        name: '美金',
        displayOrder: 1,
        cash: { buy: null, sell: '32', label: '現鈔' },
        spot: { buy: '31', sell: '31.5', label: '即期' },
      },
      ZAR: { name: '南非幣', spot: { buy: '1.5', sell: '1.6', label: '僅帳戶' } },
    },
  };
  try {
    const result = await publishRelease(dir, { bot: input }, time);
    const legacy = legacyPayload(result.snapshots.get('bot'), input);
    expect(legacy).toMatchObject({
      details: {
        USD: {
          name: '美金',
          displayOrder: 1,
          cash: { buy: null, sell: 32, label: '現鈔' },
          spot: { buy: 31, sell: 31.5, label: '即期' },
        },
        ZAR: {
          name: '南非幣',
          cash: { buy: null, sell: null },
          spot: { buy: 1.5, sell: 1.6, label: '僅帳戶' },
        },
      },
      rates: { USD: 32 },
    });
    expect(legacy).not.toHaveProperty('rates.ZAR');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

const historicalFiles = vi.hoisted(() => new Map<string, string>());
const removeScratchIfEmpty = (path: string) => {
  try {
    rmdirSync(path);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT' && code !== 'ENOTEMPTY') throw error;
  }
};
vi.mock('node:child_process', () => ({
  execFileSync: (_command: string, args: string[]) => {
    if (args[0] === 'ls-tree') return [...historicalFiles.keys()].join('\n');
    const path = args[1]?.split(':').slice(1).join(':') ?? '';
    const source = historicalFiles.get(path);
    if (args[0] === 'show' && source !== undefined) return Buffer.from(source);
    throw new Error('Unexpected git fixture read');
  },
}));
import { migrateHistory } from '../migrate-fx-history.mjs';

it('requires a full 40-hex commit SHA only in Git revision mode', () => {
  expect(() => migrateHistory('revision', '/tmp/fx-migration-output')).toThrow(
    /full 40-character commit SHA/,
  );
});

it('quarantines conflicting historical identities and preserves known legacy without a schema version', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fx-migration-identities-'));
  const bank = {
    timestamp: '2026-09-01T00:00:00Z',
    base: 'TWD',
    source: 'Taiwan Bank',
    details: { USD: { cash: { buy: 31, sell: 32 } } },
    rates: { USD: 32 },
  };
  const variants = [
    bank,
    { ...bank, base: 'USD' },
    { ...bank, source: 'Another Bank' },
    { ...bank, schemaVersion: '99.0' },
    { ...bank, providerId: 'moneybox' },
  ];
  historicalFiles.clear();
  variants.forEach((payload, index) =>
    historicalFiles.set(`public/rates/history/2026-09-0${index + 1}.json`, JSON.stringify(payload)),
  );
  historicalFiles.set(
    'public/rates/providers/moneybox/history/2026-09-01.json',
    JSON.stringify({
      timestamp: bank.timestamp,
      base: 'KRW',
      source: 'MoneyBox',
      rates: { TWD: { buy: 43, sell: 42, spbuy: null, spsell: null } },
    }),
  );
  try {
    const result = migrateHistory('a'.repeat(40), dir);
    expect(result).toMatchObject({ total: 6, converted: 2, quarantined: 4 });
    expect(
      result.entries
        .filter((entry) => entry.status === 'quarantined')
        .every((entry) => entry.reason),
    ).toBe(true);
  } finally {
    historicalFiles.clear();
    rmSync(dir, { recursive: true, force: true });
  }
});

it('converts a legacy MoneyBox snapshot when only one side is declared', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fx-migration-missing-side-'));
  historicalFiles.clear();
  historicalFiles.set(
    'public/rates/providers/moneybox/history/2026-09-01.json',
    JSON.stringify({
      timestamp: '2026-09-01T00:00:00Z',
      base: 'KRW',
      source: 'MoneyBox',
      rates: { TWD: { sell: 45 } },
    }),
  );
  try {
    expect(migrateHistory('b'.repeat(40), dir)).toMatchObject({
      total: 1,
      converted: 1,
      quarantined: 0,
    });
  } finally {
    historicalFiles.clear();
    rmSync(dir, { recursive: true, force: true });
  }
});

it('migrates real-shaped 30-day bank histories with gaps and the MoneyBox Seoul filename day', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fx-migration-window-'));
  historicalFiles.clear();
  for (let day = 1; day <= 30; day++) {
    if (day === 7) continue;
    const date = `2026-05-${String(day).padStart(2, '0')}`;
    historicalFiles.set(
      `public/rates/history/${date}.json`,
      JSON.stringify({
        timestamp: `${date}T00:05:00.000Z`,
        updateTime: `${date.replaceAll('-', '/')} 08:05:00`,
        base: 'TWD',
        source: 'Taiwan Bank',
        details: { USD: { cash: { buy: 31, sell: 32 } } },
        rates: { USD: 32 },
      }),
    );
  }
  historicalFiles.set(
    'public/rates/providers/moneybox/history/2026-05-12.json',
    JSON.stringify({
      timestamp: '2026-05-12T15:01:00.000Z', // 2026-05-13 00:01 KST
      updateTime: '2026/05/12 23:59:58',
      base: 'KRW',
      source: 'MoneyBox',
      rates: { TWD: { buy: 43, sell: 42, spbuy: null, spsell: null } },
    }),
  );
  try {
    const result = migrateHistory('c'.repeat(40), dir);
    expect(result).toMatchObject({ total: 30, converted: 30, quarantined: 0 });
    const history = JSON.parse(readFileSync(join(dir, 'history-index.json'), 'utf8'));
    expect(history).toContainEqual(
      expect.objectContaining({ providerId: 'moneybox', date: '2026-05-12' }),
    );
    expect(history).not.toContainEqual(
      expect.objectContaining({ providerId: 'moneybox', date: '2026-05-13' }),
    );
  } finally {
    historicalFiles.clear();
    rmSync(dir, { recursive: true, force: true });
  }
});

it('quarantines an old MoneyBox file whose Seoul snapshot day differs from its filename and continues migration', () => {
  const scratch = join(process.cwd(), '.tmp');
  mkdirSync(scratch, { recursive: true });
  const dir = mkdtempSync(join(scratch, 'fx-migration-quarantine-old-moneybox-'));
  historicalFiles.clear();
  historicalFiles.set(
    'public/rates/history/2026-05-12.json',
    JSON.stringify({
      timestamp: '2026-05-12T10:00:00.000Z',
      base: 'TWD',
      source: 'Taiwan Bank',
      details: { USD: { cash: { buy: 31, sell: 32 } } },
      rates: { USD: 32 },
    }),
  );
  historicalFiles.set(
    'public/rates/providers/moneybox/history/2026-05-12.json',
    JSON.stringify({
      timestamp: '2026-05-12T15:15:00.000Z',
      updateTime: '2026/05/13 00:15:00',
      base: 'KRW',
      source: 'MoneyBox',
      rates: { TWD: { buy: 43, sell: 42, spbuy: null, spsell: null } },
    }),
  );
  try {
    const result = migrateHistory('d'.repeat(40), dir);
    expect(result).toMatchObject({ total: 2, converted: 1, quarantined: 1 });
    expect(result.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'public/rates/providers/moneybox/history/2026-05-12.json',
          status: 'quarantined',
          reason: 'MoneyBox history date differs from legacy Seoul snapshot date',
          evidence: expect.objectContaining({ path: expect.stringContaining('evidence/') }),
        }),
      ]),
    );
    const entry = result.entries.find((candidate) => candidate.status === 'quarantined');
    expect(readFileSync(join(dir, entry!.evidence!.path), 'utf8')).toContain('2026/05/13 00:15:00');
    expect(JSON.parse(readFileSync(join(dir, 'history-index.json'), 'utf8'))).toContainEqual(
      expect.objectContaining({ providerId: 'bot', date: '2026-05-12' }),
    );
  } finally {
    historicalFiles.clear();
    rmSync(dir, { recursive: true, force: true });
    removeScratchIfEmpty(scratch);
  }
});

it('retains a 30-day bank calendar window and the latest 30 MoneyBox snapshots', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fx-retained-window-'));
  const v3 = join(dir, 'v3');
  const dataRoot = dir;
  const dates = (start: string, count: number) =>
    Array.from({ length: count }, (_, index) => {
      const date = new Date(`${start}T00:00:00Z`);
      date.setUTCDate(date.getUTCDate() + index);
      return date.toISOString().slice(0, 10);
    });
  try {
    const entries = [
      ...dates('2026-08-30', 32).map((date) => ({ providerId: 'bot', date })),
      ...dates('2026-08-30', 32).map((date) => ({ providerId: 'moneybox', date })),
    ];
    mkdirSync(v3, { recursive: true });
    writeFileSync(join(v3, 'history-index.json'), JSON.stringify(entries));
    const retained = retainedHistory(dataRoot, new Date('2026-09-30T00:00:00Z'));
    expect(retained.filter((entry) => entry.providerId === 'bot')).toHaveLength(30);
    expect(retained.find((entry) => entry.providerId === 'bot')?.date).toBe('2026-08-31');
    expect(retained.filter((entry) => entry.providerId === 'bot').at(-1)?.date).toBe('2026-09-29');
    expect(retained.filter((entry) => entry.providerId === 'moneybox')).toHaveLength(30);
    expect(retained.filter((entry) => entry.providerId === 'moneybox').at(-1)?.date).toBe(
      '2026-09-30',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

it('uses each provider calendar when UTC crosses into the next Seoul day', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fx-provider-calendars-'));
  const v3 = join(dir, 'v3');
  try {
    mkdirSync(v3, { recursive: true });
    writeFileSync(
      join(v3, 'history-index.json'),
      JSON.stringify([
        { providerId: 'bot', date: '2026-09-27' },
        { providerId: 'bot', date: '2026-09-28' },
        { providerId: 'moneybox', date: '2026-09-29' },
      ]),
    );
    const retained = retainedHistory(dir, new Date('2026-09-28T15:30:00Z'));
    expect(retained).toContainEqual({ providerId: 'bot', date: '2026-09-27' });
    expect(retained).not.toContainEqual({ providerId: 'bot', date: '2026-09-28' });
    expect(retained).toContainEqual({ providerId: 'moneybox', date: '2026-09-29' });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

it('reports per-provider history, date gaps and quarantines; rejects a provider with no history', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'fx-provider-coverage-'));
  const v3 = join(dir, 'v3');
  const time = '2026-09-20T10:00:00Z';
  const inputs = {
    bot: {
      timestamp: time,
      sourcePublishedAt: time,
      details: { USD: { cash: { buy: '31', sell: '32' } } },
    },
    moneybox: { timestamp: time, rates: { TWD: { buy: '46', sell: '45' } } },
  };
  try {
    const initial = await publishRelease(v3, inputs, time);
    const history = initial.manifest.providers.flatMap(({ providerId, snapshot }) =>
      providerId === 'bot'
        ? [
            { providerId, date: '2026-09-20', snapshot },
            { providerId, date: '2026-09-22', snapshot },
          ]
        : [{ providerId, date: '2026-09-20', snapshot }],
    );
    await publishRelease(v3, inputs, '2026-09-22T10:00:00Z', history);
    writeFileSync(
      join(v3, 'migration.json'),
      JSON.stringify({
        entries: [
          { providerId: 'bot', status: 'quarantined' },
          { providerId: 'moneybox', status: 'converted' },
        ],
      }),
    );
    const verified = verifyDataRoot(dir);
    expect(verified.providers).toMatchObject({
      bot: {
        history: 2,
        dateGaps: [{ after: '2026-09-20', before: '2026-09-22', missingDays: 1 }],
        quarantined: 1,
      },
      moneybox: { history: 1, dateGaps: [], quarantined: 0 },
    });

    await publishRelease(v3, inputs, time, []);
    expect(() => verifyDataRoot(dir)).toThrow('No history for provider: bot');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

it('requires bot and MoneyBox providers in the verified release', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'fx-required-providers-'));
  const v3 = join(dir, 'v3');
  const time = '2026-09-20T10:00:00Z';
  try {
    const result = await publishRelease(
      v3,
      {
        bot: {
          timestamp: time,
          sourcePublishedAt: time,
          details: { USD: { cash: { buy: '31', sell: '32' } } },
        },
      },
      time,
      [],
    );
    expect(result.manifest.providers.map((provider) => provider.providerId)).toEqual(['bot']);
    writeFileSync(join(v3, 'migration.json'), JSON.stringify({ entries: [] }));
    expect(() => verifyDataRoot(dir)).toThrow('Missing required provider: moneybox');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
