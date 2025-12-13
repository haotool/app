/**
 * Generate sitemap.xml and robots.txt for SEO
 * [context7:/google/seo-starter-guide:2025-12-13]
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
 * Generate sitemap.xml
 */
function generateSitemap() {
  const urls = ROUTES.map(
    (route) => `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
  );

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  const publicDir = resolve(__dirname, '../public');
  writeFileSync(resolve(publicDir, 'sitemap.xml'), sitemap);
  console.log('✅ Generated sitemap.xml');
}

/**
 * Generate robots.txt
 */
function generateRobotsTxt() {
  const robotsTxt = `# robots.txt for HAOTOOL.ORG
# [context7:/google/robots-txt:2025-12-13]

User-agent: *
Allow: /

# Sitemap location
Sitemap: ${SITE_URL}/sitemap.xml

# Crawl-delay (optional, for polite crawling)
Crawl-delay: 1

# Disallow common non-content paths
Disallow: /api/
Disallow: /_next/
Disallow: /assets/
`;

  const publicDir = resolve(__dirname, '../public');
  writeFileSync(resolve(publicDir, 'robots.txt'), robotsTxt);
  console.log('✅ Generated robots.txt');
}

// Main execution
generateSitemap();
generateRobotsTxt();
