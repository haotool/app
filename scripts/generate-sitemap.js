/**
 * 動態生成 Sitemap.xml
 * 自動更新 lastmod 為當前日期
 *
 * 執行: node scripts/generate-sitemap.js
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 網站設定
const SITE_URL = 'https://app.haotool.org/ratewise';
const SITE_NAME = 'RateWise - 匯率好工具';

// 路由配置
const routes = [
  {
    path: '/',
    changefreq: 'daily',
    priority: 1.0,
    lastmod: new Date().toISOString().split('T')[0], // 今天 (YYYY-MM-DD)
  },
  {
    path: '/faq',
    changefreq: 'weekly',
    priority: 0.8,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/about',
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
];

// 語言配置
const languages = ['zh-TW', 'en'];

/**
 * 生成單個 URL 項目
 */
function generateUrlEntry(route) {
  const fullUrl = `${SITE_URL}${route.path}`;

  // hreflang 替代連結
  const alternates = languages
    .map((lang) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${fullUrl}" />`)
    .join('\n');

  // x-default
  const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${fullUrl}" />`;

  return `  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
${alternates}
${xDefault}
  </url>`;
}

/**
 * 生成完整的 sitemap.xml
 */
function generateSitemap() {
  const urlEntries = routes.map(generateUrlEntry).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries}
</urlset>
`;

  return sitemap;
}

/**
 * 主函式
 */
function main() {
  console.log('🗺️  Generating sitemap.xml');
  console.log('=====================================');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`🌐 Site URL: ${SITE_URL}`);
  console.log(`📄 Routes: ${routes.length}`);
  console.log('');

  const sitemap = generateSitemap();
  const outputPath = join(__dirname, '../apps/ratewise/public/sitemap.xml');

  writeFileSync(outputPath, sitemap, 'utf-8');

  console.log('✅ Sitemap generated successfully');
  console.log('=====================================');
  console.log(`📁 Output: ${outputPath}`);
  console.log(`📊 Total URLs: ${routes.length}`);
  console.log('');
  console.log('📋 Routes:');
  routes.forEach((route) => {
    console.log(
      `  ${route.path.padEnd(10)} - priority: ${route.priority}, changefreq: ${route.changefreq}`,
    );
  });
  console.log('');
  console.log('💡 Next steps:');
  console.log('  1. Commit the generated sitemap.xml');
  console.log('  2. Deploy to production');
  console.log('  3. Submit to Google Search Console');
}

// 執行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateSitemap, routes };
