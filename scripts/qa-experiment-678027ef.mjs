#!/usr/bin/env node
/**
 * experiment/ratewise-ux-2026 @ 678027ef — 5 工程師並行 QA 稽核腳本
 * Usage: AUDIT_BASE_URL=http://127.0.0.1:4173/ratewise node scripts/qa-experiment-678027ef.mjs
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BASE = (process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173/ratewise').replace(/\/$/, '');
const TAG = process.env.AUDIT_TAG ?? '678027ef';
const SCREENSHOTS = path.join(ROOT, 'screenshots');

const ROUTES_12 = [
  { page: 'home', path: '/' },
  { page: 'usd-twd', path: '/usd-twd/' },
  { page: 'jpy-twd', path: '/jpy-twd/' },
  { page: 'twd-jpy', path: '/twd-jpy/' },
  { page: 'multi', path: '/multi/' },
  { page: 'settings', path: '/settings/' },
  { page: 'favorites', path: '/favorites/' },
  { page: 'faq', path: '/faq/' },
  { page: 'about', path: '/about/' },
  { page: 'guide', path: '/guide/' },
  { page: 'privacy', path: '/privacy/' },
  { page: '404', path: '/nonexistent-route-qa/' },
];

const ENGINEERS = [
  {
    id: 'E1',
    name: 'Mobile UX',
    viewports: [
      { name: '375x667', width: 375, height: 667 },
      { name: '390x844', width: 390, height: 844 },
    ],
    routes: ['home', 'usd-twd', 'jpy-twd', 'twd-jpy'],
  },
  {
    id: 'E2',
    name: 'Hero/PWA',
    viewports: [
      { name: '360x800', width: 360, height: 800 },
      { name: '430x932', width: 430, height: 932 },
    ],
    routes: ['home'],
    extraUrls: [{ page: 'home-hero-v2', path: '/?ux=hero-v2' }],
  },
  {
    id: 'E3',
    name: 'Touch/A11y',
    viewports: [
      { name: '375x667', width: 375, height: 667 },
      { name: '390x844', width: 390, height: 844 },
    ],
    routes: ['multi', 'settings', 'favorites'],
  },
  {
    id: 'E4',
    name: 'Console/Perf',
    viewports: [{ name: '390x844', width: 390, height: 844 }],
    routes: ROUTES_12.map((r) => r.page),
  },
  {
    id: 'E5',
    name: 'Content/SEO UI',
    viewports: [{ name: '414x896', width: 414, height: 896 }],
    routes: ['home', 'usd-twd', 'jpy-twd', 'twd-jpy', 'faq', 'about'],
  },
];

function urlFor(routePath) {
  return `${BASE}${routePath.startsWith('/') ? routePath : `/${routePath}`}`;
}

async function auditPage(page, route, viewport, engineerId) {
  const url = urlFor(route.path);
  const consoleErrors = [];
  const consoleWarnings = [];

  page.removeAllListeners('console');
  page.removeAllListeners('pageerror');
  page.on('console', (msg) => {
    const t = msg.text();
    if (msg.type() === 'error') consoleErrors.push(t);
    if (msg.type() === 'warning') consoleWarnings.push(t);
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  let httpStatus = null;
  let error = null;
  let lcpEstimate = null;

  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    httpStatus = resp?.status() ?? null;
    await page.waitForTimeout(1500);

    lcpEstimate = await page.evaluate(() => {
      const entries = performance.getEntriesByType('largest-contentful-paint');
      if (entries.length) return Math.round(entries.at(-1).startTime);
      const h1 = document.querySelector('h1');
      if (h1) return Math.round(h1.getBoundingClientRect().top + performance.now());
      return null;
    });
  } catch (e) {
    error = String(e.message ?? e);
  }

  const audit = await page.evaluate(() => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const truncation = [];
    const fixedBottom = [];
    const interactives = document.querySelectorAll(
      'button, a[href], [role="button"], input, select, textarea, [tabindex="0"]',
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

    let sellRateY = null;
    let sellRateFontSize = null;
    let heroRateEl = document.querySelector(
      '[data-testid="hero-rate-display"], [data-testid="hero-rate"], [data-testid="sell-rate"], .hero-rate',
    );
    if (heroRateEl) {
      const r = heroRateEl.getBoundingClientRect();
      sellRateY = Math.round(r.top);
      sellRateFontSize = parseFloat(getComputedStyle(heroRateEl).fontSize);
    } else {
      for (const el of document.querySelectorAll('span, div, p, strong')) {
        const t = el.textContent?.trim() ?? '';
        if (/^\d[\d,.]+$/.test(t) && t.length >= 2) {
          const fs = parseFloat(getComputedStyle(el).fontSize);
          const parent = el.closest('[class*="rate"], [data-testid*="rate"]');
          if (fs >= 18 && parent) {
            const r = el.getBoundingClientRect();
            if (!sellRateY || fs > (sellRateFontSize ?? 0)) {
              sellRateY = Math.round(r.top);
              sellRateFontSize = fs;
            }
          }
        }
      }
    }

    const pwaModal = !!document.querySelector(
      '[class*="install"], [data-testid*="pwa"], [aria-label*="安裝"], [data-testid="pwa-install-modal"]',
    );
    const offlineHint = !!document.querySelector(
      '[data-testid*="offline"], [class*="offline"], [aria-label*="離線"]',
    );

    const bodyText = document.body?.innerText ?? '';
    const thesisMatches = (bodyText.match(/賣出價|中間價/g) ?? []).length;
    const duplicateH1 = document.querySelectorAll('h1').length;

    const navLinks = [...document.querySelectorAll('nav a, [role="navigation"] a')].map((a) => ({
      text: a.textContent?.trim().slice(0, 20),
      bottom: Math.round(a.getBoundingClientRect().bottom),
      h: Math.round(a.getBoundingClientRect().height),
    }));

    return {
      truncation,
      fixedBottom,
      heroInfo: { title, h1, sellRateY, sellRateFontSize },
      pwaModalVisible: pwaModal,
      offlineHintVisible: offlineHint,
      thesisMatches,
      duplicateH1,
      navLinks,
      bodyLen: bodyText.length,
    };
  });

  const shotName = `qa-${engineerId}-${route.page}-${viewport.name}.png`;
  const shotPath = path.join(SCREENSHOTS, shotName);
  await page.screenshot({ path: shotPath, fullPage: false });

  const bottomClipped = audit.truncation.filter((t) => t.issues.includes('bottom-clipped'));
  const touchSmall = audit.truncation.filter((t) => t.issues.includes('touch-target<44px'));
  const uniqueErrors = [...new Set(consoleErrors)];

  const has418 = uniqueErrors.some((e) => e.includes('418') || e.includes('Hydration'));
  const heroPass = audit.heroInfo.sellRateY !== null && audit.heroInfo.sellRateY <= 120;
  const heroFontPass = (audit.heroInfo.sellRateFontSize ?? 0) >= 32;

  return {
    engineer: engineerId,
    page: route.page,
    path: route.path,
    viewport: viewport.name,
    url,
    httpStatus,
    error,
    lcpEstimate,
    consoleErrors: uniqueErrors,
    consoleWarnings: [...new Set(consoleWarnings)],
    screenshot: shotPath,
    bottomClippedCount: bottomClipped.length,
    touchSmallCount: touchSmall.length,
    bottomClipped: bottomClipped.slice(0, 5),
    touchSmall: touchSmall.slice(0, 5),
    fixedBottom: audit.fixedBottom,
    heroInfo: audit.heroInfo,
    pwaModalVisible: audit.pwaModalVisible,
    offlineHintVisible: audit.offlineHintVisible,
    thesisMatches: audit.thesisMatches,
    duplicateH1: audit.duplicateH1,
    navLinks: audit.navLinks,
    ac: {
      'AC-CON-01': uniqueErrors.length === 0 ? 'pass' : 'fail',
      'AC-HERO-01': heroPass ? 'pass' : 'fail',
      'AC-HERO-02': heroFontPass ? 'pass' : 'fail',
      'AC-TOUCH-01': bottomClipped.length === 0 ? 'pass' : 'fail',
      'AC-TOUCH-02': touchSmall.length === 0 ? 'pass' : 'fail',
      'AC-LAND-01':
        route.page.includes('twd') || route.page.includes('jpy') || route.page.includes('usd')
          ? audit.heroInfo.sellRateY !== null && audit.heroInfo.sellRateY < viewport.height
            ? 'warn'
            : 'fail'
          : 'n/a',
      'AC-PWA-01': audit.pwaModalVisible ? 'fail' : 'pass',
    },
    has418,
  };
}

async function main() {
  await mkdir(SCREENSHOTS, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const allResults = [];

  for (const eng of ENGINEERS) {
    for (const vp of eng.viewports) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      });
      const page = await context.newPage();

      const routeList = [
        ...ROUTES_12.filter((r) => eng.routes.includes(r.page)),
        ...(eng.extraUrls ?? []),
      ];

      for (const route of routeList) {
        const r = await auditPage(page, route, vp, eng.id);
        allResults.push(r);
        process.stderr.write(`✓ ${eng.id} ${route.page} @ ${vp.name}\n`);
      }
      await context.close();
    }
  }

  await browser.close();

  const matrix390 = ROUTES_12.map((route) => {
    const r = allResults.find((x) => x.engineer === 'E4' && x.page === route.page);
    const e3 = allResults.filter((x) => x.engineer === 'E3' && x.page === route.page);
    const e2 = allResults.filter((x) => x.engineer === 'E2' && x.page.startsWith('home'));
    return {
      route: route.path,
      page: route.page,
      console: r?.consoleErrors.length ?? '?',
      has418: r?.has418 ?? false,
      clip: r?.bottomClippedCount ?? '?',
      touch: r?.touchSmallCount ?? '?',
      heroY: r?.heroInfo?.sellRateY ?? null,
      heroFs: r?.heroInfo?.sellRateFontSize ?? null,
      pwaModal: e2.some((x) => x.pwaModalVisible),
      e3clip: Math.max(...e3.map((x) => x.bottomClippedCount), 0),
      e3touch: Math.max(...e3.map((x) => x.touchSmallCount), 0),
      httpStatus: r?.httpStatus,
      lcp: r?.lcpEstimate,
    };
  });

  const out = {
    commit: TAG,
    branch: 'experiment/ratewise-ux-2026',
    base: BASE,
    date: new Date().toISOString(),
    matrix390,
    results: allResults,
    summary: {
      totalAudits: allResults.length,
      consoleFail: allResults.filter((r) => r.consoleErrors.length > 0).length,
      has418: allResults.filter((r) => r.has418).length,
      clipFail: allResults.filter((r) => r.bottomClippedCount > 0).length,
      touchFail: allResults.filter((r) => r.touchSmallCount > 0).length,
      pwaModal: allResults.filter((r) => r.pwaModalVisible).length,
    },
  };

  const jsonPath = path.join(SCREENSHOTS, `qa-experiment-${TAG}.json`);
  await writeFile(jsonPath, JSON.stringify(out, null, 2));
  console.log(JSON.stringify({ jsonPath, summary: out.summary, matrix390 }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
