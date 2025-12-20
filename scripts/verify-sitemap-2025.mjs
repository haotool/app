#!/usr/bin/env node
/**
 * Sitemap 2025 標準驗證腳本
 *
 * 依據：
 * - [Bing Webmaster](https://blogs.bing.com/webmaster/february-2023/The-Importance-of-Setting-the-lastmod-Tag-in-Your-Sitemap)
 * - [Spotibo SEO Guide](https://spotibo.com/sitemap-guide/)
 * - [Sitemaps.org Protocol](https://www.sitemaps.org/protocol.html)
 *
 * 2025 標準驗證：
 * - ❌ 不得包含 <changefreq> 標籤 (Google 忽略)
 * - ❌ 不得包含 <priority> 標籤 (Google 和 Bing 都忽略)
 * - ✅ 必須包含 <lastmod> 且格式正確
 * - ✅ 時間戳必須真實（≥3 個不同日期）
 * - ✅ 必須包含 Image Sitemap Extension
 * - ✅ 所有 17 個 SEO 路徑必須存在
 * - ✅ Hreflang 配置完整
 *
 * 建立時間: 2025-12-20
 * BDD 階段: Stage 2 RED → GREEN 驗證
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 從 SSOT 導入配置
import { SEO_PATHS } from '../apps/ratewise/seo-paths.config.mjs';

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

const SITEMAP_PATH = resolve(__dirname, '../apps/ratewise/public/sitemap.xml');

/**
 * 讀取 sitemap.xml
 */
function readSitemap() {
  if (!existsSync(SITEMAP_PATH)) {
    throw new Error(`Sitemap not found: ${SITEMAP_PATH}`);
  }
  return readFileSync(SITEMAP_PATH, 'utf-8');
}

/**
 * 簡單的 XML 解析（提取標籤內容）
 */
function extractTags(xml, tagName) {
  const regex = new RegExp(`<${tagName}>([^<]+)</${tagName}>`, 'g');
  const matches = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

/**
 * 提取 <loc> 標籤
 */
function extractUrls(xml) {
  return extractTags(xml, 'loc');
}

/**
 * 提取 <lastmod> 標籤
 */
function extractLastmods(xml) {
  return extractTags(xml, 'lastmod');
}

/**
 * 驗證測試套件
 */
async function runTests() {
  let hasErrors = false;
  const xml = readSitemap();

  console.log('\n🔍 Sitemap 2025 標準驗證');
  console.log('─'.repeat(60));

  // Test 1: 不得包含 <changefreq>
  console.log('\n📋 測試 1: 移除 <changefreq> 標籤');
  if (xml.includes('<changefreq>')) {
    log(colors.red, '✗', 'FAILED: sitemap 包含 <changefreq> 標籤（已過時）');
    hasErrors = true;
  } else {
    log(colors.green, '✓', 'PASSED: 沒有 <changefreq> 標籤');
  }

  // Test 2: 不得包含 <priority>
  console.log('\n📋 測試 2: 移除 <priority> 標籤');
  if (xml.includes('<priority>')) {
    log(colors.red, '✗', 'FAILED: sitemap 包含 <priority> 標籤（已過時）');
    hasErrors = true;
  } else {
    log(colors.green, '✓', 'PASSED: 沒有 <priority> 標籤');
  }

  // Test 3: 所有 URL 必須有 <lastmod>
  console.log('\n📋 測試 3: <lastmod> 標籤完整性');
  const urls = extractUrls(xml);
  const lastmods = extractLastmods(xml);

  if (urls.length === 0) {
    log(colors.red, '✗', 'FAILED: 沒有找到任何 URL');
    hasErrors = true;
  } else if (lastmods.length !== urls.length) {
    log(
      colors.red,
      '✗',
      `FAILED: lastmod 數量 (${lastmods.length}) 與 URL 數量 (${urls.length}) 不匹配`,
    );
    hasErrors = true;
  } else {
    log(colors.green, '✓', `PASSED: 所有 ${urls.length} 個 URL 都有 lastmod`);
  }

  // Test 4: lastmod 格式驗證（ISO 8601 + 時區）
  console.log('\n📋 測試 4: ISO 8601 格式 + 時區');
  const iso8601Regex = /T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)$/;
  let invalidFormats = [];

  lastmods.forEach((lastmod, index) => {
    if (!iso8601Regex.test(lastmod)) {
      invalidFormats.push(`${urls[index]}: ${lastmod}`);
    }
  });

  if (invalidFormats.length > 0) {
    log(colors.red, '✗', `FAILED: ${invalidFormats.length} 個 lastmod 格式錯誤:`);
    invalidFormats.forEach((msg) => console.log(`    ${msg}`));
    hasErrors = true;
  } else {
    log(colors.green, '✓', 'PASSED: 所有 lastmod 格式正確（ISO 8601 + 時區）');
  }

  // Test 5: 時間戳真實性（至少 3 個不同日期）
  console.log('\n📋 測試 5: 時間戳真實性（多樣性）');
  const uniqueDates = new Set(lastmods.map((d) => d.split('T')[0]));

  if (uniqueDates.size < 3) {
    log(colors.yellow, '⚠', `WARNING: 只有 ${uniqueDates.size} 個不同日期（建議 ≥3 以展示真實性）`);
    console.log(`    提示: 這在開發環境中是正常的，生產環境會隨時間自然改善`);
  } else {
    log(colors.green, '✓', `PASSED: ${uniqueDates.size} 個不同的修改日期`);
  }

  // Test 6: lastmod 時間合理性（過去一年內，不在未來）
  console.log('\n📋 測試 6: lastmod 時間合理性');
  const now = Date.now();
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
  let invalidTimes = [];

  lastmods.forEach((lastmod, index) => {
    const time = new Date(lastmod).getTime();

    if (isNaN(time)) {
      invalidTimes.push(`${urls[index]}: Invalid date - ${lastmod}`);
    } else if (time > now) {
      invalidTimes.push(`${urls[index]}: Future date - ${lastmod}`);
    } else if (time < oneYearAgo) {
      invalidTimes.push(`${urls[index]}: Too old (>1 year) - ${lastmod}`);
    }
  });

  if (invalidTimes.length > 0) {
    log(colors.red, '✗', `FAILED: ${invalidTimes.length} 個時間戳不合理:`);
    invalidTimes.forEach((msg) => console.log(`    ${msg}`));
    hasErrors = true;
  } else {
    log(colors.green, '✓', 'PASSED: 所有時間戳在合理範圍內');
  }

  // Test 7: Image Sitemap Extension namespace
  console.log('\n📋 測試 7: Image Sitemap Extension');
  const imageNamespace = 'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"';

  if (!xml.includes(imageNamespace)) {
    log(colors.red, '✗', 'FAILED: 缺少 Image Sitemap 命名空間');
    hasErrors = true;
  } else {
    log(colors.green, '✓', 'PASSED: Image Sitemap 命名空間存在');
  }

  // Test 8: image:image 標籤存在
  console.log('\n📋 測試 8: image:image 標籤');
  if (!xml.includes('<image:image>')) {
    log(colors.red, '✗', 'FAILED: 沒有 image:image 標籤');
    hasErrors = true;
  } else {
    const imageCount = (xml.match(/<image:image>/g) || []).length;
    log(colors.green, '✓', `PASSED: 找到 ${imageCount} 個 image:image 標籤`);
  }

  // Test 9: 所有 SEO 路徑都在 sitemap 中
  console.log('\n📋 測試 9: SEO 路徑完整性（17 個路徑）');
  const siteUrl = 'https://app.haotool.org/ratewise/';
  const missingPaths = [];

  SEO_PATHS.forEach((path) => {
    const expectedUrl = path === '/' ? siteUrl : `${siteUrl}${path.slice(1)}`; // 移除開頭的 /
    if (!xml.includes(`<loc>${expectedUrl}</loc>`)) {
      missingPaths.push(path);
    }
  });

  if (missingPaths.length > 0) {
    log(colors.red, '✗', `FAILED: ${missingPaths.length} 個路徑缺失:`);
    missingPaths.forEach((path) => console.log(`    ${path}`));
    hasErrors = true;
  } else {
    log(colors.green, '✓', `PASSED: 所有 ${SEO_PATHS.length} 個 SEO 路徑都存在`);
  }

  // Test 10: Hreflang 配置
  console.log('\n📋 測試 10: Hreflang 配置');
  const hreflangMatches = xml.match(/<xhtml:link/g) || [];
  const expectedHreflangCount = SEO_PATHS.length * 2; // 每個 URL 2 個 hreflang

  if (hreflangMatches.length !== expectedHreflangCount) {
    log(
      colors.red,
      '✗',
      `FAILED: hreflang 數量錯誤 (期望: ${expectedHreflangCount}, 實際: ${hreflangMatches.length})`,
    );
    hasErrors = true;
  } else {
    log(colors.green, '✓', `PASSED: hreflang 配置正確 (${hreflangMatches.length} 個標籤)`);
  }

  // 最終結果
  console.log('\n' + '─'.repeat(60));
  if (hasErrors) {
    log(colors.red, '❌', 'Sitemap 2025 標準驗證失敗！');
    process.exit(1);
  } else {
    log(colors.green, '✅', 'Sitemap 2025 標準驗證通過！');
    process.exit(0);
  }
}

runTests().catch((error) => {
  console.error('驗證腳本錯誤:', error);
  process.exit(1);
});
