#!/usr/bin/env node
/* eslint-env node */
/**
 * 生產環境 SEO 健康檢查腳本
 *
 * 功能:
 * 1. 驗證所有 sitemap.xml 中的 URL 返回 200
 * 2. 驗證 robots.txt 存在且正確
 * 3. 驗證 llms.txt 存在且正確
 * 4. 驗證 hreflang 配置一致性
 *
 * 用法:
 *   node scripts/verify-production-seo.mjs
 *   node scripts/verify-production-seo.mjs --base-url=https://app.haotool.org/ratewise
 *
 * 建立時間: 2025-11-30T15:50:00+08:00
 * 依據: [moss.sh/deployment/health-checks][SEO Best Practices 2025]
 */

const PRODUCTION_BASE_URL =
  process.env.PRODUCTION_BASE_URL ||
  process.argv.find((arg) => arg.startsWith('--base-url='))?.split('=')[1] ||
  'https://app.haotool.org/ratewise';

// SEO 關鍵路徑 (必須與 sitemap.xml 一致)
const SEO_PATHS = ['/', '/faq/', '/about/', '/guide/'];

// SEO 配置文件
const SEO_FILES = ['/sitemap.xml', '/robots.txt', '/llms.txt'];

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
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s 超時

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

async function verifySitemapContent(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/sitemap.xml`);
    const content = await response.text();

    const errors = [];

    // 檢查是否包含所有必要路徑
    for (const path of SEO_PATHS) {
      const expectedUrl = `${baseUrl}${path}`;
      if (!content.includes(`<loc>${expectedUrl}</loc>`)) {
        errors.push(`sitemap.xml 缺少路徑: ${path}`);
      }
    }

    // 檢查 hreflang 數量 (4 URLs × 2 hreflang = 8)
    const hreflangMatches = content.match(/<xhtml:link/g) || [];
    const expectedCount = SEO_PATHS.length * 2;
    if (hreflangMatches.length !== expectedCount) {
      errors.push(
        `hreflang 數量錯誤: 期望 ${expectedCount}, 實際 ${hreflangMatches.length}`,
      );
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

async function verifyLlmsContent(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/llms.txt`);
    const content = await response.text();

    const errors = [];

    // 檢查必要內容
    if (!content.includes('RateWise')) {
      errors.push('llms.txt 缺少品牌名稱');
    }
    if (!content.includes('/guide')) {
      errors.push('llms.txt 缺少 /guide 連結');
    }
    if (!content.includes('https://app.haotool.org/ratewise/')) {
      errors.push('llms.txt 缺少首頁連結');
    }

    return { ok: errors.length === 0, errors };
  } catch (error) {
    return { ok: false, errors: [`無法讀取 llms.txt: ${error.message}`] };
  }
}

async function main() {
  console.log('\n🔍 RateWise 生產環境 SEO 健康檢查');
  console.log(`📍 Base URL: ${PRODUCTION_BASE_URL}`);
  console.log('─'.repeat(50));

  let hasErrors = false;

  // 1. 檢查所有頁面 HTTP 狀態
  console.log('\n📄 頁面 HTTP 狀態檢查:');
  for (const path of SEO_PATHS) {
    const url = `${PRODUCTION_BASE_URL}${path}`;
    const result = await checkUrl(url);

    if (result.ok) {
      log(colors.green, '✓', `${path} → ${result.status}`);
    } else {
      log(
        colors.red,
        '✗',
        `${path} → ${result.status || 'ERROR'} (${result.error || 'Non-200'})`,
      );
      hasErrors = true;
    }
  }

  // 2. 檢查 SEO 配置文件
  console.log('\n📁 SEO 配置文件檢查:');
  for (const file of SEO_FILES) {
    const url = `${PRODUCTION_BASE_URL}${file}`;
    const result = await checkUrl(url);

    if (result.ok) {
      log(colors.green, '✓', `${file} → ${result.status}`);
    } else {
      log(
        colors.red,
        '✗',
        `${file} → ${result.status || 'ERROR'} (${result.error || 'Non-200'})`,
      );
      hasErrors = true;
    }
  }

  // 3. 驗證 sitemap.xml 內容
  console.log('\n🗺️ Sitemap 內容驗證:');
  const sitemapResult = await verifySitemapContent(PRODUCTION_BASE_URL);
  if (sitemapResult.ok) {
    log(colors.green, '✓', 'sitemap.xml 內容正確');
  } else {
    for (const error of sitemapResult.errors) {
      log(colors.red, '✗', error);
    }
    hasErrors = true;
  }

  // 4. 驗證 robots.txt 內容
  console.log('\n🤖 Robots.txt 內容驗證:');
  const robotsResult = await verifyRobotsContent(PRODUCTION_BASE_URL);
  if (robotsResult.ok) {
    log(colors.green, '✓', 'robots.txt 內容正確');
  } else {
    for (const error of robotsResult.errors) {
      log(colors.red, '✗', error);
    }
    hasErrors = true;
  }

  // 5. 驗證 llms.txt 內容
  console.log('\n🤖 LLMs.txt 內容驗證:');
  const llmsResult = await verifyLlmsContent(PRODUCTION_BASE_URL);
  if (llmsResult.ok) {
    log(colors.green, '✓', 'llms.txt 內容正確');
  } else {
    for (const error of llmsResult.errors) {
      log(colors.red, '✗', error);
    }
    hasErrors = true;
  }

  // 最終結果
  console.log('\n' + '─'.repeat(50));
  if (hasErrors) {
    log(colors.red, '❌', '生產環境 SEO 健康檢查失敗！');
    process.exit(1);
  } else {
    log(colors.green, '✅', '生產環境 SEO 健康檢查通過！');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('健康檢查腳本錯誤:', error);
  process.exit(1);
});

