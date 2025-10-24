#!/usr/bin/env node
/**
 * Sitemap Generator
 * Dynamically generates sitemap.xml with current timestamps
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SITE_URL = 'https://ratewise.app';
const currentDate = new Date().toISOString().split('T')[0];

const routes = [
  {
    path: '/',
    changefreq: 'daily',
    priority: 1.0,
    lastmod: currentDate,
  },
  {
    path: '/faq',
    changefreq: 'weekly',
    priority: 0.8,
    lastmod: currentDate,
  },
  {
    path: '/about',
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: currentDate,
  },
  {
    path: '/how-to-use',
    changefreq: 'monthly',
    priority: 0.7,
    lastmod: currentDate,
  },
];

const generateSitemap = () => {
  const urls = routes
    .map(
      ({ path, changefreq, priority, lastmod }) => `
  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="zh-TW" href="${SITE_URL}${path}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${path}" />
  </url>`,
    )
    .join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;

  const outputPath = resolve(__dirname, '../public/sitemap.xml');
  writeFileSync(outputPath, sitemap, 'utf-8');
  console.log(`✅ Sitemap generated: ${outputPath}`);
  console.log(`📅 Last modified: ${currentDate}`);
};

generateSitemap();
