import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

type ManifestIcon = { src: string; sizes?: string; type?: string; purpose?: string };
type Manifest = { id?: string; scope?: string; start_url?: string; icons?: ManifestIcon[] };
const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf-8'),
) as {
  version: string;
};

function resolveHref(href: string, pageUrl: string): string {
  return new URL(href, pageUrl).href;
}

async function getManifest(page: Page, request: APIRequestContext) {
  await page.goto('/');
  const pageUrl = page.url();
  const manifestLink = page.locator('link[rel="manifest"]');
  await expect(manifestLink).toHaveCount(1);
  const href = await manifestLink.getAttribute('href');
  expect(href).toBeTruthy();
  const manifestUrl = resolveHref(href!, pageUrl);
  const response = await request.get(manifestUrl);
  expect(response.status(), `Manifest at ${manifestUrl} should return 200`).toBe(200);
  const manifest = (await response.json()) as Manifest;
  return { manifest, manifestUrl, pageUrl };
}

test.describe('PWA icon identity and settings version', () => {
  test('HTML exposes apple-touch-icon PNG for iOS home screen', async ({ page, request }) => {
    await page.goto('/');

    const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleTouchIcon).toHaveCount(1);

    const href = await appleTouchIcon.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toContain('apple-touch-icon.png');
    await expect(appleTouchIcon).toHaveAttribute('sizes', '180x180');

    const iconUrl = resolveHref(href!, page.url());
    const response = await request.get(iconUrl);
    expect(response.status(), `apple-touch-icon "${iconUrl}" should return 200`).toBe(200);
    expect(response.headers()['content-type']).toContain('png');
  });

  test('Manifest exposes a stable install identity', async ({ page, request }) => {
    const { manifest } = await getManifest(page, request);

    expect(manifest.id, 'manifest.id is required to prevent install identity collisions').toBe(
      '/split-meow/',
    );
    expect(manifest.scope).toBe('/split-meow/');
    expect(manifest.start_url).toBe('/split-meow/');
  });

  test('Manifest serves dedicated raster icons for any and maskable purposes', async ({
    page,
    request,
  }) => {
    const { manifest, manifestUrl } = await getManifest(page, request);
    const icons = manifest.icons ?? [];

    expect(icons.length).toBeGreaterThan(0);

    const icon192 = icons.find(
      (icon) =>
        icon.src.endsWith('icons/icon-192.png') &&
        icon.sizes === '192x192' &&
        icon.type === 'image/png',
    );
    const icon512 = icons.find(
      (icon) =>
        icon.src.endsWith('icons/icon-512.png') &&
        icon.sizes === '512x512' &&
        icon.type === 'image/png' &&
        (icon.purpose ?? 'any') === 'any',
    );
    const maskable = icons.find(
      (icon) =>
        icon.src.endsWith('icons/icon-512-maskable.png') &&
        icon.sizes === '512x512' &&
        icon.type === 'image/png' &&
        icon.purpose === 'maskable',
    );

    expect(icon192).toBeDefined();
    expect(icon512).toBeDefined();
    expect(maskable).toBeDefined();
    expect(maskable?.src).not.toBe(icon512?.src);

    for (const icon of [icon192, icon512, maskable]) {
      if (!icon) continue;
      const iconUrl = resolveHref(icon.src, manifestUrl);
      const resp = await request.get(iconUrl);
      expect(
        resp.status(),
        `Icon "${icon.src}" (purpose: ${icon.purpose ?? 'any'}) should return 200`,
      ).toBe(200);
      expect(resp.headers()['content-type']).toContain('png');
    }
  });

  test('favicon.svg is accessible with correct content-type', async ({ page, request }) => {
    await page.goto('/');
    const faviconUrl = resolveHref('favicon.svg', page.url());

    const resp = await request.get(faviconUrl);
    expect(resp.status(), `favicon.svg should return 200`).toBe(200);
    expect(resp.headers()['content-type']).toContain('svg');
  });

  test('Settings tab shows the current app version at the bottom', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /設定|settings/i }).click();

    const version = page.getByTestId('app-version');
    await expect(version).toBeVisible();
    await expect(version).toContainText(packageJson.version);
  });
});
