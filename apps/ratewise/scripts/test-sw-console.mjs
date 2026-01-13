import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  page.on('console', (msg) => {
    const type = msg.type();
    console.log(`[BROWSER ${type}]`, msg.text());
  });

  // Capture errors
  page.on('pageerror', (error) => {
    console.error('[PAGE ERROR]', error.message);
  });

  console.log('📍 Navigating to http://localhost:4173/');
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });

  console.log('⏳ Waiting 5 seconds...');
  await page.waitForTimeout(5000);

  console.log('\n🔍 Checking Service Worker registration...');
  const swCheck = await page.evaluate(async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      return {
        exists: !!registration,
        state: registration?.active?.state,
        installing: !!registration?.installing,
        waiting: !!registration?.waiting,
        scope: registration?.scope,
        error: null,
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message,
      };
    }
  });

  console.log('\n📊 Service Worker Status:');
  console.log(JSON.stringify(swCheck, null, 2));

  await page.waitForTimeout(2000);
  await browser.close();
})();
