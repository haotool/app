import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console
  page.on('console', (msg) => {
    console.log(`[BROWSER] ${msg.text()}`);
  });

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });

  console.log('\n🧪 Testing minimal SW registration...');

  // Unregister existing SW
  await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      await reg.unregister();
    }
  });

  await page.waitForTimeout(1000);

  // Try registering minimal SW
  const minimalResult = await page.evaluate(async () => {
    try {
      const reg = await navigator.serviceWorker.register('/test-minimal-sw.js', { scope: '/' });
      return { success: true, state: reg.installing?.state || 'unknown' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  console.log('\n📊 Minimal SW Result:');
  console.log(JSON.stringify(minimalResult, null, 2));

  if (minimalResult.success) {
    console.log('\n✅ Minimal SW works! Now testing main sw.js...');

    await page.evaluate(async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    });

    await page.waitForTimeout(1000);

    const mainResult = await page.evaluate(async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        return { success: true, state: reg.installing?.state || 'unknown' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    console.log('\n📊 Main SW Result:');
    console.log(JSON.stringify(mainResult, null, 2));
  }

  await page.waitForTimeout(2000);
  await browser.close();
})();
