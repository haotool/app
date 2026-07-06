#!/usr/bin/env node
/**
 * 一次性 QA 截圖：內容頁骨架重構前後對比（三視口＋PWA standalone safe-area 模擬）。
 * 以本機靜態伺服器掛載 baseline 與 current 兩份 dist（base path /ratewise/），
 * standalone 模擬：請求帶 x-safe-area header 時，將 CSS/HTML 內的
 * env(safe-area-inset-top…) 置換為 59px（iPhone 14 Pro 動態島）。
 * 用法：node scripts/qa/screenshot-content-pages.mjs <baselineDist> <currentDist> <outDir>
 */

import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { chromium } from '@playwright/test';

const [baselineDist, currentDist, outDir] = process.argv.slice(2);
if (!baselineDist || !currentDist || !outDir) {
  console.error('用法：node scripts/qa/screenshot-content-pages.mjs <baseline> <current> <out>');
  process.exit(2);
}
mkdirSync(outDir, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function serveDist(distRoot, port) {
  const server = createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    let pathname = decodeURIComponent(url.pathname).replace(/^\/ratewise/, '') || '/';
    if (pathname.endsWith('/')) pathname += 'index.html';
    let file = resolve(distRoot, pathname.replace(/^\/+/, ''));
    if (!existsSync(file)) {
      const asDir = resolve(distRoot, pathname.replace(/^\/+/, ''), 'index.html');
      if (existsSync(asDir)) file = asDir;
      else {
        res.writeHead(404).end('not found');
        return;
      }
    }
    const ext = extname(file);
    let body = readFileSync(file);
    if (req.headers['x-safe-area'] && (ext === '.css' || ext === '.html')) {
      const px = `${Number(req.headers['x-safe-area'])}px`;
      body = Buffer.from(
        body
          .toString('utf-8')
          .replace(/env\(safe-area-inset-top\s*,\s*0(?:px)?\)/g, px)
          .replace(/env\(safe-area-inset-top\)/g, px),
      );
    }
    res.writeHead(200, { 'content-type': MIME[ext] ?? 'application/octet-stream' });
    res.end(body);
  });
  return new Promise((resolveStart) => server.listen(port, () => resolveStart(server)));
}

const PAGES = [
  ['faq', '/ratewise/faq/'],
  ['guide', '/ratewise/guide/'],
  ['about', '/ratewise/about/'],
];
const VIEWPORTS = [
  ['mobile-390', { width: 390, height: 844 }],
  ['tablet-768', { width: 768, height: 1024 }],
  ['desktop-1440', { width: 1440, height: 900 }],
];

const baselineServer = await serveDist(resolve(baselineDist), 4181);
const currentServer = await serveDist(resolve(currentDist), 4182);
const browser = await chromium.launch();

const consoleErrors = [];
async function shoot(label, port, safeArea) {
  for (const [vpName, viewport] of VIEWPORTS) {
    if (safeArea && vpName !== 'mobile-390') continue;
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 2,
      extraHTTPHeaders: safeArea ? { 'x-safe-area': String(safeArea) } : {},
    });
    const page = await context.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`${label}-${vpName}: ${msg.text()}`);
    });
    for (const [pageName, path] of PAGES) {
      await page.goto(`http://localhost:${port}${path}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      const suffix = safeArea ? `-standalone${safeArea}` : '';
      await page.screenshot({ path: `${outDir}/${label}-${pageName}-${vpName}${suffix}-top.png` });
      // 滾動後：驗證頂列隨內容滾走（after）／sticky 壓內容（before）。
      // hydration 後 router scroll restoration 可能重置捲動，故等待後重複捲動並驗證。
      await page.waitForTimeout(800);
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(300);
      const scrollY = await page.evaluate(() => {
        window.scrollTo(0, 500);
        return window.scrollY;
      });
      await page.waitForTimeout(300);
      if (scrollY === 0) console.warn(`WARN ${label} ${pageName} ${vpName} 捲動未生效`);
      await page.screenshot({
        path: `${outDir}/${label}-${pageName}-${vpName}${suffix}-scrolled.png`,
      });
    }
    await context.close();
  }
}

await shoot('before', 4181, null);
await shoot('after', 4182, null);
await shoot('before', 4181, 59);
await shoot('after', 4182, 59);

await browser.close();
baselineServer.close();
currentServer.close();
console.log(`截圖完成 → ${outDir}`);
if (consoleErrors.length > 0) {
  console.log(`console errors（${consoleErrors.length}）：`);
  for (const err of consoleErrors.slice(0, 10)) console.log(`  ${err}`);
}
