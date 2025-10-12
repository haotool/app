/**
 * 台灣銀行牌告匯率抓取腳本
 * 資料來源: https://rate.bot.com.tw/xrt/flcsv/0/day
 * 更新頻率: 每30分鐘
 */

import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 設定檔案路徑
const REPO_ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(REPO_ROOT, 'public', 'rates');
const OUTPUT_FILE = join(OUTPUT_DIR, 'latest.json');

// 台灣銀行 CSV API
const TAIWAN_BANK_CSV_URL = 'https://rate.bot.com.tw/xrt/flcsv/0/day';

// 貨幣代碼對應表（台銀使用的代碼）
const CURRENCY_MAP = {
  USD: { name: '美金', code: 'USD' },
  HKD: { name: '港幣', code: 'HKD' },
  GBP: { name: '英鎊', code: 'GBP' },
  AUD: { name: '澳幣', code: 'AUD' },
  CAD: { name: '加拿大幣', code: 'CAD' },
  SGD: { name: '新加坡幣', code: 'SGD' },
  CHF: { name: '瑞士法郎', code: 'CHF' },
  JPY: { name: '日圓', code: 'JPY' },
  ZAR: { name: '南非幣', code: 'ZAR' },
  SEK: { name: '瑞典幣', code: 'SEK' },
  NZD: { name: '紐元', code: 'NZD' },
  THB: { name: '泰銖', code: 'THB' },
  PHP: { name: '菲律賓披索', code: 'PHP' },
  IDR: { name: '印尼幣', code: 'IDR' },
  EUR: { name: '歐元', code: 'EUR' },
  KRW: { name: '韓元', code: 'KRW' },
  VND: { name: '越南盾', code: 'VND' },
  MYR: { name: '馬來幣', code: 'MYR' },
  CNY: { name: '人民幣', code: 'CNY' },
};

/**
 * 解析台灣銀行 CSV 格式
 * CSV 結構：
 * - columns[0]: 幣別代碼 (USD, EUR, etc.)
 * - columns[2]: 現金買入
 * - columns[3]: 即期買入
 * - columns[12]: 現金賣出
 * - columns[13]: 即期賣出
 */
function parseTaiwanBankCSV(csvText) {
  const lines = csvText.trim().split('\n');

  // 跳過標題列
  const dataLines = lines.slice(1);

  const rates = {};
  const details = {};

  for (const line of dataLines) {
    // 移除 BOM 和處理特殊字符
    const cleanLine = line.replace(/^\uFEFF/, '');
    const columns = cleanLine.split(',');

    if (columns.length < 14) continue;

    const currencyCode = columns[0].trim();

    // 只處理我們定義的貨幣
    if (!CURRENCY_MAP[currencyCode]) continue;

    // 解析匯率
    const cashBuy = parseFloat(columns[2]);
    const spotBuy = parseFloat(columns[3]);
    const cashSell = parseFloat(columns[12]);
    const spotSell = parseFloat(columns[13]);

    // 使用現金賣出作為主要匯率
    const mainRate = cashSell;

    // 跳過無效資料 (有些貨幣沒有現金賣出價, e.g. ZAR, SEK)
    if (isNaN(mainRate) || mainRate === 0) continue;

    // 儲存主要匯率（現金賣出）
    rates[currencyCode] = mainRate;

    // 儲存詳細資料
    details[currencyCode] = {
      name: CURRENCY_MAP[currencyCode].name,
      spot: {
        buy: isNaN(spotBuy) || spotBuy === 0 ? null : spotBuy,
        sell: isNaN(spotSell) || spotSell === 0 ? null : spotSell,
      },
      cash: {
        buy: isNaN(cashBuy) || cashBuy === 0 ? null : cashBuy,
        sell: isNaN(cashSell) || cashSell === 0 ? null : cashSell,
      },
    };
  }

  return { rates, details };
}

/**
 * 從台灣銀行抓取匯率
 */
async function fetchTaiwanBankRates() {
  try {
    console.log('🔄 Fetching exchange rates from Taiwan Bank...');

    const response = await fetch(TAIWAN_BANK_CSV_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();
    const { rates, details } = parseTaiwanBankCSV(csvText);

    if (Object.keys(rates).length === 0) {
      throw new Error('No valid rates found in CSV');
    }

    console.log(`✅ Successfully parsed ${Object.keys(rates).length} currencies`);

    return {
      timestamp: new Date().toISOString(),
      updateTime: new Date().toLocaleString('zh-TW', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }),
      source: 'Taiwan Bank (臺灣銀行牌告匯率)',
      sourceUrl: 'https://rate.bot.com.tw/xrt',
      base: 'TWD',
      rates,
      details,
    };
  } catch (error) {
    console.error('❌ Failed to fetch Taiwan Bank rates:', error.message);
    throw error;
  }
}

/**
 * 檢查匯率是否有變化
 */
function hasRateChanges(newData) {
  try {
    const oldData = JSON.parse(readFileSync(OUTPUT_FILE, 'utf8'));

    // 比較匯率資料
    const oldRatesStr = JSON.stringify(oldData.rates);
    const newRatesStr = JSON.stringify(newData.rates);

    return oldRatesStr !== newRatesStr;
  } catch (error) {
    // 檔案不存在或無法讀取，視為有變化
    return true;
  }
}

/**
 * 主函式
 */
async function main() {
  console.log('🚀 Taiwan Bank Exchange Rate Updater');
  console.log('=====================================');

  try {
    // 抓取匯率
    const ratesData = await fetchTaiwanBankRates();

    // 檢查是否有變化
    const hasChanges = hasRateChanges(ratesData);

    if (!hasChanges) {
      console.log('ℹ️  No rate changes detected, skipping update');
      return;
    }

    // 確保目錄存在
    mkdirSync(OUTPUT_DIR, { recursive: true });

    // 寫入檔案
    writeFileSync(OUTPUT_FILE, JSON.stringify(ratesData, null, 2), 'utf8');

    console.log('✅ Rate changes detected and saved');
    console.log(`📁 Output: ${OUTPUT_FILE}`);
    console.log(`📊 Currencies: ${Object.keys(ratesData.rates).length}`);
    console.log(`⏰ Updated: ${ratesData.updateTime}`);
    console.log('');
    console.log('Sample rates:');
    console.log(`  USD: ${ratesData.rates.USD} TWD`);
    console.log(`  EUR: ${ratesData.rates.EUR} TWD`);
    console.log(`  JPY: ${ratesData.rates.JPY} TWD`);
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    process.exit(1);
  }
}

// 執行主函式
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { fetchTaiwanBankRates, parseTaiwanBankCSV };
