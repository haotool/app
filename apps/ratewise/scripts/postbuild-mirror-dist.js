#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '../dist');

const basePath = process.env.VITE_BASE_PATH ?? '/ratewise/';
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
  const templatePath = join(distDir, 'index.html');
  if (!existsSync(templatePath)) {
    console.warn('⚠️ 無法生成靜態頁面：缺少 dist/index.html');
    return;
  }

  const html = fs.readFileSync(templatePath, 'utf-8');
  const normalizedRoute = routePath.replace(/\/+$/, '');
  const outputDir = join(distDir, normalizedRoute.replace(/^\//, ''), '/');
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
