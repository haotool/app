import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEV_ONLY_PATHS, SITE_CONFIG } from '../seo-paths.config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
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

User-agent: *
Allow: /
Disallow: /ratewise/sw.js
Disallow: /ratewise/workbox-*.js
${buildDisallowRules(DEV_ONLY_PATHS)}
# 首頁 deep-link 僅供分享，不作為索引目標。
# 幣對金額頁是否索引由頁面層 canonical 與 robots 決定。
# robots.txt 僅控制 crawl 範圍。
Disallow: /ratewise/?

Sitemap: ${SITEMAP_URL}

${sectionForBots(AI_BOTS)}

${sectionForBots(SOCIAL_BOTS)}
`;

writeFileSync(resolve(ROOT, 'public/robots.txt'), robotsTxt.trimEnd() + '\n');
console.log('✅ robots.txt 已由 SSOT 重新生成');
