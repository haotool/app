/**
 * 台銀牌告 CSV 瀏覽器取得腳本（bot challenge fallback）
 *
 * 台銀 rate.bot.com.tw 的 bot challenge 需在真瀏覽器內完成 JS 驗證後
 * 以同頁 fetch 下載 CSV（headless 與 API request context 的指紋會被擋）。
 *
 * 職責單一：只負責「取得 CSV 文字並寫入指定檔案」；
 * 解析、比較與寫入 latest.json 仍由 fetch-taiwan-bank-rates.js（CSV_INPUT_FILE 模式）處理。
 *
 * 用法：xvfb-run -a node fetch-taiwan-bank-rates-browser.mjs <輸出檔路徑>
 * 依賴：@playwright/test（workflow 於暫存目錄按需安裝）＋系統 Chrome（runner 預裝）。
 */

import { writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const RATE_PAGE_URL = 'https://rate.bot.com.tw/xrt?Lang=zh-TW';
const CSV_PATH = '/xrt/flcsv/0/day';
const CHALLENGE_TITLE = 'Challenge Validation';
const MAX_ATTEMPTS = 2;
const CSV_LINE_PATTERN = /^[A-Z]{3},/m;

const outputFile = process.argv[2];
if (!outputFile) {
  console.error('Usage: node fetch-taiwan-bank-rates-browser.mjs <output-file>');
  process.exit(2);
}

async function fetchCsvOnce(channel) {
  const browser = await chromium.launch({ headless: false, channel });
  try {
    const context = await browser.newContext({ locale: 'zh-TW', timezoneId: 'Asia/Taipei' });
    const page = await context.newPage();

    await page.goto(RATE_PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 45_000 });

    // challenge 完成後頁面會自動 reload 為牌告頁。
    await page.waitForFunction(
      (challengeTitle) => document.title !== challengeTitle,
      CHALLENGE_TITLE,
      { timeout: 30_000 },
    );
    console.log(`✅ Challenge passed, page title: ${await page.title()}`);

    // 必須在頁面內 fetch：沿用瀏覽器連線指紋與 challenge cookie。
    const csvText = await page.evaluate(async (csvPath) => {
      const response = await fetch(csvPath, { headers: { 'cache-control': 'no-cache' } });
      return response.text();
    }, CSV_PATH);

    if (!CSV_LINE_PATTERN.test(csvText)) {
      throw new Error(`CSV validation failed, got: ${csvText.slice(0, 120)}`);
    }

    return csvText;
  } finally {
    await browser.close();
  }
}

async function main() {
  // 優先用系統 Chrome（GitHub runner 預裝、指紋最接近真實用戶）；失敗退回 Playwright chromium。
  const channels = ['chrome', undefined];
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    for (const channel of channels) {
      try {
        console.log(
          `🌐 Attempt ${attempt}/${MAX_ATTEMPTS} via ${channel ?? 'bundled chromium'}...`,
        );
        const csvText = await fetchCsvOnce(channel);
        writeFileSync(outputFile, csvText, 'utf8');
        console.log(`✅ CSV saved to ${outputFile} (${csvText.trim().split('\n').length} lines)`);
        return;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ ${channel ?? 'chromium'} failed: ${error.message}`);
      }
    }
  }

  console.error('❌ Browser fallback failed to fetch Taiwan Bank CSV');
  console.error(String(lastError?.stack || lastError));
  process.exit(1);
}

await main();
