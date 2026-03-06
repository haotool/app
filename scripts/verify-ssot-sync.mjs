#!/usr/bin/env node
/**
 * SSOT 同步驗證腳本
 *
 * 功能：驗證 TypeScript SSOT 和 JavaScript SSOT 的路徑配置是否一致
 *
 * 用法：
 *   node scripts/verify-ssot-sync.mjs
 *
 * 建立時間: 2025-12-14
 * 依據: [P0 Priority] 防止 SSOT 不同步
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
 * 從文件內容中提取具名陣列的字串項目
 */
function extractNamedArray(content, arrayName, asSuffix = '') {
  const escapedSuffix = asSuffix ? asSuffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
  const pattern = new RegExp(`export const ${arrayName} = \\[([\\s\\S]*?)\\]${escapedSuffix};`);
  const match = content.match(pattern);
  if (!match) return [];

  const allMatches = [...match[1].matchAll(/['"]([^'"]+)['"]/g)];
  return allMatches.map((m) => m[1]);
}

/**
 * 從 TypeScript 文件中提取 SEO 路徑
 * 支援 inline 與 spread 語法
 */
function extractPathsFromTS(filePath) {
  const content = readFileSync(filePath, 'utf-8');

  const inlinePaths = extractNamedArray(content, 'SEO_PATHS', ' as const');
  if (inlinePaths.length > 0) return inlinePaths;

  const contentPaths = extractNamedArray(content, 'CONTENT_SEO_PATHS', ' as const');
  const legalPaths = extractNamedArray(content, 'LEGAL_SSG_PATHS', ' as const');
  const currencyPaths = extractNamedArray(content, 'CURRENCY_SEO_PATHS', ' as const');
  if (contentPaths.length > 0 || legalPaths.length > 0 || currencyPaths.length > 0) {
    return [...contentPaths, ...legalPaths, ...currencyPaths];
  }

  throw new Error('無法從 TypeScript 文件中提取 SEO_PATHS');
}

/**
 * 從 JavaScript (.mjs) 文件中提取 SEO 路徑
 * 優先使用 dynamic import；fallback 為 regex
 */
async function extractPathsFromMJS(filePath) {
  try {
    const mod = await import(pathToFileURL(filePath).href);
    if (mod.SEO_PATHS && Array.isArray(mod.SEO_PATHS) && mod.SEO_PATHS.length > 0) {
      return [...mod.SEO_PATHS];
    }
  } catch {
    // dynamic import 失敗時 fallback 到 regex
  }

  const content = readFileSync(filePath, 'utf-8');
  const inlinePaths = extractNamedArray(content, 'SEO_PATHS');
  if (inlinePaths.length > 0) return inlinePaths;

  const contentPaths = extractNamedArray(content, 'CONTENT_SEO_PATHS');
  const legalPaths = extractNamedArray(content, 'LEGAL_SSG_PATHS');
  const currencyPaths = extractNamedArray(content, 'CURRENCY_SEO_PATHS');
  if (contentPaths.length > 0 || legalPaths.length > 0 || currencyPaths.length > 0) {
    return [...contentPaths, ...legalPaths, ...currencyPaths];
  }

  throw new Error('無法從 .mjs 文件中提取 SEO_PATHS');
}

/**
 * 比較兩個路徑數組
 */
function comparePaths(tsPaths, mjsPaths) {
  const errors = [];

  // 檢查數量
  if (tsPaths.length !== mjsPaths.length) {
    errors.push(
      `路徑數量不一致: TypeScript (${tsPaths.length}) vs JavaScript (${mjsPaths.length})`,
    );
  }

  // 檢查順序和內容
  const maxLength = Math.max(tsPaths.length, mjsPaths.length);
  for (let i = 0; i < maxLength; i++) {
    const tsPath = tsPaths[i];
    const mjsPath = mjsPaths[i];

    if (tsPath !== mjsPath) {
      errors.push(`位置 ${i}: TypeScript "${tsPath}" ≠ JavaScript "${mjsPath}"`);
    }
  }

  // 檢查是否有缺少或多餘的路徑
  const tsSet = new Set(tsPaths);
  const mjsSet = new Set(mjsPaths);

  const onlyInTS = tsPaths.filter((p) => !mjsSet.has(p));
  const onlyInMJS = mjsPaths.filter((p) => !tsSet.has(p));

  if (onlyInTS.length > 0) {
    errors.push(`只存在於 TypeScript: ${onlyInTS.join(', ')}`);
  }

  if (onlyInMJS.length > 0) {
    errors.push(`只存在於 JavaScript: ${onlyInMJS.join(', ')}`);
  }

  return errors;
}

/**
 * 驗證 robots.txt 與 seo-paths.config.mjs 的 SSOT 一致性
 *
 * 檢查項目：
 * - DEV_ONLY_PATHS 每條路徑都有對應 Disallow
 * - APP_ONLY_NOINDEX_PATHS 路徑不應有 Disallow（由 SEOHelmet noindex 處理）
 * - Sitemap URL 與 SITE_CONFIG.url 一致
 */
async function verifyRobotsTxt(mjsPath, robotsTxtPath) {
  const errors = [];

  if (!existsSync(robotsTxtPath)) {
    return [
      `[robots.txt] 檔案不存在: ${robotsTxtPath}（請先執行 node scripts/generate-robots-txt.mjs）`,
    ];
  }

  let mod;
  try {
    mod = await import(pathToFileURL(mjsPath).href);
  } catch (e) {
    return [`[robots.txt] 無法載入 seo-paths.config.mjs: ${e.message}`];
  }

  const devOnlyPaths = mod.DEV_ONLY_PATHS;
  const noindexPaths = mod.APP_ONLY_NOINDEX_PATHS;
  const siteUrl = mod.SITE_CONFIG?.url;

  if (!Array.isArray(devOnlyPaths) || !Array.isArray(noindexPaths) || !siteUrl) {
    return [
      '[robots.txt] seo-paths.config.mjs 缺少 DEV_ONLY_PATHS / APP_ONLY_NOINDEX_PATHS / SITE_CONFIG',
    ];
  }

  const robotsTxt = readFileSync(robotsTxtPath, 'utf-8');
  const expectedSitemap = `Sitemap: ${siteUrl}sitemap.xml`;

  // DEV_ONLY_PATHS 必須有 Disallow（含尾斜線）
  for (const path of devOnlyPaths) {
    const disallowEntry = `Disallow: ${path.endsWith('/') ? path : `${path}/`}`;
    if (!robotsTxt.includes(disallowEntry)) {
      errors.push(`[robots.txt] DEV_ONLY_PATHS "${path}" 缺少 "${disallowEntry}"`);
    }
  }

  // APP_ONLY_NOINDEX_PATHS 不應有 Disallow（Google 需爬取才能讀 noindex）
  for (const path of noindexPaths) {
    const bare = path.replace(/\/$/, '');
    if (robotsTxt.includes(`Disallow: ${path}`) || robotsTxt.includes(`Disallow: ${bare}`)) {
      errors.push(
        `[robots.txt] noindex 頁面 "${path}" 有 Disallow（應移除，改由 SEOHelmet noindex 處理）`,
      );
    }
  }

  // Sitemap URL 須與 SITE_CONFIG.url 一致
  if (!robotsTxt.includes(expectedSitemap)) {
    errors.push(`[robots.txt] Sitemap URL 不符，預期: "${expectedSitemap}"`);
  }

  if (errors.length === 0) {
    log(
      colors.green,
      '✓',
      `robots.txt SSOT 同步（DEV Disallow: ${devOnlyPaths.length} 條，noindex 頁面: ${noindexPaths.length} 條未 Disallow）`,
    );
  }

  return errors;
}

/**
 * 驗證單一路徑群組的 TS/MJS 一致性
 */
function verifyGroup(groupName, tsContent, mjsContent, asSuffix) {
  const tsPaths = extractNamedArray(tsContent, groupName, asSuffix);
  const mjsPaths = extractNamedArray(mjsContent, groupName);
  if (tsPaths.length === 0 && mjsPaths.length === 0) return [];
  const errors = comparePaths(tsPaths, mjsPaths).map((e) => `[${groupName}] ${e}`);
  if (errors.length === 0) {
    log(colors.green, '✓', `${groupName}: ${tsPaths.length} 路徑一致`);
  }
  return errors;
}

async function main() {
  console.log('\n🔍 SSOT 同步驗證');
  console.log('─'.repeat(50));

  const tsPath = join(__dirname, '../apps/ratewise/src/config/seo-paths.ts');
  const mjsPath = join(__dirname, '../apps/ratewise/seo-paths.config.mjs');

  let hasErrors = false;

  try {
    console.log('\n📂 讀取配置文件:');
    log(colors.cyan, '→', 'TypeScript: src/config/seo-paths.ts');
    const tsPaths = extractPathsFromTS(tsPath);
    log(colors.green, '✓', `提取 ${tsPaths.length} 個 SEO 路徑`);

    log(colors.cyan, '→', 'JavaScript: seo-paths.config.mjs');
    const mjsPaths = await extractPathsFromMJS(mjsPath);
    log(colors.green, '✓', `提取 ${mjsPaths.length} 個 SEO 路徑`);

    console.log('\n🔄 比較 SEO_PATHS:');
    const seoErrors = comparePaths(tsPaths, mjsPaths);

    if (seoErrors.length === 0) {
      log(colors.green, '✅', 'SEO_PATHS 完全同步！');
      console.log(`   TypeScript: ${tsPaths.length} | JavaScript: ${mjsPaths.length}`);
    } else {
      log(colors.red, '❌', 'SEO_PATHS 不同步:');
      seoErrors.forEach((e) => log(colors.red, '  ✗', e));
      hasErrors = true;
    }

    console.log('\n🔄 比較其他路徑群組:');
    const tsContent = readFileSync(tsPath, 'utf-8');
    const mjsContent = readFileSync(mjsPath, 'utf-8');

    const groups = [
      'CONTENT_SEO_PATHS',
      'CURRENCY_SEO_PATHS',
      'APP_ONLY_PATHS',
      'LEGAL_SSG_PATHS',
      'SEO_FILES',
    ];
    for (const group of groups) {
      const groupErrors = verifyGroup(group, tsContent, mjsContent, ' as const');
      if (groupErrors.length > 0) {
        groupErrors.forEach((e) => log(colors.red, '  ✗', e));
        hasErrors = true;
      }
    }

    console.log('\n🤖 robots.txt SSOT 驗證:');
    const robotsTxtPath = join(__dirname, '../apps/ratewise/public/robots.txt');
    const robotsErrors = await verifyRobotsTxt(mjsPath, robotsTxtPath);
    if (robotsErrors.length > 0) {
      robotsErrors.forEach((e) => log(colors.red, '  ✗', e));
      hasErrors = true;
    }

    if (hasErrors) {
      console.log('\n📋 詳細路徑列表:');
      console.log('\nTypeScript SEO_PATHS:');
      tsPaths.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
      console.log('\nJavaScript SEO_PATHS:');
      mjsPaths.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
    }
  } catch (error) {
    log(colors.red, '❌', `驗證失敗: ${error.message}`);
    hasErrors = true;
  }

  console.log('\n' + '─'.repeat(50));

  if (hasErrors) {
    console.log('\n💡 修復建議:');
    console.log('  1. 檢查 src/config/seo-paths.ts 和 seo-paths.config.mjs');
    console.log('  2. 確保所有路徑群組完全一致（SEO_PATHS, APP_ONLY_PATHS, SEO_FILES 等）');
    console.log('  3. 路徑必須按照相同順序排列');
    console.log('  4. 路徑格式必須一致（包括尾斜線）');
    console.log(
      '  5. robots.txt 漂移：執行 node apps/ratewise/scripts/generate-robots-txt.mjs 重新生成\n',
    );
    process.exit(1);
  } else {
    console.log('');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('驗證腳本錯誤:', error);
  process.exit(1);
});
