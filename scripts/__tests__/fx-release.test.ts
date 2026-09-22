import { describe, expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { legacyPayload, publishRelease, sunsetAt } from '../publish-fx-release.mjs';

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
