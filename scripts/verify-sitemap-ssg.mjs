#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * Sitemap/SSG 一致性驗證腳本 - 通用版本
 *
 * 功能：
 * 1. 自動發現所有 apps
 * 2. 驗證 sitemap.xml 與 app.config.mjs 中的 SEO_PATHS 一致
 *
 * 建立時間: 2025-11-30T13:54:46+08:00
 * 更新時間: 2025-12-15 - 重構為通用版本，使用 SSOT app.config.mjs
 * 依據: [Linus: 消除特殊情況][SSOT 架構]
 *
 * 使用方式:
 *   node scripts/verify-sitemap-ssg.mjs
 *
 * CI 整合:
 *   pnpm verify:sitemap
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverApps } from './lib/workspace-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

/**
 * 從 sitemap.xml 提取 URL 路徑
 * @param {string} sitemapContent - sitemap.xml 內容
 * @param {string} baseUrl - 基礎 URL
 * @returns {string[]} 路徑陣列
 */
function extractSitemapPaths(sitemapContent, baseUrl) {
  // 建立動態正則表達式匹配 baseUrl
  const escapedUrl = baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\/$/, '');
  const locRegex = new RegExp(`<loc>${escapedUrl}(/[^<]*)?</loc>`, 'g');
  const paths = [];
  let match;

  while ((match = locRegex.exec(sitemapContent)) !== null) {
    // 標準化路徑
    const rawPath = match[1] || '/';
    const path = rawPath === '/' ? '/' : rawPath.replace(/\/+$/, '') + '/';
    paths.push(path);
  }

  return paths;
}

/**
 * 標準化路徑陣列
 * @param {string[]} paths - 路徑陣列
 * @returns {string[]} 標準化後的路徑陣列
 */
function normalizePaths(paths) {
  return paths.map((p) => {
    if (p === '/') return '/';
    return p.replace(/\/+$/, '') + '/';
  });
}

/**
 * 比較兩個路徑陣列
 * @param {string[]} paths1 - 第一個路徑陣列
 * @param {string[]} paths2 - 第二個路徑陣列
 * @returns {{onlyIn1: string[], onlyIn2: string[]}} 差異
 */
function comparePaths(paths1, paths2) {
  const set1 = new Set(normalizePaths(paths1));
  const set2 = new Set(normalizePaths(paths2));

  const onlyIn1 = [...set1].filter((p) => !set2.has(p));
  const onlyIn2 = [...set2].filter((p) => !set1.has(p));

  return { onlyIn1, onlyIn2 };
}

/**
 * 驗證單一 app 的 sitemap/SSG 一致性
 * @param {string} appName - app 名稱
 * @param {object} config - app 配置
 * @returns {Promise<boolean>} 是否通過驗證
 */
async function verifyApp(appName, config) {
  console.log(`\n${colors.cyan}${colors.bold}📦 驗證: ${config.displayName}${colors.reset}`);

  const sitemapPath = resolve(rootDir, `apps/${appName}/public/sitemap.xml`);

  // 檢查 sitemap.xml 是否存在
  if (!existsSync(sitemapPath)) {
    log(colors.yellow, '⚠', `${appName} 沒有 sitemap.xml，跳過驗證`);
    return true;
  }

  try {
    const sitemapContent = readFileSync(sitemapPath, 'utf-8');
    const baseUrl = config.siteUrl.replace(/\/$/, '');

    // 從 sitemap.xml 提取路徑
    const sitemapPaths = extractSitemapPaths(sitemapContent, baseUrl);

    // 從 config 取得 SEO 路徑
    const configPaths = config.seoPaths || [];

    console.log(`  📄 sitemap.xml: ${JSON.stringify(sitemapPaths)}`);
    console.log(`  📄 app.config:  ${JSON.stringify(configPaths)}`);

    // 比較路徑
    const { onlyIn1: onlyInSitemap, onlyIn2: onlyInConfig } = comparePaths(
      sitemapPaths,
      configPaths,
    );

    let hasErrors = false;

    if (onlyInSitemap.length > 0) {
      log(
        colors.red,
        '✗',
        `sitemap.xml 包含但 app.config 未定義: ${JSON.stringify(onlyInSitemap)}`,
      );
      hasErrors = true;
    }

    if (onlyInConfig.length > 0) {
      log(colors.red, '✗', `app.config 定義但 sitemap.xml 未包含: ${JSON.stringify(onlyInConfig)}`);
      hasErrors = true;
    }

    if (!hasErrors) {
      log(colors.green, '✓', `${config.displayName} sitemap/SSG 一致性驗證通過`);
    }

    return !hasErrors;
  } catch (error) {
    log(colors.red, '✗', `驗證失敗: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log(`${colors.bold}${colors.cyan}🔍 Sitemap/SSG 一致性驗證 (SSOT)${colors.reset}`);
  console.log('━'.repeat(60));

  try {
    // 自動發現所有 apps (返回 {name, path, config} 物件陣列)
    const apps = await discoverApps();
    const appNames = apps.map((app) => app.name);
    console.log(`\n📦 發現 ${apps.length} 個 apps: ${appNames.join(', ')}`);

    let allPassed = true;

    for (const app of apps) {
      const passed = await verifyApp(app.name, app.config);
      if (!passed) {
        allPassed = false;
      }
    }

    console.log('\n' + '━'.repeat(60));

    if (allPassed) {
      log(colors.green, '✅', '所有 apps sitemap/SSG 一致性驗證通過');
      process.exit(0);
    } else {
      log(colors.red, '❌', '部分 apps sitemap/SSG 一致性驗證失敗');
      console.log('\n💡 修復建議：');
      console.log('   1. 確保 sitemap.xml 包含 app.config.mjs 中的所有 seoPaths');
      console.log('   2. 每個 URL 都需要 hreflang 標籤（zh-TW + x-default）');
      process.exit(1);
    }
  } catch (error) {
    log(colors.red, '❌', `驗證失敗: ${error.message}`);
    process.exit(1);
  }
}

main();
