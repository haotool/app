import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEV_ONLY_PATHS, SITE_CONFIG } from '../seo-paths.config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SITEMAP_URL = `${SITE_CONFIG.url}sitemap.xml`;

// AI 爬蟲清單：遵循 SEO_MASTER_SSOT.md §8.2 規範
// 注意：Googlebot 和 Bingbot 不需專門規則，它們應遵循 User-agent: * 的 Disallow 規則
const AI_SEARCH_BOTS = [
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
  'Google-CloudVertexBot',
  'GrokBot',
  'cohere-ai',
  'YouBot',
  'PhindBot',
  'DuckAssistBot',
  'Amazonbot',
  'Applebot',
  'Applebot-Extended',
  'CCBot',
  'Bytespider',
  'PetalBot',
  'MistralAI-User',
  'Manus-User',
  'Meta-ExternalAgent',
  'Meta-ExternalFetcher',
  'FacebookBot',
  'facebookexternalhit',
  'Twitterbot',
  'LinkedInBot',
  'Cloudflare-AutoRAG',
  'Anchor Browser',
  'archive.org_bot',
  'Terracotta Bot',
  'Timpibot',
  'ProRataInc',
  'Novellum AI Crawl',
];

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
Disallow: /ratewise/?

Sitemap: ${SITEMAP_URL}

${sectionForBots(AI_SEARCH_BOTS)}
`;

writeFileSync(resolve(ROOT, 'public/robots.txt'), robotsTxt.trimEnd() + '\n');
console.log('✅ robots.txt generated');
