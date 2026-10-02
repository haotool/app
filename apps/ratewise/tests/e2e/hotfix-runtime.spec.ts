import { test, expect } from '@playwright/test';

const BASE_PATH =
  `${process.env['E2E_BASE_PATH'] || process.env['VITE_RATEWISE_BASE_PATH'] || '/ratewise'}/`.replace(
    /\/+$/,
    '/',
  );
test.use({ serviceWorkers: 'allow' });

for (const [language, sourceLabel] of [
  ['zh-TW', '選擇來源貨幣'],
  ['en', 'Select source currency'],
  ['ja', '変換元通貨を選択'],
  ['ko', '출발 통화 선택'],
]) {
  test(`品牌字型與 ${language} 語系重新開啟無 hydration 錯誤`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.addInitScript((lang) => localStorage.setItem('ratewise-language', lang), language);
    await page.goto(BASE_PATH);
    await page.waitForFunction(() =>
      document.documentElement.hasAttribute('data-ratewise-app-ready'),
    );
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await expect(page.getByRole('combobox', { name: sourceLabel, exact: true })).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() =>
          Array.from(document.fonts).some(
            (font) => font.family === 'Nunito Wordmark' && font.status === 'loaded',
          ),
        ),
      )
      .toBe(true);
    expect(await page.locator('link[rel="preload"][as="font"]').count()).toBe(1);
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => localStorage.getItem('ratewise-language'))).toBe(language);
  });
}

test.describe('Service Worker shell 背景預熱失敗', () => {
  test('快取被清除且離線時回傳 503，頁面導覽仍有離線回退', async ({ page, context }) => {
    await page.goto(BASE_PATH);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await page.evaluate(async () => {
      await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
    });
    await context.setOffline(true);
    try {
      const status = await page.evaluate(async (path) => (await fetch(path)).status, BASE_PATH);
      expect(status).toBe(503);
      const response = await page.reload();
      expect(response?.status()).toBe(200);
    } finally {
      await context.setOffline(false);
    }
  });
});

test('首次冷載自動修復損毀的持久欄位', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'ratewise-converter',
      JSON.stringify({
        state: {
          fromCurrency: 'INVALID',
          favorites: ['INVALID', 'JPY'],
          lastConverterView: 'broken',
        },
        version: 0,
      }),
    );
  });
  await page.goto(BASE_PATH);
  await page.waitForFunction(() =>
    document.documentElement.hasAttribute('data-ratewise-app-ready'),
  );
  const state = await page.evaluate(
    () => JSON.parse(localStorage.getItem('ratewise-converter') ?? '{}').state,
  );
  expect(state.fromCurrency).toBe('TWD');
  expect(state.favorites).toEqual(['JPY']);
  expect(state.lastConverterView).toBe('single');
});

test('SW hard reset 保留他 app precache 與舊共用快取的他 app 資料', async ({ page }) => {
  await page.goto(BASE_PATH);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const report = await page.evaluate(async (scopePath) => {
    const foreignScope = `${location.origin}/starpuff/`;
    const foreignName = `workbox-precache-v2-${foreignScope}`;
    const foreignUrl = `${foreignScope}offline.html`;
    const ownUrl = new URL('isolation-marker.html', new URL(scopePath, location.href)).href;
    const foreign = await caches.open(foreignName);
    await foreign.put(foreignUrl, new Response('foreign offline shell'));
    const shared = await caches.open('html-cache');
    await shared.put(foreignUrl, new Response('foreign shared shell'));
    await shared.put(ownUrl, new Response('own legacy shell'));
    await caches.open('ratewise-isolation-marker');
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        navigator.serviceWorker.removeEventListener('message', listener);
        reject(new Error('hard reset 未回覆'));
      }, 10000);
      const listener = (event: MessageEvent) => {
        if (event.data?.type !== 'SW_HARD_RESET_DONE') return;
        clearTimeout(timer);
        navigator.serviceWorker.removeEventListener('message', listener);
        resolve();
      };
      navigator.serviceWorker.addEventListener('message', listener);
      navigator.serviceWorker.controller?.postMessage({ type: 'FORCE_HARD_RESET' });
    });
    return {
      foreignPrecache: await (await caches.open(foreignName))
        .match(foreignUrl)
        .then((response) => response?.text()),
      foreignShared: await shared.match(foreignUrl).then((response) => response?.text()),
      ownLegacy: Boolean(await shared.match(ownUrl)),
      ownCache: await caches.has('ratewise-isolation-marker'),
    };
  }, BASE_PATH);
  expect(report).toEqual({
    foreignPrecache: 'foreign offline shell',
    foreignShared: 'foreign shared shell',
    ownLegacy: false,
    ownCache: false,
  });
});

test('iOS 驅逐 loader manifest 後，SW 修復寫回正確 revision key', async ({ page, context }) => {
  await page.goto(BASE_PATH);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const entry = await page.evaluate(async (scopePath) => {
    const scope = new URL(scopePath, location.href).href;
    const cacheName = (await caches.keys()).find(
      (name) => name.startsWith('workbox-precache-') && name.endsWith(`-${scope}`),
    );
    if (!cacheName) throw new Error('own precache missing');
    const cache = await caches.open(cacheName);
    const request = (await cache.keys()).find((key) =>
      key.url.includes('static-loader-data-manifest'),
    );
    if (!request) throw new Error('loader manifest missing');
    await cache.delete(request);
    navigator.serviceWorker.controller?.postMessage({ type: 'VERIFY_AND_REPAIR_PRECACHE' });
    return { cacheName, key: request.url };
  }, BASE_PATH);
  await expect
    .poll(() =>
      page.evaluate(
        async ({ cacheName, key }) => Boolean(await (await caches.open(cacheName)).match(key)),
        entry,
      ),
    )
    .toBe(true);
  await context.setOffline(true);
  try {
    const status = await page.evaluate(async (key) => {
      const url = new URL(key);
      url.searchParams.delete('__WB_REVISION__');
      return (await fetch(url.href)).status;
    }, entry.key);
    expect(status).toBe(200);
  } finally {
    await context.setOffline(false);
  }
});
