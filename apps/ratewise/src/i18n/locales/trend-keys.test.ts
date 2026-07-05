import { describe, it, expect } from 'vitest';
import zhTW from './zh-TW';
import en from './en';
import ja from './ja';
import ko from './ko';

// 趨勢圖基準標註 key 必須四語系齊備，缺 key 時 i18next 會直接顯示 key 字串。
describe('trend i18n keys', () => {
  const locales = [
    ['zh-TW', zhTW],
    ['en', en],
    ['ja', ja],
    ['ko', ko],
  ] as const;

  it.each(locales)('%s 應提供 trend.cashSellBasis', (_name, locale) => {
    expect(locale.trend.cashSellBasis).toEqual(expect.any(String));
    expect(locale.trend.cashSellBasis.length).toBeGreaterThan(0);
  });

  it('zh-TW 基準標註為現金賣出走勢', () => {
    expect(zhTW.trend.cashSellBasis).toBe('現金賣出走勢');
  });
});
