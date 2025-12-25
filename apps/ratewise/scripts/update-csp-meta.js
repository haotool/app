#!/usr/bin/env node
/**
 * Post-SSG CSP 修正工具
 *
 * 問題背景：
 * - vite-plugin-csp-guard 在 HTML 預渲染前就計算 hash，無法涵蓋 vite-react-ssg 後置注入的 inline scripts/styles
 * - 導致 script-src-elem/style-src-elem 缺少必需的 hash（如 __staticRouterHydrationData）
 *
 * 解法：
 * - 於 SSG 完成後重新掃描 dist/*.html
 * - 為所有 inline scripts/styles 計算 SHA-256 hash，更新 CSP meta
 * - 與雲端 CSP 基線對齊（connect-src/img-src/font-src 等）
 */

import crypto from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '../dist');

if (!existsSync(distDir)) {
  console.warn('⚠️ 無 dist 目錄，略過 CSP 修正。');
  process.exit(0);
}

const collectHtmlFiles = (dir) => {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...collectHtmlFiles(fullPath));
    } else if (stats.isFile() && extname(entry) === '.html') {
      files.push(fullPath);
    }
  }
  return files;
};

const hash = (value) => crypto.createHash('sha256').update(value).digest('base64');

const extractHashes = (html) => {
  const scriptHashes = new Set();
  const styleHashes = new Set();

  const scriptRegex = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;

  let match;
  while ((match = scriptRegex.exec(html))) {
    scriptHashes.add(hash(match[1]));
  }

  while ((match = styleRegex.exec(html))) {
    styleHashes.add(hash(match[1]));
  }

  return { scriptHashes, styleHashes };
};

/**
 * [Security:2025-12-25] Strict CSP - Hash-based Strategy
 * 參考: https://web.dev/articles/strict-csp
 * 參考: https://csp.withgoogle.com/docs/strict-csp.html
 */
const buildCsp = ({ scriptHashes }) => {
  // Strict CSP with 'strict-dynamic' and hash-based scripts
  // 'unsafe-inline' and https: are kept for backward compatibility (ignored by modern browsers)
  const scriptSrc = [
    "'self'",
    "'strict-dynamic'",
    'https://static.cloudflareinsights.com',
    'https:',
    "'unsafe-inline'", // Fallback for old browsers (ignored when hashes present)
  ];

  const scriptSrcElem = new Set([
    "'self'",
    'https://static.cloudflareinsights.com',
    ...[...scriptHashes].map((value) => `'sha256-${value}'`),
  ]);

  // 'unsafe-inline' for styles is acceptable (Tailwind CSS 需要)
  const styleSrc = ["'self'", "'unsafe-inline'"];
  const styleSrcElem = new Set(["'self'", "'unsafe-inline'"]);

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    `script-src-elem ${[...scriptSrcElem].join(' ')}`,
    `style-src ${styleSrc.join(' ')}`,
    `style-src-elem ${[...styleSrcElem].join(' ')}`,
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://raw.githubusercontent.com https://cdn.jsdelivr.net https://cloudflareinsights.com https://*.ingest.sentry.io",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // frame-ancestors / report-uri / report-to 由 HTTP headers 設定（meta tag 不支援）
  ];

  return directives.join('; ') + ';';
};

const updateCspMeta = (filePath) => {
  const html = readFileSync(filePath, 'utf-8');
  const { scriptHashes } = extractHashes(html);
  const cspValue = buildCsp({ scriptHashes });

  const metaRegex = /<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/i;
  const newMeta = `<meta http-equiv="Content-Security-Policy" content="${cspValue}">`;

  const nextHtml = metaRegex.test(html)
    ? html.replace(metaRegex, newMeta)
    : html.replace(/<head>/i, `<head>\n${newMeta}`);

  writeFileSync(filePath, nextHtml, 'utf-8');

  console.log(
    `✅ 更新 CSP: ${filePath.replace(distDir, 'dist')} | script hashes=${scriptHashes.size}`,
  );
};

const htmlFiles = collectHtmlFiles(distDir);
htmlFiles.forEach(updateCspMeta);

console.log(`🎯 已更新 ${htmlFiles.length} 個 HTML 檔案的 CSP meta。`);
