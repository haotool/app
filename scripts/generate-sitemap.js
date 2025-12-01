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
const SITE_URL = 'https://app.haotool.org/ratewise/'; // SSOT: 與 canonical/hreflang 尾斜線一致
const SITE_NAME = 'RateWise - 匯率好工具';

// 路由配置 (必須與 routes.tsx getIncludedRoutes 保持一致)
// @see apps/ratewise/src/routes.tsx
// @see scripts/verify-sitemap-ssg.mjs
// [SEO Update: 2025-12-02] 新增 13 個長尾幣別落地頁
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
  {
    path: '/guide',
    changefreq: 'monthly',
    priority: 0.7,
    lastmod: new Date().toISOString().split('T')[0],
  },
  // 長尾落地頁：幣別換算 (USD/JPY/EUR/GBP/CNY/KRW/HKD/AUD/CAD/SGD/THB/NZD/CHF)
  {
    path: '/usd-twd',
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/jpy-twd',
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/eur-twd',
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/gbp-twd',
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/cny-twd',
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/krw-twd',
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/hkd-twd',
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/aud-twd',
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/cad-twd',
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/sgd-twd',
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/thb-twd',
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/nzd-twd',
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/chf-twd',
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
];

// 語言配置（單一語言策略：僅 zh-TW + x-default）
const languages = ['zh-TW'];

/**
 * 生成單個 URL 項目
 */
function buildFullUrl(path) {
  const base = SITE_URL.replace(/\/+$/, '');
  const normalizedPath = path === '/' ? '/' : `${path.replace(/\/+$/, '')}/`;
  return `${base}${normalizedPath}`;
}

function generateUrlEntry(route) {
  const fullUrl = buildFullUrl(route.path);

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
