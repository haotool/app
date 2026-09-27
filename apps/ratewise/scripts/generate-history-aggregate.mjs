#!/usr/bin/env node
/** Rebuild the legacy aggregate from the checked-out data revision, never a floating CDN. */
import { existsSync, readFileSync, writeFileSync, renameSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { normalizeMoneyboxSnapshot } from '../../shared/fx/runtime.mjs';
import { isHistoryDate, isValidHistorySnapshot } from '../../shared/fx/history.mjs';

export function buildHistoryAggregate(entries) {
  for (const { date, data } of entries) {
    if (!isHistoryDate(date) || (data !== null && !isValidHistorySnapshot(data, date)))
      throw new Error(`Invalid history snapshot: ${date}`);
  }
  const valid = entries.filter(({ data }) => data?.rates);
  const currencies = [...new Set(valid.flatMap(({ data }) => Object.keys(data.rates)))];
  return {
    updateTime: valid[0]?.data.updateTime ?? '',
    generatedAt: new Date().toISOString(),
    dates: valid.map(({ date }) => date),
    updateTimes: valid.map(({ data }) => data.updateTime),
    rates: Object.fromEntries(
      currencies.map((currency) => [
        currency,
        valid.map(({ data }) => data.rates[currency] ?? null),
      ]),
    ),
  };
}

export function generateHistoryAggregate(root, now = new Date()) {
  const output = join(root, 'public/rates/history-30d.json');
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(now);
  const entries = Array.from({ length: 30 }, (_, i) => {
    const day = new Date(`${today}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() - i - 1);
    const date = day.toISOString().slice(0, 10);
    const file = join(root, 'public/rates/history', `${date}.json`);
    return { date, data: existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null };
  });
  const aggregate = buildHistoryAggregate(entries);
  const previousCount = existsSync(output)
    ? (JSON.parse(readFileSync(output, 'utf8')).dates?.length ?? 0)
    : 0;
  if (!aggregate.dates.length || aggregate.dates.length < previousCount) {
    throw new Error('Refusing to replace last-known-good history with empty or shortened coverage');
  }
  writeFileSync(`${output}.tmp`, JSON.stringify(aggregate, null, 2) + '\n');
  renameSync(`${output}.tmp`, output);
  return aggregate;
}

export function generateMoneyboxHistoryAggregate(root) {
  const folder = join(root, 'public/rates/providers/moneybox');
  const output = join(folder, 'history-30d.json');
  const snapshots = readdirSync(join(folder, 'history'))
    .filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file))
    .sort()
    .reverse()
    .slice(0, 30)
    .map((file) => {
      const date = file.slice(0, -5);
      const raw = JSON.parse(readFileSync(join(folder, 'history', file), 'utf8'));
      if (!isHistoryDate(date) || !normalizeMoneyboxSnapshot(raw).length)
        throw new Error(`Invalid MoneyBox history: ${date}`);
      return { date, raw };
    });
  const previousCount = existsSync(output)
    ? (JSON.parse(readFileSync(output, 'utf8')).snapshots?.length ?? 0)
    : 0;
  if (!snapshots.length || snapshots.length < previousCount)
    throw new Error('Refusing empty or shortened MoneyBox history');
  const aggregate = { providerId: 'moneybox', generatedAt: new Date().toISOString(), snapshots };
  writeFileSync(`${output}.tmp`, JSON.stringify(aggregate, null, 2) + '\n');
  renameSync(`${output}.tmp`, output);
  return aggregate;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = resolve(process.env.RATE_DATA_ROOT ?? '.');
  if (process.env.FX_PROVIDER === 'moneybox') generateMoneyboxHistoryAggregate(root);
  else generateHistoryAggregate(root);
}
