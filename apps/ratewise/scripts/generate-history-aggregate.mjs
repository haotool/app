#!/usr/bin/env node
/** Rebuild the legacy aggregate from the checked-out data revision, never a floating CDN. */
import { existsSync, readFileSync, writeFileSync, renameSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isHistoryDate, isValidHistorySnapshot } from '../../shared/fx/history.mjs';
import { assertMoneyBoxRatesIntegrity } from '../../../scripts/fetch-moneybox-rates.js';

export function buildHistoryAggregate(entries) {
  for (const { date, data } of entries) {
    if (!isHistoryDate(date) || (data !== null && !isValidHistorySnapshot(data, date)))
      throw new Error(`Invalid history snapshot: ${date}`);
  }
  const valid = entries.filter(({ data }) => data?.rates);
  // v2 形狀與 main 一致：TWD 欄恆為首欄（快照本身不含 TWD，值為 null）。
  const currencies = [...new Set(['TWD', ...valid.flatMap(({ data }) => Object.keys(data.rates))])];
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

/** 單日壞檔視同缺日並警示：不可讓一個檔案永久阻斷後續聚合（與 main 的容錯一致）。 */
function readSnapshot(file, date, isValid) {
  if (!existsSync(file)) return null;
  try {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    if (isValid(data, date)) return data;
  } catch {
    // 落到下方警示。
  }
  console.warn(`⚠️ Skipping invalid history snapshot: ${date}`);
  return null;
}

export const HISTORY_WINDOW_DAYS = 30;

/**
 * 覆蓋率以「應有視窗」（前 30 個台北日）衡量，不與前次筆數比較：
 * 缺日只警示，只有整個視窗皆無有效快照時才拒寫，避免缺一天後永久拒寫（ratchet）。
 */
export function generateHistoryAggregate(root, now = new Date()) {
  const output = join(root, 'public/rates/history-30d.json');
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(now);
  const entries = Array.from({ length: HISTORY_WINDOW_DAYS }, (_, i) => {
    const day = new Date(`${today}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() - i - 1);
    const date = day.toISOString().slice(0, 10);
    const file = join(root, 'public/rates/history', `${date}.json`);
    return { date, data: readSnapshot(file, date, isValidHistorySnapshot) };
  });
  const aggregate = buildHistoryAggregate(entries);
  if (!aggregate.dates.length) {
    throw new Error('Refusing to replace last-known-good history with an empty window');
  }
  if (aggregate.dates.length < HISTORY_WINDOW_DAYS) {
    console.warn(
      `⚠️ History coverage ${aggregate.dates.length}/${HISTORY_WINDOW_DAYS} days in window`,
    );
  }
  writeFileSync(`${output}.tmp`, JSON.stringify(aggregate, null, 2) + '\n');
  renameSync(`${output}.tmp`, output);
  return aggregate;
}

/** v2 資料管線不得依賴 pnpm install：以抓取端同一套零依賴完整性守門驗證歷史檔。 */
export function generateMoneyboxHistoryAggregate(root) {
  const folder = join(root, 'public/rates/providers/moneybox');
  const output = join(folder, 'history-30d.json');
  const isValidMoneybox = (raw, date) => {
    if (!isHistoryDate(date)) return false;
    assertMoneyBoxRatesIntegrity(raw?.rates, null);
    return true;
  };
  const snapshots = readdirSync(join(folder, 'history'))
    .filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file))
    .sort()
    .reverse()
    .slice(0, HISTORY_WINDOW_DAYS)
    .flatMap((file) => {
      const date = file.slice(0, -5);
      const raw = readSnapshot(join(folder, 'history', file), date, isValidMoneybox);
      return raw === null ? [] : [{ date, raw }];
    });
  if (!snapshots.length) throw new Error('Refusing empty MoneyBox history');
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
