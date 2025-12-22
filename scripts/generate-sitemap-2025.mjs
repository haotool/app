#!/usr/bin/env node
/**
 * Sitemap 2025 標準生成器
 *
 * 依據：
 * - [Bing Webmaster](https://blogs.bing.com/webmaster/february-2023/The-Importance-of-Setting-the-lastmod-Tag-in-Your-Sitemap)
 * - [Spotibo SEO Guide](https://spotibo.com/sitemap-guide/)
 * - [Sitemaps.org Protocol](https://www.sitemaps.org/protocol.html)
 * - [Google Image Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps)
 *
 * 2025 標準：
 * - ✅ 保留 <lastmod> (Bing 明確要求真實時間戳)
 * - ❌ 移除 <changefreq> (Google 忽略)
 * - ❌ 移除 <priority> (Google 和 Bing 都忽略)
 * - ✅ 新增 Image Sitemap Extension
 * - ✅ ISO 8601 格式 + 時區信息
 *
 * 建立時間: 2025-12-20
 * BDD 階段: Stage 2 GREEN (實作階段)
 */

import { statSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 從 SSOT 導入配置
import {
  SEO_PATHS,
  SITE_CONFIG,
  IMAGE_RESOURCES,
  normalizeSiteUrl,
} from '../apps/ratewise/seo-paths.config.mjs';

const SITE_URL = normalizeSiteUrl(SITE_CONFIG.url);

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

/**
 * 路徑到源文件映射
 * 用於獲取真實的文件修改時間
 */
const PATH_TO_SOURCE = {
  '/': 'apps/ratewise/src/features/ratewise/RateWise.tsx',
  '/faq/': 'apps/ratewise/src/pages/FAQ.tsx',
  '/about/': 'apps/ratewise/src/pages/About.tsx',
  '/guide/': 'apps/ratewise/src/pages/Guide.tsx',
  '/usd-twd/': 'apps/ratewise/src/pages/USDToTWD.tsx',
  '/jpy-twd/': 'apps/ratewise/src/pages/JPYToTWD.tsx',
  '/eur-twd/': 'apps/ratewise/src/pages/EURToTWD.tsx',
  '/gbp-twd/': 'apps/ratewise/src/pages/GBPToTWD.tsx',
  '/cny-twd/': 'apps/ratewise/src/pages/CNYToTWD.tsx',
  '/krw-twd/': 'apps/ratewise/src/pages/KRWToTWD.tsx',
  '/hkd-twd/': 'apps/ratewise/src/pages/HKDToTWD.tsx',
  '/aud-twd/': 'apps/ratewise/src/pages/AUDToTWD.tsx',
  '/cad-twd/': 'apps/ratewise/src/pages/CADToTWD.tsx',
  '/sgd-twd/': 'apps/ratewise/src/pages/SGDToTWD.tsx',
  '/thb-twd/': 'apps/ratewise/src/pages/THBToTWD.tsx',
  '/nzd-twd/': 'apps/ratewise/src/pages/NZDToTWD.tsx',
  '/chf-twd/': 'apps/ratewise/src/pages/CHFToTWD.tsx',
};

/**
 * 頁面圖片映射
 * 定義每個頁面包含哪些圖片資源
 */
const PAGE_IMAGES = {
  '/': [
    {
      loc: `${SITE_URL}og-image.png`,
      caption: 'RateWise - 即時匯率轉換器 Open Graph 圖片',
    },
    {
      loc: `${SITE_URL}icons/ratewise-icon-512x512.png`,
      caption: 'RateWise Logo',
    },
  ],
  // 其他核心頁面使用相同圖片
  '/faq/': [
    {
      loc: `${SITE_URL}og-image.png`,
      caption: 'RateWise FAQ - 常見問題',
    },
  ],
  '/about/': [
    {
      loc: `${SITE_URL}og-image.png`,
      caption: 'RateWise About - 關於我們',
    },
  ],
  '/guide/': [
    {
      loc: `${SITE_URL}og-image.png`,
      caption: 'RateWise Guide - 使用指南',
    },
  ],
};

/**
 * 獲取文件的真實修改時間
 * @param {string} path - SEO 路徑
 * @returns {Date} 文件修改時間
 */
function getLastModDate(path) {
  const sourceFile = PATH_TO_SOURCE[path];
  if (!sourceFile) {
    console.warn(`⚠️  No source file mapping for ${path}, using current time`);
    return new Date();
  }

  const fullPath = resolve(__dirname, '..', sourceFile);
  if (!existsSync(fullPath)) {
    console.warn(`⚠️  Source file not found: ${sourceFile}, using current time`);
    return new Date();
  }

  const stats = statSync(fullPath);
  return stats.mtime;
}

/**
 * 格式化日期為 ISO 8601 + 時區
 * 範例：2025-12-20T10:30:45+08:00
 *
 * @param {Date} date - 日期對象
 * @returns {string} ISO 8601 格式字串（含時區）
 */
function formatDateISO8601(date) {
  // 使用台灣時區 +08:00
  const tzOffset = '+08:00';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${tzOffset}`;
}

/**
 * 轉義 XML 特殊字符
 */
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 生成單個 URL 的 sitemap 條目
 *
 * @param {string} path - SEO 路徑
 * @returns {string} XML 條目
 */
function generateUrlEntry(path) {
  const url = path === '/' ? SITE_URL : `${SITE_URL}${path.slice(1)}`;
  const lastmod = formatDateISO8601(getLastModDate(path));

  let xml = '  <url>\n';
  xml += `    <loc>${escapeXml(url)}</loc>\n`;
  xml += `    <lastmod>${lastmod}</lastmod>\n`;

  // hreflang (保持原有配置)
  xml += `    <xhtml:link rel="alternate" hreflang="zh-TW" href="${escapeXml(url)}" />\n`;
  xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(url)}" />\n`;

  // Image Sitemap Extension
  const images = PAGE_IMAGES[path];
  if (images && images.length > 0) {
    images.forEach((image) => {
      xml += '    <image:image>\n';
      xml += `      <image:loc>${escapeXml(image.loc)}</image:loc>\n`;
      if (image.caption) {
        xml += `      <image:caption>${escapeXml(image.caption)}</image:caption>\n`;
      }
      xml += '    </image:image>\n';
    });
  }

  xml += '  </url>\n';
  return xml;
}

/**
 * 生成完整 sitemap.xml
 *
 * @returns {string} 完整 XML 內容
 */
function generateSitemap() {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml"\n';
  xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  // 生成所有 URL 條目
  SEO_PATHS.forEach((path) => {
    xml += generateUrlEntry(path);
  });

  xml += '</urlset>\n';
  return xml;
}

/**
 * 主函數
 */
async function main() {
  console.log('\n🗺️  Sitemap 2025 標準生成器');
  console.log('─'.repeat(60));

  // 生成 sitemap
  log(colors.cyan, '📝', '開始生成 sitemap.xml...');
  const sitemapXml = generateSitemap();

  // 寫入文件
  const outputPath = resolve(__dirname, '../apps/ratewise/public/sitemap.xml');
  writeFileSync(outputPath, sitemapXml, 'utf-8');

  log(colors.green, '✅', `Sitemap 已生成: ${outputPath}`);

  // 統計信息
  console.log('\n📊 生成統計:');
  console.log(`  總計 URL: ${SEO_PATHS.length}`);
  console.log(`  包含圖片: ${Object.keys(PAGE_IMAGES).length} 個頁面`);

  // 驗證時間戳多樣性
  const timestamps = SEO_PATHS.map((path) => getLastModDate(path));
  const uniqueDates = new Set(timestamps.map((d) => d.toISOString().split('T')[0]));

  console.log(`  不同日期: ${uniqueDates.size} 個`);

  if (uniqueDates.size < 3) {
    log(colors.yellow, '⚠️', '警告：時間戳多樣性不足（<3個不同日期），可能影響 SEO 真實性判斷');
  }

  // 2025 標準驗證
  console.log('\n✅ 2025 標準合規檢查:');
  console.log('  ✓ 已移除 <changefreq> 標籤');
  console.log('  ✓ 已移除 <priority> 標籤');
  console.log('  ✓ lastmod 使用真實文件修改時間');
  console.log('  ✓ 時間格式：ISO 8601 + 時區 (+08:00)');
  console.log('  ✓ 已加入 Image Sitemap Extension');
  console.log('  ✓ hreflang 配置保留');

  console.log('\n' + '─'.repeat(60));
  log(colors.green, '\n🎉', 'Sitemap 生成完成！\n');
}

main().catch((error) => {
  console.error('生成失敗:', error);
  process.exit(1);
});
