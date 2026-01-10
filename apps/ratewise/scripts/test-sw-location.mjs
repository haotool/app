import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => console.log(`[BROWSER]`, msg.text()));
  page.on('pageerror', (error) => console.error('[ERROR]', error.message));

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });

  // Unregister existing SW
  await page.evaluate(async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      await reg.unregister();
    }
  });

  await page.waitForTimeout(1000);

  console.log('\n🧪 Testing self.location in SW context...\n');

  // Create a test SW that logs self.location
  const testSW = `
    console.log('[TEST SW] typeof self:', typeof self);
    console.log('[TEST SW] typeof self.location:', typeof self.location);
    console.log('[TEST SW] self.location:', self.location);
    console.log('[TEST SW] self.location.href:', self.location ? self.location.href : 'undefined');

    // Test polyfill approach
    var location = self.location;
    console.log('[TEST SW] After polyfill - typeof location:', typeof location);
    console.log('[TEST SW] After polyfill - location:', location);
    console.log('[TEST SW] After polyfill - location.href:', location ? location.href : 'undefined');

    self.addEventListener('install', () => {
      console.log('[TEST SW] Install event');
      self.skipWaiting();
    });

    self.addEventListener('activate', () => {
      console.log('[TEST SW] Activate event');
    });
  `;

  // Write test SW to a data URL
  const result = await page.evaluate(async (swCode) => {
    try {
      const blob = new Blob([swCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);

      const reg = await navigator.serviceWorker.register(url, { scope: '/' });
      await new Promise((resolve) => setTimeout(resolve, 3000));

      return {
        success: true,
        state: reg.active?.state || reg.installing?.state || 'unknown',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }, testSW);

  console.log('📊 Test SW Result:');
  console.log(JSON.stringify(result, null, 2));

  await page.waitForTimeout(2000);
  await browser.close();
})();
