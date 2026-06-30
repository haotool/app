import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.env.HERO_QA_BASE ?? 'http://127.0.0.1:4173/ratewise/';
const ROUND = process.env.HERO_QA_ROUND ?? '1';
const SCREENSHOTS = path.join(process.cwd(), 'screenshots');

const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800 },
  { name: '375x667', width: 375, height: 667 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
];

async function auditPage(page) {
  return page.evaluate(() => {
    const heroRate = document.querySelector('[data-testid="hero-rate-display"]');
    const tabs = document.querySelector('[data-testid="hero-rate-tabs"]');
    const swap = document.querySelector('[data-testid="hero-swap-button"]');
    const swapInput = document.querySelector('[data-testid="hero-currency-input-from"]');

    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        y: Math.round(r.top),
        h: Math.round(r.height),
        w: Math.round(r.width),
        fontSize: Number.parseFloat(style.fontSize),
      };
    };

    const tabButtons = tabs ? [...tabs.querySelectorAll('[role="tab"]')] : [];
    const tabHeights = tabButtons.map((b) => Math.round(b.getBoundingClientRect().height));

    let swapOverlap = null;
    if (swap && swapInput) {
      const s = swap.getBoundingClientRect();
      const f = swapInput.getBoundingClientRect();
      swapOverlap = !(s.y >= f.y - 4 && s.y + s.height <= f.y + f.height + 4);
    }

    return {
      heroRate: rect(heroRate),
      tabsY: tabs ? Math.round(tabs.getBoundingClientRect().top) : null,
      tabMinH: tabHeights.length ? Math.min(...tabHeights) : null,
      swapOverlap,
    };
  });
}

async function main() {
  await mkdir(SCREENSHOTS, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="hero-rate-display"]', { timeout: 15000 });

    const audit = await auditPage(page);
    const shot = path.join(SCREENSHOTS, `hero-redesign-v${ROUND}-${vp.name}.png`);
    await page.screenshot({ path: shot, fullPage: false });

    const acHero01 = audit.heroRate?.y != null && audit.heroRate.y <= 120;
    const acHero02 = (audit.heroRate?.fontSize ?? 0) >= 32;
    const acTouch = (audit.tabMinH ?? 0) >= 44;

    results.push({
      viewport: vp.name,
      screenshot: shot,
      ...audit,
      consoleErrors: [...new Set(consoleErrors)],
      ac: {
        'AC-HERO-01': acHero01 ? 'pass' : 'fail',
        'AC-HERO-02': acHero02 ? 'pass' : 'fail',
        'AC-TOUCH-tabs': acTouch ? 'pass' : 'fail',
        'AC-CON-01': consoleErrors.length === 0 ? 'pass' : 'fail',
        swapOverlap: audit.swapOverlap ? 'fail' : 'pass',
      },
    });

    await context.close();
  }

  await browser.close();
  console.log(JSON.stringify({ round: ROUND, base: BASE, results }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
