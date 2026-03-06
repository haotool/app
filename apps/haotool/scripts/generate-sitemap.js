import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEO_PATHS, SITE_CONFIG } from '../app.config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BUILD_TIMESTAMP = new Date().toISOString();

const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'anthropic-ai',
  'PerplexityBot',
  'Google-Extended',
  'cohere-ai',
  'CCBot',
  'Bytespider',
];

const SOCIAL_BOTS = [
  'Meta-ExternalAgent',
  'facebookexternalhit',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot',
];

const SITEMAP_URLS = [
  `${SITE_CONFIG.url}sitemap.xml`,
  `${SITE_CONFIG.url}ratewise/sitemap.xml`,
  `${SITE_CONFIG.url}nihonname/sitemap.xml`,
  `${SITE_CONFIG.url}park-keeper/sitemap.xml`,
  `${SITE_CONFIG.url}quake-school/sitemap.xml`,
];

function buildUrlXml(pathname) {
  const absoluteUrl = new URL(pathname, SITE_CONFIG.url).toString();

  return `  <url>
    <loc>${absoluteUrl}</loc>
    <lastmod>${BUILD_TIMESTAMP}</lastmod>
    <xhtml:link rel="alternate" hreflang="zh-TW" href="${absoluteUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl}" />
  </url>`;
}

function buildBotSection(bots) {
  return bots.map((bot) => `User-agent: ${bot}\nAllow: /`).join('\n\n');
}

function generateSitemap() {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${SEO_PATHS.map((pathname) => buildUrlXml(pathname)).join('\n')}
</urlset>
`;

  writeFileSync(resolve(ROOT, 'public/sitemap.xml'), sitemap);
  console.log('✅ haotool sitemap.xml 已由 SSOT 重新生成');
}

function generateRobotsTxt() {
  const robotsTxt = `# haotool.org — Robots Exclusion Protocol
# ${SITE_CONFIG.url}
# 最後更新：${BUILD_TIMESTAMP.slice(0, 10)}

User-agent: *
Allow: /
Disallow: /sw.js
Disallow: /workbox-*.js

${SITEMAP_URLS.map((url) => `Sitemap: ${url}`).join('\n')}

${buildBotSection(AI_BOTS)}

${buildBotSection(SOCIAL_BOTS)}
`;

  writeFileSync(resolve(ROOT, 'public/robots.txt'), robotsTxt.trimEnd() + '\n');
  console.log('✅ haotool robots.txt 已由 SSOT 重新生成');
}

generateSitemap();
generateRobotsTxt();
