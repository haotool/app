import { afterEach, expect, it, vi } from 'vitest';
import type * as I18nextModule from 'i18next';

vi.mock('i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof I18nextModule>();
  return { ...actual, default: actual.default.createInstance() };
});

afterEach(() => {
  vi.unstubAllEnvs();
  document.documentElement.lang = '';
});

it('SSG 固定以繁體中文產生頁面，不採建置機的英文語系', async () => {
  vi.stubEnv('SSR', true);
  document.documentElement.lang = 'en';
  vi.resetModules();
  const { default: i18n } = await import('../index');
  await vi.waitFor(() => expect(i18n.isInitialized).toBe(true));
  expect(i18n.resolvedLanguage).toBe('zh-TW');
});
