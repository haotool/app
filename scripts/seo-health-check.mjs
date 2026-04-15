#!/usr/bin/env node
// RateWise SEO smoke check：驗證 sitemap、robots、llms、路由 SSOT 與 head 管理架構。

import { readFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { INDEXABLE_CANONICAL_PATHS } from '../apps/ratewise/seo-paths.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const RATEWISE_DIR = join(ROOT_DIR, 'apps/ratewise');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const log = {
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}📋 ${msg}${colors.reset}\n${'='.repeat(50)}`),
  info: (msg) => console.log(`   ${msg}`),
};

let errorCount = 0;
let warningCount = 0;
let successCount = 0;

/**
 * 檢查 sitemap.xml
 */
function checkSitemap() {
  log.section('檢查 Sitemap.xml');

  const sitemapPath = join(RATEWISE_DIR, 'public/sitemap.xml');

  if (!existsSync(sitemapPath)) {
    log.error('sitemap.xml 不存在');
    errorCount++;
    return [];
  }

  const content = readFileSync(sitemapPath, 'utf-8');
  const urlRegex = /<loc>(.*?)<\/loc>/g;
  const urls = [...content.matchAll(urlRegex)].map((match) => match[1]);

  urls.forEach((url) => {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    if (/[A-Z]/.test(pathname)) {
      log.error(`URL 包含大寫字母: ${url}`);
      errorCount++;
    } else if (!pathname.endsWith('/')) {
      log.error(`URL 缺少尾斜線: ${url}`);
      errorCount++;
    } else {
      successCount++;
    }
  });

  log.success(`Sitemap 檢查完成：${urls.length} 個 URL`);
  return urls;
}

/**
 * 檢查 robots.txt
 */
function checkRobotsTxt() {
  log.section('檢查 robots.txt');

  const robotsPath = join(RATEWISE_DIR, 'public/robots.txt');

  if (!existsSync(robotsPath)) {
    log.error('robots.txt 不存在');
    errorCount++;
    return;
  }

  const content = readFileSync(robotsPath, 'utf-8');

  // 檢查必要內容
  if (!content.includes('User-agent:')) {
    log.error('robots.txt 缺少 User-agent 指令');
    errorCount++;
  } else {
    successCount++;
  }

  if (!content.includes('Sitemap:')) {
    log.warning('robots.txt 缺少 Sitemap 指令');
    warningCount++;
  } else {
    // 驗證 Sitemap URL
    const sitemapMatch = content.match(/Sitemap:\s*(.+)/);
    if (sitemapMatch) {
      const sitemapUrl = sitemapMatch[1].trim();
      if (!sitemapUrl.startsWith('https://')) {
        log.error(`Sitemap URL 應使用 HTTPS: ${sitemapUrl}`);
        errorCount++;
      } else {
        successCount++;
      }
    }
  }

  log.success('robots.txt 檢查完成');
}

/**
 * 檢查 llms.txt
 */
function checkLlmsTxt() {
  log.section('檢查 llms.txt');

  const llmsPath = join(RATEWISE_DIR, 'public/llms.txt');

  if (!existsSync(llmsPath)) {
    log.warning('llms.txt 不存在（可選文件）');
    warningCount++;
    return;
  }

  const content = readFileSync(llmsPath, 'utf-8');

  // 檢查 URL 格式 - 只匹配完整的 URL（以空白、換行、括號結尾）
  const urlRegex = /https?:\/\/[^\s\)\]\>]+/g;
  const urls = content.match(urlRegex) || [];

  urls.forEach((url) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const hostname = urlObj.hostname;

      // 跳過外部連結（僅允許 haotool.org 及其子域名）
      if (hostname !== 'haotool.org' && !hostname.endsWith('.haotool.org')) {
        return;
      }

      // decodeURIComponent 先還原 %XX，避免 percent-encoded 非 ASCII 字元的大寫 hex 誤判
      if (/[A-Z]/.test(decodeURIComponent(pathname))) {
        log.error(`llms.txt URL 包含大寫字母: ${url}`);
        errorCount++;
      } else if (pathname !== '/' && !pathname.endsWith('/') && extname(pathname) === '') {
        log.error(`llms.txt URL 缺少尾斜線: ${url}`);
        errorCount++;
      } else {
        successCount++;
      }
    } catch {
      // 忽略無效 URL
    }
  });

  log.success(`llms.txt 檢查完成：${urls.length} 個 URL`);
}

function checkRoutesConsistency(sitemapUrls) {
  log.section('檢查 Routes 與 Sitemap 一致性');

  const routePaths = INDEXABLE_CANONICAL_PATHS.map((path) =>
    path === '/' ? '/' : path.replace(/\/+$/, ''),
  );

  const sitemapPaths = sitemapUrls.map((url) => {
    const urlObj = new URL(url);
    let pathname = urlObj.pathname;
    pathname = pathname.replace(/^\/ratewise/, '');
    if (pathname !== '/') {
      pathname = pathname.replace(/\/+$/, '');
    }
    return pathname || '/';
  });

  const uniqueRoutePaths = [...new Set(routePaths)];
  const uniqueSitemapPaths = [...new Set(sitemapPaths)];

  log.info(`SSOT 路徑: ${uniqueRoutePaths.join(', ')}`);
  log.info(`Sitemap 路徑: ${uniqueSitemapPaths.join(', ')}`);

  uniqueRoutePaths.forEach((path) => {
    if (!uniqueSitemapPaths.includes(path)) {
      log.warning(`路徑在 seo-paths SSOT 中但不在 sitemap.xml 中: ${path}`);
      warningCount++;
    } else {
      successCount++;
    }
  });

  uniqueSitemapPaths.forEach((path) => {
    if (!uniqueRoutePaths.includes(path)) {
      log.warning(`路徑在 sitemap.xml 中但不在 seo-paths SSOT 中: ${path}`);
      warningCount++;
    }
  });

  log.success('Routes 一致性檢查完成');
}

function checkCanonicalUrl() {
  log.section('檢查 Canonical URL');

  const indexPath = join(RATEWISE_DIR, 'index.html');
  const seoHelmetPath = join(RATEWISE_DIR, 'src/components/SEOHelmet.tsx');

  if (!existsSync(indexPath)) {
    log.error('index.html 不存在');
    errorCount++;
    return;
  }

  const content = readFileSync(indexPath, 'utf-8');

  // 檢查 canonical link
  const canonicalMatch = content.match(
    /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i,
  );

  if (canonicalMatch) {
    const canonicalUrl = canonicalMatch[1];

    if (!canonicalUrl.endsWith('/')) {
      log.error(`Canonical URL 缺少尾斜線: ${canonicalUrl}`);
      errorCount++;
      return;
    }

    if (/[A-Z]/.test(decodeURIComponent(new URL(canonicalUrl).pathname))) {
      log.error(`Canonical URL 包含大寫字母: ${canonicalUrl}`);
      errorCount++;
      return;
    }

    successCount++;
    log.success(`Canonical URL 正確: ${canonicalUrl}`);
    return;
  }

  if (!existsSync(seoHelmetPath)) {
    log.warning('index.html 未宣告 canonical，且找不到 SEOHelmet 動態管理來源');
    warningCount++;
    return;
  }

  const seoHelmetContent = readFileSync(seoHelmetPath, 'utf-8');
  const managesCanonical =
    seoHelmetContent.includes('rel="canonical"') &&
    seoHelmetContent.includes('upsertLink(\'link[rel="canonical"]\'');

  if (managesCanonical) {
    successCount++;
    log.success('index.html 無硬編碼 canonical，改由 SEOHelmet 動態管理 canonical。');
    return;
  }

  log.warning('index.html 未宣告 canonical，且 SEOHelmet 未顯示接管 canonical 管理');
  warningCount++;
}

/**
 * 檢查 Web Vitals 監測配置（VSI/INP）
 */
function checkWebVitalsMonitoring() {
  log.section('檢查 Web Vitals 監測配置');

  const vitalsPath = join(RATEWISE_DIR, 'src/utils/webVitals.ts');
  const reportPath = join(RATEWISE_DIR, 'src/utils/reportWebVitals.ts');

  if (!existsSync(vitalsPath)) {
    log.error('webVitals.ts 不存在');
    errorCount++;
    return;
  }

  if (!existsSync(reportPath)) {
    log.error('reportWebVitals.ts 不存在');
    errorCount++;
    return;
  }

  const vitalsContent = readFileSync(vitalsPath, 'utf-8');

  if (!vitalsContent.includes('reportAllChanges')) {
    log.warning('webVitals.ts 未啟用 reportAllChanges（可能缺少 VSI/INP 全生命週期觀測）');
    warningCount++;
  } else {
    successCount++;
  }

  if (!vitalsContent.includes('VSI')) {
    log.warning('webVitals.ts 未包含 VSI 回報');
    warningCount++;
  } else {
    successCount++;
  }

  if (!vitalsContent.includes('durationThreshold')) {
    log.warning('webVitals.ts 未設定 INP durationThreshold');
    warningCount++;
  } else {
    successCount++;
  }

  log.success('Web Vitals 監測配置檢查完成');
}

/**
 * 主函數
 */
async function main() {
  console.log(`\n${colors.cyan}🔍 RateWise SEO Health Check${colors.reset}`);
  console.log(`${colors.cyan}================================${colors.reset}\n`);

  // 執行所有檢查
  const sitemapUrls = checkSitemap();
  checkRobotsTxt();
  checkLlmsTxt();
  checkRoutesConsistency(sitemapUrls);
  checkCanonicalUrl();
  checkWebVitalsMonitoring();

  // 輸出結果
  console.log(`\n${colors.cyan}📊 檢查結果摘要${colors.reset}`);
  console.log(`${'='.repeat(50)}`);
  log.success(`通過: ${successCount} 項`);
  if (warningCount > 0) {
    log.warning(`警告: ${warningCount} 項`);
  }
  if (errorCount > 0) {
    log.error(`錯誤: ${errorCount} 項`);
  }

  console.log('');

  if (errorCount > 0) {
    log.error(`發現 ${errorCount} 個錯誤，請修復後再提交`);
    process.exit(1);
  } else if (warningCount > 0) {
    log.warning(`發現 ${warningCount} 個警告，建議檢查`);
    log.success('🎉 無阻塞性錯誤，檢查通過！');
    process.exit(0);
  } else {
    log.success('🎉 所有檢查通過！');
    process.exit(0);
  }
}

main().catch((error) => {
  log.error(`執行失敗: ${error.message}`);
  process.exit(1);
});
