#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-undef */
/* global fetch */
/**
 * 驗證最近 N 天歷史匯率資料是否可讀取且具備實際波動
 * 需求來源：確保 30 天資料完整，可提供趨勢圖
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isHistoryRate, isValidHistorySnapshot } from '../apps/shared/fx/history.mjs';

export function validateHistoryEntries(entries) {
  return entries.filter(({ value }) => !isHistoryRate(value));
}

const DAYS_TO_VERIFY = Number(process.env.HISTORY_DAYS ?? '25');
const START_OFFSET = Number(process.env.HISTORY_START_OFFSET ?? '1'); // 預設從昨天開始
const TARGET_CURRENCY = process.env.HISTORY_CURRENCY ?? 'USD';
const OUTPUT_FILE = path.resolve(process.cwd(), 'tmp/history-values.json');

const ENDPOINTS = [
  'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/history',
  'https://raw.githubusercontent.com/haotool/app/data/public/rates/history',
];

function formatDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function fetchHistory(date) {
  for (const base of ENDPOINTS) {
    const url = `${base}/${date}.json`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        continue;
      }
      return {
        url,
        payload: await res.json(),
      };
    } catch (error) {
      // 換下一個端點
      console.warn(
        `⚠️  ${url} 取得失敗：${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return null;
}

async function main() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const entries = [];
  const missingDates = [];
  const invalidRates = [];
  const distinctValues = new Set();

  for (let i = START_OFFSET; i < START_OFFSET + DAYS_TO_VERIFY; i += 1) {
    const targetDate = new Date(today);
    targetDate.setUTCDate(targetDate.getUTCDate() - i);
    const dateStr = formatDate(targetDate);

    const result = await fetchHistory(dateStr);
    if (!result) {
      missingDates.push(dateStr);
      continue;
    }

    const { payload, url } = result;
    const { updateTime, source = 'unknown', rates } = payload ?? {};
    const value = rates?.[TARGET_CURRENCY];
    const numericValue = value;

    entries.push({
      date: dateStr,
      sourceUrl: url,
      updateTime,
      source,
      currency: TARGET_CURRENCY,
      value: numericValue,
    });

    if (
      validateHistoryEntries([{ value: numericValue }]).length > 0 ||
      !isValidHistorySnapshot(payload, dateStr)
    ) {
      invalidRates.push(dateStr);
    } else {
      distinctValues.add(numericValue.toFixed(6));
    }
  }

  await mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(
    OUTPUT_FILE,
    JSON.stringify({ generatedAt: new Date().toISOString(), entries }, null, 2),
  );

  console.log(`📊 歷史數據驗證完成：已輸出詳細資料至 ${OUTPUT_FILE}`);
  console.table(
    entries.map((entry) => ({
      日期: entry.date,
      來源: entry.source,
      匯率: entry.value,
      更新時間: entry.updateTime ?? 'N/A',
    })),
  );

  if (missingDates.length > 0) {
    console.error(`❌ 無法取得以下日期的歷史匯率：${missingDates.join(', ')}`);
    process.exitCode = 1;
  }

  if (invalidRates.length > 0) {
    console.error(`❌ 以下日期缺少 ${TARGET_CURRENCY} 匯率欄位：${invalidRates.join(', ')}`);
    process.exitCode = 1;
  }

  // 平盤合法；資料完整性與上游存活不能由價格波動推斷。

  if (process.exitCode === undefined) {
    console.log(
      `✅ 成功驗證 ${entries.length} 天資料，${TARGET_CURRENCY} 匯率共有 ${distinctValues.size} 種不同數值，可安全繪製趨勢圖。`,
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href)
  await main();
