import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEV_ONLY_PATHS, SITE_CONFIG } from '../seo-paths.config.mjs';
import { APP_INFO } from '../src/config/app-info.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SITEMAP_URL = `${SITE_CONFIG.url}sitemap.xml`;

/**
 * AI Bot 三層治理模型（2026-04 SSOT）
 *
 * 依 OpenAI / Anthropic 2026 官方文件，AI bot 用途分成三個獨立治理軸：
 *  1. TRAINING   — 抓取內容用於訓練基礎模型
 *  2. SEARCH     — 抓取內容用於 AI 搜尋結果索引與引用
 *  3. USER_AGENT — 使用者於對話中觸發的即時內容檢索
 *
 * 本站策略：三層皆 Allow /，換取 AI 搜尋最大化曝光。
 * 若未來要封鎖訓練但保留搜尋能見度，只需將 TRAINING_BOTS 整段切成 Disallow /。
 *
 * 參考：
 * - OpenAI:    https://developers.openai.com/api/docs/bots
 * - Anthropic: https://privacy.claude.com/en/articles/8896518
 */
const TRAINING_BOTS = [
  'GPTBot', // OpenAI 基礎模型訓練
  'ClaudeBot', // Anthropic 基礎模型訓練
  'anthropic-ai', // Anthropic 舊版 UA（相容）
  'Google-Extended', // Google Gemini / Bard 訓練
  'Applebot-Extended', // Apple Intelligence 訓練
  'Amazonbot', // Amazon AI 訓練
  'Bytespider', // ByteDance（豆包）訓練
  'CCBot', // Common Crawl 公共訓練語料
  'cohere-ai', // Cohere 訓練
  'FacebookBot', // Meta AI 訓練
  'Meta-ExternalAgent', // Meta AI 新版訓練爬蟲
  'Timpibot', // Timpi 搜尋索引（常被模型重用）
  'ProRataInc', // ProRata AI 索引
  'Novellum AI Crawl', // Novellum AI 訓練
];

const SEARCH_BOTS = [
  'OAI-SearchBot', // ChatGPT Search 索引
  'Claude-SearchBot', // Claude Search 索引
  'PerplexityBot', // Perplexity 搜尋索引
  'Applebot', // Apple 搜尋（Siri / Spotlight）
  'Google-CloudVertexBot', // Google Vertex AI grounding
  'DuckAssistBot', // DuckDuckGo AI 搜尋
];

const USER_AGENT_BOTS = [
  'ChatGPT-User', // 使用者在 ChatGPT 要求即時抓取
  'Claude-User', // 使用者在 Claude 要求即時抓取
  'Perplexity-User', // 使用者在 Perplexity 要求即時抓取
  'MistralAI-User', // 使用者在 Mistral Le Chat 要求即時抓取
  'Manus-User', // Manus 代理操作
  'Meta-ExternalFetcher', // Meta AI 使用者觸發抓取
  'Cloudflare-AutoRAG', // Cloudflare AutoRAG 代理抓取
  'Anchor Browser', // Anchor AI 瀏覽代理
];

const PREVIEW_AND_OTHER_BOTS = [
  'facebookexternalhit', // Facebook 分享預覽
  'Twitterbot', // X / Twitter 分享預覽
  'LinkedInBot', // LinkedIn 分享預覽
  'archive.org_bot', // Internet Archive 保存
  'Terracotta Bot', // Terracotta 搜尋
  'PhindBot', // Phind 開發者搜尋
  'YouBot', // You.com 搜尋
  'GrokBot', // xAI Grok
  'PetalBot', // 華為花瓣搜尋
];

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
# AI Bot 三層治理：TRAINING / SEARCH / USER_AGENT
# 當前策略：三層皆 Allow /（最大化 AI 搜尋曝光）。
# 若未來需停止貢獻訓練語料，請將 TRAINING 區段改為 Disallow /。

User-agent: *
Allow: /
${SHARED_DISALLOW}

Sitemap: ${SITEMAP_URL}

${sectionForBots(TRAINING_BOTS, 'Tier 1: TRAINING (基礎模型訓練語料)')}

${sectionForBots(SEARCH_BOTS, 'Tier 2: SEARCH (AI 搜尋索引與引用)')}

${sectionForBots(USER_AGENT_BOTS, 'Tier 3: USER_AGENT (使用者觸發即時抓取)')}

${sectionForBots(PREVIEW_AND_OTHER_BOTS, 'Tier 4: PREVIEW / OTHER (社群預覽與其他)')}
`;

writeFileSync(resolve(ROOT, 'public/robots.txt'), robotsTxt.trimEnd() + '\n');
console.log('✅ robots.txt generated (4-tier governance)');
