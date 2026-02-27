#!/usr/bin/env node
/* eslint-env node */
/* global AbortController, fetch, setTimeout, clearTimeout, console, process */
/**
 * 生產環境 SEO 健康檢查腳本 - 通用版本
 *
 * 功能:
 * 1. 驗證公開 SEO 路徑返回 200
 * 2. 驗證 app-only 路由返回 200，但不出現在 sitemap
 * 3. 驗證 robots / llms / sitemap 內容
 * 4. 驗證圖片資源存在
 * 5. 驗證未知路徑返回真 404
 * 6. 驗證舊資產 URL 正確 301 到新 URL
 *
 * 注意:
 * - requestBaseUrl: 實際抓取位址（可為本地 preview / staging）
 * - canonicalBaseUrl: sitemap / canonical 預期位址（來自 config.siteUrl）
 */

import { discoverApps, loadAppConfig } from './lib/workspace-utils.mjs';
import { getExpectedCanonicalUrl, joinUrl, resolveAuditBaseUrls } from './lib/seo-health-utils.mjs';

const appName = process.argv[2] || 'ratewise';
const customBaseUrl = process.argv.find((arg) => arg.startsWith('--base-url='))?.split('=')[1];

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

async function checkUrl(url, expectedStatus = 200, options = {}) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      method: options.method ?? 'HEAD',
      redirect: options.redirect ?? 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'RateWise-SEO-HealthCheck/2.1',
        ...(options.headers ?? {}),
      },
    });

    clearTimeout(timeout);

    return {
      url,
      status: response.status,
      ok: response.status === expectedStatus,
      error: null,
      body: options.method === 'GET' ? await response.text() : null,
    };
  } catch (error) {
    return {
      url,
      status: null,
      ok: false,
      error: error.message,
      body: null,
    };
  }
}

async function checkRedirect(url, expectedLocation) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'User-Agent': 'RateWise-SEO-HealthCheck/2.1',
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

async function fetchSitemap(requestBaseUrl) {
  return checkUrl(`${requestBaseUrl}/sitemap.xml`, 200, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });
}

async function verifySitemapContent(
  requestBaseUrl,
  canonicalBaseUrl,
  seoPaths,
  appShellPaths = [],
  imageResources = [],
) {
  const response = await fetchSitemap(requestBaseUrl);
  if (!response.ok || response.body == null) {
    return { ok: false, errors: [`無法讀取 sitemap.xml: ${response.error ?? response.status}`] };
  }

  const errors = [];

  for (const path of seoPaths) {
    const expectedUrl = getExpectedCanonicalUrl(canonicalBaseUrl, path);
    if (!response.body.includes(`<loc>${expectedUrl}</loc>`)) {
      errors.push(`sitemap.xml 缺少 canonical 路徑: ${path}`);
    }
  }

  for (const path of appShellPaths) {
    const appUrl = getExpectedCanonicalUrl(canonicalBaseUrl, path);
    if (response.body.includes(`<loc>${appUrl}</loc>`)) {
      errors.push(`app-only 路徑不應出現在 sitemap.xml: ${path}`);
    }
  }

  const hasJpgOgImage = imageResources.some((img) => img.endsWith('.jpg') && img.includes('og-'));
  if (hasJpgOgImage) {
    if (response.body.includes('og-image.png') || response.body.includes('twitter-image.png')) {
      errors.push('sitemap.xml 仍引用舊的 PNG 社交圖片 URL（應為 .jpg）');
    }
  }

  const hreflangMatches = response.body.match(/<xhtml:link/g) || [];
  const expectedCount = seoPaths.length * 2;
  if (hreflangMatches.length !== expectedCount) {
    errors.push(`hreflang 數量錯誤: 期望 ${expectedCount}, 實際 ${hreflangMatches.length}`);
  }

  return { ok: errors.length === 0, errors };
}

async function verifyRobotsContent(requestBaseUrl) {
  const response = await checkUrl(`${requestBaseUrl}/robots.txt`, 200, { method: 'GET' });
  if (!response.ok || response.body == null) {
    return { ok: false, errors: [`無法讀取 robots.txt: ${response.error ?? response.status}`] };
  }

  const errors = [];
  if (!response.body.includes('Sitemap:')) errors.push('robots.txt 缺少 Sitemap 指令');
  if (!response.body.includes('User-agent: *')) errors.push('robots.txt 缺少 User-agent 指令');
  if (!response.body.includes('GPTBot')) errors.push('robots.txt 缺少 AI 爬蟲配置 (GPTBot)');

  return { ok: errors.length === 0, errors };
}

async function verifyLlmsContent(requestBaseUrl, appDisplayName, siteUrl) {
  const response = await checkUrl(`${requestBaseUrl}/llms.txt`, 200, { method: 'GET' });
  if (!response.ok || response.body == null) {
    return { ok: false, errors: [`無法讀取 llms.txt: ${response.error ?? response.status}`] };
  }

  const content = response.body;
  const errors = [];
  const hasH1Title = /^#\s+.+$/m.test(content);
  if (!hasH1Title) errors.push('llms.txt 缺少必需的 H1 標題（# Title）');

  const brandKeyword = appDisplayName.split(/[- ]/)[0];
  if (!content.includes(brandKeyword)) errors.push(`llms.txt 缺少品牌名稱: ${brandKeyword}`);
  if (!content.includes(siteUrl)) errors.push(`llms.txt 缺少網站 URL: ${siteUrl}`);

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
}

async function verify404(requestBaseUrl) {
  const probePath = `/__seo-404-probe-${Date.now()}/`;
  const result = await checkUrl(joinUrl(requestBaseUrl, probePath), 404);
  if (!result.ok) {
    return { ok: false, errors: [`未知路徑應回傳 404，但得到 ${result.status ?? result.error}`] };
  }
  return { ok: true, errors: [] };
}

async function verifyLegacyAssetRedirects(requestBaseUrl, legacyAssetRedirects = {}) {
  const errors = [];
  for (const [from, to] of Object.entries(legacyAssetRedirects)) {
    const result = await checkRedirect(joinUrl(requestBaseUrl, from), joinUrl(requestBaseUrl, to));
    if (!result.ok) {
      errors.push(
        `${from} 未正確 301/308 到 ${to}（目前: ${result.status ?? result.error} ${result.location ?? ''}`.trim() +
          ')',
      );
    }
  }
  return { ok: errors.length === 0, errors };
}

async function main() {
  const app = await loadAppConfig(appName);

  if (!app) {
    const apps = await discoverApps();
    const appNames = apps.map((item) => item.name).join(', ');
    console.error(`❌ App not found: ${appName}`);
    console.error(`\n可用的 apps: ${appNames || '無'}`);
    console.error('用法: node scripts/verify-production-seo.mjs <app-name>');
    process.exit(1);
  }

  const { config } = app;
  const { requestBaseUrl, canonicalBaseUrl } = resolveAuditBaseUrls(config, customBaseUrl);

  console.log(`\n🔍 ${config.displayName} 生產環境 SEO 健康檢查`);
  console.log(`📍 Request Base URL: ${requestBaseUrl}`);
  if (requestBaseUrl !== canonicalBaseUrl) {
    console.log(`🔗 Canonical Base URL: ${canonicalBaseUrl}`);
  }
  console.log('─'.repeat(60));

  let hasErrors = false;

  if (config.basePath?.production && config.basePath.production !== '/') {
    console.log('\n↪️  尾斜線重定向檢查:');
    const redirectUrl = `${requestBaseUrl}/`;
    const redirectResult = await checkRedirect(requestBaseUrl, redirectUrl);

    if (redirectResult.ok) {
      log(colors.green, '✓', `${requestBaseUrl} → ${redirectUrl} (${redirectResult.status})`);
    } else {
      log(
        colors.red,
        '✗',
        `${requestBaseUrl} → ${redirectResult.status || 'ERROR'} (${redirectResult.error || 'Invalid redirect'})`,
      );
      hasErrors = true;
    }
  }

  console.log('\n📄 公開 SEO 頁面 HTTP 狀態檢查:');
  for (const path of config.seoPaths) {
    const url = path === '/' ? `${requestBaseUrl}/` : joinUrl(requestBaseUrl, path);
    const result = await checkUrl(url);
    if (result.ok) {
      log(colors.green, '✓', `${path} → ${result.status}`);
    } else {
      log(colors.red, '✗', `${path} → ${result.status || 'ERROR'} (${result.error || 'Non-200'})`);
      hasErrors = true;
    }
  }

  if (Array.isArray(config.appShellPaths) && config.appShellPaths.length > 0) {
    console.log('\n📱 App-only 路由 HTTP 狀態檢查:');
    for (const path of config.appShellPaths) {
      const result = await checkUrl(joinUrl(requestBaseUrl, path));
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
  }

  console.log('\n📁 SEO 配置文件檢查:');
  for (const file of config.resources.seoFiles) {
    const result = await checkUrl(joinUrl(requestBaseUrl, file));
    if (result.ok) {
      log(colors.green, '✓', `${file} → ${result.status}`);
    } else {
      log(colors.red, '✗', `${file} → ${result.status || 'ERROR'} (${result.error || 'Non-200'})`);
      hasErrors = true;
    }
  }

  console.log('\n🗺️ Sitemap 內容驗證:');
  const sitemapResult = await verifySitemapContent(
    requestBaseUrl,
    canonicalBaseUrl,
    config.seoPaths,
    config.appShellPaths,
    config.resources?.images ?? [],
  );
  if (sitemapResult.ok) {
    log(colors.green, '✓', 'sitemap.xml 內容正確');
  } else {
    sitemapResult.errors.forEach((error) => log(colors.red, '✗', error));
    hasErrors = true;
  }

  console.log('\n🤖 Robots.txt 內容驗證:');
  const robotsResult = await verifyRobotsContent(requestBaseUrl);
  if (robotsResult.ok) {
    log(colors.green, '✓', 'robots.txt 內容正確');
  } else {
    robotsResult.errors.forEach((error) => log(colors.red, '✗', error));
    hasErrors = true;
  }

  if (config.resources.seoFiles.includes('/llms.txt')) {
    console.log('\n🤖 LLMs.txt 內容驗證:');
    const llmsResult = await verifyLlmsContent(requestBaseUrl, config.displayName, config.siteUrl);
    if (llmsResult.ok) {
      log(colors.green, '✓', 'llms.txt 內容正確');
    } else {
      llmsResult.errors.forEach((error) => log(colors.red, '✗', error));
      hasErrors = true;
    }
  }

  console.log('\n🖼️  圖片資源檢查:');
  for (const image of config.resources.images) {
    const result = await checkUrl(joinUrl(requestBaseUrl, image));
    if (result.ok) {
      log(colors.green, '✓', `${image} → ${result.status}`);
    } else {
      log(
        colors.yellow,
        '⚠',
        `${image} → ${result.status || 'ERROR'} (${result.error || 'Non-200'})`,
      );
    }
  }

  console.log('\n🚫 真 404 驗證:');
  const notFoundResult = await verify404(requestBaseUrl);
  if (notFoundResult.ok) {
    log(colors.green, '✓', '未知路徑正確回傳 404');
  } else {
    notFoundResult.errors.forEach((error) => log(colors.red, '✗', error));
    hasErrors = true;
  }

  if (config.legacyAssetRedirects) {
    console.log('\n🔁 舊資產重定向驗證:');
    const legacyRedirects = await verifyLegacyAssetRedirects(
      requestBaseUrl,
      config.legacyAssetRedirects,
    );
    if (legacyRedirects.ok) {
      log(colors.green, '✓', '舊資產 URL 正確重定向');
    } else {
      legacyRedirects.errors.forEach((error) => log(colors.red, '✗', error));
      hasErrors = true;
    }
  }

  console.log('\n' + '─'.repeat(60));
  if (hasErrors) {
    log(colors.red, '❌', `${config.displayName} SEO 健康檢查失敗！`);
    process.exit(1);
  }

  log(colors.green, '✅', `${config.displayName} SEO 健康檢查通過！`);
  process.exit(0);
}

main().catch((error) => {
  console.error('健康檢查腳本錯誤:', error);
  process.exit(1);
});
