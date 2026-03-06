/**
 * 自動生成 robots.txt — 從 SSOT 讀取站點配置與路徑
 *
 * 執行時機：prebuild（確保 public/robots.txt 永遠與 seo-paths.config.mjs 同步）
 * SSOT 來源：seo-paths.config.mjs (SITE_CONFIG, DEV_ONLY_PATHS)
 *
 * 策略說明：
 * - 技術檔案（/sw.js, /workbox-*.js, /*.json）：Disallow（非頁面）
 * - 開發/展示頁（DEV_ONLY_PATHS）：Disallow（無使用者價值，無需 noindex）
 * - 使用者功能頁（APP_ONLY_NOINDEX_PATHS）：允許爬取，由 SEOHelmet noindex 處理
 *   ↳ Google 必須先爬取頁面才能讀取 noindex 指令，不可 Disallow
 *
 * 輸出：public/robots.txt
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_CONFIG, DEV_ONLY_PATHS } from '../seo-paths.config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const BUILD_DATE = new Date().toISOString().split('T')[0];
const SITEMAP_URL = `${SITE_CONFIG.url}sitemap.xml`;

// Google 規格：指向目錄路徑必須以 / 結尾，保留 DEV_ONLY_PATHS 的尾斜線
// Disallow: /theme-showcase/ 只匹配 /theme-showcase/，不會誤匹配 /theme-showcase-beta
const devDisallows = DEV_ONLY_PATHS.map((p) => (p.endsWith('/') ? p : `${p}/`));

const content = `# RateWise — Robots Exclusion Protocol
# ${SITE_CONFIG.url}
# 最後更新：${BUILD_DATE}

# Content Signals 宣告已停用
# 原因：避免非標準 directive 影響 robots 驗證
# 需求仍以 llms.txt 與授權文件表達

# ── 預設規則 ──────────────────────────────────────────
User-agent: *
Allow: /
Disallow: /sw.js
Disallow: /workbox-*.js
Disallow: /*.json
${devDisallows.map((p) => `Disallow: ${p}`).join('\n')}

Sitemap: ${SITEMAP_URL}

# ── OpenAI ────────────────────────────────────────────
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

# ── Anthropic ─────────────────────────────────────────
User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

# ── Perplexity ────────────────────────────────────────
User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

# ── Google ────────────────────────────────────────────
User-agent: Google-Extended
Allow: /

# ── xAI (Grok) ────────────────────────────────────────
User-agent: GrokBot
Allow: /

# ── Cohere ────────────────────────────────────────────
User-agent: cohere-ai
Allow: /

# ── You.com ───────────────────────────────────────────
User-agent: YouBot
Allow: /

# ── DuckDuckGo AI ─────────────────────────────────────
User-agent: DuckAssistBot
Allow: /

# ── Amazon ────────────────────────────────────────────
User-agent: Amazonbot
Allow: /

# ── Apple ─────────────────────────────────────────────
User-agent: Applebot-Extended
Allow: /

# ── Common Crawl ──────────────────────────────────────
User-agent: CCBot
Allow: /

# ── ByteDance ─────────────────────────────────────────
User-agent: Bytespider
Allow: /

# ── 社群媒體 ──────────────────────────────────────────
User-agent: Meta-ExternalAgent
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /
`;

const OUTPUT_PATH = resolve(ROOT, 'public/robots.txt');
writeFileSync(OUTPUT_PATH, content, 'utf-8');
console.log(`✓ robots.txt 已更新（${BUILD_DATE}）`);
console.log(`  Sitemap: ${SITEMAP_URL}`);
console.log(`  Dev Disallow: ${devDisallows.join(', ')}`);
