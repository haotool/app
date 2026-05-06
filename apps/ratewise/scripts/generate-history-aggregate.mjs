#!/usr/bin/env node
/**
 * 生成 30 天歷史匯率聚合 JSON
 *
 * 將 30 個獨立的 history/YYYY-MM-DD.json 合併成單一 history-30d.json。
 * 使用 column-major 格式減少 JSON 大小（約 8KB gzip）。
 *
 * 輸入：public/rates/history/*.json（或 CDN data branch）
 * 輸出：public/rates/history-30d.json
 *
 * @created 2026-05-05
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CANDIDATES = [join(__dirname, '..'), process.cwd()];
const TARGET_ROOT = resolveTargetRoot();
const OUTPUT_PATH = join(TARGET_ROOT, 'public', 'rates', 'history-30d.json');

function resolveTargetRoot() {
  const configured = process.env.RATE_DATA_ROOT;
  if (configured) {
    const resolved = join(configured);
    if (existsSync(join(resolved, 'public', 'rates'))) return resolved;
  }

  for (const candidate of DEFAULT_CANDIDATES) {
    if (existsSync(join(candidate, 'public', 'rates'))) {
      return candidate;
    }
  }

  throw new Error('無法定位 public/rates 資料根目錄，請設定 RATE_DATA_ROOT');
}

// 資料來源常數
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/haotool/app@data';
const RAW_BASE = 'https://raw.githubusercontent.com/haotool/app/data';
const MAX_DAYS = 30;

/**
 * 產生過去 N 天的日期字串陣列
 * @param {number} days
 * @returns {string[]} YYYY-MM-DD 格式
 */
function generateDateRange(days) {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
  }

  return dates;
}

/**
 * 從 CDN 或 Raw 獲取單日匯率資料
 * @param {string} date YYYY-MM-DD
 * @returns {Promise<{rates: Record<string, number>} | null>}
 */
async function fetchDailyRates(date) {
  const urls = [
    `${CDN_BASE}/public/rates/history/${date}.json`,
    `${RAW_BASE}/public/rates/history/${date}.json`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch {
      // 嘗試下一個 URL
    }
  }

  return null;
}

/**
 * 主程式：生成 aggregate JSON
 */
async function main() {
  console.log('🚀 生成 30 天歷史匯率聚合 JSON...');

  const dates = generateDateRange(MAX_DAYS);
  const aggregateRates = {};
  const validDates = [];
  let updateTime = '';

  // 定義所有支援的貨幣代碼
  const currencies = [
    'TWD',
    'USD',
    'HKD',
    'GBP',
    'AUD',
    'CAD',
    'SGD',
    'CHF',
    'JPY',
    'NZD',
    'THB',
    'PHP',
    'IDR',
    'EUR',
    'KRW',
    'VND',
    'MYR',
    'CNY',
  ];

  // 初始化 rates 結構
  for (const currency of currencies) {
    aggregateRates[currency] = [];
  }

  // 並行獲取所有日期的資料（5 批次）
  const BATCH_SIZE = 5;
  let consecutiveMissing = 0;

  for (let i = 0; i < dates.length; i += BATCH_SIZE) {
    const batch = dates.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(fetchDailyRates));

    for (let j = 0; j < batch.length; j++) {
      const date = batch[j];
      const data = results[j];

      if (data && data.rates) {
        validDates.push(date);
        consecutiveMissing = 0;

        // 記錄最新的 updateTime
        if (!updateTime && data.updateTime) {
          updateTime = data.updateTime;
        }

        // 填充各貨幣的匯率
        for (const currency of currencies) {
          const rate = data.rates[currency];
          aggregateRates[currency].push(rate ?? null);
        }
      } else {
        consecutiveMissing++;
        console.log(`  ⚠️ 缺少 ${date} 的資料`);

        // 填充 null 保持索引對齊
        for (const currency of currencies) {
          aggregateRates[currency].push(null);
        }
      }
    }

    // 連續 5 天缺失則停止
    if (consecutiveMissing >= 5) {
      console.log('  ⚠️ 連續缺失過多，停止獲取');
      break;
    }

    // 避免 rate limit
    if (i + BATCH_SIZE < dates.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // 建立 aggregate JSON
  const aggregate = {
    updateTime: updateTime || new Date().toISOString(),
    generatedAt: new Date().toISOString(),
    dates: validDates,
    rates: aggregateRates,
  };

  // 確保輸出目錄存在
  const outputDir = dirname(OUTPUT_PATH);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // 寫入 JSON
  writeFileSync(OUTPUT_PATH, JSON.stringify(aggregate, null, 2) + '\n');

  // 計算檔案大小
  const jsonSize = JSON.stringify(aggregate).length;
  const estimatedGzipSize = Math.round(jsonSize * 0.15); // 估計 gzip 後約 15%

  console.log(`✅ 已生成 ${OUTPUT_PATH}`);
  console.log(`   - 有效天數：${validDates.length}`);
  console.log(`   - 貨幣數量：${currencies.length}`);
  console.log(`   - JSON 大小：${Math.round(jsonSize / 1024)}KB`);
  console.log(`   - 估計 Gzip：${Math.round(estimatedGzipSize / 1024)}KB`);
}

main().catch((error) => {
  console.error('❌ 生成失敗:', error);
  process.exit(1);
});
