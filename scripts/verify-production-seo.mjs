#!/usr/bin/env node
/* eslint-env node */
/* global AbortController, fetch, setTimeout, clearTimeout, console, process */
/**
 * 生產環境 SEO 健康檢查腳本 - 通用版本
 *
 * 功能:
 * 1. 驗證所有 sitemap.xml 中的 URL 返回 200
 * 2. 驗證 robots.txt 存在且正確
 * 3. 驗證 llms.txt 存在且正確（如適用）
 * 4. 驗證 hreflang 配置一致性
 * 5. 驗證圖片資源存在且可訪問
 *
 * 用法:
 *   node scripts/verify-production-seo.mjs [app-name] [--base-url=<url>]
 *   node scripts/verify-production-seo.mjs ratewise
 *   node scripts/verify-production-seo.mjs nihonname --base-url=https://app.haotool.org/nihonname
 *
 * 建立時間: 2025-11-30T15:50:00+08:00
 * 更新時間: 2025-12-15 - 重構為通用版本，支持所有 apps
 * 依據: [moss.sh/deployment/health-checks][SEO Best Practices 2025][Linus: 消除特殊情況]
 */

// 動態載入 app 配置
import { discoverApps, loadAppConfig } from './lib/workspace-utils.mjs';

// 解析命令行參數
const appName = process.argv[2] || 'ratewise';
const customBaseUrl = process.argv.find((arg) => arg.startsWith('--base-url='))?.split('=')[1];

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

async function checkUrl(url, expectedStatus = 200) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s 超時（HaoTool 3D 載入需要較長時間）

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'RateWise-SEO-HealthCheck/1.0',
      },
    });

    clearTimeout(timeout);

    return {
      url,
      status: response.status,
      ok: response.status === expectedStatus,
      error: null,
    };
  } catch (error) {
    return {
      url,
      status: null,
      ok: false,
      error: error.message,
    };
  }
}

async function checkRedirect(url, expectedLocation) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s 超時

    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'User-Agent': 'RateWise-SEO-HealthCheck/1.0',
      },
    });

    clearTimeout(timeout);

    const location = response.headers.get('location');
    const resolvedLocation = location ? new URL(location, url).toString() : null;

    return {
      url,
      status: response.status,
      ok:
        (response.status === 301 || response.status === 308) &&
        resolvedLocation === expectedLocation,
      location: resolvedLocation,
      error: null,
    };
  } catch (error) {
    return {
      url,
      status: null,
      ok: false,
      location: null,
      error: error.message,
    };
  }
}

async function verifySitemapContent(baseUrl, seoPaths) {
  try {
    const response = await fetch(`${baseUrl}/sitemap.xml`);
    const content = await response.text();

    const errors = [];

    // 檢查是否包含所有必要路徑
    for (const path of seoPaths) {
      const expectedUrl = `${baseUrl}${path}`;
      if (!content.includes(`<loc>${expectedUrl}</loc>`)) {
        errors.push(`sitemap.xml 缺少路徑: ${path}`);
      }
    }

    // 檢查 hreflang 數量 (URLs × 2 hreflang)
    const hreflangMatches = content.match(/<xhtml:link/g) || [];
    const expectedCount = seoPaths.length * 2;
    if (hreflangMatches.length !== expectedCount) {
      errors.push(`hreflang 數量錯誤: 期望 ${expectedCount}, 實際 ${hreflangMatches.length}`);
    }

    return { ok: errors.length === 0, errors };
  } catch (error) {
    return { ok: false, errors: [`無法讀取 sitemap.xml: ${error.message}`] };
  }
}

async function verifyRobotsContent(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/robots.txt`);
    const content = await response.text();

    const errors = [];

    // 檢查必要內容
    if (!content.includes('Sitemap:')) {
      errors.push('robots.txt 缺少 Sitemap 指令');
    }
    if (!content.includes('User-agent: *')) {
      errors.push('robots.txt 缺少 User-agent 指令');
    }
    if (!content.includes('GPTBot')) {
      errors.push('robots.txt 缺少 AI 爬蟲配置 (GPTBot)');
    }

    return { ok: errors.length === 0, errors };
  } catch (error) {
    return { ok: false, errors: [`無法讀取 robots.txt: ${error.message}`] };
  }
}

async function verifyLlmsContent(baseUrl, appDisplayName, siteUrl) {
  try {
    const response = await fetch(`${baseUrl}/llms.txt`);
    const content = await response.text();

    const errors = [];

    // 官方規範驗證：只檢查必需的 H1 標題
    // 參考：https://llmstxt.org/ - "An H1 with the name of the project or site. This is the only required section"
    const hasH1Title = /^#\s+.+$/m.test(content);

    if (!hasH1Title) {
      errors.push('llms.txt 缺少必需的 H1 標題（# Title）- 官方規範唯一必需項目');
    }

    // Blockquote 是官方建議但非必需，添加資訊性提示
    const hasBlockquote = /^>\s+.+$/m.test(content);
    if (!hasBlockquote) {
      console.log(
        `ℹ️  ${appDisplayName} llms.txt 建議包含 blockquote 摘要（> Summary）以提升 AI 理解度`,
      );
    }

    // 檢查品牌名稱（使用 displayName 的前幾個字符）
    const brandKeyword = appDisplayName.split(/[- ]/)[0]; // 取第一個單詞
    if (!content.includes(brandKeyword)) {
      errors.push(`llms.txt 缺少品牌名稱: ${brandKeyword}`);
    }

    // 檢查是否包含網站 URL
    if (!content.includes(siteUrl)) {
      errors.push(`llms.txt 缺少網站 URL: ${siteUrl}`);
    }

    if (appDisplayName === 'RateWise') {
      const popularRatePaths = [
        'usd-twd/',
        'jpy-twd/',
        'eur-twd/',
        'hkd-twd/',
        'cny-twd/',
        'krw-twd/',
      ];
      popularRatePaths.forEach((path) => {
        const expectedUrl = `${siteUrl}${path}`;
        if (!content.includes(expectedUrl)) {
          errors.push(`llms.txt 缺少熱門匯率連結: ${expectedUrl}`);
        }
      });
    }

    return { ok: errors.length === 0, errors };
  } catch (error) {
    return { ok: false, errors: [`無法讀取 llms.txt: ${error.message}`] };
  }
}

async function main() {
  // 載入 app 配置
  const app = await loadAppConfig(appName);

  if (!app) {
    const apps = await discoverApps();
    const appNames = apps.map((item) => item.name).join(', ');
    console.error(`❌ App not found: ${appName}`);
    console.error(`\n可用的 apps: ${appNames || '無'}`);
    console.error(`用法: node scripts/verify-production-seo.mjs <app-name>`);
    process.exit(1);
  }

  const { config } = app;
  const baseUrl = customBaseUrl || config.siteUrl.replace(/\/$/, ''); // 移除尾斜線

  console.log(`\n🔍 ${config.displayName} 生產環境 SEO 健康檢查`);
  console.log(`📍 Base URL: ${baseUrl}`);
  console.log('─'.repeat(60));

  let hasErrors = false;

  // 1. 檢查 base path 尾斜線重定向（非根路徑）
  if (config.basePath?.production && config.basePath.production !== '/') {
    console.log('\n↪️  尾斜線重定向檢查:');
    const redirectUrl = `${baseUrl}/`;
    const redirectResult = await checkRedirect(baseUrl, redirectUrl);

    if (redirectResult.ok) {
      log(colors.green, '✓', `${baseUrl} → ${redirectUrl} (${redirectResult.status})`);
    } else {
      log(
        colors.red,
        '✗',
        `${baseUrl} → ${redirectResult.status || 'ERROR'} (${redirectResult.error || 'Invalid redirect'})`,
      );
      hasErrors = true;
    }
  }

  // 2. 檢查所有頁面 HTTP 狀態
  console.log('\n📄 頁面 HTTP 狀態檢查:');
  for (const path of config.seoPaths) {
    const url = `${baseUrl}${path}`;
    const result = await checkUrl(url);

    if (result.ok) {
      log(colors.green, '✓', `${path} → ${result.status}`);
    } else {
      log(colors.red, '✗', `${path} → ${result.status || 'ERROR'} (${result.error || 'Non-200'})`);
      hasErrors = true;
    }
  }

  // 3. 檢查 SEO 配置文件
  console.log('\n📁 SEO 配置文件檢查:');
  for (const file of config.resources.seoFiles) {
    const url = `${baseUrl}${file}`;
    const result = await checkUrl(url);

    if (result.ok) {
      log(colors.green, '✓', `${file} → ${result.status}`);
    } else {
      log(colors.red, '✗', `${file} → ${result.status || 'ERROR'} (${result.error || 'Non-200'})`);
      hasErrors = true;
    }
  }

  // 4. 驗證 sitemap.xml 內容
  console.log('\n🗺️ Sitemap 內容驗證:');
  const sitemapResult = await verifySitemapContent(baseUrl, config.seoPaths);
  if (sitemapResult.ok) {
    log(colors.green, '✓', 'sitemap.xml 內容正確');
  } else {
    for (const error of sitemapResult.errors) {
      log(colors.red, '✗', error);
    }
    hasErrors = true;
  }

  // 5. 驗證 robots.txt 內容
  console.log('\n🤖 Robots.txt 內容驗證:');
  const robotsResult = await verifyRobotsContent(baseUrl);
  if (robotsResult.ok) {
    log(colors.green, '✓', 'robots.txt 內容正確');
  } else {
    for (const error of robotsResult.errors) {
      log(colors.red, '✗', error);
    }
    hasErrors = true;
  }

  // 6. 驗證 llms.txt 內容（如果有的話）
  if (config.resources.seoFiles.includes('/llms.txt')) {
    console.log('\n🤖 LLMs.txt 內容驗證:');
    const llmsResult = await verifyLlmsContent(baseUrl, config.displayName, config.siteUrl);
    if (llmsResult.ok) {
      log(colors.green, '✓', 'llms.txt 內容正確');
    } else {
      for (const error of llmsResult.errors) {
        log(colors.red, '✗', error);
      }
      hasErrors = true;
    }
  }

  // 7. 驗證圖片資源
  console.log('\n🖼️  圖片資源檢查:');
  for (const image of config.resources.images) {
    const url = `${baseUrl}${image}`;
    const result = await checkUrl(url);

    if (result.ok) {
      log(colors.green, '✓', `${image} → ${result.status}`);
    } else {
      log(
        colors.yellow,
        '⚠',
        `${image} → ${result.status || 'ERROR'} (${result.error || 'Non-200'})`,
      );
      // 圖片資源失敗不算致命錯誤，只是警告
    }
  }

  // 最終結果
  console.log('\n' + '─'.repeat(60));
  if (hasErrors) {
    log(colors.red, '❌', `${config.displayName} SEO 健康檢查失敗！`);
    process.exit(1);
  } else {
    log(colors.green, '✅', `${config.displayName} SEO 健康檢查通過！`);
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('健康檢查腳本錯誤:', error);
  process.exit(1);
});
