import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMessages = [];
  const errors = [];

  page.on('console', (msg) => {
    const text = msg.text();
    consoleMessages.push(text);
    console.log(`[CONSOLE]`, text);
  });

  page.on('pageerror', (error) => {
    errors.push(error.message);
    console.error('[PAGE ERROR]', error.message);
  });

  // Listen for SW console messages
  context.on('console', (msg) => {
    console.log(`[SW CONSOLE]`, msg.text());
  });

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });

  // Unregister existing SW
  await page.evaluate(async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      await reg.unregister();
    }
    // Clear caches
    const caches = await window.caches.keys();
    for (const cache of caches) {
      await window.caches.delete(cache);
    }
  });

  await page.waitForTimeout(2000);

  console.log('\n🧪 Testing SW.js with debug logging...\n');

  const result = await page.evaluate(async () => {
    try {
      console.log('[TEST] Starting SW registration...');
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('[TEST] SW registration initiated');

      // Wait for SW to activate
      await new Promise((resolve) => setTimeout(resolve, 5000));

      return {
        success: true,
        state: reg.active?.state || reg.installing?.state || reg.waiting?.state || 'unknown',
        hasController: navigator.serviceWorker.controller !== null,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  console.log('\n📊 Registration Result:');
  console.log(JSON.stringify(result, null, 2));

  console.log('\n📋 Console Messages:');
  console.log(consoleMessages.filter((m) => m.includes('[SW Polyfill]')).join('\n'));

  console.log('\n❌ Errors:');
  console.log(errors.join('\n'));

  await page.waitForTimeout(2000);
  await browser.close();
})();
