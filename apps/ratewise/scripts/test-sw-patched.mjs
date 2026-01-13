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

  console.log('\n🧪 Testing patched SW with polyfill...\n');

  const result = await page.evaluate(async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw-patched.js', { scope: '/' });
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
  });

  console.log('📊 Patched SW Result:');
  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('\n✅ Polyfill works! Now checking precache...\n');

    await page.waitForTimeout(5000);

    const cacheResult = await page.evaluate(async () => {
      const allCaches = await caches.keys();
      const precacheCaches = allCaches.filter(
        (name) => name.includes('precache') || name.includes('workbox'),
      );
      let totalEntries = 0;
      for (const cacheName of precacheCaches) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        totalEntries += keys.length;
      }
      return { totalEntries, allCaches };
    });

    console.log('📊 Cache Result:');
    console.log(`Total Precached Items: ${cacheResult.totalEntries} / 133 expected`);
    console.log(`All Caches: ${cacheResult.allCaches.join(', ')}`);
    console.log(cacheResult.totalEntries > 0 ? '\n✅ SUCCESS!' : '\n❌ FAIL');
  }

  await page.waitForTimeout(2000);
  await browser.close();
})();
