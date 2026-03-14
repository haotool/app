#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '../dist');

/**
 * [fix:2025-12-24] 確保 charset 在 head 前 1024 bytes
 * [fix:2026-01-03] 修復 W3C Validator 錯誤：移除重複的 crossorigin 屬性
 * [fix:2026-03-14] 注入 data-cfasync="false" 至 __VITE_REACT_SSG_HASH__ script，
 *                  防止 Cloudflare Rocket Loader 修改 type 屬性，
 *                  導致 window.__VITE_REACT_SSG_HASH__ 永遠是 undefined
 *                  → 造成 static-loader-data-manifest-undefined.json 404 → 骨架屏卡死。
 *                  必須在 origin HTML 就帶此屬性，否則 Rocket Loader 在 sub-request 時
 *                  已先改完 type，Worker HTMLRewriter 的修補為時已晚。
 */
const fixHtmlOutput = (htmlPath) => {
  if (!existsSync(htmlPath)) return;
  let html = fs.readFileSync(htmlPath, 'utf-8');
  const original = html;

  // 1. 確保 charset 是 head 的第一個元素
  const charsetMeta = '<meta charset="UTF-8">';
  // 移除現有的 charset
  html = html.replace(/<meta\s+charset="[^"]*"\s*\/?>/gi, '');
  // 在 <head> 標籤後立即插入 charset
  html = html.replace(/<head([^>]*)>/i, `<head$1>${charsetMeta}`);

  // 2. 修復重複 crossorigin 屬性
  html = html.replace(/crossorigin\s+crossorigin/gi, 'crossorigin');

  // 3. 注入 data-cfasync="false" 到 __VITE_REACT_SSG_HASH__ script。
  //    Rocket Loader 在 CF Worker sub-request 時優先跑，data-cfasync="false" 需在 origin HTML 就存在。
  html = html.replace(
    /(<script)(\s*>window\.__VITE_REACT_SSG_HASH__)/g,
    '$1 data-cfasync="false"$2',
  );

  if (html !== original) {
    fs.writeFileSync(htmlPath, html, 'utf-8');
    console.log(`✅ fixed HTML (charset first, dedup crossorigin, cfasync): ${htmlPath}`);
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
      fixHtmlOutput(fullPath);
    }
  }
};

// 執行 HTML 修復
console.log('🔧 Fixing HTML files (charset position, duplicate crossorigin)...');
fixAllHtmlFiles(distDir);

if (!existsSync(distDir)) {
  console.warn('⚠️ 找不到 dist 目錄，請先執行 pnpm build:ratewise');
  process.exit(0);
}

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

console.log('🎯 完成 dist postbuild 處理（HTML 修復 + fallback 靜態頁）');
