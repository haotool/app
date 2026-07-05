/**
 * 收藏頁 i18n key 存在性測試
 *
 * 迴歸防護：favorites.baseCurrency 曾在四語系皆缺 key，
 * i18next 缺 key 時回傳 key 本身（truthy），UI 直接顯示 raw key。
 */

import { describe, it, expect } from 'vitest';
import zhTW from '../locales/zh-TW';
import en from '../locales/en';
import ja from '../locales/ja';
import ko from '../locales/ko';

const locales = { 'zh-TW': zhTW, en, ja, ko } as const;

describe('favorites 區段 i18n key 存在性', () => {
  it.each(Object.entries(locales))('%s 語系 favorites.baseCurrency 存在且非空', (_lng, locale) => {
    expect(locale.favorites.baseCurrency).toBeTruthy();
    expect(typeof locale.favorites.baseCurrency).toBe('string');
  });

  it('zh-TW 的 favorites.baseCurrency 為「基準幣」', () => {
    expect(zhTW.favorites.baseCurrency).toBe('基準幣');
  });

  it.each(Object.entries(locales))(
    '%s 語系 favorites.starToReorderHint 存在且非空',
    (_lng, locale) => {
      expect(locale.favorites.starToReorderHint).toBeTruthy();
      expect(typeof locale.favorites.starToReorderHint).toBe('string');
    },
  );

  it.each(Object.entries(locales))('%s 語系不殘留死鍵 favorites.dragToFavorite', (_lng, locale) => {
    expect(locale.favorites).not.toHaveProperty('dragToFavorite');
  });
});
