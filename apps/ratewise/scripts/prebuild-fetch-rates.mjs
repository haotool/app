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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const PUBLIC_PATH = path.resolve(APP_ROOT, 'public');
const RATES_CACHE_PATH = path.resolve(PUBLIC_PATH, 'rates.json');

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
      console.log(`✅ 使用緩存匯率（${Object.keys(cached).length} 個幣別）`);
      return cached;
    }
  } catch (error) {
    console.error(`❌ 讀取緩存失敗：${error.message}`);
  }

  // 返回預設值（僅作為備用）
  console.warn('⚠️  無法加載緩存，使用預設匯率');
  return getDefaultRates();
}

/**
 * 預設匯率（備用）
 */
function getDefaultRates() {
  return {
    'usd-twd': 31.5,
    'jpy-twd': 0.21,
    'eur-twd': 34.8,
    'gbp-twd': 40.2,
    'cny-twd': 4.35,
    'hkd-twd': 4.05,
    'krw-twd': 0.024,
    'thb-twd': 0.88,
    'myr-twd': 6.8,
    'sgd-twd': 23.5,
    'php-twd': 0.56,
    'idr-twd': 0.002,
    'vnd-twd': 0.00123,
    'aud-twd': 20.8,
    'nzd-twd': 19.2,
    'cad-twd': 22.5,
    'chf-twd': 35.8,
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
 * 生成所有金額組合的路由
 */
function generateAmountPaths() {
  const commonAmounts = {
    usd: [1, 10, 100, 500, 1000, 5000],
    jpy: [100, 1000, 10000, 100000],
    eur: [10, 100, 500, 1000],
    gbp: [10, 100, 500, 1000],
    cny: [100, 1000, 10000],
    hkd: [100, 1000, 10000],
    krw: [1000, 10000, 100000],
    thb: [100, 1000, 10000],
    myr: [100, 1000],
    sgd: [100, 1000],
    php: [100, 1000],
    idr: [10000, 100000],
    vnd: [100000, 1000000],
    aud: [100, 1000],
    nzd: [100, 1000],
    cad: [100, 1000],
    chf: [100, 1000],
  };

  const paths = [];

  // 生成正向和反向路由
  for (const [currency, amounts] of Object.entries(commonAmounts)) {
    amounts.forEach((amount) => {
      paths.push(`/${currency}-twd/${amount}/`);
      paths.push(`/twd-${currency}/${amount}/`);
    });
  }

  return paths;
}

/**
 * 主函數
 */
async function main() {
  console.log('\n📊 RateWise 構建時匯率數據預處理');
  console.log('═'.repeat(50));

  // 1. 獲取匯率
  const rates = await fetchLatestRates();

  // 2. 保存匯率
  const saved = saveRates(rates);

  if (!saved) {
    console.error('❌ 構建失敗：無法保存匯率數據');
    process.exit(1);
  }

  // 3. 生成路由信息
  const amountPaths = generateAmountPaths();
  console.log(`\n📈 預計生成 ${amountPaths.length} 個金額路由頁面`);
  console.log(`   基礎路由：43 個`);
  console.log(`   金額路由：${amountPaths.length} 個`);
  console.log(`   總計：${43 + amountPaths.length} 個靜態頁面`);

  console.log('\n✅ 構建前準備完成！');
  console.log('═'.repeat(50) + '\n');
}

// 執行
main().catch((error) => {
  console.error('❌ 致命錯誤：', error);
  process.exit(1);
});
