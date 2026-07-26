import { describe, expect, it } from 'vitest';

import { verifyDesignDocs } from './verify-design-docs.mjs';

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
  const inlineSupersession = /（v\d+(\.\d+)? 已(由|於) §/;
  const deprecationLine = /^> \*\*已廢止\*\*（[^）]+）：.+/;

  it('抓得到行內取代標註（審查必修 1 的回歸樣態）', () => {
    expect(inlineSupersession.test('- 地面長按 0.6s 觸發（v19 已由 §109 取代：改 SP 鍵）')).toBe(
      true,
    );
    expect(inlineSupersession.test('- 同系 ≥3 且在地面時按 SP 鍵點按立即變身。')).toBe(false);
  });

  it('抓得到格式不符的已廢止附註', () => {
    expect(
      deprecationLine.test('> **已廢止**（v19 起，現行見 §109.2）：地面長按 0.6s 觸發。'),
    ).toBe(true);
    expect(deprecationLine.test('> **已廢止**：地面長按 0.6s 觸發。')).toBe(false);
    expect(deprecationLine.test('> **已廢止**（v19 起，現行見 §109.2）：')).toBe(false);
  });
});
