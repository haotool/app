import { describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildHistoryAggregate,
  generateHistoryAggregate,
  generateMoneyboxHistoryAggregate,
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

it('never replaces a good aggregate with an empty window', () => {
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
  } finally {
    rmSync(root, { recursive: true });
  }
});

describe('data-branch shaped history window', () => {
  const fixture = (name) =>
    JSON.parse(readFileSync(join(import.meta.dirname, 'fixtures/data-branch', name), 'utf8'));
  const dayBefore = (date, days) => {
    const day = new Date(`${date}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() - days);
    return day.toISOString().slice(0, 10);
  };
  const seed = (dir, today, skip) => {
    const snapshot = fixture('bot-history-snapshot.json');
    for (let i = 1; i <= 30; i++) {
      const date = dayBefore(today, i);
      if (skip.includes(date)) continue;
      const updateTime = `${date.replaceAll('-', '/')} 08:00:00`;
      writeFileSync(join(dir, `${date}.json`), JSON.stringify({ ...snapshot, updateTime }));
    }
  };

  it('keeps aggregating after a missing day instead of ratcheting on the previous count', () => {
    const root = mkdtempSync(join(tmpdir(), 'history-window-'));
    const dir = join(root, 'public/rates');
    mkdirSync(join(dir, 'history'), { recursive: true });
    try {
      // 前一日：完整 30 天 → 前次 aggregate 為 30 筆。
      seed(join(dir, 'history'), '2026-09-27', []);
      expect(generateHistoryAggregate(root, new Date('2026-09-27T01:00:00Z')).dates).toHaveLength(
        30,
      );
      // 隔日：2026-09-27 快照缺失（例如當日 workflow 未執行），視窗內僅 29 天仍須成功寫入。
      rmSync(join(dir, 'history/2026-09-27.json'), { force: true });
      const next = generateHistoryAggregate(root, new Date('2026-09-28T01:00:00Z'));
      expect(next.dates).toHaveLength(29);
      expect(next.dates).not.toContain('2026-09-27');
      const written = JSON.parse(readFileSync(join(dir, 'history-30d.json'), 'utf8'));
      expect(written.dates).toEqual(next.dates);
      // v2 形狀與 main 一致：TWD 欄存在且為首欄。
      expect(Object.keys(written.rates)[0]).toBe('TWD');
      expect(written.rates.TWD.every((value) => value === null)).toBe(true);
      expect(written.rates.USD).toHaveLength(29);
    } finally {
      rmSync(root, { recursive: true });
    }
  });

  it('skips a corrupt snapshot with a warning instead of blocking the aggregate', () => {
    const root = mkdtempSync(join(tmpdir(), 'history-corrupt-'));
    const dir = join(root, 'public/rates');
    mkdirSync(join(dir, 'history'), { recursive: true });
    const warn = vi.spyOn(globalThis.console, 'warn').mockImplementation(() => {});
    try {
      seed(join(dir, 'history'), '2026-09-28', []);
      writeFileSync(join(dir, 'history/2026-09-20.json'), '{"source":"Taiwan Bank","rates":');
      const result = generateHistoryAggregate(root, new Date('2026-09-28T01:00:00Z'));
      expect(result.dates).not.toContain('2026-09-20');
      expect(result.dates).toHaveLength(29);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('2026-09-20'));
    } finally {
      warn.mockRestore();
      rmSync(root, { recursive: true });
    }
  });

  it('skips a bad MoneyBox history file with a warning like main', () => {
    const root = mkdtempSync(join(tmpdir(), 'history-moneybox-'));
    const dir = join(root, 'public/rates/providers/moneybox/history');
    mkdirSync(dir, { recursive: true });
    const warn = vi.spyOn(globalThis.console, 'warn').mockImplementation(() => {});
    try {
      const snapshot = fixture('moneybox-history-snapshot.json');
      writeFileSync(join(dir, '2026-09-26.json'), JSON.stringify(snapshot));
      writeFileSync(join(dir, '2026-09-27.json'), JSON.stringify({ ...snapshot, rates: {} }));
      writeFileSync(join(dir, '2026-09-28.json'), '{not json');
      const result = generateMoneyboxHistoryAggregate(root);
      expect(result.snapshots.map(({ date }) => date)).toEqual(['2026-09-26']);
      expect(warn).toHaveBeenCalledTimes(2);
    } finally {
      warn.mockRestore();
      rmSync(root, { recursive: true });
    }
  });
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
