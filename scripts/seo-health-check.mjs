#!/usr/bin/env node
/**
 * SEO Health Check Script
 * 
 * [BDD:2025-12-01] 自動化 SEO 健康檢查
 * [SEO:2025-12-01] 全局驗證 URL 一致性、尾斜線、大小寫
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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
};

let errorCount = 0;
let successCount = 0;

function checkSitemap() {
  log.section('檢查 Sitemap.xml');
  
  const sitemapPath = join(RATEWISE_DIR, 'public/sitemap.xml');
  
  if (!existsSync(sitemapPath)) {
    log.error('sitemap.xml 不存在');
    errorCount++;
    return;
  }
  
  const content = readFileSync(sitemapPath, 'utf-8');
  const urlRegex = /<loc>(.*?)<\/loc>/g;
  const urls = [...content.matchAll(urlRegex)].map(match => match[1]);
  
  urls.forEach(url => {
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
}

async function main() {
  console.log(`\n${colors.cyan}🔍 RateWise SEO Health Check${colors.reset}\n`);
  
  checkSitemap();
  
  console.log(`\n${colors.cyan}檢查結果：${colors.reset}`);
  log.success(`通過: ${successCount} 項`);
  log.error(`錯誤: ${errorCount} 項`);
  
  if (errorCount > 0) {
    log.error(`發現 ${errorCount} 個錯誤`);
    process.exit(1);
  } else {
    log.success('🎉 所有檢查通過！');
    process.exit(0);
  }
}

main().catch(error => {
  log.error(`執行失敗: ${error.message}`);
  process.exit(1);
});
