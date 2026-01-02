/**
 * Generate sitemap.xml and robots.txt for SEO
 * [context7:/google/seo-starter-guide:2025-12-15]
 *
 * 更新說明:
 * - 2025-12-15: 新增 hreflang 標籤支援 (zh-TW + x-default)
 * - 2025-12-15: 新增 AI 爬蟲配置 (GPTBot, ClaudeBot, etc.)
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SITE_URL = 'https://app.haotool.org';
const BUILD_DATE = new Date().toISOString().split('T')[0];

// Define routes with priorities and change frequencies
const ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/projects/', priority: '0.9', changefreq: 'weekly' },
  { path: '/about/', priority: '0.8', changefreq: 'monthly' },
  { path: '/contact/', priority: '0.7', changefreq: 'monthly' },
];

/**
 * Generate sitemap.xml with hreflang tags
 * [SEO Best Practices 2025: hreflang for international targeting]
 */
function generateSitemap() {
  const urls = ROUTES.map(
    (route) => `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
    <xhtml:link rel="alternate" hreflang="zh-TW" href="${SITE_URL}${route.path}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${route.path}" />
  </url>`,
  );

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;

  const publicDir = resolve(__dirname, '../public');
  writeFileSync(resolve(publicDir, 'sitemap.xml'), sitemap);
  console.log('✅ Generated sitemap.xml (with hreflang)');
}

/**
 * Generate robots.txt with AI crawler configurations
 * [SEO Best Practices 2025: AI crawler policies]
 */
function generateRobotsTxt() {
  const robotsTxt = `# robots.txt for haotool.org
# https://app.haotool.org/
# Updated: ${BUILD_DATE}
# [context7:/google/robots-txt:2025-12-15]

User-agent: *
Allow: /

# AI Crawlers - Allow all major AI search engines
User-agent: GPTBot
User-agent: ChatGPT-User
User-agent: ClaudeBot
User-agent: PerplexityBot
User-agent: anthropic-ai
User-agent: Google-Extended
User-agent: Bingbot
Allow: /

# Social Media Crawlers - For rich previews
User-agent: facebookexternalbot
User-agent: Twitterbot
User-agent: LinkedInBot
User-agent: Slackbot
User-agent: Discordbot
User-agent: TelegramBot
Allow: /

# Security - Disallow sensitive files
Disallow: /sw.js
Disallow: /service-worker.js
Disallow: /*.json$

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml

# Crawl-delay (optional, for polite crawling)
Crawl-delay: 1
`;

  const publicDir = resolve(__dirname, '../public');
  writeFileSync(resolve(publicDir, 'robots.txt'), robotsTxt);
  console.log('✅ Generated robots.txt (with AI crawler config)');
}

// Main execution
generateSitemap();
generateRobotsTxt();
