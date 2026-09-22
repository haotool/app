import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildHistoryAggregate,
  generateHistoryAggregate,
} from '../../../scripts/generate-history-aggregate.mjs';

describe('history aggregate integrity', () => {
  it('keeps dates aligned across a missing day', () => {
    const result = buildHistoryAggregate([
      {
        date: '2026-09-21',
        data: { updateTime: '2026/09/21 08:00:00', source: 'Taiwan Bank', rates: { USD: 31 } },
      },
      { date: '2026-09-20', data: null },
      {
        date: '2026-09-19',
        data: { updateTime: '2026/09/19 08:00:00', source: 'Taiwan Bank', rates: { USD: 30 } },
      },
    ]);
    expect(result.dates).toEqual(['2026-09-21', '2026-09-19']);
    expect(result.rates.USD).toEqual([31, 30]);
  });
});

it('never replaces a good aggregate with empty or shortened coverage', () => {
  const root = mkdtempSync(join(tmpdir(), 'history-'));
  const dir = join(root, 'public/rates');
  mkdirSync(join(dir, 'history'), { recursive: true });
  const previous = JSON.stringify({
    dates: ['2026-09-21', '2026-09-20'],
    rates: { USD: [31, 30] },
  });
  writeFileSync(join(dir, 'history-30d.json'), previous);
  try {
    expect(() => generateHistoryAggregate(root, new Date('2026-09-22T00:00:00Z'))).toThrow();
    expect(readFileSync(join(dir, 'history-30d.json'), 'utf8')).toBe(previous);
    writeFileSync(
      join(dir, 'history/2026-09-21.json'),
      JSON.stringify({
        source: 'Taiwan Bank',
        updateTime: '2026/09/21 08:00:00',
        rates: { USD: 31 },
      }),
    );
    expect(() => generateHistoryAggregate(root, new Date('2026-09-22T00:00:00Z'))).toThrow();
    expect(readFileSync(join(dir, 'history-30d.json'), 'utf8')).toBe(previous);
  } finally {
    rmSync(root, { recursive: true });
  }
});

it('rejects malformed history before aggregation', () => {
  for (const data of [
    { source: 'MoneyBox', updateTime: '2026/09/21 08:00:00', rates: { USD: 31 } },
    { source: 'Taiwan Bank', updateTime: '2026/09/21 08:00:00', rates: { USD: -1 } },
    { source: 'Taiwan Bank', updateTime: '2026/09/21 08:00:00', rates: { USD: '31' } },
    {
      source: 'Taiwan Bank',
      updateTime: '2026/09/21 08:00:00',
      snapshotDate: '2026-09-20',
      rates: { USD: 31 },
    },
  ])
    expect(() => buildHistoryAggregate([{ date: '2026-09-21', data }])).toThrow();
});

it('rejects misaligned columns and wrong provider before using aggregate', async () => {
  const { isValidHistoryAggregate } = await import('../../../../shared/fx/history.mjs');
  expect(
    isValidHistoryAggregate({ dates: ['2026-09-21', '2026-09-20'], rates: { USD: [31] } }),
  ).toBe(false);
  expect(
    isValidHistoryAggregate({
      providerId: 'moneybox',
      dates: ['2026-09-21'],
      rates: { USD: [31] },
    }),
  ).toBe(false);
  expect(isValidHistoryAggregate({ dates: ['2026-02-30'], rates: { USD: [31] } })).toBe(false);
  expect(isValidHistoryAggregate({ dates: ['2026-09-21'], rates: { USD: [31] } })).toBe(true);
});

it('accepts flat prices while rejecting null empty zero and negative validation samples', async () => {
  const { validateHistoryEntries } = await import('../../../../../scripts/verify-history-data.mjs');
  expect(validateHistoryEntries([{ value: 31 }, { value: 31 }])).toEqual([]);
  expect(
    validateHistoryEntries([{ value: null }, { value: '' }, { value: 0 }, { value: -1 }]),
  ).toHaveLength(4);
});

it('rejects rolled-over dates and permits real legacy slash timestamps', async () => {
  const { isValidHistorySnapshot } = await import('../../../../shared/fx/history.mjs');
  const snapshot = { source: 'Taiwan Bank', rates: { USD: 31 } };
  expect(isValidHistorySnapshot({ ...snapshot, updateTime: '2026/02/30 08:00:00' })).toBe(false);
  expect(isValidHistorySnapshot({ ...snapshot, updateTime: '2026/02/28 08:00:00' })).toBe(true);
  expect(isValidHistorySnapshot({ ...snapshot, updateTime: '2026/02/28 08:00:00' })).toBe(true);
});
