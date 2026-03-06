/**
 * 產生 sitemap.xml 與 robots.txt
 *
 * 說明：
 * - 以 app.config.mjs 為 SSOT
 * - root robots 額外宣告 RateWise sitemap，確保 host-level discovery 完整
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEO_PATHS, SITE_CONFIG } from '../app.config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUILD_DATE = new Date().toISOString().split('T')[0];
const SITE_URL = SITE_CONFIG.url.replace(/\/$/, '');
const RATEWISE_SITEMAP_URL = `${SITE_URL}/ratewise/sitemap.xml`;

/**
 * 產生 sitemap.xml
 */
function generateSitemap() {
  const urls = SEO_PATHS.map(
    (path) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${BUILD_DATE}T00:00:00Z</lastmod>
    <xhtml:link rel="alternate" hreflang="zh-TW" href="${SITE_URL}${path}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${path}" />
  </url>`,
  );

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;

  const publicDir = resolve(__dirname, '../public');
  writeFileSync(resolve(publicDir, 'sitemap.xml'), sitemap);
  console.log('✅ Generated sitemap.xml');
}

/**
 * 產生 robots.txt
 */
function generateRobotsTxt() {
  const robotsTxt = `# haotool — Robots Exclusion Protocol
# ${SITE_URL}/
# 最後更新：${BUILD_DATE}

# Content-Signal 宣告已停用
# 原因：避免非標準 directive 影響 robots 驗證

User-agent: *
Allow: /
Disallow: /sw.js
Disallow: /service-worker.js
Disallow: /*.json

Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${RATEWISE_SITEMAP_URL}

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: GrokBot
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: YouBot
Allow: /

User-agent: DuckAssistBot
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: Bytespider
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /

User-agent: Slackbot
Allow: /
`;

  const publicDir = resolve(__dirname, '../public');
  writeFileSync(resolve(publicDir, 'robots.txt'), robotsTxt);
  console.log('✅ Generated robots.txt');
}

// Main execution
generateSitemap();
generateRobotsTxt();
