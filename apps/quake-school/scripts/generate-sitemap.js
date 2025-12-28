#!/usr/bin/env node

/**
 * Sitemap Generator for 地震小學堂
 * [SEO:2025-12-29] 生成 sitemap.xml
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SITE_URL = 'https://app.haotool.org/quake-school';
const TODAY = new Date().toISOString().split('T')[0];

const routes = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/quiz/', priority: '0.8', changefreq: 'weekly' },
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

const outputPath = resolve(__dirname, '../public/sitemap.xml');
writeFileSync(outputPath, sitemap, 'utf-8');
console.log(`[Sitemap] Generated: ${outputPath}`);
