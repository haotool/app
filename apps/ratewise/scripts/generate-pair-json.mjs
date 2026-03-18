/**
 * 自動生成 /api/pairs/{pair}.json 靜態 API 端點
 *
 * 執行時機：prebuild（與 generate-api-json.mjs 同階段）
 * 功能：為每個幣別落地頁產生對應的機器可讀 JSON 端點，
 *       供搜尋系統、AI agent 與開發者直接查詢特定幣對最新匯率。
 * SSOT 來源：seo-paths.config.mjs (幣別路徑) + SITE_CONFIG (站點)
 *
 * 輸出：public/api/pairs/{slug}.json（共 17 個）
 *       例如：public/api/pairs/usd-twd.json
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CURRENCY_SEO_PATHS, SITE_CONFIG, RAW_DATA_BASE } from '../seo-paths.config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// GitHub raw 無快取，確保 liveRateUrl 指向真正即時資料（jsdelivr 有 12-24h 快取延遲，不適合用於 liveRateUrl）
const CDN_BASE_URL = `${RAW_DATA_BASE}/public/rates`;

const RATE_TYPE_DESCRIPTIONS = {
  cash_sell: '現金賣出：銀行以此價賣出外幣現鈔（你拿台幣換外幣現金）',
  cash_buy: '現金買入：銀行以此價收購外幣現鈔（你拿外幣換台幣）',
  spot_sell: '即期賣出：電匯/帳戶轉出匯率（你從台灣匯款出去）',
  spot_buy: '即期買入：電匯/帳戶轉入匯率（你匯款回台灣）',
};

const pairsDir = resolve(ROOT, 'public/api/pairs');
mkdirSync(pairsDir, { recursive: true });

let count = 0;

for (const path of CURRENCY_SEO_PATHS) {
  // path 格式：'/usd-twd/'
  const slug = path.replace(/\//g, '');
  const fromCode = slug.split('-')[0].toUpperCase();
  const toCode = 'TWD';

  const pairJson = {
    pair: `${fromCode}/${toCode}`,
    from: fromCode,
    to: toCode,
    slug,
    pageUrl: `${SITE_CONFIG.url}${slug}/`,
    liveRateUrl: `${CDN_BASE_URL}/latest.json`,
    rateFieldPath: `details.${fromCode}`,
    source: '臺灣銀行牌告匯率',
    sourceUrl: 'https://rate.bot.com.tw/xrt',
    updateFrequency: 'every 5 minutes',
    rateTypes: RATE_TYPE_DESCRIPTIONS,
    note: '賣出（sell）= 銀行賣給你外幣的價格，即你拿台幣換外幣看此價；買入（buy）= 銀行收你外幣的價格，即你拿外幣換台幣看此價。',
    disclaimer: '匯率僅供參考，實際交易請以金融機構公告為準。',
  };

  writeFileSync(resolve(pairsDir, `${slug}.json`), JSON.stringify(pairJson, null, 2) + '\n');
  count++;
}

console.log(`✅ api/pairs/ generated: ${count} pair JSON files`);
