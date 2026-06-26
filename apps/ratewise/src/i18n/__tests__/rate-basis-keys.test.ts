import { describe, it, expect } from 'vitest';
import zhTW from '../locales/zh-TW';
import en from '../locales/en';
import ja from '../locales/ja';
import ko from '../locales/ko';

const REQUIRED_KEYS = [
  'bank-sell',
  'bank-buy',
  'bank-cross',
  'bank-sell-only',
  'mid',
  'shop-sell',
  'shop-buy',
  'shop-mid',
  'listBasisNote',
] as const;

describe('rateBasis i18n keys - 四語系完整性', () => {
  it.each([
    ['zh-TW', zhTW],
    ['en', en],
    ['ja', ja],
    ['ko', ko],
  ])('%s 包含全部 rateBasis keys', (_name, locale) => {
    const rateBasis = (locale as Record<string, unknown>)['rateBasis'] as
      | Record<string, string>
      | undefined;
    expect(rateBasis).toBeDefined();
    if (!rateBasis) return;
    for (const key of REQUIRED_KEYS) {
      expect(rateBasis[key], `missing key: ${key}`).toBeTypeOf('string');
      expect(rateBasis[key]?.length).toBeGreaterThan(0);
    }
  });
});
