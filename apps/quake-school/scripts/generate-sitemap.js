/**
 * 生成 sitemap.xml
 * [2025 SEO 最佳實踐]
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SITE_URL = 'https://app.haotool.org/quake-school/';
const PAGES = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/lessons/', priority: 0.9, changefreq: 'monthly' },
  { path: '/quiz/', priority: 0.8, changefreq: 'monthly' },
  { path: '/about/', priority: 0.6, changefreq: 'monthly' },
];

function generateSitemap() {
  const lastmod = new Date().toISOString().split('T')[0];

  const urls = PAGES.map(
    (page) => `
  <url>
    <loc>${new URL(page.path.replace(/^\//, ''), SITE_URL).toString()}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  ).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  const outputPath = resolve(__dirname, '../public/sitemap.xml');
  writeFileSync(outputPath, sitemap.trim());
  console.log('✅ sitemap.xml generated:', outputPath);
}

generateSitemap();
