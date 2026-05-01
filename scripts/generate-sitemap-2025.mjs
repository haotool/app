#!/usr/bin/env node
/**
 * Sitemap 2026 標準生成器
 *
 * 依據：
 * - [Bing Webmaster](https://blogs.bing.com/webmaster/february-2023/The-Importance-of-Setting-the-lastmod-Tag-in-Your-Sitemap)
 * - [Spotibo SEO Guide](https://spotibo.com/sitemap-guide/)
 * - [Sitemaps.org Protocol](https://www.sitemaps.org/protocol.html)
 * - [Google Image Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps)
 *
 * 2026 標準：
 * - ✅ 保留 <lastmod>（使用頁面最後重大更新日期）
 * - ❌ 移除 <changefreq> (Google 忽略)
 * - ❌ 移除 <priority> (Google 和 Bing 都忽略)
 * - ✅ 新增 Image Sitemap Extension
 * - ✅ W3C Datetime 日期格式（YYYY-MM-DD）
 *
 * 建立時間: 2026-05-02
 * BDD 階段: Stage 2 GREEN (實作階段)
 */

import { statSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 從 SSOT 導入配置
import {
  SEO_PATHS,
  CURRENCY_SEO_PATHS,
  REVERSE_CURRENCY_SEO_PATHS,
  SITE_CONFIG,
  SHARE_IMAGE,
  IMAGE_RESOURCES,
  normalizeSiteUrl,
} from '../apps/ratewise/seo-paths.config.mjs';
import { SEO_STANDARD_LABEL } from './lib/seo-year-metadata.mjs';
import { APP_INFO } from '../apps/ratewise/src/config/app-info.ts';
import {
  CONTENT_LASTMOD_POLICY,
  RATE_PAGE_LASTMOD_POLICY,
} from '../apps/ratewise/src/config/seo-lastmod-policy.ts';

const SITE_URL = normalizeSiteUrl(SITE_CONFIG.url);
const PUBLIC_SITEMAP_PATHS = [...new Set(SEO_PATHS)];

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

const REPO_ROOT = resolve(__dirname, '..');
const ENFORCE_LASTMOD_DIVERSITY =
  process.env.CI === 'true' || process.env.SITEMAP_ENFORCE_LASTMOD_DIVERSITY === '1';
const IS_SHALLOW_REPOSITORY = (() => {
  const result = spawnSync('git', ['rev-parse', '--is-shallow-repository'], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
  });
  return result.status === 0 && result.stdout.trim() === 'true';
})();
let cachedRatePageFallbackDate = undefined;

/**
 * 每個公開 URL 對應一組「重大內容依賴」。
 * `lastmod` 優先取這組依賴檔最近一次 git commit 日期，避免 CI checkout 後 mtime 失真，
 * 並避免同日 commit time 讓追蹤中的 sitemap 產物在 commit 後再次漂移。
 */
const PATH_DEPENDENCIES = {
  '/': [
    'apps/ratewise/src/features/ratewise/RateWise.tsx',
    'apps/ratewise/src/config/seo-metadata.ts',
  ],
  '/faq/': ['apps/ratewise/src/pages/FAQ.tsx'],
  '/about/': ['apps/ratewise/src/pages/About.tsx', 'apps/ratewise/src/config/seo-metadata.ts'],
  '/guide/': ['apps/ratewise/src/pages/Guide.tsx'],
  '/sell-rate-vs-mid-rate/': ['apps/ratewise/src/pages/SellRateVsMidRate.tsx'],
  '/cash-vs-spot-rate/': ['apps/ratewise/src/pages/CashVsSpotRate.tsx'],
  '/card-rate-guide/': ['apps/ratewise/src/pages/CardRateGuide.tsx'],
  '/open-data/': [
    'apps/ratewise/src/pages/OpenData.tsx',
    'apps/ratewise/src/config/api-endpoints.ts',
    'apps/ratewise/src/config/seo-metadata.ts',
  ],
  '/privacy/': ['apps/ratewise/src/pages/Privacy.tsx'],
  '/usd-twd/': [
    'apps/ratewise/src/pages/USDToTWD.tsx',
    'apps/ratewise/src/config/generated/seo-rate-examples.ts',
  ],
  '/jpy-twd/': [
    'apps/ratewise/src/pages/JPYToTWD.tsx',
    'apps/ratewise/src/config/generated/seo-rate-examples.ts',
  ],
  '/eur-twd/': [
    'apps/ratewise/src/pages/EURToTWD.tsx',
    'apps/ratewise/src/config/generated/seo-rate-examples.ts',
  ],
  '/gbp-twd/': [
    'apps/ratewise/src/pages/GBPToTWD.tsx',
    'apps/ratewise/src/config/generated/seo-rate-examples.ts',
  ],
  '/cny-twd/': [
    'apps/ratewise/src/pages/CNYToTWD.tsx',
    'apps/ratewise/src/config/generated/seo-rate-examples.ts',
  ],
  '/krw-twd/': [
    'apps/ratewise/src/pages/KRWToTWD.tsx',
    'apps/ratewise/src/config/generated/seo-rate-examples.ts',
  ],
  '/hkd-twd/': [
    'apps/ratewise/src/pages/HKDToTWD.tsx',
    'apps/ratewise/src/config/generated/seo-rate-examples.ts',
  ],
  '/aud-twd/': [
    'apps/ratewise/src/pages/AUDToTWD.tsx',
    'apps/ratewise/src/config/generated/seo-rate-examples.ts',
  ],
  '/cad-twd/': [
    'apps/ratewise/src/pages/CADToTWD.tsx',
    'apps/ratewise/src/config/generated/seo-rate-examples.ts',
  ],
  '/sgd-twd/': [
    'apps/ratewise/src/pages/SGDToTWD.tsx',
    'apps/ratewise/src/config/generated/seo-rate-examples.ts',
  ],
  '/thb-twd/': [
    'apps/ratewise/src/pages/THBToTWD.tsx',
    'apps/ratewise/src/config/generated/seo-rate-examples.ts',
  ],
  '/nzd-twd/': [
    'apps/ratewise/src/pages/NZDToTWD.tsx',
    'apps/ratewise/src/config/generated/seo-rate-examples.ts',
  ],
  '/chf-twd/': [
    'apps/ratewise/src/pages/CHFToTWD.tsx',
    'apps/ratewise/src/config/generated/seo-rate-examples.ts',
  ],
  '/vnd-twd/': [
    'apps/ratewise/src/pages/VNDToTWD.tsx',
    'apps/ratewise/src/config/generated/seo-rate-examples.ts',
  ],
  '/php-twd/': [
    'apps/ratewise/src/pages/PHPToTWD.tsx',
    'apps/ratewise/src/config/generated/seo-rate-examples.ts',
  ],
  '/idr-twd/': [
    'apps/ratewise/src/pages/IDRToTWD.tsx',
    'apps/ratewise/src/config/generated/seo-rate-examples.ts',
  ],
  '/myr-twd/': [
    'apps/ratewise/src/pages/MYRToTWD.tsx',
    'apps/ratewise/src/config/generated/seo-rate-examples.ts',
  ],
};

/**
 * 頁面圖片映射
 * 定義每個頁面包含哪些圖片資源
 */
const OG_IMAGE_URL = `${SITE_URL}${SHARE_IMAGE.replace(/^\//, '')}`;

const BRAND_SHORT = APP_INFO.shortName;
const BRAND_FULL = APP_INFO.name;

const PAGE_IMAGES = {
  '/': [
    {
      loc: OG_IMAGE_URL,
      caption: `${BRAND_SHORT} - 即時匯率轉換器 Open Graph 圖片`,
    },
    {
      loc: `${SITE_URL}icons/ratewise-icon-512x512.png`,
      caption: `${BRAND_SHORT} Logo`,
    },
  ],
  '/faq/': [
    {
      loc: OG_IMAGE_URL,
      caption: `${BRAND_SHORT} FAQ - 常見問題`,
    },
  ],
  '/about/': [
    {
      loc: OG_IMAGE_URL,
      caption: `${BRAND_SHORT} About - 關於我們`,
    },
  ],
  '/guide/': [
    {
      loc: OG_IMAGE_URL,
      caption: `${BRAND_SHORT} Guide - 使用指南`,
    },
  ],
  '/sell-rate-vs-mid-rate/': [
    {
      loc: OG_IMAGE_URL,
      caption: `${BRAND_SHORT} Guide - 賣出價與中間價差異`,
    },
  ],
  '/cash-vs-spot-rate/': [
    {
      loc: OG_IMAGE_URL,
      caption: `${BRAND_SHORT} Guide - 現金與即期匯率差異`,
    },
  ],
  '/card-rate-guide/': [
    {
      loc: OG_IMAGE_URL,
      caption: `${BRAND_SHORT} Guide - 刷卡匯率與 DCC`,
    },
  ],
  '/open-data/': [
    {
      loc: OG_IMAGE_URL,
      caption: `${BRAND_SHORT} Open Data - 台銀匯率開放 API`,
    },
  ],
  '/privacy/': [
    {
      loc: OG_IMAGE_URL,
      caption: `${BRAND_SHORT} Privacy - 隱私政策`,
    },
  ],
};

// 動態補上 17 個幣別頁 image entries（共用 OG 圖，caption 帶幣別代碼）
CURRENCY_SEO_PATHS.forEach((path) => {
  const currency = path
    .replace(/^\//, '')
    .replace(/-twd\/$/, '')
    .toUpperCase();
  PAGE_IMAGES[path] = [
    {
      loc: OG_IMAGE_URL,
      caption: `${BRAND_FULL} - ${currency}/TWD 即時匯率換算`,
    },
  ];

  // 補上對應的 PATH_DEPENDENCIES（若尚未設定）
  if (!PATH_DEPENDENCIES[path]) {
    const pageFile = `apps/ratewise/src/pages/${currency}ToTWD.tsx`;
    PATH_DEPENDENCIES[path] = [pageFile, 'apps/ratewise/src/config/generated/seo-rate-examples.ts'];
  }
});

// 動態補上 17 個反向幣別頁 image entries 與 PATH_DEPENDENCIES
REVERSE_CURRENCY_SEO_PATHS.forEach((path) => {
  const currency = path.replace(/^\//, '').replace(/^twd-/, '').replace(/\/$/, '').toUpperCase();
  PAGE_IMAGES[path] = [
    {
      loc: OG_IMAGE_URL,
      caption: `${BRAND_FULL} - TWD/${currency} 出國換匯換算`,
    },
  ];
  if (!PATH_DEPENDENCIES[path]) {
    PATH_DEPENDENCIES[path] = [
      `apps/ratewise/src/pages/TWDTo${currency}.tsx`,
      'apps/ratewise/src/config/generated/seo-rate-examples.ts',
    ];
  }
});

/**
 * 優先用 git commit 日期代表重大內容更新日期，失敗時回退到檔案 mtime。
 * 金額落地頁（/usd-twd/500/）繼承父幣別頁（/usd-twd/）的依賴設定。
 * @param {string} path - SEO 路徑
 * @returns {Date} 文件修改時間
 */
function getLastModDate(path) {
  if (IS_SHALLOW_REPOSITORY && hasStableFallbackLastMod(path)) {
    return getFallbackLastModDate(path);
  }

  const dependencyFiles = getDependencyFilesForPath(path);
  if (!dependencyFiles?.length) {
    console.warn(`⚠️  No dependency mapping for ${path}, using fallback time`);
    return getFallbackLastModDate(path);
  }

  const existingFiles = dependencyFiles.filter((file) => existsSync(resolve(REPO_ROOT, file)));
  if (existingFiles.length === 0) {
    console.warn(`⚠️  Dependency files not found for ${path}, using fallback time`);
    return getFallbackLastModDate(path);
  }

  const lookupPath = resolveLookupPath(path);
  const contentPolicy = CONTENT_LASTMOD_POLICY[lookupPath];
  const lastmodFiles = contentPolicy?.lastmodFiles?.filter((file) =>
    existsSync(resolve(REPO_ROOT, file)),
  );
  const gitDate = getGitCommitDate(
    lastmodFiles && lastmodFiles.length > 0 ? lastmodFiles : existingFiles,
  );
  if (gitDate) return gitDate;

  const semanticFallbackDate = getFallbackLastModDate(path);
  if (semanticFallbackDate) return semanticFallbackDate;

  const mtimes = existingFiles.map((file) => statSync(resolve(REPO_ROOT, file)).mtime.getTime());
  return new Date(Math.max(...mtimes));
}

function getGitCommitDate(files) {
  const normalizedFiles = files.filter(Boolean);
  if (normalizedFiles.length === 0) return null;

  const gitResult = spawnSync('git', ['log', '-1', '--format=%cI', '--', ...normalizedFiles], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
  });
  const gitTimestamp = gitResult.status === 0 ? gitResult.stdout.trim() : '';
  if (!gitTimestamp) return null;

  const gitDate = new Date(gitTimestamp);
  return Number.isNaN(gitDate.getTime()) ? null : gitDate;
}

function parseDateInTaipei(dateText) {
  if (!dateText) return null;
  const normalized = dateText.replace(/\//g, '-');
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
}

function getRatePageFallbackDate() {
  if (cachedRatePageFallbackDate !== undefined) {
    return cachedRatePageFallbackDate;
  }

  const rateSourcePath = resolve(REPO_ROOT, RATE_PAGE_LASTMOD_POLICY.source);
  if (!existsSync(rateSourcePath)) {
    cachedRatePageFallbackDate = null;
    return cachedRatePageFallbackDate;
  }

  const sourceContent = readFileSync(rateSourcePath, 'utf-8');
  const rateTimestampMatch = sourceContent.match(/匯率時間：(\d{4}\/\d{2}\/\d{2})/);
  const generatedDateMatch = sourceContent.match(/生成日期：(\d{4}-\d{2}-\d{2})/);

  cachedRatePageFallbackDate =
    parseDateInTaipei(rateTimestampMatch?.[1] ?? '') ??
    parseDateInTaipei(generatedDateMatch?.[1] ?? '') ??
    null;

  return cachedRatePageFallbackDate;
}

function resolveLookupPath(path) {
  const parent =
    CURRENCY_SEO_PATHS.find((candidate) => path.startsWith(candidate) && path !== candidate) ??
    REVERSE_CURRENCY_SEO_PATHS.find(
      (candidate) => path.startsWith(candidate) && path !== candidate,
    );

  return parent ?? path;
}

function isRateContentPath(path) {
  const lookupPath = resolveLookupPath(path);
  return CURRENCY_SEO_PATHS.includes(lookupPath) || REVERSE_CURRENCY_SEO_PATHS.includes(lookupPath);
}

function getDependencyFilesForPath(path) {
  const lookupPath = resolveLookupPath(path);
  const contentPolicy = CONTENT_LASTMOD_POLICY[lookupPath];
  if (contentPolicy) {
    return [...contentPolicy.contentFiles];
  }

  const dependencyFiles = PATH_DEPENDENCIES[lookupPath] ?? [];
  if (isRateContentPath(path)) {
    return [...new Set([...dependencyFiles, RATE_PAGE_LASTMOD_POLICY.source])];
  }

  return dependencyFiles;
}

function getFallbackLastModDate(path) {
  const lookupPath = resolveLookupPath(path);
  const policyFallback = CONTENT_LASTMOD_POLICY[lookupPath]?.fallbackDate;
  if (policyFallback) return new Date(`${policyFallback}T00:00:00.000Z`);
  if (isRateContentPath(path)) {
    return getRatePageFallbackDate();
  }
  return null;
}

function hasStableFallbackLastMod(path) {
  const lookupPath = resolveLookupPath(path);
  if (CONTENT_LASTMOD_POLICY[lookupPath]?.fallbackDate) {
    return true;
  }
  return isRateContentPath(path) && Boolean(getRatePageFallbackDate());
}

/**
 * 格式化日期為 W3C Datetime 的日期格式。
 * 範例：2026-12-20
 *
 * @param {Date} date - 日期對象
 * @returns {string} YYYY-MM-DD
 */
function formatDateISO8601(date) {
  return date.toISOString().slice(0, 10);
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
  PUBLIC_SITEMAP_PATHS.forEach((path) => {
    xml += generateUrlEntry(path);
  });

  xml += '</urlset>\n';
  return xml;
}

/**
 * 主函數
 */
export async function main() {
  console.log(`\n🗺️  ${SEO_STANDARD_LABEL} 生成器`);
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
  console.log(`  總計 URL: ${PUBLIC_SITEMAP_PATHS.length}`);
  console.log(`  包含圖片: ${Object.keys(PAGE_IMAGES).length} 個頁面`);

  // 驗證時間戳多樣性
  const timestamps = PUBLIC_SITEMAP_PATHS.map((path) => getLastModDate(path));
  const uniqueDates = new Set(timestamps.map((d) => d.toISOString().split('T')[0]));

  console.log(`  不同日期: ${uniqueDates.size} 個`);

  if (uniqueDates.size < 3) {
    const message = '時間戳多樣性不足（<3個不同日期），可能影響 SEO 真實性判斷';
    if (ENFORCE_LASTMOD_DIVERSITY) {
      throw new Error(message);
    }
    log(colors.yellow, '⚠️', `警告：${message}`);
  }

  // 2026 標準驗證
  console.log(`\n✅ ${SEO_STANDARD_LABEL} 合規檢查:`);
  console.log('  ✓ 已移除 <changefreq> 標籤');
  console.log('  ✓ 已移除 <priority> 標籤');
  console.log('  ✓ lastmod 優先使用重大依賴檔的 git commit 日期');
  console.log('  ✓ 時間格式：W3C Datetime 日期（YYYY-MM-DD）');
  console.log('  ✓ 已加入 Image Sitemap Extension');
  console.log('  ✓ hreflang 配置保留');

  console.log('\n' + '─'.repeat(60));
  log(colors.green, '\n🎉', 'Sitemap 生成完成！\n');
}

const isDirectExecution = process.argv[1] ? resolve(process.argv[1]) === __filename : false;

if (isDirectExecution) {
  main().catch((error) => {
    console.error('生成失敗:', error);
    process.exit(1);
  });
}

export {
  formatDateISO8601,
  generateSitemap,
  getDependencyFilesForPath,
  getFallbackLastModDate,
  getLastModDate,
  hasStableFallbackLastMod,
  isRateContentPath,
  resolveLookupPath,
};
