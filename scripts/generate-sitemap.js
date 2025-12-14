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

/**
 * 路由配置
 *
 * ⚠️ 此配置必須與以下文件保持同步：
 * - apps/ratewise/src/config/seo-paths.ts (集中式配置 - 主要來源)
 * - scripts/verify-production-seo.mjs (生產環境檢測)
 * - apps/ratewise/vite.config.ts (SSG 預渲染)
 *
 * [SEO Update: 2025-12-02] 新增 13 個長尾幣別落地頁
 * [refactor:2025-12-14] 統一路徑格式為帶尾斜線，與集中式配置同步
 *
 * 總計：17 個路徑（4 個核心頁面 + 13 個幣別頁面）
 */
const routes = [
  // 核心頁面 (4)
  {
    path: '/',
    changefreq: 'daily',
    priority: 1.0,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/faq/',
    changefreq: 'weekly',
    priority: 0.8,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/about/',
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/guide/',
    changefreq: 'monthly',
    priority: 0.7,
    lastmod: new Date().toISOString().split('T')[0],
  },

  // 幣別落地頁 (13) - 依字母順序排列
  {
    path: '/aud-twd/', // 澳幣
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/cad-twd/', // 加幣
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/chf-twd/', // 瑞士法郎
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/cny-twd/', // 人民幣
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/eur-twd/', // 歐元
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/gbp-twd/', // 英鎊
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/hkd-twd/', // 港幣
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/jpy-twd/', // 日圓
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/krw-twd/', // 韓元
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/nzd-twd/', // 紐幣
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/sgd-twd/', // 新加坡幣
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/thb-twd/', // 泰銖
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
  {
    path: '/usd-twd/', // 美金
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0],
  },
];

// 語言配置（單一語言策略：僅 zh-TW + x-default）
const languages = ['zh-TW'];

/**
 * 生成單個 URL 項目
 *
 * [refactor:2025-12-14] 路徑已統一使用尾斜線格式，無需額外處理
 */
function buildFullUrl(path) {
  const base = SITE_URL.replace(/\/+$/, '');
  // 路徑已經帶尾斜線，直接組合
  return `${base}${path}`;
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
