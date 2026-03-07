#!/usr/bin/env node
/* globals console:readonly, process:readonly, URL:readonly */
/**
 * RateWise 端點健康檢查腳本
 *
 * 基於 2025 最佳實踐：
 * - 淺層檢查：HTTP 狀態碼、回應時間
 * - 深層檢查：內容驗證、SEO 標籤
 * - 安全性：HTTPS 驗證
 *
 * 參考來源：
 * - https://api7.ai/blog/tips-for-health-check-best-practices
 * - https://betterstack.com/community/guides/monitoring/health-checks/
 * - https://www.browserstack.com/guide/api-endpoint-testing
 */

import https from 'node:https';
import http from 'node:http';

const TIMEOUT = 10000; // 10 秒超時

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol} ${message}${colors.reset}`);
}

/**
 * HTTP(S) 請求封裝
 */
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const req = protocol.request(
      url,
      {
        method: options.method || 'GET',
        timeout: TIMEOUT,
        headers: {
          'User-Agent': 'RateWise-HealthCheck/1.0',
          ...options.headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        });
      },
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * 嚴格探測：不接受 3xx redirect（偵測 nginx alias trailing-slash 問題）
 * 成功條件：HTTP 2xx（含 204）
 */
async function strictProbe(url, method = 'GET') {
  const startTime = Date.now();
  try {
    const res = await request(url, { method });
    const responseTime = Date.now() - startTime;
    const ok = res.statusCode >= 200 && res.statusCode < 300;

    if (ok) {
      log(colors.green, '✓', `[${method}] ${url} → ${res.statusCode} (${responseTime}ms)`);
    } else {
      log(
        colors.red,
        '✗',
        `[${method}] ${url} → ${res.statusCode} (expected 2xx, redirect indicates missing nginx exact-match rule)`,
      );
    }
    return { success: ok, statusCode: res.statusCode, responseTime };
  } catch (error) {
    log(colors.red, '✗', `[${method}] ${url} → ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Worker 部署驗證：檢查 X-Security-Policy-Version 標頭
 * 缺少此標頭表示 Cloudflare Worker 未部署或路由未生效
 */
async function workerDeployCheck(url, expectedVersion) {
  try {
    const res = await request(url);
    const version = res.headers['x-security-policy-version'];

    if (!version) {
      log(
        colors.red,
        '✗',
        `Worker 未部署：${url} 缺少 X-Security-Policy-Version header（probe/csp-report 將 301/404）`,
      );
      return { success: false, reason: 'missing-header' };
    }

    if (expectedVersion && version !== expectedVersion) {
      log(colors.yellow, '⚠', `Worker 版本漂移：期待 ${expectedVersion}，實際 ${version}`);
      return { success: true, version, warning: 'version-mismatch' };
    }

    log(colors.green, '✓', `Worker 已部署：X-Security-Policy-Version: ${version}`);
    return { success: true, version };
  } catch (error) {
    log(colors.red, '✗', `Worker 檢查失敗：${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 淺層健康檢查：HTTP 狀態碼 + 回應時間
 *
 * 接受 200 或 301（尾斜線重定向是正常的）
 */
async function shallowCheck(url, expectedStatus = 200) {
  const startTime = Date.now();
  try {
    const res = await request(url);
    const responseTime = Date.now() - startTime;

    // 301 重定向到尾斜線版本是正常的（URL 標準化）
    const isSuccess = res.statusCode === expectedStatus || res.statusCode === 301;

    if (isSuccess) {
      const suffix = res.statusCode === 301 ? ' (→ trailing slash)' : '';
      log(colors.green, '✓', `${url} - ${res.statusCode}${suffix} (${responseTime}ms)`);
      return { success: true, statusCode: res.statusCode, responseTime };
    } else {
      log(colors.red, '✗', `${url} - Expected ${expectedStatus}, got ${res.statusCode}`);
      return { success: false, statusCode: res.statusCode, responseTime };
    }
  } catch (error) {
    log(colors.red, '✗', `${url} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 深層健康檢查：內容驗證
 *
 * 自動跟隨 301/302 重定向（最多 5 次）
 */
async function deepCheck(url, validators = [], maxRedirects = 5) {
  const startTime = Date.now();
  let currentUrl = url;
  let redirectCount = 0;

  try {
    while (redirectCount < maxRedirects) {
      const res = await request(currentUrl);

      // 跟隨重定向
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location;
        if (!location) {
          log(colors.red, '✗', `${url} - ${res.statusCode} without Location header`);
          return { success: false, statusCode: res.statusCode };
        }

        // 處理相對 URL
        currentUrl = location.startsWith('http')
          ? location
          : new URL(location, currentUrl).toString();
        redirectCount++;
        continue;
      }

      // 檢查最終回應
      const responseTime = Date.now() - startTime;

      if (res.statusCode !== 200) {
        log(colors.red, '✗', `${url} - Status ${res.statusCode}`);
        return { success: false, statusCode: res.statusCode };
      }

      // 執行驗證器
      for (const validator of validators) {
        const result = validator(res.body, res.headers);
        if (!result.valid) {
          log(colors.yellow, '⚠', `${url} - ${result.message}`);
          return { success: false, message: result.message };
        }
      }

      const suffix =
        redirectCount > 0 ? ` (${redirectCount} redirect${redirectCount > 1 ? 's' : ''})` : '';
      log(colors.green, '✓', `${url} - Content valid${suffix} (${responseTime}ms)`);
      return { success: true, responseTime, redirectCount };
    }

    log(colors.red, '✗', `${url} - Too many redirects (${maxRedirects})`);
    return { success: false, error: 'Too many redirects' };
  } catch (error) {
    log(colors.red, '✗', `${url} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 驗證器工廠
 */
const validators = {
  containsText: (text) => (body) => ({
    valid: body.includes(text),
    message: `Missing text: "${text}"`,
  }),

  hasMetaTag: (name, content) => (body) => ({
    valid:
      body.includes(`<meta name="${name}"`) && (!content || body.includes(`content="${content}"`)),
    message: `Missing meta tag: ${name}`,
  }),

  hasTitle: (title) => (body) => ({
    valid: body.includes(`<title>${title}</title>`),
    message: `Missing title: ${title}`,
  }),

  isXML: () => (body) => ({
    valid: body.startsWith('<?xml version="1.0"'),
    message: 'Not valid XML',
  }),

  containsURL: (url) => (body) => ({
    valid: body.includes(url),
    message: `Missing URL: ${url}`,
  }),
};

/**
 * 測試套件
 */
async function runHealthChecks(baseUrl) {
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}🏥 Health Check: ${baseUrl}${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  const results = [];

  // 1. 淺層檢查：所有路由
  console.log(`${colors.gray}[淺層檢查] HTTP 狀態碼 + 回應時間${colors.reset}`);
  const routes = ['/', '/faq', '/about', '/guide'];

  for (const route of routes) {
    const result = await shallowCheck(`${baseUrl}${route}`);
    results.push({ url: route, ...result });
  }

  // 2. 深層檢查：SEO 檔案
  console.log(`\n${colors.gray}[深層檢查] SEO 檔案內容驗證${colors.reset}`);

  const sitemapResult = await deepCheck(`${baseUrl}/sitemap.xml`, [
    validators.isXML(),
    validators.containsURL('https://app.haotool.org/ratewise/'),
    validators.containsURL('https://app.haotool.org/ratewise/guide/'),
  ]);
  results.push({ url: '/sitemap.xml', ...sitemapResult });

  const robotsResult = await deepCheck(`${baseUrl}/robots.txt`, [
    validators.containsText('Sitemap:'),
  ]);
  results.push({ url: '/robots.txt', ...robotsResult });

  // 3. 深層檢查：HTML 內容
  console.log(`\n${colors.gray}[深層檢查] HTML 內容驗證${colors.reset}`);

  const homeResult = await deepCheck(baseUrl, [
    validators.hasTitle('RateWise 匯率好工具 | 即時匯率換算 PWA'),
    validators.hasMetaTag('google-site-verification'),
  ]);
  results.push({ url: '/ (home)', ...homeResult });

  const guideResult = await deepCheck(`${baseUrl}/guide`, [
    validators.hasTitle('使用教學 | RateWise 匯率好工具'),
    validators.containsText('HowTo'),
  ]);
  results.push({ url: '/guide (HowTo)', ...guideResult });

  // 4. 關鍵端點嚴格檢查（不接受 3xx redirect）
  console.log(`\n${colors.gray}[嚴格探測] 關鍵端點 - 不允許 redirect${colors.reset}`);

  const probeResult = await strictProbe(`${baseUrl}/__network_probe__?t=${Date.now()}`);
  results.push({ url: '/__network_probe__', ...probeResult });
  if (!probeResult.success) {
    log(
      colors.yellow,
      '⚠',
      '  → 修復：確認 nginx exact-match location = /ratewise/__network_probe__ 存在並已部署',
    );
  }

  const cspReportResult = await strictProbe(`${baseUrl}/csp-report`, 'POST');
  results.push({ url: '/csp-report (POST)', ...cspReportResult });
  if (!cspReportResult.success) {
    log(
      colors.yellow,
      '⚠',
      '  → 修復：確認 nginx exact-match location = /ratewise/csp-report 存在並已部署',
    );
  }

  // 5. Cloudflare Worker 部署驗證
  console.log(`\n${colors.gray}[Worker 驗證] Cloudflare Security Headers Worker${colors.reset}`);

  const workerResult = await workerDeployCheck(baseUrl, '3.7');
  results.push({ url: 'Worker deployment', ...workerResult });
  if (!workerResult.success) {
    log(colors.yellow, '⚠', '  → 修復：cd security-headers && npx wrangler deploy');
  }

  // 6. 靜態資源檢查
  console.log(`\n${colors.gray}[淺層檢查] 靜態資源${colors.reset}`);

  const staticFiles = [
    '/manifest.webmanifest',
    '/favicon.ico',
    '/robots.txt',
    '/llms.txt',
    '/offline.html',
  ];

  for (const file of staticFiles) {
    const result = await shallowCheck(`${baseUrl}${file}`);
    results.push({ url: file, ...result });
  }

  // 總結
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  const passed = results.filter((r) => r.success).length;
  const total = results.length;
  const allPassed = passed === total;

  if (allPassed) {
    log(colors.green, '✓', `All checks passed (${passed}/${total})`);
  } else {
    log(colors.red, '✗', `${total - passed} checks failed (${passed}/${total})`);
  }
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  return allPassed;
}

/**
 * 主程式
 */
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'both';

  let devPassed = true;
  let prodPassed = true;

  if (mode === 'dev' || mode === 'both') {
    devPassed = await runHealthChecks('http://localhost:4173/ratewise');
  }

  if (mode === 'prod' || mode === 'both') {
    prodPassed = await runHealthChecks('https://app.haotool.org/ratewise');
  }

  const exitCode = devPassed && prodPassed ? 0 : 1;
  process.exit(exitCode);
}

main().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
