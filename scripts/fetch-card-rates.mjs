/**
 * 刷卡匯率（Visa/MC 清算匯率）快照抓取腳本（ADR-002 Phase 2 canary）。
 *
 * 姿態：headed browser（workflow 以 xvfb-run 執行）。純 fetch/curl 對兩官方端點皆回 403
 * （Visa Cloudflare、MC Akamai 邊緣封鎖），必須在通過邊緣驗證的真瀏覽器 same-origin
 * context 內呼叫頁面本身使用的 XHR 端點。
 *   - Visa：計算器 widget 的 GET /cmsapi/fx/rates（cmsapi 直打）。
 *   - MC：貨幣轉換器的 GET .../currency-conversions/conversion-rates（頁面 XHR 端點）。
 *
 * 職責單一：取得雙來源清算匯率、通過 schema 契約後才寫檔；髒資料不落地。
 * AGPL 隔離：僅參考 ForexRadar 的 workflow 結構，未複製其原始碼。
 *
 * 用法：node scripts/fetch-card-rates.mjs [輸出檔路徑]
 *   預設輸出：public/rates/canary/card-rates.json（canary 模式，不接前端）。
 * 依賴：@playwright/test（workflow 於暫存目錄按需安裝）＋系統 Chrome（runner 預裝）。
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

import {
  CARD_RATE_CURRENCIES,
  MIN_CARD_RATE_CURRENCIES,
  validateCardRates,
} from './lib/card-rates-schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const DEFAULT_OUTPUT = join(REPO_ROOT, 'public', 'rates', 'canary', 'card-rates.json');

const VISA_PAGE =
  'https://usa.visa.com/support/consumer/travel-support/exchange-rate-calculator.html';
const VISA_API = '/cmsapi/fx/rates';
const MC_PAGE =
  'https://www.mastercard.com/us/en/personal/get-support/currency-exchange-rate-converter.html';
const MC_API =
  'https://www.mastercard.com/marketingservices/public/mccom-services/currency-conversions/conversion-rates';

// 禮貌原則：同來源逐幣別查詢間隔，避免高頻。
const PER_QUERY_DELAY_MS = 700;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function todayParts() {
  const now = new Date();
  return {
    yyyy: now.getUTCFullYear(),
    mm: String(now.getUTCMonth() + 1).padStart(2, '0'),
    dd: String(now.getUTCDate()).padStart(2, '0'),
  };
}

async function launchBrowser() {
  // 系統 Chrome 指紋最接近真實使用者；失敗退回 bundled chromium。
  for (const channel of ['chrome', undefined]) {
    try {
      return await chromium.launch({ headless: false, channel });
    } catch (error) {
      console.warn(`⚠️ launch via ${channel ?? 'bundled chromium'} failed: ${error.message}`);
    }
  }
  throw new Error('無法啟動瀏覽器（chrome 與 bundled chromium 皆失敗）');
}

/** Visa：頁面 context 內打 /cmsapi/fx/rates，回傳 TWD per 1 foreign（fxRateVisa）。 */
async function fetchVisaRates(page) {
  await page.goto(VISA_PAGE, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await sleep(1500);
  const { mm, dd, yyyy } = todayParts();
  const dateStr = `${mm}/${dd}/${yyyy}`;
  const rates = {};

  for (const currency of CARD_RATE_CURRENCIES) {
    try {
      const value = await page.evaluate(
        async ({ api, dateStr, currency }) => {
          // fromCurr=TWD、toCurr=foreign → 回應 fxRateVisa = TWD per 1 foreign。
          const qs = new URLSearchParams({
            amount: '1',
            fee: '0.0',
            utcConvertedDate: dateStr,
            exchangedate: dateStr,
            fromCurr: 'TWD',
            toCurr: currency,
          });
          const res = await fetch(`${api}?${qs.toString()}`, {
            headers: { accept: 'application/json' },
          });
          if (!res.ok) return { error: `HTTP ${res.status}` };
          const json = await res.json();
          const rate = Number(json?.originalValues?.fxRateVisa);
          return Number.isFinite(rate) ? { rate } : { error: 'no fxRateVisa' };
        },
        { api: VISA_API, dateStr, currency },
      );
      if (typeof value.rate === 'number') {
        rates[currency] = value.rate;
      } else {
        console.warn(`  ⚠️ Visa ${currency}: ${value.error}`);
      }
    } catch (error) {
      console.warn(`  ⚠️ Visa ${currency} failed: ${error.message}`);
    }
    await sleep(PER_QUERY_DELAY_MS);
  }
  return rates;
}

/** MC：頁面 context 內打 conversion-rates，回傳 TWD per 1 foreign（conversionRate）。 */
async function fetchMastercardRates(page) {
  await page.goto(MC_PAGE, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await sleep(2000);
  const rates = {};

  for (const currency of CARD_RATE_CURRENCIES) {
    try {
      const value = await page.evaluate(
        async ({ api, currency }) => {
          // transaction_currency=foreign、billing=TWD → conversionRate = TWD per 1 foreign。
          // exchange_date=0000-00-00 取當前最新清算匯率（頁面預設）。
          const qs = new URLSearchParams({
            exchange_date: '0000-00-00',
            transaction_currency: currency,
            cardholder_billing_currency: 'TWD',
            bank_fee: '0',
            transaction_amount: '1',
          });
          const res = await fetch(`${api}?${qs.toString()}`, {
            headers: { accept: 'application/json' },
          });
          if (!res.ok) return { error: `HTTP ${res.status}` };
          const json = await res.json();
          const rate = Number(json?.data?.conversionRate);
          return Number.isFinite(rate) ? { rate } : { error: 'no conversionRate' };
        },
        { api: MC_API, currency },
      );
      if (typeof value.rate === 'number') {
        rates[currency] = value.rate;
      } else {
        console.warn(`  ⚠️ MC ${currency}: ${value.error}`);
      }
    } catch (error) {
      console.warn(`  ⚠️ MC ${currency} failed: ${error.message}`);
    }
    await sleep(PER_QUERY_DELAY_MS);
  }
  return rates;
}

function mergeRates(visaRates, mcRates) {
  const merged = {};
  for (const currency of CARD_RATE_CURRENCIES) {
    const entry = {};
    if (typeof visaRates[currency] === 'number') entry.visa = visaRates[currency];
    if (typeof mcRates[currency] === 'number') entry.mastercard = mcRates[currency];
    if (Object.keys(entry).length > 0) merged[currency] = entry;
  }
  return merged;
}

async function main() {
  const outputFile = process.argv[2] || DEFAULT_OUTPUT;
  const browser = await launchBrowser();
  const nowIso = new Date().toISOString();

  try {
    const context = await browser.newContext({ locale: 'en-US', timezoneId: 'America/New_York' });

    console.log('🌐 Fetching Visa settlement rates...');
    const visaPage = await context.newPage();
    const visaRates = await fetchVisaRates(visaPage);
    const visaFetchedAt = new Date().toISOString();
    console.log(`  ✅ Visa: ${Object.keys(visaRates).length} currencies`);

    console.log('🌐 Fetching Mastercard settlement rates...');
    const mcPage = await context.newPage();
    const mcRates = await fetchMastercardRates(mcPage);
    const mcFetchedAt = new Date().toISOString();
    console.log(`  ✅ Mastercard: ${Object.keys(mcRates).length} currencies`);

    const snapshot = {
      updateTime: nowIso,
      source: {
        visa: { url: VISA_PAGE, fetchedAt: visaFetchedAt },
        mastercard: { url: MC_PAGE, fetchedAt: mcFetchedAt },
      },
      rates: mergeRates(visaRates, mcRates),
    };

    const { valid, errors } = validateCardRates(snapshot);
    if (!valid) {
      console.error('❌ Schema contract failed — refusing to write:');
      for (const err of errors) console.error(`   - ${err}`);
      process.exit(1);
    }

    const currencyCount = Object.keys(snapshot.rates).length;
    if (currencyCount < MIN_CARD_RATE_CURRENCIES) {
      console.error(`❌ Only ${currencyCount} currencies (< ${MIN_CARD_RATE_CURRENCIES})`);
      process.exit(1);
    }

    mkdirSync(dirname(outputFile), { recursive: true });
    writeFileSync(outputFile, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
    console.log(`✅ Wrote ${currencyCount} currencies to ${outputFile}`);
    console.log(
      `   Sample USD: visa=${snapshot.rates.USD?.visa}, mc=${snapshot.rates.USD?.mastercard}`,
    );
  } finally {
    await browser.close();
  }
}

await main();
