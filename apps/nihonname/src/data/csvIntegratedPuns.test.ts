import { describe, expect, it } from 'vitest';
import { ALL_CSV_PUNS, CSV_PUNS_COUNT } from './csvIntegratedPuns';

const CJK_REGEX = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\uFF00-\uFFEF]/u;

describe('csvIntegratedPuns dataset', () => {
  it('should not contain banned entries', () => {
    const banned = ['水稻忠武', '布翔尚班', '握載嘉坂', '今天下魚', '倭美帶錢', '渦耀賀茶'];
    for (const name of banned) {
      expect(ALL_CSV_PUNS.find((pun) => pun.kanji === name)).toBeUndefined();
    }
  });

  it('should have romaji free of CJK characters with fallback applied', () => {
    const offenders = ALL_CSV_PUNS.filter((pun) => {
      const romaji = pun.romaji ?? '';
      return romaji.trim().length === 0 || CJK_REGEX.test(romaji);
    });

    expect(ALL_CSV_PUNS.length).toBe(CSV_PUNS_COUNT);
    expect(offenders).toEqual([]);
  });
});
