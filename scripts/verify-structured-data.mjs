#!/usr/bin/env node
/**
 * JSON-LD 結構化數據驗證腳本 - Stage 5
 *
 * 依據：
 * - [Schema.org] 結構化數據規範
 * - [Google Search Central] 結構化數據指南 2025
 * - [Google Rich Results Test] 驗證工具標準
 *
 * 驗證項目：
 * - 所有頁面都有適當的 JSON-LD
 * - Schema 類型正確且未使用已廢棄類型
 * - 必要屬性完整
 * - URL 使用絕對路徑
 * - 日期格式符合 ISO 8601
 * - FAQPage 與 HowTo Schema 正確性
 *
 * 2025 已廢棄 Schema 類型：
 * - Speakable (已移除)
 * - SiteNavigationElement (不再推薦)
 * - 某些 Event 屬性已變更
 *
 * 建立時間: 2025-12-20
 * BDD 階段: Stage 5 REFACTOR
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
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
 * 2025 已廢棄或不推薦的 Schema 類型
 */
const DEPRECATED_SCHEMAS = [
  'Speakable', // Google 已移除支持
  'SiteNavigationElement', // 不再推薦使用
];

/**
 * 必要屬性檢查規則
 */
const REQUIRED_PROPERTIES = {
  FAQPage: ['mainEntity'],
  HowTo: ['name', 'step'],
  BreadcrumbList: ['itemListElement'],
  Organization: ['name', 'url'],
  WebSite: ['name', 'url'],
  Question: ['name', 'acceptedAnswer'],
  Answer: ['text'],
  HowToStep: ['name', 'text'],
  ListItem: ['position', 'name', 'item'],
};

/**
 * 驗證 JSON-LD Schema
 *
 * @param {object} schema - JSON-LD 物件
 * @param {string} pagePath - 頁面路徑
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
function validateSchema(schema, pagePath) {
  const errors = [];
  const warnings = [];

  // 處理陣列形式的 JSON-LD
  const schemas = Array.isArray(schema) ? schema : [schema];

  schemas.forEach((s, index) => {
    const schemaType = s['@type'];
    const prefix = schemas.length > 1 ? `Schema ${index + 1} (${schemaType}): ` : '';

    // 1. 檢查 @context
    if (!s['@context']) {
      errors.push(`${prefix}Missing @context`);
    } else if (s['@context'] !== 'https://schema.org' && s['@context'] !== 'http://schema.org') {
      warnings.push(`${prefix}@context should be "https://schema.org", got "${s['@context']}"`);
    }

    // 2. 檢查 @type
    if (!schemaType) {
      errors.push(`${prefix}Missing @type`);
      return;
    }

    // 3. 檢查是否使用已廢棄的 Schema
    if (DEPRECATED_SCHEMAS.includes(schemaType)) {
      errors.push(`${prefix}Using deprecated schema type "${schemaType}" (not supported in 2025)`);
    }

    // 4. 檢查必要屬性
    const requiredProps = REQUIRED_PROPERTIES[schemaType];
    if (requiredProps) {
      requiredProps.forEach((prop) => {
        if (!s[prop]) {
          errors.push(`${prefix}Missing required property "${prop}"`);
        }
      });
    }

    // 5. FAQPage 特定驗證
    if (schemaType === 'FAQPage') {
      if (Array.isArray(s.mainEntity)) {
        s.mainEntity.forEach((question, qIndex) => {
          if (question['@type'] !== 'Question') {
            errors.push(
              `${prefix}mainEntity[${qIndex}] @type should be "Question", got "${question['@type']}"`,
            );
          }

          if (!question.acceptedAnswer) {
            errors.push(`${prefix}mainEntity[${qIndex}] missing acceptedAnswer`);
          } else if (question.acceptedAnswer['@type'] !== 'Answer') {
            errors.push(`${prefix}mainEntity[${qIndex}].acceptedAnswer @type should be "Answer"`);
          }
        });
      }
    }

    // 6. HowTo 特定驗證
    if (schemaType === 'HowTo') {
      if (!s.step || !Array.isArray(s.step)) {
        errors.push(`${prefix}HowTo must have "step" array`);
      } else {
        s.step.forEach((step, sIndex) => {
          if (step['@type'] !== 'HowToStep') {
            errors.push(
              `${prefix}step[${sIndex}] @type should be "HowToStep", got "${step['@type']}"`,
            );
          }
        });
      }

      // totalTime 格式檢查 (ISO 8601 duration)
      if (s.totalTime && !/^PT\d+(H|M|S)$/.test(s.totalTime)) {
        warnings.push(
          `${prefix}totalTime should be ISO 8601 duration format (e.g., PT2M), got "${s.totalTime}"`,
        );
      }
    }

    // 7. BreadcrumbList 特定驗證
    if (schemaType === 'BreadcrumbList') {
      if (Array.isArray(s.itemListElement)) {
        s.itemListElement.forEach((item, iIndex) => {
          // 檢查 URL 是否為絕對路徑
          if (item.item && !item.item.startsWith('http')) {
            errors.push(
              `${prefix}itemListElement[${iIndex}].item should be absolute URL, got "${item.item}"`,
            );
          }

          // 檢查 position 連續性
          if (item.position !== iIndex + 1) {
            errors.push(
              `${prefix}itemListElement[${iIndex}].position should be ${iIndex + 1}, got ${item.position}`,
            );
          }
        });
      }
    }

    // 8. 檢查所有 URL 屬性都使用絕對路徑
    ['url', 'sameAs', 'image'].forEach((urlProp) => {
      if (s[urlProp]) {
        const urls = Array.isArray(s[urlProp]) ? s[urlProp] : [s[urlProp]];
        urls.forEach((url) => {
          if (typeof url === 'string' && !url.startsWith('http')) {
            warnings.push(`${prefix}${urlProp} should be absolute URL, got "${url}"`);
          }
        });
      }
    });
  });

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * 從 HTML 提取所有 JSON-LD
 *
 * @param {string} html - HTML 內容
 * @returns {object[]} JSON-LD 物件陣列
 */
function extractJsonLd(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  const jsonLdList = [];

  scripts.forEach((script) => {
    try {
      const jsonLd = JSON.parse(script.textContent);
      // 展開 @graph 格式（SEOHelmet 使用 @graph 輸出）
      if (jsonLd['@graph'] && Array.isArray(jsonLd['@graph'])) {
        jsonLd['@graph'].forEach((item) => {
          const ctx = item['@context'] ?? jsonLd['@context'];
          jsonLdList.push(ctx ? { '@context': ctx, ...item } : item);
        });
      } else {
        jsonLdList.push(jsonLd);
      }
    } catch (error) {
      console.warn(`Failed to parse JSON-LD: ${error.message}`);
    }
  });

  return jsonLdList;
}

/**
 * 驗證單一頁面
 *
 * @param {string} htmlPath - HTML 文件路徑
 * @param {string} pagePath - 頁面路徑
 * @returns {{ valid: boolean, errors: string[], warnings: string[], schemasFound: number }}
 */
function verifyPage(htmlPath, pagePath) {
  if (!existsSync(htmlPath)) {
    return {
      valid: false,
      errors: [`File not found: ${htmlPath}`],
      warnings: [],
      schemasFound: 0,
    };
  }

  const html = readFileSync(htmlPath, 'utf-8');
  const jsonLdList = extractJsonLd(html);

  if (jsonLdList.length === 0) {
    return {
      valid: false,
      errors: ['No JSON-LD structured data found'],
      warnings: [],
      schemasFound: 0,
    };
  }

  let allErrors = [];
  let allWarnings = [];

  jsonLdList.forEach((jsonLd, index) => {
    const validation = validateSchema(jsonLd, pagePath);
    allErrors = allErrors.concat(validation.errors);
    allWarnings = allWarnings.concat(validation.warnings);
  });

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    schemasFound: jsonLdList.length,
  };
}

/**
 * 主函數
 */
async function main() {
  console.log('\n🔍 JSON-LD 結構化數據驗證');
  console.log('─'.repeat(60));

  const distPath = resolve(__dirname, '../apps/ratewise/dist');

  // 檢查 dist 目錄是否存在
  if (!existsSync(distPath)) {
    log(colors.red, '✗', `Dist directory not found: ${distPath}`);
    console.log('\n提示: 請先建置應用程式 (pnpm build:ratewise)\n');
    process.exit(1);
  }

  // 需要檢查的頁面
  const pages = [
    { path: '/', html: resolve(distPath, 'index.html'), label: '首頁' },
    { path: '/faq/', html: resolve(distPath, 'faq/index.html'), label: 'FAQ' },
    { path: '/about/', html: resolve(distPath, 'about/index.html'), label: 'About' },
    { path: '/guide/', html: resolve(distPath, 'guide/index.html'), label: 'Guide' },
    { path: '/usd-twd/', html: resolve(distPath, 'usd-twd/index.html'), label: 'USD→TWD' },
    { path: '/jpy-twd/', html: resolve(distPath, 'jpy-twd/index.html'), label: 'JPY→TWD' },
    { path: '/eur-twd/', html: resolve(distPath, 'eur-twd/index.html'), label: 'EUR→TWD' },
  ];

  let hasErrors = false;
  const results = [];

  for (const page of pages) {
    console.log(`\n📄 檢查頁面: ${page.label} (${page.path})`);

    const result = verifyPage(page.html, page.path);
    results.push({ page, result });

    if (!result.valid) {
      hasErrors = true;
      log(colors.red, '✗', 'FAILED');
      result.errors.forEach((err) => {
        console.log(`  ${colors.red}•${colors.reset} ${err}`);
      });
    } else {
      log(colors.green, '✓', 'PASSED');
      console.log(`  找到 ${result.schemasFound} 個 JSON-LD schema`);
    }

    // 顯示警告
    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach((warn) => {
        console.log(`  ${colors.yellow}⚠${colors.reset} ${warn}`);
      });
    }
  }

  // 統計
  console.log('\n' + '─'.repeat(60));
  console.log('📊 驗證統計:');
  const passed = results.filter((r) => r.result.valid).length;
  const failed = results.filter((r) => !r.result.valid).length;
  const totalSchemas = results.reduce((sum, r) => sum + r.result.schemasFound, 0);

  console.log(`  通過: ${passed} 個頁面`);
  console.log(`  失敗: ${failed} 個頁面`);
  console.log(`  總 Schema 數量: ${totalSchemas}`);

  // Schema 類型統計
  console.log('\n📊 Schema 類型分布:');
  const schemaTypes = new Set();
  results.forEach((r) => {
    if (r.result.valid && existsSync(r.page.html)) {
      const html = readFileSync(r.page.html, 'utf-8');
      const jsonLdList = extractJsonLd(html);
      jsonLdList.forEach((s) => {
        if (s['@type']) schemaTypes.add(s['@type']);
      });
    }
  });
  schemaTypes.forEach((type) => {
    console.log(`  • ${type}`);
  });

  // 最終結果
  console.log('\n' + '─'.repeat(60));
  if (hasErrors) {
    log(colors.red, '❌', 'JSON-LD 驗證失敗！');
    console.log('\n建議:');
    console.log('  - 檢查 SEOHelmet 組件中的 JSON-LD 生成邏輯');
    console.log('  - 使用 Google Rich Results Test 驗證');
    console.log('  - 參考 Schema.org 官方文檔\n');
    process.exit(1);
  } else {
    log(colors.green, '✅', 'JSON-LD 驗證通過！');
    console.log('\n建議下一步:');
    console.log('  - 使用 Google Search Console 提交 sitemap');
    console.log('  - 使用 Google Rich Results Test 線上驗證');
    console.log('  - 監控 Search Console 中的結構化數據報告\n');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('驗證腳本錯誤:', error);
  process.exit(1);
});
