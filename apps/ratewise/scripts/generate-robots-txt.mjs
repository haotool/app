import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_CONFIG } from '../seo-paths.config.mjs';

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

const robotsTxt = `# RateWise — Robots Exclusion Protocol
# ${SITE_CONFIG.url}
# 最後更新：${BUILD_DATE}

User-agent: *
Allow: /
Disallow: /ratewise/sw.js
Disallow: /ratewise/workbox-*.js
Disallow: /ratewise/theme-showcase/
Disallow: /ratewise/color-scheme/
Disallow: /ratewise/update-prompt-test/
Disallow: /ratewise/ui-showcase/
# 封鎖帶 query string 的首頁 deep-link URL（如 ?amount=500&from=USD&to=TWD）
# 這些 URL 的 canonical 已正確指向 /ratewise/，但 Googlebot 仍會爬取浪費 crawl budget
# Social bot（facebookexternalhit 等）在各自 section 有 Allow: /，不受此規則影響
Disallow: /ratewise/?

Sitemap: ${SITEMAP_URL}

${sectionForBots(AI_BOTS)}

${sectionForBots(SOCIAL_BOTS)}
`;

writeFileSync(resolve(ROOT, 'public/robots.txt'), robotsTxt.trimEnd() + '\n');
console.log('✅ robots.txt 已由 SSOT 重新生成');
