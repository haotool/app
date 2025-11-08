#!/usr/bin/env node
/* eslint-disable no-undef */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DAYS_TO_CHECK = Number(process.env.HISTORY_DAYS ?? '30');
const START_OFFSET = Number(process.env.HISTORY_START_OFFSET ?? '1'); // 從昨天開始
const OUTPUT_PATH = path.resolve(process.cwd(), 'tmp/history-manifest.json');

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/history';
const RAW_BASE = 'https://raw.githubusercontent.com/haotool/app/data/public/rates/history';

function formatDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function probe(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok && response.status === 405) {
      // 某些 CDN 不支援 HEAD，退回 GET
      const getResponse = await fetch(url, { method: 'GET' });
      return {
        status: getResponse.ok ? 'ok' : 'missing',
        statusCode: getResponse.status,
      };
    }
    return {
      status: response.ok ? 'ok' : 'missing',
      statusCode: response.status,
    };
  } catch (error) {
    return {
      status: 'error',
      statusCode: 0,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const manifest = {
    generatedAt: new Date().toISOString(),
    daysChecked: DAYS_TO_CHECK,
    entries: [],
  };

  for (let i = START_OFFSET; i < START_OFFSET + DAYS_TO_CHECK; i++) {
    const target = new Date(today);
    target.setUTCDate(target.getUTCDate() - i);
    const dateStr = formatDate(target);

    const cdnUrl = `${CDN_BASE}/${dateStr}.json`;
    const rawUrl = `${RAW_BASE}/${dateStr}.json`;

    const [cdnResult, rawResult] = await Promise.all([probe(cdnUrl), probe(rawUrl)]);

    manifest.entries.push({
      date: dateStr,
      cdn: { url: cdnUrl, ...cdnResult },
      raw: { url: rawUrl, ...rawResult },
      missing: cdnResult.status !== 'ok' && rawResult.status !== 'ok',
    });
  }

  // 計算連續缺失天數
  let consecutiveMissing = 0;
  let maxConsecutiveMissing = 0;
  const missingDates = [];

  for (const entry of manifest.entries) {
    if (entry.missing) {
      consecutiveMissing += 1;
      missingDates.push(entry.date);
    } else {
      maxConsecutiveMissing = Math.max(maxConsecutiveMissing, consecutiveMissing);
      consecutiveMissing = 0;
    }
  }
  maxConsecutiveMissing = Math.max(maxConsecutiveMissing, consecutiveMissing);

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(manifest, null, 2));

  console.log(`📄 歷史匯率 manifest 已輸出至 ${OUTPUT_PATH}`);
  if (missingDates.length > 0) {
    console.log(`⚠️ 缺失日期: ${missingDates.join(', ')}`);
  } else {
    console.log('✅ 近期歷史匯率檔案完整');
  }

  if (maxConsecutiveMissing >= 2) {
    console.error(
      `❌ 連續缺失 ${maxConsecutiveMissing} 天，請立即執行 scripts/setup-historical-rates.sh 並補檔`,
    );
    process.exitCode = 1;
  }
}

await main();
