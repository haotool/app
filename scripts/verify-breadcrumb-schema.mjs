#!/usr/bin/env node
/**
 * Breadcrumb Schema 驗證腳本 - Stage 3 REFACTOR
 *
 * 依據：
 * - [Schema.org] BreadcrumbList 結構化數據規範
 *   https://schema.org/BreadcrumbList
 * - [Google Search Central] 麵包屑導航結構化數據指南
 *   https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
 *
 * 驗證項目：
 * - BreadcrumbList @context 和 @type
 * - itemListElement 陣列結構
 * - 每個項目的 position, name, item 正確性
 * - 絕對 URL 格式
 * - 位置連續性（1, 2, 3...）
 *
 * 建立時間: 2025-12-20
 * BDD 階段: Stage 3 REFACTOR
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { JSDOM } from 'jsdom';

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

const SITE_URL = 'https://app.haotool.org/ratewise/';

/**
 * 驗證 BreadcrumbList Schema
 *
 * @param {object} schema - JSON-LD schema
 * @param {string} pagePath - 頁面路徑
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateBreadcrumbSchema(schema, pagePath) {
  const errors = [];

  // 1. 檢查 @context
  if (schema['@context'] !== 'https://schema.org') {
    errors.push(`@context should be "https://schema.org", got "${schema['@context']}"`);
  }

  // 2. 檢查 @type
  if (schema['@type'] !== 'BreadcrumbList') {
    errors.push(`@type should be "BreadcrumbList", got "${schema['@type']}"`);
  }

  // 3. 檢查 itemListElement
  if (!Array.isArray(schema.itemListElement)) {
    errors.push('itemListElement should be an array');
    return { valid: false, errors };
  }

  if (schema.itemListElement.length === 0) {
    errors.push('itemListElement should not be empty');
    return { valid: false, errors };
  }

  // 4. 檢查每個項目
  schema.itemListElement.forEach((item, index) => {
    const expectedPosition = index + 1;

    // 檢查 @type
    if (item['@type'] !== 'ListItem') {
      errors.push(`Item ${expectedPosition}: @type should be "ListItem", got "${item['@type']}"`);
    }

    // 檢查 position
    if (item.position !== expectedPosition) {
      errors.push(
        `Item ${expectedPosition}: position should be ${expectedPosition}, got ${item.position}`,
      );
    }

    // 檢查 name
    if (!item.name || typeof item.name !== 'string') {
      errors.push(`Item ${expectedPosition}: name is missing or invalid`);
    }

    // 檢查 item (URL)
    if (!item.item || typeof item.item !== 'string') {
      errors.push(`Item ${expectedPosition}: item (URL) is missing or invalid`);
    } else {
      // 檢查是否為絕對 URL
      if (!item.item.startsWith('http://') && !item.item.startsWith('https://')) {
        errors.push(`Item ${expectedPosition}: item should be an absolute URL, got "${item.item}"`);
      }

      // 檢查是否使用正確的 base URL
      if (!item.item.startsWith(SITE_URL)) {
        errors.push(
          `Item ${expectedPosition}: item should start with ${SITE_URL}, got "${item.item}"`,
        );
      }
    }
  });

  // 5. 檢查最後一項是否為當前頁面
  const lastItem = schema.itemListElement[schema.itemListElement.length - 1];
  const expectedUrl =
    pagePath === '/' ? SITE_URL : `${SITE_URL}${pagePath.replace(/^\//, '').replace(/\/+$/, '')}/`;

  if (lastItem.item !== expectedUrl) {
    errors.push(`Last item should point to current page (${expectedUrl}), got "${lastItem.item}"`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 驗證頁面的 BreadcrumbList Schema
 *
 * @param {string} htmlPath - HTML 文件路徑
 * @param {string} pagePath - 頁面路徑（用於檢查）
 * @returns {{ valid: boolean, errors: string[], schema: object|null }}
 */
function verifyPageBreadcrumb(htmlPath, pagePath) {
  if (!existsSync(htmlPath)) {
    return {
      valid: false,
      errors: [`File not found: ${htmlPath}`],
      schema: null,
    };
  }

  const html = readFileSync(htmlPath, 'utf-8');
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // 查找 BreadcrumbList JSON-LD script
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  let breadcrumbSchema = null;

  for (const script of scripts) {
    try {
      const jsonLd = JSON.parse(script.textContent);

      // 處理陣列形式的 JSON-LD
      if (Array.isArray(jsonLd)) {
        const found = jsonLd.find((s) => s['@type'] === 'BreadcrumbList');
        if (found) {
          breadcrumbSchema = found;
          break;
        }
      } else if (jsonLd['@type'] === 'BreadcrumbList') {
        breadcrumbSchema = jsonLd;
        break;
      }
    } catch (error) {
      console.warn(`Failed to parse JSON-LD: ${error.message}`);
    }
  }

  if (!breadcrumbSchema) {
    return {
      valid: false,
      errors: ['No BreadcrumbList schema found'],
      schema: null,
    };
  }

  const validation = validateBreadcrumbSchema(breadcrumbSchema, pagePath);

  return {
    ...validation,
    schema: breadcrumbSchema,
  };
}

/**
 * 主函數
 */
async function main() {
  console.log('\n🔍 Breadcrumb Schema 驗證');
  console.log('─'.repeat(60));

  const distPath = resolve(__dirname, '../apps/ratewise/dist');

  // 需要檢查的頁面
  const pages = [
    { path: '/faq/', html: resolve(distPath, 'faq/index.html'), label: 'FAQ' },
    { path: '/about/', html: resolve(distPath, 'about/index.html'), label: 'About' },
    { path: '/guide/', html: resolve(distPath, 'guide/index.html'), label: 'Guide' },
    { path: '/usd-twd/', html: resolve(distPath, 'usd-twd/index.html'), label: 'USD→TWD' },
  ];

  let hasErrors = false;
  const results = [];

  for (const page of pages) {
    console.log(`\n📄 檢查頁面: ${page.label} (${page.path})`);

    const result = verifyPageBreadcrumb(page.html, page.path);
    results.push({ page, result });

    if (!result.valid) {
      hasErrors = true;
      log(colors.red, '✗', 'FAILED');
      result.errors.forEach((err) => {
        console.log(`  ${colors.red}•${colors.reset} ${err}`);
      });
    } else {
      log(colors.green, '✓', 'PASSED');
      console.log(
        `  項目數量: ${result.schema.itemListElement.length}, 結構: ${result.schema.itemListElement.map((i) => i.name).join(' → ')}`,
      );
    }
  }

  // 統計
  console.log('\n' + '─'.repeat(60));
  console.log('📊 驗證統計:');
  const passed = results.filter((r) => r.result.valid).length;
  const failed = results.filter((r) => !r.result.valid).length;

  console.log(`  通過: ${passed} 個頁面`);
  console.log(`  失敗: ${failed} 個頁面`);

  // 最終結果
  if (hasErrors) {
    log(colors.red, '\n❌', 'Breadcrumb Schema 驗證失敗！');
    console.log('\n提示: 確保 dist 目錄存在並已建置（pnpm build:ratewise）\n');
    process.exit(1);
  } else {
    log(colors.green, '\n✅', 'Breadcrumb Schema 驗證通過！\n');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('驗證腳本錯誤:', error);
  process.exit(1);
});
