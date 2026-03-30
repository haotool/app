#!/usr/bin/env node
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '../dist');

/**
 * [fix:2025-12-24] 確保 charset 在 head 前 1024 bytes
 * [fix:2026-01-03] 修復 W3C Validator 錯誤：移除重複的 crossorigin 屬性
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

  if (html !== original) {
    fs.writeFileSync(htmlPath, html, 'utf-8');
    console.log(`✅ fixed HTML (charset first, dedup crossorigin): ${htmlPath}`);
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

console.log('🎯 完成 dist postbuild 處理（HTML 修復）');
