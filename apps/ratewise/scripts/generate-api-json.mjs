/**
 * 自動生成 /api/latest.json 靜態 API 端點
 *
 * 執行時機：prebuild（與 generate-llms-txt.mjs 同階段）
 * 功能：產生靜態 JSON metadata，指向 GitHub data 分支的即時匯率 API
 * SSOT 來源：package.json (version) + seo-paths.config.mjs (currencies) + constants.ts (全幣別)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_CONFIG } from '../seo-paths.config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));

const DATA_BASE_URL = 'https://raw.githubusercontent.com/haotool/app/data/public/rates';
const CDN_BASE_URL = 'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates';

const constantsPath = resolve(ROOT, 'src/features/ratewise/constants.ts');
const constantsContent = readFileSync(constantsPath, 'utf-8');
const currencyKeys = [...constantsContent.matchAll(/^\s+([A-Z]{3}):\s*\{/gm)].map((m) => m[1]);

const latestJson = {
  name: 'RateWise Exchange Rate API',
  version: pkg.version,
  description: '臺灣銀行牌告匯率靜態 API — 資料每 5 分鐘自動同步',
  source: '臺灣銀行牌告匯率',
  sourceUrl: 'https://rate.bot.com.tw/xrt',
  updateFrequency: 'every 5 minutes',
  baseCurrency: 'TWD',
  rateTypes: ['cash_buy', 'cash_sell', 'spot_buy', 'spot_sell'],
  supportedCurrencies: currencyKeys,
  endpoints: {
    latest: `${DATA_BASE_URL}/latest.json`,
    history: `${DATA_BASE_URL}/history/{YYYY-MM-DD}.json`,
  },
  cdnEndpoints: {
    latest: `${CDN_BASE_URL}/latest.json`,
    history: `${CDN_BASE_URL}/history/{YYYY-MM-DD}.json`,
  },
  rateTypeDescriptions: {
    cash_buy: '現金買入：銀行以此價收購外幣現鈔（你拿外幣換台幣）',
    cash_sell: '現金賣出：銀行以此價賣出外幣現鈔（你拿台幣換外幣現金）',
    spot_buy: '即期買入：電匯/帳戶轉入匯率（你匯款回台灣）',
    spot_sell: '即期賣出：電匯/帳戶轉出匯率（你從台灣匯款出去）',
  },
  openapi: `${SITE_CONFIG.url}openapi.json`,
  documentation: `${SITE_CONFIG.url}llms.txt`,
  webapp: SITE_CONFIG.url,
  deepLink: `${SITE_CONFIG.url}?amount={AMOUNT}&from={FROM}&to={TO}`,
  disclaimer: '匯率僅供參考，實際交易請以金融機構公告為準。',
  license: pkg.license,
  contact: pkg.author?.email || 'haotool.org@gmail.com',
};

const apiDir = resolve(ROOT, 'public/api');
mkdirSync(apiDir, { recursive: true });
const apiOutputPath = resolve(apiDir, 'latest.json');
writeFileSync(apiOutputPath, JSON.stringify(latestJson, null, 2) + '\n');
console.log(`✅ api/latest.json generated: v${pkg.version}, ${currencyKeys.length} currencies`);
