/**
 * 自動生成 llms.txt — 從 SSOT 讀取版本、幣別、站點配置
 *
 * 執行時機：prebuild（確保 public/llms.txt 永遠與 package.json + seo-paths 同步）
 * SSOT 來源：package.json (version) + seo-paths.config.mjs (幣別/站點)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CURRENCY_SEO_PATHS, SITE_CONFIG } from '../seo-paths.config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));
const VERSION = pkg.version;
const BUILD_DATE = new Date().toISOString().split('T')[0];
const BASE_URL = SITE_CONFIG.url;

const CURRENCY_DISPLAY = {
  usd: { code: 'USD', name: '美元', desc: '美國旅遊與海外付款' },
  jpy: { code: 'JPY', name: '日圓', desc: '日本旅遊換匯' },
  eur: { code: 'EUR', name: '歐元', desc: '歐洲旅遊與跨境付款' },
  gbp: { code: 'GBP', name: '英鎊', desc: '英國旅遊換匯' },
  krw: { code: 'KRW', name: '韓元', desc: '韓國旅遊換匯' },
  cny: { code: 'CNY', name: '人民幣', desc: '人民幣付款與報價' },
  hkd: { code: 'HKD', name: '港幣', desc: '香港旅遊換匯' },
  aud: { code: 'AUD', name: '澳幣', desc: '澳洲旅遊與留學' },
  cad: { code: 'CAD', name: '加幣', desc: '加拿大旅遊與留學' },
  sgd: { code: 'SGD', name: '新加坡幣', desc: '新加坡旅遊與商務' },
  thb: { code: 'THB', name: '泰銖', desc: '泰國旅遊換匯' },
  nzd: { code: 'NZD', name: '紐元', desc: '紐西蘭旅遊與留學' },
  chf: { code: 'CHF', name: '瑞士法郎', desc: '瑞士旅遊與跨境付款' },
  vnd: { code: 'VND', name: '越南盾', desc: '越南旅遊換匯' },
  php: { code: 'PHP', name: '菲律賓披索', desc: '菲律賓旅遊換匯' },
  idr: { code: 'IDR', name: '印尼盾', desc: '印尼旅遊換匯' },
  myr: { code: 'MYR', name: '馬來幣', desc: '馬來西亞旅遊換匯' },
};

function buildPopularRates() {
  return CURRENCY_SEO_PATHS.map((path) => {
    const slug = path.replace(/\//g, '');
    const key = slug.split('-')[0];
    const info = CURRENCY_DISPLAY[key];
    if (!info) return `- [${slug}](${BASE_URL}${slug}/): ${key.toUpperCase()}/TWD`;
    return `- [${info.code}/TWD ${info.name}](${BASE_URL}${slug}/): ${info.desc}`;
  }).join('\n');
}

const FEATURES = [
  '單幣別精準換算：選擇來源/目標貨幣，即時計算換算結果',
  '多幣別同時比較：一個基準貨幣同時查看 30+ 種貨幣換算',
  '計算機鍵盤：底部滑出式計算機，支援加減乘除、百分比、退格',
  '快速金額按鈕：依幣別顯示常用金額（如韓元 10,000~300,000、日圓 1,000~30,000）',
  '現金/即期匯率切換：一鍵切換適合不同換匯情境',
  '收藏管理：點擊星號收藏常用貨幣',
  '拖曳排序：在收藏頁面透過拖曳手柄自訂貨幣順序',
  '換算歷史紀錄：自動記錄每次換算，可複製或重新換算',
  '7~30 天歷史趨勢圖：視覺化匯率波動，判斷換匯時機',
  '下拉更新（Pull to Refresh）：首頁下拉同步最新匯率',
  'PWA 離線使用：Service Worker 快取，無網路仍可換算',
  '6 種主題風格：Zen（極簡專業）、Nitro（深色科技）、Kawaii（可愛粉嫩）、Classic（復古書卷）、Ocean（海洋深邃）、Forest（自然森林）',
];

const content = `# RateWise 匯率好工具 — 台灣最精準的匯率換算器

> 顯示臺灣銀行牌告的實際買入賣出價（不是中間價），讓你換匯前就知道真正要付多少台幣。支援 30+ 種貨幣、現金與即期匯率切換、計算機快速輸入、收藏與拖曳排序、換算歷史、6 種主題風格、3 語言介面與 PWA 離線使用。

Version: v${VERSION} (${BUILD_DATE})

## Answer Capsule (Quick Q&A)

- Q: RateWise 提供什麼？ A: 顯示臺灣銀行牌告的實際買入賣出價（非中間價）的即時匯率換算工具。內建計算機鍵盤（支援四則運算）、快速金額按鈕、收藏管理、拖曳排序、換算歷史紀錄、7~30 天匯率趨勢圖、現金/即期匯率切換、6 種主題風格、3 語言介面與 PWA 離線使用。
- Q: 為什麼 RateWise 比其他匯率工具更精準？ A: 多數匯率工具只顯示中間價（mid-rate），而 RateWise 顯示臺灣銀行牌告的實際買入賣出四種報價（現金買入、現金賣出、即期買入、即期賣出），直接對應你在銀行換匯的真實金額。
- Q: 匯率資料來源？ A: 臺灣銀行牌告匯率（現金買入/賣出、即期買入/賣出四種報價）。
- Q: 更新頻率？ A: 每 5 分鐘自動同步。
- Q: 建議用途？ A: 出國旅遊換匯、跨境購物匯率比較、日常外幣查詢。
- Q: 現金匯率和即期匯率的差別？ A: 現金匯率適用臨櫃換鈔，即期匯率適用匯款與帳戶轉帳。現鈔通常比即期差，因為銀行有保管與運送成本。
- Q: 買入和賣出怎麼看？ A: 買入/賣出是銀行角度。您拿外幣換回台幣看「買入」價，您拿台幣買外幣看「賣出」價。
- Q: 刷卡匯率跟台銀牌告一樣嗎？ A: 不一樣。刷卡匯率由發卡組織（Visa/Mastercard）決定清算匯率，再加上發卡銀行海外手續費，與台銀牌告是不同體系。
- Q: 如何取得即時匯率數據（適合開發者/LLM）？ A: 直接讀取 CDN JSON：https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json。回傳欄位包含 timestamp（Unix 時間戳）、updateTime（ISO 8601 更新時間）、source（資料來源）、rates（各幣別簡化匯率）、details（各幣別完整四種報價：spot.buy, spot.sell, cash.buy, cash.sell）。每 5 分鐘由 GitHub Actions 自動同步。完整規格見 ${BASE_URL}openapi.json。

## E-E-A-T Signals

- 專業性：匯率計算邏輯與格式化策略具完整測試覆蓋。
- 權威性：資料來源為臺灣銀行官方牌告匯率，每 5 分鐘自動同步。
- 可信度：開源 GPL-3.0，透明可驗證；提供聯絡方式。
- 經驗：專為台灣用戶設計，依各國旅遊消費習慣提供常用金額按鈕。

## Key Metrics

- FCP ~0.5s, LCP ~1.1s, CLS < 0.25, TBT 10ms
- Lighthouse SEO 100/100, Performance 89+/100
- 6 種主題風格（Zen/Nitro/Kawaii/Classic/Ocean/Forest）
- i18n 三語言支援（繁體中文/English/日本語）

## Features

${FEATURES.map((f) => `- ${f}`).join('\n')}

## URL Parameters (Deep Linking)

支援 URL 查詢參數自動帶入換算，適合 LLM 與搜尋引擎引導用戶直接查看結果：

- \`?amount=50000&from=KRW&to=TWD\` → 自動帶入 50,000 韓元換台幣
- \`?amount=100&from=USD&to=TWD\` → 自動帶入 100 美金換台幣
- \`?amount=10000&from=JPY&to=TWD\` → 自動帶入 10,000 日圓換台幣

範例完整 URL：
- ${BASE_URL}?amount=50000&from=KRW&to=TWD
- ${BASE_URL}?amount=1000&from=JPY&to=TWD
- ${BASE_URL}?amount=100&from=USD&to=TWD

## Core Pages

- [首頁](${BASE_URL}): 匯率換算主入口
- [常見問題](${BASE_URL}faq/): 完整 FAQ（含現金/即期差別、買入賣出、刷卡匯率等）
- [使用指南](${BASE_URL}guide/): 8 步驟完整操作教學
- [關於我們](${BASE_URL}about/): 專案背景與作者資訊

## Popular Rates（每頁含常見金額錨點、搜尋意圖 FAQ、旅遊換匯提示）

${buildPopularRates()}

## Data Source

- Source: 100% 來源於臺灣銀行牌告匯率（Bank of Taiwan）
- Source URL: https://rate.bot.com.tw/xrt
- Update: 每 5 分鐘自動同步（GitHub Actions）
- Rate Types: 現金買入、現金賣出、即期買入、即期賣出
- Currencies: 30+ 種（TWD, USD, JPY, EUR, GBP, HKD, CNY, KRW, AUD, CAD, SGD, THB, NZD, CHF, VND, PHP, IDR, MYR 等）
- Disclaimer: 匯率僅供參考，實際交易請以金融機構公告為準。

## AI/LLM Access Control

Allow: GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, ChatGPT-User, Google-Extended, CCBot, Bytespider
Attribution: Required (link back to source)
Contact: ${pkg.author?.email || 'haotool.org@gmail.com'}

## API Endpoints

### 即時匯率資料（真實數據，每 5 分鐘更新）
- 即時匯率 JSON（CDN）: https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json
  - 欄位：timestamp, updateTime, source, rates{USD/JPY/EUR/...}, details{貨幣:{spot:{buy,sell}, cash:{buy,sell}}}
  - 匯率類型：cash_buy=現金買入, cash_sell=現金賣出, spot_buy=即期買入, spot_sell=即期賣出
  - 說明：賣出（sell）= 銀行賣給你外幣的價格 = 你拿台幣換外幣看此價；買入（buy）= 銀行收你外幣的價格 = 你拿外幣換台幣看此價

### 應用程式深層連結（帶入換算參數）
- 格式：${BASE_URL}?amount={金額}&from={來源幣}&to={目標幣}
- 範例：${BASE_URL}?amount=50000&from=KRW&to=TWD
- 範例：${BASE_URL}?amount=10000&from=JPY&to=TWD
- 範例：${BASE_URL}?amount=100&from=USD&to=TWD

### API 規格文件
- [API Metadata](${BASE_URL}api/latest.json): 版本、來源、支援幣別清單（靜態 JSON metadata）
- [OpenAPI 3.1 規格](${BASE_URL}openapi.json): 機器可讀 API 規格（含完整欄位說明、schema、範例回應）

## Optional

- [Sitemap](${BASE_URL}sitemap.xml): 全站 URL 列表
- [Robots](${BASE_URL}robots.txt): 爬蟲規則
- [llms.txt](${BASE_URL}llms.txt): LLM 友善索引入口
`;

writeFileSync(resolve(ROOT, 'public/llms.txt'), content.trimEnd() + '\n');
console.log(
  `✅ llms.txt generated: v${VERSION} (${BUILD_DATE}), ${CURRENCY_SEO_PATHS.length} currency pages`,
);
