#!/usr/bin/env node
/**
 * RateWise live UX audit — 5 viewports × 12 routes.
 * Output: screenshots/ux-audit-2026-06-30b-*.png + apps/ratewise/screenshots/ux-audit-results-2026-06-30b.json
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BASE = (process.env.AUDIT_BASE_URL ?? 'https://app.haotool.org/ratewise').replace(/\/$/, '');
const TAG = process.env.AUDIT_TAG ?? '2026-06-30b';
const SCREENSHOTS = path.join(ROOT, 'screenshots');
const MIRROR = path.join(ROOT, 'apps/ratewise/screenshots');

const VIEWPORTS = [
  { name: '375x667', width: 375, height: 667 },
  { name: '390x844', width: 390, height: 844 },
  { name: '414x896', width: 414, height: 896 },
  { name: '360x800', width: 360, height: 800 },
  { name: '430x932', width: 430, height: 932 },
];

const ROUTES = [
  { page: 'home', path: '/' },
  { page: 'usd-twd', path: '/usd-twd/' },
  { page: 'jpy-twd', path: '/jpy-twd/' },
  { page: 'twd-usd', path: '/twd-usd/' },
  { page: 'usd-twd-500', path: '/usd-twd/500/' },
  { page: 'multi', path: '/multi/' },
  { page: 'favorites', path: '/favorites/' },
  { page: 'settings', path: '/settings/' },
  { page: 'faq', path: '/faq/' },
  { page: 'about', path: '/about/' },
  { page: 'guide', path: '/guide/' },
  { page: 'privacy', path: '/privacy/' },
];

function urlFor(routePath) {
  return `${BASE}${routePath.startsWith('/') ? routePath : `/${routePath}`}`;
}

async function auditPage(page, route, viewport) {
  const url = urlFor(route.path);
  let httpStatus = null;
  const consoleErrors = [];

  page.removeAllListeners('console');
  page.removeAllListeners('pageerror');
  page.removeAllListeners('response');

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));
  page.on('response', (res) => {
    if (res.url() === url || res.url() === url.replace(/\/$/, '')) {
      httpStatus = res.status();
    }
  });

  let error = null;
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    httpStatus = resp?.status() ?? httpStatus;
    await page.waitForTimeout(1200);
  } catch (e) {
    error = String(e.message ?? e);
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(800);
    } catch (e2) {
      error = String(e2.message ?? e2);
    }
  }

  const audit = await page.evaluate(() => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const truncation = [];
    const fixedBottom = [];
    const interactives = document.querySelectorAll(
      'button, a[href], [role="button"], input, select, textarea',
    );

    for (const el of interactives) {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0')
        continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      const text = (el.textContent?.trim() || el.getAttribute('aria-label') || '').slice(0, 48);
      const issues = [];
      if (rect.bottom > vh + 1) issues.push('bottom-clipped');
      if (rect.top < -1) issues.push('top-clipped');
      if (rect.right > vw + 1) issues.push('right-clipped');
      if (rect.left < -1) issues.push('left-clipped');
      if (rect.width < 44 || rect.height < 44) issues.push('touch-target<44px');
      if (issues.length) {
        truncation.push({
          tag: el.tagName,
          text,
          rect: {
            top: Math.round(rect.top),
            bottom: Math.round(rect.bottom),
            h: Math.round(rect.height),
            w: Math.round(rect.width),
          },
          issues,
        });
      }
      const pos = style.position;
      if ((pos === 'fixed' || pos === 'sticky') && rect.bottom >= vh - 2) {
        fixedBottom.push({ tag: el.tagName, text, h: Math.round(rect.height) });
      }
    }

    const h1 = document.querySelector('h1')?.textContent?.trim() ?? null;
    const title = document.title;
    const rateCandidates = [
      ...document.querySelectorAll(
        '[data-testid="hero-rate-display"], [data-testid="hero-rate"], [data-testid="sell-rate"], .hero-rate',
      ),
    ];
    let firstLargeNumber = null;
    let rateY = null;
    for (const el of document.querySelectorAll('span, div, p, strong')) {
      const t = el.textContent?.trim() ?? '';
      if (/^\d[\d,.]*$/.test(t) && t.length >= 2) {
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs >= 20) {
          const r = el.getBoundingClientRect();
          if (!firstLargeNumber || fs > firstLargeNumber.fontSize) {
            firstLargeNumber = { text: t.slice(0, 20), fontSize: fs, y: Math.round(r.top) };
          }
        }
      }
    }
    if (rateCandidates[0]) {
      rateY = Math.round(rateCandidates[0].getBoundingClientRect().top);
    }

    const pwaModal = !!document.querySelector(
      '[class*="install"], [data-testid*="pwa"], [aria-label*="安裝"]',
    );
    const metaTheme = document.querySelector('meta[name="theme-color"]')?.getAttribute('content');

    return {
      truncation,
      fixedBottom,
      heroInfo: { title, h1, firstLargeNumber, rateY },
      pwaModalVisible: pwaModal,
      metaThemeColor: metaTheme,
    };
  });

  const shotName = `ux-audit-${TAG}-${route.page}-${viewport.name}.png`;
  const shotPath = path.join(SCREENSHOTS, shotName);
  await page.screenshot({ path: shotPath, fullPage: false });

  const uniqueErrors = [...new Set(consoleErrors)];

  return {
    page: route.page,
    path: route.path,
    viewport: viewport.name,
    url,
    httpStatus,
    error,
    consoleErrors: uniqueErrors,
    screenshot: shotPath,
    truncation: audit.truncation,
    fixedBottom: audit.fixedBottom,
    heroInfo: audit.heroInfo,
    pwaModalVisible: audit.pwaModalVisible,
    metaThemeColor: audit.metaThemeColor,
    truncationCount: audit.truncation.length,
  };
}

async function main() {
  await mkdir(SCREENSHOTS, { recursive: true });
  await mkdir(MIRROR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    const page = await context.newPage();

    for (const route of ROUTES) {
      const r = await auditPage(page, route, vp);
      results.push(r);
      process.stderr.write(`✓ ${route.page} @ ${vp.name}\n`);
    }
    await context.close();
  }

  await browser.close();

  const out = {
    date: TAG,
    round: '2026-06-30b',
    postPr523: true,
    base: BASE,
    results,
    summary: {
      total: results.length,
      withConsoleErrors: results.filter((r) => r.consoleErrors.length > 0).length,
      withTruncation: results.filter((r) => r.truncationCount > 0).length,
      homeTimeouts: results.filter((r) => r.page === 'home' && r.error).length,
      manifestThemeVerifiedSeparately: '#7C3AED',
    },
  };

  const jsonPath = path.join(MIRROR, `ux-audit-results-${TAG}.json`);
  await writeFile(jsonPath, JSON.stringify(out, null, 2));

  console.log(JSON.stringify({ jsonPath, summary: out.summary }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
