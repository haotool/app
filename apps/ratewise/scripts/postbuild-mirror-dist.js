#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

console.log(`🎯 完成 dist 子路徑鏡像輸出：/dist/${normalizedSubpath}`);
