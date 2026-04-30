/**
 * 生成 SSG 內容頁的 Markdown 鏡像，供 LLM agent 乾淨讀取。
 *
 * 策略：Best Practice A（靜態 .md 鏡像）。輸出檔案與原 HTML 頁語義一致，
 * 避免 Google cloaking 紅線。檔案存放於 `public/<slug>.md`，對應 URL：
 *
 *   /ratewise/faq.md        ↔ /ratewise/faq/
 *   /ratewise/about.md      ↔ /ratewise/about/
 *   /ratewise/privacy.md    ↔ /ratewise/privacy/
 *   /ratewise/guide.md      ↔ /ratewise/guide/
 *   /ratewise/open-data.md  ↔ /ratewise/open-data/
 *   /ratewise/index.md      ↔ /ratewise/
 *
 * Q&A 內容透過 regex 從 seo-metadata.ts 直接擷取，避免 drift；
 * 頁面章節文案因 JSX 硬編碼而於本檔維護，變更時需與對應 .tsx 同步。
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_CONFIG } from '../seo-paths.config.mjs';
import { APP_INFO } from '../src/config/app-info.ts';

/**
 * RATES_API 端點重建（與 src/config/api-endpoints.ts 同構）。
 * Node 22 strip-types 不追蹤深層 .ts import，故在此以 APP_INFO 為 SSOT 原地組合；
 * 若 api-endpoints.ts 端點規則變更，請同步更新此處並由 markdown-mirror.test.ts 驗證。
 */
const GITHUB_REPO_PATH = APP_INFO.github.replace('https://github.com/', '');
const CDN_DATA_BASE = `https://cdn.jsdelivr.net/gh/${GITHUB_REPO_PATH}@data`;
const RAW_DATA_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO_PATH}/data`;
const RATES_LATEST_PATH = '/public/rates/latest.json';
const RATES_HISTORY_EXAMPLE_DATE = '2026-03-19';
const RATES_API = {
  latestCdn: `${CDN_DATA_BASE}${RATES_LATEST_PATH}`,
  latestRaw: `${RAW_DATA_BASE}${RATES_LATEST_PATH}`,
  historyCdnExample: `${CDN_DATA_BASE}/public/rates/history/${RATES_HISTORY_EXAMPLE_DATE}.json`,
  historyRawExample: `${RAW_DATA_BASE}/public/rates/history/${RATES_HISTORY_EXAMPLE_DATE}.json`,
  actionsUrl: `${APP_INFO.github}/actions`,
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));
const VERSION = pkg.version;
const BASE_URL = SITE_CONFIG.url;

const seoMetadataSrc = readFileSync(resolve(ROOT, 'src/config/seo-metadata.ts'), 'utf-8');
const constantsSrc = readFileSync(resolve(ROOT, 'src/features/ratewise/constants.ts'), 'utf-8');
const SUPPORTED_CURRENCY_COUNT = [...constantsSrc.matchAll(/^\s+([A-Z]{3}):\s*\{/gm)].length;

/**
 * 擷取 seo-metadata.ts 內 `export const <name> = [...] as const` 陣列中的 question/answer 對。
 * 支援單引號、雙引號與 backtick；template literal 內 ${...} 以 KNOWN_SUBSTITUTIONS 表展開。
 * 未知 token 直接 throw，避免未解析變數（例如 ${RATES_API.latestCdn}）靜默發佈到鏡像內容。
 */
const KNOWN_SUBSTITUTIONS = {
  'APP_INFO.email': APP_INFO.email,
  'APP_INFO.github': APP_INFO.github,
  'APP_INFO.shortName': APP_INFO.shortName,
  'APP_INFO.name': APP_INFO.name,
  'APP_INFO.subtitle': APP_INFO.subtitle,
  'SITE_SEO.description': SITE_CONFIG.description,
  ...Object.fromEntries(
    Object.entries(RATES_API).map(([key, value]) => [`RATES_API.${key}`, String(value)]),
  ),
  SUPPORTED_CURRENCY_COUNT: String(SUPPORTED_CURRENCY_COUNT),
};

function substituteTemplate(raw) {
  return raw.replace(/\$\{([^}]+)\}/g, (_m, expr) => {
    const key = expr.trim();
    if (!(key in KNOWN_SUBSTITUTIONS)) {
      throw new Error(
        `generate-markdown-mirrors: 未知 template token \`\${${key}}\`；` +
          '請在 KNOWN_SUBSTITUTIONS 補上映射，避免錯誤字面值散播到 public/*.md 鏡像。',
      );
    }
    return KNOWN_SUBSTITUTIONS[key];
  });
}

/**
 * JS string literal 反跳脫：把原始碼裡的 `\``、`\n`、`\\` 等 escape 字元還原成字面值字元。
 *
 * regex 擷取的是 seo-metadata.ts 原始碼片段，JS 尚未執行，因此像
 * `` `直接 GET \`${RATES_API.latestCdn}\`` `` 會被擷取為 `直接 GET \`...\``（兩字元）。
 * 若直接寫入鏡像檔，Markdown 解析器不會把它當成 inline code 區塊，也與對應 HTML 頁語義不一致。
 * 在 `substituteTemplate` 之後執行，避免影響 `${...}` token 解析。
 */
function unescapeJsStringLiteral(raw) {
  const SIMPLE_ESCAPES = { n: '\n', r: '\r', t: '\t' };
  return raw.replace(/\\(.)/g, (_m, c) => SIMPLE_ESCAPES[c] ?? c);
}

function resolveLiteral(raw) {
  return unescapeJsStringLiteral(substituteTemplate(raw));
}

function extractFaqArray(constName) {
  const startRe = new RegExp(`export const ${constName} = \\[`, 'm');
  const startMatch = startRe.exec(seoMetadataSrc);
  if (!startMatch) throw new Error(`找不到 export const ${constName}`);

  // 找到對應陣列結束：` as const`（可能後接 `satisfies` 或 `;`）
  const endRe = /\]\s*as const\b/g;
  endRe.lastIndex = startMatch.index;
  const endMatch = endRe.exec(seoMetadataSrc);
  if (!endMatch) throw new Error(`找不到 ${constName} 的結束標記`);

  const block = seoMetadataSrc.slice(startMatch.index, endMatch.index);

  // 逐對匹配 { question: ..., answer: ... }
  // 值可能是 '...', "...", 或 `...`（可跨行），中途允許逗號
  const entryRe = /question:\s*(['"`])([\s\S]*?)\1\s*,\s*answer:\s*(['"`])([\s\S]*?)\3\s*,?\s*}/g;
  const entries = [];
  let m;
  while ((m = entryRe.exec(block)) !== null) {
    entries.push({
      question: resolveLiteral(m[2]).trim(),
      answer: resolveLiteral(m[4]).trim(),
    });
  }
  if (entries.length === 0) throw new Error(`${constName} 未解析到任何 Q&A`);
  return entries;
}

function formatFaq(entries) {
  return entries.map((e, i) => `### ${i + 1}. ${e.question}\n\n${e.answer}`).join('\n\n');
}

/**
 * 從 seo-metadata.ts 擷取特定頁面常數的 description 字串。
 * 為避免非貪婪比對跨 block 誤匹配，先切出 `export const X = {` 至 `} satisfies` 區間再搜尋。
 */
function extractPageDescription(pageConst) {
  const startRe = new RegExp(`export const ${pageConst} = \\{`);
  const startMatch = startRe.exec(seoMetadataSrc);
  if (!startMatch) throw new Error(`找不到 export const ${pageConst}`);
  const tail = seoMetadataSrc.slice(startMatch.index);
  const endRe = /\}\s*(?:as const\s+)?satisfies\s+\w+/;
  const endMatch = endRe.exec(tail);
  if (!endMatch) throw new Error(`找不到 ${pageConst} 的結束標記`);
  const block = tail.slice(0, endMatch.index);

  const descBacktick = /description:\s*`([\s\S]*?)`/.exec(block);
  if (descBacktick) return resolveLiteral(descBacktick[1]).trim();
  const descSingle = /description:\s*'([\s\S]*?)'/.exec(block);
  if (descSingle) return resolveLiteral(descSingle[1]).trim();
  const descIdentifier = /description:\s*([A-Z_][A-Z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?)/.exec(
    block,
  );
  if (descIdentifier) {
    const key = descIdentifier[1];
    if (key in KNOWN_SUBSTITUTIONS) return KNOWN_SUBSTITUTIONS[key].trim();
  }
  throw new Error(`無法擷取 ${pageConst}.description`);
}

// 不嵌入 build timestamp：避免 prebuild 每次重跑都造成 git diff；版本號由 changeset 驅動即為 SSOT。
const COMMON_FOOTER = `---

_本 Markdown 鏡像由 \`scripts/generate-markdown-mirrors.mjs\` 於 build 時自動產生（v${VERSION}），與 HTML 頁面語義一致。_
_正式人眼版本請見對應 HTML URL。_
`;

// Deterministic write：遵循 AGENTS.md § Prettier 格式漂移修法——prebuild script
// 不得呼叫 `prettier.format()`/`prettier.resolveConfig()`，鏡像檔由 .prettierignore 排除格式化。
function writeMirror(slug, content) {
  const out = resolve(ROOT, `public/${slug}.md`);
  writeFileSync(out, content.trimEnd() + '\n');
  console.log(`  ✅ public/${slug}.md`);
}

function buildHomeMd() {
  const faq = extractFaqArray('HOMEPAGE_FAQ_CONTENT');
  const description = extractPageDescription('HOMEPAGE_SEO');
  return `# ${APP_INFO.name}

> ${description}

- Canonical: ${BASE_URL}
- Version: v${VERSION}

## 以台灣銀行牌告匯率做實務換算

- 顯示臺灣銀行現金匯率與即期匯率的買入 / 賣出價。
- 5 分鐘自動同步最新牌告匯率，主畫面可直接查即時換算結果。
- 無廣告、無登入，提供收藏貨幣、歷史趨勢與多幣別模式。

## 首頁核心功能

1. 單幣別換算與多幣別同時換算。
2. 計算機快速金額按鈕與下拉同步更新。
3. PWA 離線快取，可暫時在無網路下查看既有匯率。

## 常見問題

${formatFaq(faq)}

## 對應內容入口

- ${APP_INFO.shortName} 常見問題：${BASE_URL}faq/
- 使用指南：${BASE_URL}guide/
- 開放資料 API：${BASE_URL}open-data/

${COMMON_FOOTER}`;
}

// ---------------------------------------------------------------------------
// 1. FAQ — 直接鏡像 FAQ_PAGE_ENTRIES（20 題 Q&A）
// ---------------------------------------------------------------------------
function buildFaqMd() {
  const faq = extractFaqArray('FAQ_PAGE_ENTRIES');
  const description = extractPageDescription('FAQ_PAGE_SEO');
  return `# ${APP_INFO.shortName} 常見問題 FAQ

> ${description}

- Canonical: ${BASE_URL}faq/
- Version: v${VERSION}

## 先掌握三個重點

- **看賣出價，不看中間價：** 你拿台幣買外幣時，要看的通常是銀行賣出價，而不是中間價。
- **現金與即期是不同場景：** 臨櫃換鈔看現金匯率，外幣帳戶轉換或匯款看即期匯率。
- **刷卡匯率不是台銀牌告：** 海外刷卡會走卡組織清算匯率，另加發卡銀行海外手續費。

## 常見問題

${formatFaq(faq)}

${COMMON_FOOTER}`;
}

// ---------------------------------------------------------------------------
// 2. About — 網站定位 + 資料/技術/作者 + FAQ
//    對應頁面：src/pages/About.tsx（JSX 硬編碼文案）
// ---------------------------------------------------------------------------
function buildAboutMd() {
  const faq = extractFaqArray('ABOUT_PAGE_FAQ');
  const description = extractPageDescription('ABOUT_PAGE_SEO');
  return `# 關於 ${APP_INFO.name}

> ${description}

- Canonical: ${BASE_URL}about/
- Version: v${VERSION}

## 定位

${APP_INFO.shortName} 是以臺灣銀行牌告匯率為基礎的換匯工具，重點是幫台灣用戶看懂實際買入價、賣出價、現金價與即期價，不以市場中間價作為主要決策依據。一般中間價工具適合觀察市場方向，但不等於實際換匯成本。

## 資料方法與範圍

- 資料來源為臺灣銀行官方牌告匯率，涵蓋 ${SUPPORTED_CURRENCY_COUNT} 種貨幣。
- 每 5 分鐘自動同步最新報價，涵蓋現金買入、現金賣出、即期買入、即期賣出四種。
- 資料管線：GitHub Actions 每日抓取 + 雙重驗證（台銀牌告 vs open.er-api.com 中間價，誤差 ≤ 2%）+ Pull Request 自動審核後合併至 data branch。
- 匯差範例數字透過 SSG（vite-react-ssg）於 build 期嵌入靜態 HTML，搜尋引擎無需執行 JavaScript 即可讀取。

## 技術與資料面能力

- **PWA 離線使用**：Service Worker 預快取，無網路仍可換算。
- **SSG 預渲染**：所有 SEO 頁面於 build 期產生靜態 HTML。
- **結構化資料**：JSON-LD 包含 WebSite、Organization、SoftwareApplication、HowTo、BreadcrumbList、Article、FinancialService、ImageObject。
- **AI 友善**：robots.txt 允許 OpenAI / Anthropic / Perplexity / Google / Apple 等主流 AI 爬蟲；提供 llms.txt、llms-full.txt、openapi.json 供 LLM 引用。
- **開放原始碼**：所有程式碼公開於 GitHub（${APP_INFO.github}）。

## 作者

- 作者：${APP_INFO.author}
- 聯絡：${APP_INFO.email}
- GitHub：${APP_INFO.github}

## 常見問題

${formatFaq(faq)}

${COMMON_FOOTER}`;
}

// ---------------------------------------------------------------------------
// 3. Privacy — 對應 src/pages/Privacy.tsx
// ---------------------------------------------------------------------------
function buildPrivacyMd() {
  const description = extractPageDescription('PRIVACY_PAGE_SEO');
  return `# ${APP_INFO.shortName} 隱私政策

> ${description}

- Canonical: ${BASE_URL}privacy/
- Version: v${VERSION}

## 概述

${APP_INFO.shortName} 重視資料最小化原則。本服務不要求註冊帳號，也不建立可識別個人的會員資料。收藏貨幣、介面設定與換算歷史會保存在您的裝置本地；站點營運另使用第三方分析與安全服務處理匿名流量與防護資訊。

## 本地儲存資料

- 收藏貨幣清單
- 介面風格與語言設定
- 換算歷史記錄
- 最近一次匯率快取資料

以上資料主要透過瀏覽器的 \`localStorage\` 與快取機制儲存，不會由 ${APP_INFO.shortName} 自建伺服器集中保存。

## 第三方服務

- **臺灣銀行牌告匯率**：讀取公開匯率資料，用於顯示現金與即期報價。
- **Google Analytics**：匿名流量分析與功能使用統計，Google 可能依其服務機制設定分析所需 Cookie 或識別資訊。
- **Cloudflare**：CDN 加速、安全防護與基礎營運記錄，可能記錄匿名技術資訊以支援流量管理與防護。

## 你可以怎麼管理資料

- 於設定頁（${BASE_URL}settings/）重設部分本地偏好與快取資料。
- 可透過瀏覽器設定清除站點資料、Cookie 與本地儲存內容。
- 若對隱私有疑問，可來信 ${APP_INFO.email}。

${COMMON_FOOTER}`;
}

// ---------------------------------------------------------------------------
// 4. Guide — 使用流程 + 判讀技巧 + 進階功能
//    對應頁面：src/pages/Guide.tsx（混合 SSOT howTo + 硬編碼提示）
// ---------------------------------------------------------------------------
function buildGuideMd() {
  const description = extractPageDescription('GUIDE_PAGE_SEO');
  return `# ${APP_INFO.shortName} 使用指南

> ${description}

- Canonical: ${BASE_URL}guide/
- Version: v${VERSION}

## 快速上手（8 步驟）

1. **選擇來源貨幣**：點擊頂部貨幣選單，選擇要換出的貨幣（例如 USD）。
2. **選擇目標貨幣**：預設 TWD；多幣別模式可同時查看多組換算。
3. **輸入金額**：使用底部計算機鍵盤或實體鍵盤，支援加減乘除、百分比、退格。
4. **切換現金 / 即期**：依情境選擇——臨櫃換鈔看現金匯率，外幣帳戶或匯款看即期匯率。
5. **切換買入 / 賣出**：出國換外幣看賣出價；回國換回台幣看買入價。
6. **使用快速金額按鈕**：依幣別內建常用金額（如韓元 10,000~300,000、日圓 1,000~30,000）。
7. **收藏常用貨幣**：點擊星號收藏，收藏頁支援拖曳排序。
8. **下拉更新**：首頁向下拉動即可同步最新台銀牌告。

## 判讀匯率的三個技巧

- **先判斷方向**：出國 → 看賣出價；回國 → 看買入價。
- **再判斷場景**：換現鈔 → 現金匯率；走外幣帳戶 / 匯款 → 即期匯率。
- **對照市場基準**：台銀賣出價通常比中間價高 0.5~1.5%，若更高可能是特殊幣別成本或牌告時差。

## 進階功能

- **多幣別同時比較**：一個基準貨幣同時查看 ${SUPPORTED_CURRENCY_COUNT} 種貨幣換算。
- **歷史趨勢圖**：7 到 30 天匯率波動視覺化，判斷換匯時機。
- **換算歷史紀錄**：自動記錄每次換算，可單擊複製或雙擊重新載入。
- **6 種主題風格**：Zen、Nitro、Kawaii、Classic、Ocean、Forest。
- **PWA 安裝**：iPhone Safari → 分享 → 加入主畫面；Android Chrome → 選單 → 安裝應用程式。

## 常見 FAQ 導引

更完整的 Q&A 請參考 [FAQ 頁](${BASE_URL}faq/) 或 [faq.md](${BASE_URL}faq.md)。

${COMMON_FOOTER}`;
}

// ---------------------------------------------------------------------------
// 5. OpenData — API 端點 + 範例 + FAQ
//    對應頁面：src/pages/OpenData.tsx（常數化程度高）
// ---------------------------------------------------------------------------
function buildOpenDataMd() {
  const faq = extractFaqArray('OPEN_DATA_PAGE_FAQ');
  const description = extractPageDescription('OPEN_DATA_PAGE_SEO');
  return `# ${APP_INFO.shortName} 開放資料 API

> ${description}

- Canonical: ${BASE_URL}open-data/
- Version: v${VERSION}

## 端點

| 類型 | URL |
|------|-----|
| 最新匯率（主要，jsDelivr CDN） | \`${RATES_API.latestCdn}\` |
| 最新匯率（備援，GitHub Raw） | \`${RATES_API.latestRaw}\` |
| 歷史匯率 | \`${CDN_DATA_BASE}/public/rates/history/{YYYY-MM-DD}.json\` |
| OpenAPI 規格 | ${BASE_URL}openapi.json |

- **免 API Key**、**免費使用**、**CORS 已啟用**。
- 更新頻率：每 5 分鐘自動同步臺灣銀行牌告。
- 涵蓋 ${SUPPORTED_CURRENCY_COUNT} 種貨幣的現金買/賣、即期買/賣四種報價。

## 呼叫範例

### curl

\`\`\`bash
curl -s ${RATES_API.latestCdn} | jq '.details.USD'
\`\`\`

### JavaScript / Node.js

\`\`\`javascript
const res = await fetch('${RATES_API.latestCdn}');
const data = await res.json();
console.log('USD 現金賣出：', data.details.USD.cash.sell);
console.log('USD 即期賣出：', data.details.USD.spot.sell);
\`\`\`

### Python

\`\`\`python
import urllib.request, json
url = '${RATES_API.latestCdn}'
with urllib.request.urlopen(url) as r:
    data = json.loads(r.read())
print(data['details']['JPY']['cash']['buy'])
\`\`\`

## 資料格式

\`\`\`json
{
  "updateTime": "2026-04-17T08:00:00+08:00",
  "details": {
    "USD": {
      "cash": { "buy": 32.20, "sell": 33.05 },
      "spot": { "buy": 32.50, "sell": 32.75 }
    }
  }
}
\`\`\`

- \`cash.buy\`：現金買入（銀行向您收購外幣現鈔）
- \`cash.sell\`：現金賣出（您臨櫃向銀行買外幣現鈔）
- \`spot.buy\`：即期買入（外幣帳戶結匯回台幣）
- \`spot.sell\`：即期賣出（外幣帳戶購匯或匯款）

## 速率限制

- jsDelivr CDN：依其公開限制；正常使用不會受限。
- GitHub Raw：備援用，建議不要高頻輪詢。
- 建議同一客戶端同一資料集 5 分鐘 ≤ 1 次輪詢。

## 常見問題

${formatFaq(faq)}

${COMMON_FOOTER}`;
}

// ---------------------------------------------------------------------------
// Generate all mirrors
// ---------------------------------------------------------------------------
console.log('🪞 生成 Markdown 鏡像...');
writeMirror('faq', buildFaqMd());
writeMirror('about', buildAboutMd());
writeMirror('privacy', buildPrivacyMd());
writeMirror('guide', buildGuideMd());
writeMirror('open-data', buildOpenDataMd());
writeMirror('index', buildHomeMd());
console.log('✅ Markdown 鏡像生成完成（6 檔）');
