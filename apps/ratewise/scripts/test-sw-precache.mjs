import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('📍 Navigating to http://localhost:4173/');
  await page.goto('http://localhost:4173/');

  console.log('⏳ Waiting 15 seconds for Service Worker registration...');
  await page.waitForTimeout(15000);

  console.log('🔍 Checking Service Worker status and precache...');
  const result = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    const allCaches = await caches.keys();
    const precacheCaches = allCaches.filter(
      (name) => name.includes('precache') || name.includes('workbox'),
    );

    const cacheContents = {};
    let totalEntries = 0;

    for (const cacheName of precacheCaches) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      totalEntries += keys.length;
      cacheContents[cacheName] = {
        count: keys.length,
        sampleUrls: keys.slice(0, 3).map((r) => r.url),
      };
    }

    return {
      swState: registration?.active?.state,
      controller: navigator.serviceWorker.controller !== null,
      allCaches,
      totalPrecachedItems: totalEntries,
      cacheContents,
      success: totalEntries > 0,
    };
  });

  console.log('\n📊 Test Results:');
  console.log('================');
  console.log('SW State:', result.swState);
  console.log('Controller Active:', result.controller);
  console.log('All Caches:', result.allCaches);
  console.log('Total Precached Items:', result.totalPrecachedItems, '/ 133 expected');
  console.log('\nCache Contents:');
  for (const [name, content] of Object.entries(result.cacheContents)) {
    console.log(`  ${name}: ${content.count} entries`);
    if (content.sampleUrls.length > 0) {
      console.log('    Sample URLs:', content.sampleUrls);
    }
  }
  console.log(
    '\n' + (result.success ? '✅ SUCCESS: Precache working!' : '❌ FAIL: Precache empty!'),
  );

  await browser.close();
})();
