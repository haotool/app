import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEV_ONLY_PATHS, SITE_CONFIG } from '../seo-paths.config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BUILD_DATE = new Date().toISOString().split('T')[0];
const SITEMAP_URL = `${SITE_CONFIG.url}sitemap.xml`;

const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'anthropic-ai',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'GrokBot',
  'cohere-ai',
  'YouBot',
  'DuckAssistBot',
  'Amazonbot',
  'Applebot-Extended',
  'CCBot',
  'Bytespider',
];

const SOCIAL_BOTS = ['Meta-ExternalAgent', 'facebookexternalhit', 'Twitterbot', 'LinkedInBot'];

function sectionForBots(bots) {
  return bots.map((bot) => `User-agent: ${bot}\nAllow: /`).join('\n\n');
}

function buildDisallowRules(paths) {
  return paths
    .map((path) => `Disallow: ${new URL(path.replace(/^\//, ''), SITE_CONFIG.url).pathname}`)
    .join('\n');
}

const robotsTxt = `# RateWise — Robots Exclusion Protocol
# ${SITE_CONFIG.url}
# 最後更新：${BUILD_DATE}

User-agent: *
Allow: /
Disallow: /ratewise/sw.js
Disallow: /ratewise/workbox-*.js
${buildDisallowRules(DEV_ONLY_PATHS)}
# 封鎖帶 query string 的首頁 deep-link URL（如 /ratewise/?amount=500&from=USD&to=TWD）
# 首頁 deep-link 僅作為 UX 分享入口，三個自由變數組合無限，會消耗 crawl budget。
# 注意：此規則不影響幣對金額頁（如 /ratewise/usd-twd/?amount=500）——
# 幣對頁路徑為 /ratewise/usd-twd/，不匹配 /ratewise/? 前綴，Googlebot 可正常索引。
# 幣對金額頁採 Wise-pattern（自引用 canonical + 動態 SEO title），單一自由變數，可索引。
Disallow: /ratewise/?

Sitemap: ${SITEMAP_URL}

${sectionForBots(AI_BOTS)}

${sectionForBots(SOCIAL_BOTS)}
`;

writeFileSync(resolve(ROOT, 'public/robots.txt'), robotsTxt.trimEnd() + '\n');
console.log('✅ robots.txt 已由 SSOT 重新生成');
