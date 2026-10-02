/** 根站 SW activate 的跨 app 隔離檢查；先 build/serve haotool，再以 QA_BASE_URL 指定 origin。 */
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';

const base = new URL(process.env.QA_BASE_URL ?? 'http://127.0.0.1:4213/');
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  // 純 JSON 文件不會先註冊根站 SW，讓子 app caches 先存在。
  await page.goto(new URL('manifest.webmanifest', base).href);
  const before = await page.evaluate(async () => {
    const names = ['ratewise', 'papertrade', 'starpuff'].map(
      (app) => `workbox-precache-v2-${location.origin}/${app}/`,
    );
    for (const name of names) {
      const cache = await caches.open(name);
      await cache.put(`${location.origin}/offline-probe`, new Response('foreign shell'));
    }
    return names;
  });
  await page.goto(base.href);
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const registration = await navigator.serviceWorker.getRegistration();
          return { scope: registration?.scope, state: registration?.active?.state };
        }),
      { timeout: 30000 },
    )
    .toEqual({ scope: base.href, state: 'activated' });
  const after = await page.evaluate(
    async (names) =>
      Promise.all(
        names.map(async (name) => {
          const cache = await caches.open(name);
          return {
            name,
            count: (await cache.keys()).length,
            body: await (await cache.match(`${location.origin}/offline-probe`))?.text(),
          };
        }),
      ),
    before,
  );
  assert.deepEqual(
    after,
    before.map((name) => ({ name, count: 1, body: 'foreign shell' })),
  );
  assert.deepEqual(errors, []);
  console.log('PASS: root SW activate 保留 RateWise、PaperTrade、Starpuff precache');
} finally {
  await browser.close();
}
