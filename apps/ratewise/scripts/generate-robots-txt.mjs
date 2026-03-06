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
Disallow: /sw.js
Disallow: /workbox-*.js
Disallow: /theme-showcase/
Disallow: /color-scheme/
Disallow: /update-prompt-test/
Disallow: /ui-showcase/

Sitemap: ${SITEMAP_URL}

${sectionForBots(AI_BOTS)}

${sectionForBots(SOCIAL_BOTS)}
`;

writeFileSync(resolve(ROOT, 'public/robots.txt'), robotsTxt.trimEnd() + '\n');
console.log('✅ robots.txt 已由 SSOT 重新生成');
