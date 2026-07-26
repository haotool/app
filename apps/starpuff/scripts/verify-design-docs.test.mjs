import { describe, expect, it } from 'vitest';

import {
  HINT_SIMILARITY_THRESHOLD,
  diceSimilarity,
  verifyDesignDocs,
} from './verify-design-docs.mjs';

// 設計文件守門（T7-C）：索引是拆檔後唯一的「章號 → 檔案」解析器，失真不會有人發現，
// 故機械化為測試。負向案確保守門本身不是空轉——規則真的抓得到漂移。

describe('設計文件守門', () => {
  const result = verifyDesignDocs();

  it('索引與章節標題完全一致、主句紀律成立、零錨點引用', () => {
    expect(result.problems).toEqual([]);
  });

  it('章節與索引列數相符且已涵蓋全部主題檔', () => {
    expect(result.sectionCount).toBe(result.indexRowCount);
    expect(result.sectionCount).toBeGreaterThan(0);
    expect(result.files.length).toBeGreaterThan(0);
  });
});

describe('守門規則負向驗證（規則本身抓得到漂移）', () => {
  // 與 verify-design-docs.mjs 同源的兩條樣態規則；此處獨立重述以確保語意不被誤放寬。
  const inlineSupersession = /（v\d+(\.\d+)? 已(由|於|被) §/;
  const deprecationLine = /^> \*\*已廢止\*\*（[^）]+）：.+/;

  it('抓得到行內取代標註的被動語態三式（含複審實測繞過的「已被」）', () => {
    for (const verb of ['已由', '已於', '已被']) {
      expect(
        inlineSupersession.test(`- 地面長按 0.6s 觸發（v19 ${verb} §109 取代：改 SP 鍵）`),
        `「${verb}」應被守門攔截`,
      ).toBe(true);
    }
    expect(inlineSupersession.test('- 同系 ≥3 且在地面時按 SP 鍵點按立即變身。')).toBe(false);
  });

  // hint 近似網的門檻校準（實測值鎖定）：真漏網的 L8 舊文案必須高於門檻，
  // 而非漂移的最相近引述（§110.2 變身首教浮字，與 hint 是不同字串）必須低於門檻。
  it('hint 近似網門檻能分開「過期抄寫」與「刻意不同的文案」', () => {
    const current = '同系星彈集滿 3 發，站在地面按 SP 鍵星化變身';
    const staleQuote = '同系星彈集滿 3 發，地面長按吸入鍵 0.6 秒星化變身';
    const differentString = '同系星彈 ×3！按 SP 鍵立即變身';

    expect(diceSimilarity(staleQuote, current)).toBeGreaterThanOrEqual(HINT_SIMILARITY_THRESHOLD);
    expect(diceSimilarity(differentString, current)).toBeLessThan(HINT_SIMILARITY_THRESHOLD);
    expect(diceSimilarity(current, current)).toBe(1);
  });

  it('抓得到格式不符的已廢止附註', () => {
    expect(
      deprecationLine.test('> **已廢止**（v19 起，現行見 §109.2）：地面長按 0.6s 觸發。'),
    ).toBe(true);
    expect(deprecationLine.test('> **已廢止**：地面長按 0.6s 觸發。')).toBe(false);
    expect(deprecationLine.test('> **已廢止**（v19 起，現行見 §109.2）：')).toBe(false);
  });
});
