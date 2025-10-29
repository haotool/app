/**
 * 台灣銀行牌告匯率抓取腳本
 * 資料來源: https://rate.bot.com.tw/xrt/flcsv/0/day
 * 更新頻率: 每30分鐘
 */

import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 設定檔案路徑
const REPO_ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(REPO_ROOT, 'public', 'rates');
const OUTPUT_FILE = join(OUTPUT_DIR, 'latest.json');

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 5000;

class AbortError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'AbortError';
    this.status = status;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
 * 判斷錯誤是否可重試
 * @param {Error} error - 錯誤物件
 * @returns {boolean} - 是否應該重試
 */
function isRetryableError(error) {
  // 網路錯誤 (TypeError from fetch)
  if (error instanceof TypeError) {
    return true;
  }

  // HTTP 錯誤碼分類
  const retryableStatusCodes = [
    408, // Request Timeout
    429, // Too Many Requests
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504, // Gateway Timeout
  ];

  // 檢查錯誤訊息中的狀態碼
  const statusMatch = error.message.match(/HTTP (\d+):/);
  if (statusMatch) {
    const status = parseInt(statusMatch[1], 10);
    return retryableStatusCodes.includes(status);
  }

  return false;
}

/**
 * 從台灣銀行抓取匯率 (帶重試機制)
 */
async function fetchTaiwanBankRates() {
  console.log('🔄 Fetching exchange rates from Taiwan Bank...');

  const attempts = MAX_RETRIES + 1;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`   Attempt ${attempt}...`);
      }

      const response = await fetch(TAIWAN_BANK_CSV_URL, {
        headers: {
          'cache-control': 'no-cache',
          pragma: 'no-cache',
        },
      });

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;

        const isClientError = response.status >= 400 && response.status < 500;
        const retryableClientError = response.status === 408 || response.status === 429;

        if (isClientError && !retryableClientError) {
          throw new AbortError(error.message, response.status);
        }

        throw error;
      }

      const csvText = await response.text();
      const { rates, details } = parseTaiwanBankCSV(csvText);

      if (Object.keys(rates).length === 0) {
        throw new AbortError('No valid rates found in CSV');
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
      if (error instanceof AbortError) {
        throw error;
      }

      const retryable = isRetryableError(error);
      const isLastAttempt = attempt === attempts;

      if (!retryable || isLastAttempt) {
        console.error('❌ Failed to fetch Taiwan Bank rates:', error.message);
        throw error;
      }

      const exponentialDelay = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS);
      const jitter = Math.random() * BASE_DELAY_MS;
      const waitTime = Math.round(exponentialDelay + jitter);
      console.warn(
        `⚠️  Attempt ${attempt} failed: ${error.message}. Retrying in ${waitTime}ms... (${attempts - attempt} retries left)`,
      );
      await sleep(waitTime);
    }
  }

  throw new Error('Failed to fetch Taiwan Bank rates after maximum retries');
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

    const hasChanges = oldRatesStr !== newRatesStr;

    if (hasChanges) {
      console.log('🔄 Rate changes detected:');
      // 找出變化的貨幣
      const changedCurrencies = [];
      for (const currency in newData.rates) {
        if (oldData.rates[currency] !== newData.rates[currency]) {
          changedCurrencies.push(
            `  ${currency}: ${oldData.rates[currency]} → ${newData.rates[currency]}`,
          );
        }
      }
      if (changedCurrencies.length > 0) {
        console.log(changedCurrencies.join('\n'));
      }
    } else {
      console.log('📊 Rates unchanged since last update');
      console.log(`   Last update: ${oldData.updateTime}`);
    }

    return hasChanges;
  } catch (error) {
    // 檔案不存在或無法讀取，視為有變化
    console.log('📝 No previous data found, will create new file');
    return true;
  }
}

/**
 * 主函式
 */
async function main() {
  console.log('🚀 Taiwan Bank Exchange Rate Updater');
  console.log('=====================================');
  console.log(`⏰ Run Time: ${new Date().toISOString()}`);
  console.log(`📍 Timezone: Asia/Taipei (UTC+8)`);
  console.log('');

  try {
    // 抓取匯率
    console.log('📡 Fetching data from Taiwan Bank...');
    const ratesData = await fetchTaiwanBankRates();

    // 檢查是否有變化
    console.log('🔍 Checking for rate changes...');
    const hasChanges = hasRateChanges(ratesData);

    if (!hasChanges) {
      console.log('ℹ️  No rate changes detected, skipping update');
      console.log('📊 Current rates are still valid');
      return;
    }

    console.log('✨ Rate changes detected!');
    console.log('');

    // 確保目錄存在
    mkdirSync(OUTPUT_DIR, { recursive: true });

    // 寫入檔案
    writeFileSync(OUTPUT_FILE, JSON.stringify(ratesData, null, 2), 'utf8');

    console.log('✅ Successfully saved new rates');
    console.log('=====================================');
    console.log(`📁 Output: ${OUTPUT_FILE}`);
    console.log(`📊 Currencies: ${Object.keys(ratesData.rates).length}`);
    console.log(`⏰ Taiwan Bank Time: ${ratesData.updateTime}`);
    console.log(`🌐 UTC Timestamp: ${ratesData.timestamp}`);
    console.log('');
    console.log('💱 Sample Rates (1 TWD = X Foreign Currency):');
    console.log(`  💵 USD: ${ratesData.rates.USD} (美金)`);
    console.log(`  💶 EUR: ${ratesData.rates.EUR} (歐元)`);
    console.log(`  💴 JPY: ${ratesData.rates.JPY} (日圓)`);
    console.log(`  💴 CNY: ${ratesData.rates.CNY} (人民幣)`);
    console.log('');
    console.log('📝 Detailed Rate Info:');
    console.log(
      `  USD Cash: Buy ${ratesData.details.USD.cash.buy}, Sell ${ratesData.details.USD.cash.sell}`,
    );
    console.log(
      `  USD Spot: Buy ${ratesData.details.USD.spot.buy}, Sell ${ratesData.details.USD.spot.sell}`,
    );
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('  1. GitHub Actions will commit this file');
    console.log('  2. Changes will be pushed to main branch');
    console.log('  3. jsdelivr CDN will sync (may take 1-5 minutes)');
    console.log('  4. Zeabur app will fetch updated rates');
  } catch (error) {
    console.error('=====================================');
    console.error('❌ Update Failed');
    console.error('=====================================');
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('  1. Check Taiwan Bank API status: https://rate.bot.com.tw/xrt/flcsv/0/day');
    console.error('  2. Verify network connectivity');
    console.error('  3. Check CSV format changes');
    process.exit(1);
  }
}

// 執行主函式
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { fetchTaiwanBankRates, parseTaiwanBankCSV };
