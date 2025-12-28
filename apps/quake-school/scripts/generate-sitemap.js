/**
 * Generate Sitemap Script
 * 建立時間: 2025-12-29T02:27:28+08:00
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SITE_URL = 'https://app.haotool.org/quake-school/';
const TODAY = new Date().toISOString().split('T')[0];

const pages = [
  { path: '', priority: '1.0', changefreq: 'weekly' },
  { path: 'about/', priority: '0.8', changefreq: 'monthly' },
  { path: 'faq/', priority: '0.8', changefreq: 'monthly' },
  { path: 'guide/', priority: '0.9', changefreq: 'monthly' },
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

const outputPath = resolve(__dirname, '../public/sitemap.xml');
writeFileSync(outputPath, sitemap, 'utf-8');

console.log(`✅ Sitemap generated: ${outputPath}`);
console.log(`   Pages: ${pages.length}`);
console.log(`   Date: ${TODAY}`);
