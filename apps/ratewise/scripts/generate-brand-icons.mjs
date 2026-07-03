#!/usr/bin/env node
/**
 * HaoRate 品牌圖示生成腳本 — 由 source-images/brand/*.svg master 產出全部 PWA / favicon 資產
 *
 * SSOT：
 * - master 來源：scripts/source-images/brand/haorate-icon-{squircle,square,maskable}.svg
 * - 檔名與尺寸對齊 generate-manifest.mjs 的 icons 清單與 index.html 的 favicon 連結
 *
 * 產出：
 * - public/favicon.svg（squircle master 原樣複製）
 * - public/favicon.ico（16/32/48 PNG-ICO）
 * - public/logo.png + logo.webp（256，squircle 帶透明圓角）
 * - public/apple-touch-icon.png（180，滿版方形）
 * - public/icons/haorate-icon-{N}x{N}.png（滿版方形）
 * - public/icons/haorate-icon-maskable-{N}x{N}.png（安全區 82%）
 * - public/pwa-{N}x{N}.png 與 pwa-512x512-maskable.png
 *
 * 用法：node scripts/generate-brand-icons.mjs
 * 之後執行 pnpm optimize:images 重建 public/optimized/ 衍生檔。
 */

import sharp from 'sharp';
import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BRAND_DIR = join(__dirname, 'source-images/brand');
const PUBLIC_DIR = join(__dirname, '../public');

const MASTERS = {
  squircle: join(BRAND_DIR, 'haorate-icon-squircle.svg'),
  square: join(BRAND_DIR, 'haorate-icon-square.svg'),
  maskable: join(BRAND_DIR, 'haorate-icon-maskable.svg'),
};

/** manifest 與各平台引用的方形圖示尺寸（對齊 public/icons/ 既有檔名） */
const ICON_SIZES = [32, 48, 64, 72, 96, 120, 128, 144, 152, 167, 180, 192, 256, 384, 512, 1024];
const MASKABLE_SIZES = [512, 1024];
const PWA_ROOT_SIZES = [192, 384, 512];
const FAVICON_ICO_SIZES = [16, 32, 48];

/** SVG viewBox 為 100，依目標尺寸換算 density 讓 librsvg 直接輸出向量精度 */
async function renderPng(svgPath, size) {
  const svg = await readFile(svgPath);
  const density = (72 * size) / 100;
  return sharp(svg, { density }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
}

/** 以 PNG-ICO 格式打包（Vista+ 與所有現代瀏覽器支援 PNG 條目） */
function packIco(entries) {
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const dirSize = 16 * count;
  let offset = 6 + dirSize;
  const dirs = [];
  for (const { size, buf } of entries) {
    const dir = Buffer.alloc(16);
    dir.writeUInt8(size >= 256 ? 0 : size, 0);
    dir.writeUInt8(size >= 256 ? 0 : size, 1);
    dir.writeUInt8(0, 2);
    dir.writeUInt8(0, 3);
    dir.writeUInt16LE(1, 4);
    dir.writeUInt16LE(32, 6);
    dir.writeUInt32LE(buf.length, 8);
    dir.writeUInt32LE(offset, 12);
    dirs.push(dir);
    offset += buf.length;
  }
  return Buffer.concat([header, ...dirs, ...entries.map((e) => e.buf)]);
}

async function main() {
  await mkdir(join(PUBLIC_DIR, 'icons'), { recursive: true });
  const written = [];

  // 1. favicon.svg（squircle master 原樣）
  await copyFile(MASTERS.squircle, join(PUBLIC_DIR, 'favicon.svg'));
  written.push('favicon.svg');

  // 2. favicon.ico（16/32/48 PNG-ICO，squircle）
  const icoEntries = [];
  for (const size of FAVICON_ICO_SIZES) {
    icoEntries.push({ size, buf: await renderPng(MASTERS.squircle, size) });
  }
  await writeFile(join(PUBLIC_DIR, 'favicon.ico'), packIco(icoEntries));
  written.push('favicon.ico');

  // 3. logo.png / logo.webp（256，squircle 帶透明圓角）
  const logo256 = await renderPng(MASTERS.squircle, 256);
  await writeFile(join(PUBLIC_DIR, 'logo.png'), logo256);
  await writeFile(
    join(PUBLIC_DIR, 'logo.webp'),
    await sharp(logo256).webp({ quality: 90 }).toBuffer(),
  );
  written.push('logo.png', 'logo.webp');

  // 4. apple-touch-icon.png（180，滿版方形、不透明）
  await writeFile(join(PUBLIC_DIR, 'apple-touch-icon.png'), await renderPng(MASTERS.square, 180));
  written.push('apple-touch-icon.png');

  // 5. icons/haorate-icon-*.png（滿版方形）
  for (const size of ICON_SIZES) {
    const name = `icons/haorate-icon-${size}x${size}.png`;
    await writeFile(join(PUBLIC_DIR, name), await renderPng(MASTERS.square, size));
    written.push(name);
  }

  // 6. icons/haorate-icon-maskable-*.png（安全區 82%）
  for (const size of MASKABLE_SIZES) {
    const name = `icons/haorate-icon-maskable-${size}x${size}.png`;
    await writeFile(join(PUBLIC_DIR, name), await renderPng(MASTERS.maskable, size));
    written.push(name);
  }

  // 7. 根目錄 pwa-*.png（沿用既有檔名）
  for (const size of PWA_ROOT_SIZES) {
    const name = `pwa-${size}x${size}.png`;
    await writeFile(join(PUBLIC_DIR, name), await renderPng(MASTERS.square, size));
    written.push(name);
  }
  await writeFile(
    join(PUBLIC_DIR, 'pwa-512x512-maskable.png'),
    await renderPng(MASTERS.maskable, 512),
  );
  written.push('pwa-512x512-maskable.png');

  console.log(`generated ${written.length} files:`);
  for (const name of written) console.log(`  - ${name}`);
}

main().catch((error) => {
  console.error('brand icon generation failed:', error);
  process.exit(1);
});
