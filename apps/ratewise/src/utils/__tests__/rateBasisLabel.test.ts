import { describe, it, expect } from 'vitest';
import {
  getRateBasisKind,
  getRateBasisLabelKey,
  shouldDiscloseRateBasis,
  type RateBasisKind,
} from '../rateBasisLabel';
import zhTW from '../../i18n/locales/zh-TW';
import en from '../../i18n/locales/en';
import ja from '../../i18n/locales/ja';
import ko from '../../i18n/locales/ko';

describe('getRateBasisKind', () => {
  it('rateMode 為 mid 時一律回傳 mid（優先於 cross）', () => {
    expect(getRateBasisKind('USD', 'JPY', 'mid')).toBe('mid');
    expect(getRateBasisKind('TWD', 'USD', 'mid')).toBe('mid');
    expect(getRateBasisKind('USD', 'USD', 'mid')).toBe('mid');
  });

  it('兩端皆非台幣時為 cross（經台幣中轉吃兩次價差）', () => {
    expect(getRateBasisKind('USD', 'JPY', 'auto')).toBe('cross');
    expect(getRateBasisKind('JPY', 'KRW', 'sell')).toBe('cross');
  });

  it('任一端為台幣時為 direct（方向已由 selector 表達）', () => {
    expect(getRateBasisKind('TWD', 'USD', 'auto')).toBe('direct');
    expect(getRateBasisKind('USD', 'TWD', 'auto')).toBe('direct');
    expect(getRateBasisKind('TWD', 'JPY', 'sell')).toBe('direct');
  });

  it('同幣別不構成換匯，為 direct', () => {
    expect(getRateBasisKind('USD', 'USD', 'auto')).toBe('direct');
    expect(getRateBasisKind('TWD', 'TWD', 'sell')).toBe('direct');
  });
});

describe('getRateBasisLabelKey', () => {
  it('mid 與 cross 回傳對應的 i18n key', () => {
    expect(getRateBasisLabelKey('mid')).toBe('rateBasis.mid');
    expect(getRateBasisLabelKey('cross')).toBe('rateBasis.cross');
  });

  it('direct 不需標籤故回傳 null', () => {
    expect(getRateBasisLabelKey('direct')).toBeNull();
  });
});

describe('shouldDiscloseRateBasis', () => {
  it('僅 mid 與 cross 需要揭露', () => {
    expect(shouldDiscloseRateBasis('mid')).toBe(true);
    expect(shouldDiscloseRateBasis('cross')).toBe(true);
    expect(shouldDiscloseRateBasis('direct')).toBe(false);
  });
});

describe('i18n key 完整性', () => {
  const locales = { zhTW, en, ja, ko };
  const disclosedKinds: RateBasisKind[] = ['mid', 'cross'];

  it('四語系皆有 rateBasis 區塊', () => {
    for (const [name, locale] of Object.entries(locales)) {
      expect(locale.rateBasis, `${name} 缺少 rateBasis 區塊`).toBeDefined();
    }
  });

  it('四語系皆備齊需揭露的 kind 且非空字串', () => {
    for (const [name, locale] of Object.entries(locales)) {
      for (const kind of disclosedKinds) {
        const value = (locale.rateBasis as Record<string, string | undefined>)[kind];
        expect(value, `${name}.rateBasis.${kind} 缺失`).toBeTruthy();
        expect(value?.trim().length ?? 0, `${name}.rateBasis.${kind} 為空`).toBeGreaterThan(0);
      }
    }
  });

  it('不得為 direct 建立文案（該狀態不顯示標籤）', () => {
    for (const [name, locale] of Object.entries(locales)) {
      expect(
        (locale.rateBasis as Record<string, string | undefined>)['direct'],
        `${name} 不應有 rateBasis.direct`,
      ).toBeUndefined();
    }
  });

  it('zh-TW 文案明示中間價非可成交報價', () => {
    expect(zhTW.rateBasis.mid).toContain('非交易報價');
  });

  it('zh-TW 交叉換算文案明示計入兩次價差', () => {
    expect(zhTW.rateBasis.cross).toContain('兩次價差');
  });
});
