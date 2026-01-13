import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable verbose console logging
  page.on('console', (msg) => {
    const type = msg.type();
    console.log(`[CONSOLE ${type}]`, msg.text());
  });

  page.on('pageerror', (error) => {
    console.error('[PAGE ERROR]', error.message);
    console.error('[STACK]', error.stack);
  });

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });

  console.log('\n🔍 Fetching and evaluating sw.js directly...\n');

  const result = await page.evaluate(async () => {
    try {
      // Fetch sw.js content
      const response = await fetch('/sw.js');
      const swCode = await response.text();

      // Try to evaluate it in a worker context
      try {
        // Create a temporary worker to test execution
        const blob = new Blob([swCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const worker = new Worker(url, { type: 'classic' });

        return new Promise((resolve) => {
          worker.onerror = (error) => {
            resolve({
              success: false,
              error: error.message,
              filename: error.filename,
              lineno: error.lineno,
              colno: error.colno,
            });
            worker.terminate();
          };

          worker.onmessage = () => {
            resolve({ success: true });
            worker.terminate();
          };

          // If no error within 1 second, consider it successful
          setTimeout(() => {
            resolve({ success: true, note: 'No immediate error' });
            worker.terminate();
          }, 1000);
        });
      } catch (error) {
        return {
          success: false,
          error: error.message,
          phase: 'worker_creation',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        phase: 'fetch',
      };
    }
  });

  console.log('\n📊 Direct Evaluation Result:');
  console.log(JSON.stringify(result, null, 2));

  await page.waitForTimeout(2000);
  await browser.close();
})();
