/** <html lang> 與 i18n 語言同步（issue #594 第 3 項 lang 面）。 */

import { describe, it, expect, afterEach } from 'vitest';
import i18n from '../index';

describe('html lang 同步', () => {
  afterEach(async () => {
    await i18n.changeLanguage('zh-TW');
  });

  it('模組載入後 documentElement.lang 初始為 zh-TW', () => {
    expect(document.documentElement.lang).toBe('zh-TW');
  });

  it('changeLanguage 後 documentElement.lang 跟隨切換', async () => {
    await i18n.changeLanguage('ja');
    expect(document.documentElement.lang).toBe('ja');

    await i18n.changeLanguage('en');
    expect(document.documentElement.lang).toBe('en');

    await i18n.changeLanguage('ko');
    expect(document.documentElement.lang).toBe('ko');
  });

  it('zh 變體正規化為 zh-TW', async () => {
    await i18n.changeLanguage('zh-Hant');
    expect(document.documentElement.lang).toBe('zh-TW');
  });
});
