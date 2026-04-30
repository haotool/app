import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEV_ONLY_PATHS, SITE_CONFIG } from '../seo-paths.config.mjs';
import { APP_INFO } from '../src/config/app-info.ts';
import { AI_CRAWLER_TIERS } from './lib/ai-crawlers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SITEMAP_URL = `${SITE_CONFIG.url}sitemap.xml`;

/**
 * AI Bot 四層治理模型（2026-04 SSOT）
 *
 * 依 OpenAI / Anthropic 2026 官方文件，AI bot 用途分成獨立治理軸：
 *  1. TRAINING   — 抓取內容用於訓練基礎模型
 *  2. SEARCH     — 抓取內容用於 AI 搜尋結果索引與引用
 *  3. USER_AGENT — 使用者於對話中觸發的即時內容檢索
 *  4. PREVIEW    — 社群預覽與其他搜尋/存檔用途
 *
 * 本站策略：四層皆 Allow /，換取 AI 搜尋最大化曝光。
 * 若未來要封鎖訓練但保留搜尋能見度，只需將 training tier 整段切成 Disallow /。
 *
 * 參考：
 * - OpenAI:    https://developers.openai.com/api/docs/bots
 * - Anthropic: https://privacy.claude.com/en/articles/8896518
 * 清單來源：scripts/lib/ai-crawlers.mjs。
 */

/**
 * RFC 9309：specific user-agent group 完全覆蓋 `User-agent: *`，不會繼承。
 * 因此每個 AI bot 專屬群組必須一併輸出共用 Disallow，否則 GPTBot / ClaudeBot 等
 * 會不受 `*` 區塊約束，反而可抓取原先封鎖的 sw.js / workbox-* / 開發專用頁面。
 */
const SHARED_DISALLOW = [
  'Disallow: /ratewise/sw.js',
  'Disallow: /ratewise/workbox-*.js',
  ...DEV_ONLY_PATHS.map(
    (path) => `Disallow: ${new URL(path.replace(/^\//, ''), SITE_CONFIG.url).pathname}`,
  ),
  'Disallow: /ratewise/?',
].join('\n');

function sectionForBots(bots, label) {
  const header = `# --- ${label} ---`;
  const rules = bots.map((bot) => `User-agent: ${bot}\nAllow: /\n${SHARED_DISALLOW}`).join('\n\n');
  return `${header}\n${rules}`;
}

const robotsTxt = `# ${APP_INFO.shortName} — Robots Exclusion Protocol
# ${SITE_CONFIG.url}
#
# AI Bot 四層治理：TRAINING / SEARCH / USER_AGENT / PREVIEW
# 當前策略：四層皆 Allow /（最大化 AI 搜尋曝光）。
# 若未來需停止貢獻訓練語料，請將 TRAINING 區段改為 Disallow /。

User-agent: *
Allow: /
${SHARED_DISALLOW}

# AI內容信號：保留曝光，降低用於模型訓練與預覽的抓取風險。
# X-Content-Signal: ai-train=no, search=yes, ai-input=no

Sitemap: ${SITEMAP_URL}

${AI_CRAWLER_TIERS.map((tier) => sectionForBots(tier.bots, tier.label)).join('\n\n')}
`;

writeFileSync(resolve(ROOT, 'public/robots.txt'), robotsTxt.trimEnd() + '\n');
console.log('✅ robots.txt generated (4-tier governance)');
