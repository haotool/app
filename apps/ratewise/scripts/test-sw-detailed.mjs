import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture all console messages
  const consoleMessages = [];
  page.on('console', (msg) => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Capture errors
  const errors = [];
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  // Navigate
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Try to manually register SW and capture detailed error
  const detailedError = await page.evaluate(async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      return { success: true, state: reg.installing?.state || reg.active?.state };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        name: error.name,
        stack: error.stack,
      };
    }
  });

  console.log('\n📊 Detailed Error Analysis:');
  console.log('='.repeat(50));
  console.log('\n1. Registration Result:');
  console.log(JSON.stringify(detailedError, null, 2));

  console.log('\n2. Console Messages:');
  consoleMessages.forEach((msg) => console.log(msg));

  console.log('\n3. Page Errors:');
  errors.forEach((err) => console.log(err));

  // Check if sw.js is accessible
  const swResponse = await page.evaluate(async () => {
    try {
      const response = await fetch('/sw.js');
      return {
        ok: response.ok,
        status: response.status,
        contentType: response.headers.get('content-type'),
        size: (await response.text()).length,
      };
    } catch (error) {
      return { error: error.message };
    }
  });

  console.log('\n4. SW File Check:');
  console.log(JSON.stringify(swResponse, null, 2));

  await page.waitForTimeout(2000);
  await browser.close();
})();
