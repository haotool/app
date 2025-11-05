import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:8185';
const PATH = '/ratewise/';

async function runCheck(label, { unregister = false } = {}) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.route('**/*', async (route) => {
    const headers = {
      ...route.request().headers(),
      'cache-control': 'no-cache',
      pragma: 'no-cache',
    };
    await route.continue({ headers });
  });
  const page = await context.newPage();

  const consoleLogs = [];
  const responses = [];
  const failedRequests = [];

  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  page.on('response', (response) => {
    responses.push({
      url: response.url(),
      status: response.status(),
    });
  });

  page.on('requestfailed', (request) => {
    failedRequests.push({
      url: request.url(),
      failure: request.failure()?.errorText ?? 'unknown',
    });
  });

  const result = {
    label,
    consoleErrors: [],
    consoleWarnings: [],
    responses200: [],
    responsesNon200: [],
    failedRequests,
    serviceWorkerScope: null,
    manifestStartUrl: null,
    manifestScope: null,
  };

  try {
    await page.goto(`${BASE_URL}${PATH}`, { waitUntil: 'networkidle' });

    const manifestInfo = await page.evaluate(async () => {
      const res = await fetch('manifest.webmanifest', { cache: 'reload' });
      if (!res.ok) {
        return { ok: false, status: res.status };
      }
      const data = await res.json();
      return { ok: true, data };
    });

    if (manifestInfo.ok) {
      result.manifestStartUrl = manifestInfo.data.start_url ?? null;
      result.manifestScope = manifestInfo.data.scope ?? null;
    } else {
      result.manifestError = manifestInfo.status;
    }

    const swData = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) {
        return null;
      }
      const ready = await navigator.serviceWorker.ready;
      return {
        scope: ready.scope,
      };
    });
    if (swData) {
      result.serviceWorkerScope = swData.scope;
    }

    for (const resp of responses) {
      const entry = { url: resp.url, status: resp.status };
      if (resp.status >= 400) {
        result.responsesNon200.push(entry);
      } else if (resp.status) {
        result.responses200.push(entry);
      }
    }

    for (const log of consoleLogs) {
      if (log.type === 'error') {
        result.consoleErrors.push(log.text);
      } else if (log.type === 'warning') {
        result.consoleWarnings.push(log.text);
      }
    }

    if (unregister) {
      await page.evaluate(async () => {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((reg) => reg.unregister()));
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      });
    }
  } finally {
    await context.close();
    await browser.close();
  }

  return result;
}

(async () => {
  const firstPass = await runCheck('initial');
  const cleanupPass = await runCheck('post-clean', { unregister: true });
  console.log(JSON.stringify([firstPass, cleanupPass], null, 2));
})();
