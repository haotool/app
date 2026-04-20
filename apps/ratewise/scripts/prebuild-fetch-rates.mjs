#!/usr/bin/env node

/**
 * 構建時匯率數據獲取腳本
 * 在 vite build 前執行，獲取最新匯率並保存到 public/rates.json
 * 用於 SSG 預渲染時注入到靜態 HTML
 *
 * 使用：pnpm run prebuild:fetch-rates
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { STATS } from '../seo-paths.config.mjs';
import { APP_INFO } from '../src/config/app-info.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const PUBLIC_PATH = path.resolve(APP_ROOT, 'public');
const RATES_CACHE_PATH = path.resolve(PUBLIC_PATH, 'rates.json');
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000;

function parseRateTimestamp(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1_000_000_000_000 ? value : value * 1000;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
    }

    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function getCacheTimestamp(cached) {
  return (
    parseRateTimestamp(cached?.timestamp) ??
    parseRateTimestamp(cached?.updateTime) ??
    parseRateTimestamp(cached?.buildMeta?.fetchedAt) ??
    null
  );
}

function formatAgeHours(ageMs) {
  return `${(ageMs / (60 * 60 * 1000)).toFixed(1)}h`;
}

/**
 * 獲取最新匯率
 */
async function fetchLatestRates() {
  console.log('⏳ 構建時：從 API 獲取匯率數據...');

  try {
    // 方案 A：使用 CDN 上的匯率快照（推薦用於構建時）
    const cdnUrl = 'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json';

    const response = await fetch(cdnUrl, {
      signal: AbortSignal.timeout(10000), // 10 秒超時
    });

    if (!response.ok) {
      throw new Error(`API 返回 ${response.status}：${response.statusText}`);
    }

    const data = await response.json();

    if (!data || typeof data !== 'object') {
      throw new Error('API 返回數據格式無效');
    }

    console.log(`✅ 成功獲取 ${Object.keys(data).length} 個幣別的匯率`);
    return data;
  } catch (error) {
    console.warn(`⚠️  API 獲取失敗（${error.message}），嘗試使用緩存...`);
    return loadCachedRates();
  }
}

/**
 * 加載上次緩存的匯率
 */
function loadCachedRates() {
  try {
    if (fs.existsSync(RATES_CACHE_PATH)) {
      const cached = JSON.parse(fs.readFileSync(RATES_CACHE_PATH, 'utf-8'));
      const cacheTimestamp = getCacheTimestamp(cached);

      if (cacheTimestamp === null) {
        console.warn('⚠️  緩存缺少可解析時間戳，忽略 public/rates.json。');
      } else {
        const ageMs = Date.now() - cacheTimestamp;
        if (ageMs <= MAX_CACHE_AGE_MS) {
          console.log(
            `✅ 使用緩存匯率（年齡 ${formatAgeHours(ageMs)}，${Object.keys(cached).length} 個頂層欄位）`,
          );
          return cached;
        }

        console.warn(
          `⚠️  緩存匯率已過舊（年齡 ${formatAgeHours(ageMs)} > 24h），忽略 public/rates.json。`,
        );
      }
    }
  } catch (error) {
    console.error(`❌ 讀取緩存失敗：${error.message}`);
  }

  // 返回預設值（僅作為備用）
  console.warn('⚠️  無法加載緩存，使用預設匯率');
  return getDefaultRates();
}

/**
 * 預設匯率（備用）- 與 public/rates.json 結構一致
 */
function getDefaultRates() {
  return {
    timestamp: new Date().toISOString(),
    updateTime: new Date().toLocaleString('zh-TW'),
    source: 'Default fallback rates',
    sourceUrl: 'https://rate.bot.com.tw/xrt',
    base: 'TWD',
    rates: {
      USD: 31.5,
      JPY: 0.21,
      EUR: 34.8,
      GBP: 40.2,
      CNY: 4.35,
      HKD: 4.05,
      KRW: 0.024,
      THB: 0.88,
      MYR: 6.8,
      SGD: 23.5,
      PHP: 0.56,
      IDR: 0.002,
      VND: 0.00123,
      AUD: 20.8,
      NZD: 19.2,
      CAD: 22.5,
      CHF: 35.8,
    },
    details: {
      USD: {
        name: '美金',
        spot: { buy: 31.0, sell: 31.5 },
        cash: { buy: 31.2, sell: 31.5 },
      },
      EUR: {
        name: '歐元',
        spot: { buy: 34.0, sell: 34.8 },
        cash: { buy: 34.3, sell: 34.8 },
      },
      GBP: {
        name: '英鎊',
        spot: { buy: 39.5, sell: 40.2 },
        cash: { buy: 39.8, sell: 40.2 },
      },
      JPY: {
        name: '日圓',
        spot: { buy: 0.2, sell: 0.21 },
        cash: { buy: 0.205, sell: 0.21 },
      },
      CNY: {
        name: '人民幣',
        spot: { buy: 4.28, sell: 4.35 },
        cash: { buy: 4.31, sell: 4.35 },
      },
      HKD: {
        name: '港幣',
        spot: { buy: 3.98, sell: 4.05 },
        cash: { buy: 4.01, sell: 4.05 },
      },
      KRW: {
        name: '韓元',
        spot: { buy: 0.023, sell: 0.024 },
        cash: { buy: 0.0235, sell: 0.024 },
      },
      THB: {
        name: '泰銖',
        spot: { buy: 0.85, sell: 0.88 },
        cash: { buy: 0.86, sell: 0.88 },
      },
      MYR: {
        name: '馬來幣',
        spot: { buy: 6.65, sell: 6.8 },
        cash: { buy: 6.72, sell: 6.8 },
      },
      SGD: {
        name: '新加坡幣',
        spot: { buy: 23.0, sell: 23.5 },
        cash: { buy: 23.2, sell: 23.5 },
      },
      PHP: {
        name: '菲律賓披索',
        spot: { buy: null, sell: null },
        cash: { buy: 0.54, sell: 0.56 },
      },
      IDR: {
        name: '印尼幣',
        spot: { buy: null, sell: null },
        cash: { buy: 0.0019, sell: 0.002 },
      },
      VND: {
        name: '越南盾',
        spot: { buy: null, sell: null },
        cash: { buy: 0.00115, sell: 0.00123 },
      },
      AUD: {
        name: '澳幣',
        spot: { buy: 20.4, sell: 20.8 },
        cash: { buy: 20.6, sell: 20.8 },
      },
      NZD: {
        name: '紐元',
        spot: { buy: 18.9, sell: 19.2 },
        cash: { buy: 19.05, sell: 19.2 },
      },
      CAD: {
        name: '加拿大幣',
        spot: { buy: 22.1, sell: 22.5 },
        cash: { buy: 22.3, sell: 22.5 },
      },
      CHF: {
        name: '瑞士法郎',
        spot: { buy: 35.2, sell: 35.8 },
        cash: { buy: 35.5, sell: 35.8 },
      },
    },
  };
}

/**
 * 保存匯率到 public/rates.json
 */
function saveRates(rates) {
  try {
    // 確保目錄存在
    if (!fs.existsSync(PUBLIC_PATH)) {
      fs.mkdirSync(PUBLIC_PATH, { recursive: true });
    }

    fs.writeFileSync(RATES_CACHE_PATH, JSON.stringify(rates, null, 2), 'utf-8');

    console.log(`✅ 匯率已保存到：${RATES_CACHE_PATH}`);
    return true;
  } catch (error) {
    console.error(`❌ 保存匯率失敗：${error.message}`);
    return false;
  }
}

/**
 * 主函數
 */
async function main() {
  console.log(`\n📊 ${APP_INFO.shortName} 構建時匯率數據預處理`);
  console.log('═'.repeat(50));

  // 1. 獲取匯率
  const rates = await fetchLatestRates();

  // 2. 保存匯率
  const saved = saveRates(rates);

  if (!saved) {
    console.error('❌ 構建失敗：無法保存匯率數據');
    process.exit(1);
  }

  // 3. 顯示當前 SSOT 統計
  const indexableBasePages = STATS.content + STATS.currency + STATS.reverseCurrency;
  const indexableAmountPages = STATS.currencyAmount + STATS.reverseCurrencyAmount;
  console.log('\n📈 當前 SEO / SSG 統計（SSOT）');
  console.log(`   canonical 基礎頁：${indexableBasePages} 個`);
  console.log(`   canonical 金額頁：${indexableAmountPages} 個`);
  console.log(`   預渲染靜態頁：${STATS.total} 個`);

  console.log('\n✅ 構建前準備完成！');
  console.log('═'.repeat(50) + '\n');
}

// 執行
main().catch((error) => {
  console.error('❌ 致命錯誤：', error);
  process.exit(1);
});
