#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '../dist');

/**
 * [fix:2025-12-24] 移除 CSP meta tag，確保 charset 在 head 前 1024 bytes
 * [fix:2026-01-03] 修復 W3C Validator 錯誤：移除重複的 crossorigin 屬性
 * CSP 由 Nginx HTTP header 提供，meta tag 會導致 Lighthouse 警告
 * 參考: https://web.dev/articles/csp (推薦使用 HTTP header)
 */
const fixHtmlCharsetAndRemoveCSP = (htmlPath) => {
  if (!existsSync(htmlPath)) return;
  let html = fs.readFileSync(htmlPath, 'utf-8');
  const original = html;

  // 1. 移除 CSP meta tag（vite-plugin-csp-guard 生成的）
  html = html.replace(/<meta\s+http-equiv="Content-Security-Policy"[^>]*>/gi, '');

  // 2. 確保 charset 是 head 的第一個元素
  const charsetMeta = '<meta charset="UTF-8">';
  // 移除現有的 charset
  html = html.replace(/<meta\s+charset="[^"]*"\s*\/?>/gi, '');
  // 在 <head> 標籤後立即插入 charset
  html = html.replace(/<head([^>]*)>/i, `<head$1>${charsetMeta}`);

  // 3. [fix:2026-01-03] 修復 vite-plugin-csp-guard SRI 造成的重複 crossorigin 屬性
  // W3C Validator 報錯: "Duplicate attribute crossorigin"
  // 問題: SRI 功能會注入 crossorigin，但如果元素已有 crossorigin 就會重複
  html = html.replace(/crossorigin\s+crossorigin/gi, 'crossorigin');

  if (html !== original) {
    fs.writeFileSync(htmlPath, html, 'utf-8');
    console.log(`✅ fixed HTML (removed CSP meta, charset first, dedup crossorigin): ${htmlPath}`);
  }
};

// 修復所有 HTML 文件
const fixAllHtmlFiles = (dir) => {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      fixAllHtmlFiles(fullPath);
    } else if (entry.name.endsWith('.html')) {
      fixHtmlCharsetAndRemoveCSP(fullPath);
    }
  }
};

// 執行 HTML 修復
console.log('🔧 Fixing HTML files (charset position, removing CSP meta tag)...');
fixAllHtmlFiles(distDir);

const basePath = process.env.VITE_RATEWISE_BASE_PATH ?? '/ratewise/';
const normalizedSubpath = basePath.replace(/^\/+|\/+$/g, '');

if (!normalizedSubpath) {
  console.log('ℹ️ VITE_BASE_PATH 指向根目錄，略過 dist mirrored。');
  process.exit(0);
}

if (!existsSync(distDir)) {
  console.warn('⚠️ 找不到 dist 目錄，請先執行 pnpm build:ratewise');
  process.exit(0);
}

const targetDir = join(distDir, normalizedSubpath);
mkdirSync(targetDir, { recursive: true });

const copyDirectory = (name) => {
  const source = join(distDir, name);
  if (!existsSync(source) || !statSync(source).isDirectory()) {
    console.warn(`⚠️ 略過不存在的資料夾: ${name}`);
    return;
  }
  const destination = join(targetDir, name);
  rmSync(destination, { recursive: true, force: true });
  cpSync(source, destination, { recursive: true });
  console.log(`✅ mirrored /${name} -> /${normalizedSubpath}/${name}`);
};

const copyFile = (name) => {
  const source = join(distDir, name);
  if (!existsSync(source) || !statSync(source).isFile()) {
    console.warn(`⚠️ 略過不存在的檔案: ${name}`);
    return;
  }
  const destination = join(targetDir, name);
  cpSync(source, destination, { recursive: false });
  console.log(`✅ mirrored ${name} -> /${normalizedSubpath}/${name}`);
};

['assets', 'icons', 'screenshots', 'optimized'].forEach(copyDirectory);

// [fix:2026-01-08] SSOT: 所有需要鏡像到子路徑的靜態檔案
// 關鍵：offline.html 必須存在於 /ratewise/offline.html
// 否則 Service Worker 預快取會 404，導致 SW 安裝失敗
// 參考: https://github.com/GoogleChrome/workbox/issues/2737
const staticFiles = [
  'sw.js',
  'sw.js.map',
  'registerSW.js',
  'manifest.webmanifest',
  'apple-touch-icon.png',
  'favicon.ico',
  'favicon.svg',
  'pwa-192x192.png',
  'pwa-384x384.png',
  'pwa-512x512.png',
  'pwa-512x512-maskable.png',
  'logo.png',
  'og-image.png',
  'twitter-image.png',
  'loading.css',
  'sitemap.xml',
  'robots.txt',
  'llms.txt',
  'offline.html', // [fix:2026-01-08] 離線備援頁面必須鏡像，否則 SW 預快取 404
];
staticFiles.forEach(copyFile);

// 追加需要鏡像的靜態資產，避免 manifest/icon 404
const mirroredFiles = [
  'manifest.webmanifest',
  'favicon.ico',
  'favicon.svg',
  'apple-touch-icon.png',
  'loading.css',
];
mirroredFiles.forEach(copyFile);

const mirroredDirs = ['icons', 'optimized', 'screenshots'];
mirroredDirs.forEach(copyDirectory);

const workboxFiles = readdirSync(distDir).filter(
  (filename) =>
    filename.startsWith('workbox-') && (filename.endsWith('.js') || filename.endsWith('.js.map')),
);
workboxFiles.forEach(copyFile);

/**
 * Fallback 靜態頁面生成（避免 SSG 未輸出時 FAQ/About 缺檔）
 * - 以 dist/index.html 為模板
 * - 覆寫 title/description/canonical/OG 欄位
 */
const ensureStaticPage = (routePath, meta) => {
  const normalizedRoute = routePath.replace(/\/+$/, '');
  const outputDir = join(distDir, normalizedRoute.replace(/^\//, ''), '/');
  const outputPath = join(outputDir, 'index.html');

  // 如果 SSG 已經產出對應檔案，尊重現有內容（避免覆寫造成 Hydration mismatch）
  if (existsSync(outputPath)) {
    console.log(`ℹ️ 已存在 SSG 預渲染檔案，跳過 fallback 生成：${routePath}`);
    return;
  }

  const templatePath = join(distDir, 'index.html');
  if (!existsSync(templatePath)) {
    console.warn('⚠️ 無法生成靜態頁面：缺少 dist/index.html');
    return;
  }

  const html = fs.readFileSync(templatePath, 'utf-8');
  mkdirSync(outputDir, { recursive: true });

  const replaceTag = (source, regex, replacement, label) => {
    const updated = source.replace(regex, replacement);
    if (updated === source) {
      console.warn(`⚠️ 未能覆寫 ${label}，請檢查模板結構`);
    }
    return updated;
  };
  const canonHref =
    normalizedRoute === '/'
      ? 'https://app.haotool.org/ratewise/'
      : `https://app.haotool.org/ratewise${normalizedRoute}/`;

  let result = html;
  result = replaceTag(result, /<title>[\s\S]*?<\/title>/, `<title>${meta.title}</title>`, 'title');
  result = replaceTag(
    result,
    /<meta[^>]*name=["']description["'][^>]*>/,
    `<meta name="description" content="${meta.description}">`,
    'description',
  );
  result = replaceTag(
    result,
    /<meta[^>]*name=["']keywords["'][^>]*>/,
    `<meta name="keywords" content="${meta.keywords}">`,
    'keywords',
  );
  result = replaceTag(
    result,
    /<meta[^>]*property=["']og:title["'][^>]*>/,
    `<meta property="og:title" content="${meta.title}">`,
    'og:title',
  );
  result = replaceTag(
    result,
    /<meta[^>]*property=["']og:description["'][^>]*>/,
    `<meta property="og:description" content="${meta.description}">`,
    'og:description',
  );
  result = replaceTag(
    result,
    /<meta[^>]*property=["']og:url["'][^>]*>/,
    `<meta property="og:url" content="${canonHref}">`,
    'og:url',
  );
  result = replaceTag(
    result,
    /<link[^>]*rel=["']canonical["'][^>]*>/,
    `<link rel="canonical" href="${canonHref}">`,
    'canonical',
  );

  fs.writeFileSync(join(outputDir, 'index.html'), result, 'utf-8');
  console.log(`✅ generated fallback static page: ${routePath || '/'}`);
};

ensureStaticPage('/faq', {
  title: '常見問題 | RateWise 匯率好工具',
  description:
    'RateWise 常見問題：匯率來源、支援貨幣、離線使用、更新頻率、安裝方式，幫助你快速上手。',
  keywords:
    'RateWise FAQ,匯率常見問題,匯率來源,離線使用,匯率更新頻率,匯率換算問題,臺灣銀行匯率,多幣別換算',
});

ensureStaticPage('/about', {
  title: '關於我們 | RateWise 匯率好工具',
  description:
    'RateWise 是以臺灣銀行牌告匯率為基礎的即時匯率換算 PWA，專注提供快速、準確、離線可用的匯率工具。',
  keywords: 'RateWise 關於我們,匯率換算工具,即時匯率,PWA 匯率,臺灣銀行匯率,多幣別換算,離線匯率',
});

console.log(`🎯 完成 dist 子路徑鏡像輸出：/dist/${normalizedSubpath}`);
