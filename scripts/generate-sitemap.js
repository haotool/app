/**
 * 動態生成 Sitemap.xml
 * 自動更新 lastmod 為當前日期
 *
 * 執行: node scripts/generate-sitemap.js
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
// 從 SSOT 導入配置
import { SEO_PATHS, SITE_CONFIG } from '../apps/ratewise/seo-paths.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 從 SSOT 使用網站配置
const { url: SITE_URL, name: SITE_NAME } = SITE_CONFIG;

/**
 * 路由配置 - 從 SSOT 構建
 *
 * [refactor:2025-12-14] 從 seo-paths.config.mjs 導入路徑，確保 SSOT
 */
const today = new Date().toISOString().split('T')[0];

// 定義各路徑的 SEO 屬性
const pathMetadata = {
  '/': { changefreq: 'daily', priority: 1.0 },
  '/faq/': { changefreq: 'weekly', priority: 0.8 },
  '/about/': { changefreq: 'monthly', priority: 0.6 },
  '/guide/': { changefreq: 'monthly', priority: 0.7 },
  // 所有幣別頁面使用相同配置
  default: { changefreq: 'monthly', priority: 0.6 },
};

// 從 SSOT 構建路由配置
const routes = SEO_PATHS.map((path) => ({
  path,
  ...(pathMetadata[path] || pathMetadata.default),
  lastmod: today,
}));

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
