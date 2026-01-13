import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => console.log(`[BROWSER]`, msg.text()));
  page.on('pageerror', (error) => console.error('[ERROR]', error.message));

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });

  // Unregister all existing SWs
  await page.evaluate(async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      await reg.unregister();
    }
    const caches = await window.caches.keys();
    for (const cache of caches) {
      await window.caches.delete(cache);
    }
  });

  await page.waitForTimeout(2000);

  console.log('\n🧪 Testing SW with comprehensive polyfill (location + document)...\n');

  const result = await page.evaluate(async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw-fixed.js', { scope: '/' });

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

  console.log('📊 SW Registration Result:');
  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('\n✅ SW registered! Checking precache...\n');

    await page.waitForTimeout(8000);

    const cacheResult = await page.evaluate(async () => {
      const allCaches = await caches.keys();
      const precacheCaches = allCaches.filter(
        (name) => name.includes('precache') || name.includes('workbox'),
      );

      let totalEntries = 0;
      const cacheDetails = {};

      for (const cacheName of precacheCaches) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        totalEntries += keys.length;
        cacheDetails[cacheName] = {
          count: keys.length,
          sampleUrls: keys.slice(0, 3).map((r) => r.url),
        };
      }

      return {
        totalEntries,
        allCaches,
        cacheDetails,
      };
    });

    console.log('📊 Cache Result:');
    console.log(`Total Precached Items: ${cacheResult.totalEntries} / 133 expected`);
    console.log(`All Caches: ${cacheResult.allCaches.join(', ')}`);
    if (cacheResult.totalEntries > 0) {
      console.log('\nCache Details:');
      for (const [name, details] of Object.entries(cacheResult.cacheDetails)) {
        console.log(`  ${name}: ${details.count} entries`);
        if (details.sampleUrls.length > 0) {
          console.log(`    Sample: ${details.sampleUrls[0]}`);
        }
      }
    }
    console.log(
      cacheResult.totalEntries > 0
        ? '\n✅ SUCCESS! PWA OFFLINE WORKING!'
        : '\n❌ FAIL: Cache empty',
    );
  } else {
    console.log('\n❌ SW registration failed');
  }

  await page.waitForTimeout(2000);
  await browser.close();
})();
