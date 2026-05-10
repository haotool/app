/**
 * 明洞換匯所（MoneyBox）匯率抓取腳本
 * 資料來源: https://cems.moneybox.or.kr/api/cmd.php?cmd=C011&key=U1D8I4W7V6S1L3U4F3I4
 * 更新頻率: 每5分鐘（由 GitHub Actions cron 觸發，見 .github/workflows/update-moneybox-rates.yml）
 */

import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { dirname, isAbsolute, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 設定檔案路徑
const REPO_ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(REPO_ROOT, 'public', 'rates');
const OUTPUT_FILE = join(OUTPUT_DIR, 'providers', 'moneybox', 'latest.json');

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 5000;
const RATE_QUOTE_FIELDS = ['base', 'buy', 'sell', 'spbuy', 'spsell'];

class AbortError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'AbortError';
    this.status = status;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// MoneyBox 公開 API（韓國官方換匯所聯盟）
const MONEYBOX_API_URL =
  'https://cems.moneybox.or.kr/api/cmd.php?cmd=C011&key=U1D8I4W7V6S1L3U4F3I4';

function writeCurrentFetchSnapshot(ratesData) {
  const output = process.env.MONEYBOX_FETCH_OUTPUT_FILE;
  if (!output) return;

  const outputFile = isAbsolute(output) ? output : join(REPO_ROOT, output);
  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, JSON.stringify(ratesData, null, 2), 'utf8');
  console.log(`🧾 Current fetch snapshot saved: ${outputFile}`);
}

/**
 * 判斷錯誤是否可重試
 */
function isRetryableError(error) {
  if (error instanceof TypeError) {
    return true;
  }

  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  const statusMatch = error.message.match(/HTTP (\d+):/);
  if (statusMatch) {
    const status = parseInt(statusMatch[1], 10);
    return retryableStatusCodes.includes(status);
  }

  return false;
}

/**
 * 從 MoneyBox API 抓取所有貨幣匯率（帶重試機制）
 * 回應格式：{ result: true, data: [{ currency, base, buy, sell, spbuy, spsell }] }
 * - currency: 外幣代碼（如 "TWD"）
 * - base: 標準牌告中間價（1 KRW = X currency）
 * - buy: 換匯所買入價（客戶賣出，即客戶持外幣換 KRW 的匯率）
 * - sell: 換匯所賣出價（客戶買入，即客戶持外幣換取 KRW 的實際到手匯率）
 * - spbuy/spsell: 特殊買賣價（高額換匯）
 *
 * 對台灣旅客而言：持 TWD 現金換 KRW，適用 sell 欄位（46.5 表示 1 TWD 可換 46.5 KRW）
 */
async function fetchMoneyBoxRates() {
  console.log('🔄 Fetching exchange rates from MoneyBox (明洞換匯所)...');

  const attempts = MAX_RETRIES + 1;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`   Attempt ${attempt}...`);
      }

      const response = await fetch(MONEYBOX_API_URL, {
        headers: {
          'User-Agent': 'RateWise-Bot/1.0',
          Accept: 'application/json',
          'cache-control': 'no-cache',
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

      const data = await response.json();

      if (!data.result || !Array.isArray(data.data) || data.data.length === 0) {
        throw new AbortError(
          `Invalid response format: result=${data.result}, data length=${data.data?.length ?? 0}`,
        );
      }

      // 解析所有幣別，以 currency 代碼為 key
      const rates = {};
      for (const item of data.data) {
        const code = item.currency?.trim();
        if (!code) continue;

        rates[code] = {
          currency: code,
          base: parseFloat(item.base) || null,
          buy: parseFloat(item.buy) || null,
          sell: parseFloat(item.sell) || null,
          spbuy: parseFloat(item.spbuy) || null,
          spsell: parseFloat(item.spsell) || null,
        };
      }

      if (Object.keys(rates).length === 0) {
        throw new AbortError('No valid rates found in response');
      }

      // 確認 TWD 資料存在（主要使用貨幣）
      if (!rates.TWD) {
        throw new AbortError('TWD rate not found in response');
      }

      console.log(`✅ Successfully parsed ${Object.keys(rates).length} currencies`);
      console.log(`   TWD sell: ${rates.TWD.sell} KRW/TWD (旅客持台幣現金換韓元的到手匯率)`);

      return {
        timestamp: new Date().toISOString(),
        updateTime: new Date().toLocaleString('zh-TW', {
          timeZone: 'Asia/Seoul',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }),
        source: 'MoneyBox (明洞換匯所聯盟)',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        apiUrl: MONEYBOX_API_URL,
        base: 'KRW',
        rates,
      };
    } catch (error) {
      if (error instanceof AbortError) {
        throw error;
      }

      const retryable = isRetryableError(error);
      const isLastAttempt = attempt === attempts;

      if (!retryable || isLastAttempt) {
        console.error('❌ Failed to fetch MoneyBox rates:', error.message);
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

  throw new Error('Failed to fetch MoneyBox rates after maximum retries');
}

function listRateChanges(oldRates = {}, newRates = {}) {
  const currencies = Array.from(
    new Set([...Object.keys(oldRates), ...Object.keys(newRates)]),
  ).sort();

  return currencies.flatMap((currency) =>
    RATE_QUOTE_FIELDS.filter(
      (field) => oldRates[currency]?.[field] !== newRates[currency]?.[field],
    ).map((field) => ({
      currency,
      field,
      oldValue: oldRates[currency]?.[field],
      newValue: newRates[currency]?.[field],
    })),
  );
}

function hasRateChanges(newData) {
  try {
    const oldData = JSON.parse(readFileSync(OUTPUT_FILE, 'utf8'));

    const rateChanges = listRateChanges(oldData.rates, newData.rates);
    const hasChanges = rateChanges.length > 0;

    if (hasChanges) {
      console.log(
        `🔄 Rate change detected: ${rateChanges.map(({ currency, field }) => `${currency}.${field}`).join(', ')}`,
      );
      for (const { currency, field, oldValue, newValue } of rateChanges) {
        console.log(`   ${currency}.${field}: ${oldValue} → ${newValue}`);
      }
    } else {
      const currentCurrencies = Object.keys(newData.rates ?? {}).length;
      console.log('📊 Rates unchanged since last update');
      console.log(`   Last update: ${oldData.updateTime}`);
      console.log(`   Currencies checked: ${currentCurrencies}`);
    }

    return hasChanges;
  } catch {
    console.log('📝 No previous data found, will create new file');
    return true;
  }
}

/**
 * 主函式
 */
async function main() {
  console.log('🚀 MoneyBox Exchange Rate Updater (明洞換匯所)');
  console.log('===============================================');
  console.log(`⏰ Run Time: ${new Date().toISOString()}`);
  console.log(`📍 Timezone: Asia/Seoul (UTC+9)`);
  console.log('');

  try {
    // 抓取匯率
    console.log('📡 Fetching data from MoneyBox API...');
    const ratesData = await fetchMoneyBoxRates();
    writeCurrentFetchSnapshot(ratesData);

    // 檢查是否有變化
    console.log('🔍 Checking for rate changes...');
    const hasChanges = hasRateChanges(ratesData);

    if (!hasChanges) {
      console.log('ℹ️  No rate changes detected, skipping update');
      return;
    }

    console.log('✨ Rate changes detected!');
    console.log('');

    // 確保目錄存在
    mkdirSync(dirname(OUTPUT_FILE), { recursive: true });

    // 寫入檔案
    writeFileSync(OUTPUT_FILE, JSON.stringify(ratesData, null, 2), 'utf8');

    const twdRate = ratesData.rates.TWD;
    console.log('✅ Successfully saved new rates');
    console.log('===============================================');
    console.log(`📁 Output: ${OUTPUT_FILE}`);
    console.log(`📊 Currencies: ${Object.keys(ratesData.rates).length}`);
    console.log(`⏰ Seoul Time: ${ratesData.updateTime}`);
    console.log(`🌐 UTC Timestamp: ${ratesData.timestamp}`);
    console.log('');
    console.log('💱 TWD Rates at MoneyBox:');
    console.log(`  Base (中間牌告): ${twdRate.base} KRW/TWD`);
    console.log(`  Buy  (換匯所買入 TWD): ${twdRate.buy} KRW/TWD`);
    console.log(`  Sell (旅客持 TWD 換 KRW 到手): ${twdRate.sell} KRW/TWD`);
    console.log(`  SP Buy  (高額買入): ${twdRate.spbuy} KRW/TWD`);
    console.log(`  SP Sell (高額賣出): ${twdRate.spsell} KRW/TWD`);
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('  1. GitHub Actions will commit this file');
    console.log('  2. Changes will be pushed to data branch');
    console.log('  3. jsdelivr CDN will sync (may take 1-5 minutes)');
    console.log('  4. SEO rate examples will use updated MoneyBox rate');
  } catch (error) {
    console.error('===============================================');
    console.error('❌ Update Failed');
    console.error('===============================================');
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('  1. Check MoneyBox API status: https://cems.moneybox.or.kr/');
    console.error('  2. Verify network connectivity');
    console.error('  3. Check API response format changes');
    process.exit(1);
  }
}

// 執行主函式
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { fetchMoneyBoxRates };
export { listRateChanges };
