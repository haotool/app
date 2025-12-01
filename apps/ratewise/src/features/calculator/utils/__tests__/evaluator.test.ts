/**
 * evaluator.test.ts - expr-eval 封裝測試
 *
 * BDD 測試：測試行為而非實作細節
 */

import { describe, it, expect } from 'vitest';
import { calculateExpression, isValidExpression, formatResult, safeCalculate } from '../evaluator';

describe('calculateExpression', () => {
  describe('基本運算', () => {
    it('應正確計算加法', () => {
      expect(calculateExpression('1+2')).toBe(3);
      expect(calculateExpression('100 + 200')).toBe(300);
    });

    it('應正確計算減法', () => {
      expect(calculateExpression('10-5')).toBe(5);
      expect(calculateExpression('0 - 10')).toBe(-10);
    });

    it('應正確計算乘法', () => {
      expect(calculateExpression('3 × 4')).toBe(12);
      expect(calculateExpression('2.5 × 4')).toBe(10);
    });

    it('應正確計算除法', () => {
      expect(calculateExpression('10 ÷ 2')).toBe(5);
      expect(calculateExpression('7 ÷ 2')).toBe(3.5);
    });
  });

  describe('運算優先順序', () => {
    it('應先乘除後加減', () => {
      expect(calculateExpression('2 + 3 × 4')).toBe(14); // 2+(3×4) = 14
      expect(calculateExpression('10 - 6 ÷ 2')).toBe(7); // 10-(6÷2) = 7
    });

    it('應處理括號優先權', () => {
      expect(calculateExpression('(2+3) × 4')).toBe(20);
      expect(calculateExpression('2 × (3+4)')).toBe(14);
    });

    it('應處理巢狀括號', () => {
      expect(calculateExpression('((2+3) × 4)+5')).toBe(25);
    });
  });

  describe('小數處理', () => {
    it('應正確計算小數運算', () => {
      expect(calculateExpression('0.1+0.2')).toBeCloseTo(0.3);
      expect(calculateExpression('1.5 × 2.5')).toBe(3.75);
    });

    it('應處理小數點開頭的數字', () => {
      expect(calculateExpression('.5+.5')).toBe(1);
    });
  });

  describe('邊界情況', () => {
    it('應處理單一數字', () => {
      expect(calculateExpression('42')).toBe(42);
      expect(calculateExpression('3.14')).toBe(3.14);
    });

    it('應處理負數', () => {
      expect(calculateExpression('-5')).toBe(-5);
      expect(calculateExpression('-5+10')).toBe(5);
    });

    it('應處理空白字元', () => {
      expect(calculateExpression('  1 + 2  ')).toBe(3);
    });
  });

  describe('錯誤處理', () => {
    it('應拒絕空字串', () => {
      expect(() => calculateExpression('')).toThrow('表達式不可為空');
    });

    it('應拒絕無效語法', () => {
      expect(() => calculateExpression('1++')).toThrow();
      expect(() => calculateExpression('(1+2')).toThrow();
    });
  });

  describe('複雜運算式', () => {
    it('應處理多項運算', () => {
      expect(calculateExpression('1 + 2 × 3 - 4 ÷ 2')).toBeCloseTo(5); // 1+6-2 = 5
    });

    it('應處理長運算式', () => {
      expect(calculateExpression('((10+20) × 3-40) ÷ 2')).toBe(25);
    });
  });

  describe('除以零處理', () => {
    it('應拒絕除以零', () => {
      expect(() => calculateExpression('10 ÷ 0')).toThrow('除以零錯誤');
    });

    it('應拒絕複雜表達式中的除以零', () => {
      expect(() => calculateExpression('(10 + 5) ÷ (3 - 3)')).toThrow('除以零錯誤');
    });
  });

  describe('無效字符處理', () => {
    it('應拒絕包含字母的表達式', () => {
      expect(() => calculateExpression('10 + abc')).toThrow('表達式包含無效字符');
    });

    it('應拒絕包含特殊符號的表達式', () => {
      expect(() => calculateExpression('10 @ 5')).toThrow('表達式包含無效字符');
    });
  });

  describe('括號不匹配處理', () => {
    it('應拒絕缺少右括號的表達式', () => {
      expect(() => calculateExpression('(10 + 5')).toThrow('括號不匹配');
    });

    it('應拒絕缺少左括號的表達式', () => {
      expect(() => calculateExpression('10 + 5)')).toThrow('括號不匹配');
    });

    it('應拒絕括號順序錯誤的表達式', () => {
      expect(() => calculateExpression(')10 + 5(')).toThrow('括號不匹配');
    });
  });

  describe('運算符錯誤處理', () => {
    it('應拒絕連續運算符', () => {
      expect(() => calculateExpression('10 + * 5')).toThrow();
    });

    it('應拒絕只有運算符的表達式', () => {
      expect(() => calculateExpression('+')).toThrow();
    });

    it('應拒絕表達式結尾為運算符', () => {
      expect(() => calculateExpression('10 +')).toThrow();
    });
  });
});

describe('isValidExpression', () => {
  it('應驗證有效的表達式', () => {
    expect(isValidExpression('100 + 50')).toBe(true);
    expect(isValidExpression('10 × 5')).toBe(true);
    expect(isValidExpression('(10 + 5) ÷ 3')).toBe(true);
  });

  it('應拒絕空表達式', () => {
    expect(isValidExpression('')).toBe(false);
    expect(isValidExpression('   ')).toBe(false);
  });

  it('應拒絕無效的表達式', () => {
    expect(isValidExpression('abc')).toBe(false);
    expect(isValidExpression('10 @@ 5')).toBe(false);
    // 注意：isValidExpression 只驗證 tokenize，不驗證括號匹配
    // 括號不匹配在 toRPN 階段才會被檢測到
  });

  it('應驗證括號表達式（僅檢查 token 格式）', () => {
    // isValidExpression 只驗證 token 格式，不驗證完整語法
    expect(isValidExpression('(10 + 5)')).toBe(true);
    expect(isValidExpression('((10 + 5) × 2)')).toBe(true);
  });

  it('應驗證負數表達式', () => {
    expect(isValidExpression('-5')).toBe(true);
    expect(isValidExpression('-5 + 10')).toBe(true);
  });

  it('應驗證小數表達式', () => {
    expect(isValidExpression('0.5 + 0.5')).toBe(true);
    expect(isValidExpression('.5 + .5')).toBe(true);
  });
});

describe('formatResult', () => {
  it('應格式化整數結果', () => {
    expect(formatResult(100)).toBe('100');
    expect(formatResult(0)).toBe('0');
    expect(formatResult(-50)).toBe('-50');
  });

  it('應格式化小數結果（預設 2 位）', () => {
    expect(formatResult(123.456789)).toBe('123.46');
    expect(formatResult(0.123)).toBe('0.12');
    // 1.005 因浮點數精度問題會變成 1.00499...，四捨五入後為 1
    expect(formatResult(1.006)).toBe('1.01'); // 四捨五入
  });

  it('應格式化小數結果（自訂小數位數）', () => {
    expect(formatResult(123.456789, 4)).toBe('123.4568');
    expect(formatResult(0.123456, 3)).toBe('0.123');
    // 1.0 是整數，直接返回 '1'
    expect(formatResult(1.0, 2)).toBe('1');
  });

  it('應移除尾部的零', () => {
    expect(formatResult(1.2)).toBe('1.2');
    expect(formatResult(1.1)).toBe('1.1');
    expect(formatResult(1.0)).toBe('1');
  });
});

describe('safeCalculate', () => {
  it('應返回有效表達式的計算結果', () => {
    expect(safeCalculate('100 + 50')).toBe(150);
    expect(safeCalculate('10 × 5')).toBe(50);
    expect(safeCalculate('(10 + 5) ÷ 3')).toBe(5);
  });

  it('應對無效表達式返回 null', () => {
    expect(safeCalculate('')).toBeNull();
    expect(safeCalculate('abc')).toBeNull();
    expect(safeCalculate('10 @@ 5')).toBeNull();
  });

  it('應對除以零返回 null', () => {
    expect(safeCalculate('10 ÷ 0')).toBeNull();
    expect(safeCalculate('(10 + 5) ÷ (3 - 3)')).toBeNull();
  });

  it('應對括號不匹配返回 null', () => {
    expect(safeCalculate('(10 + 5')).toBeNull();
    expect(safeCalculate('10 + 5)')).toBeNull();
  });

  it('應處理負數', () => {
    expect(safeCalculate('-5')).toBe(-5);
    expect(safeCalculate('-5 + 10')).toBe(5);
  });

  it('應處理小數', () => {
    expect(safeCalculate('0.5 + 0.5')).toBe(1);
    expect(safeCalculate('1.5 × 2')).toBe(3);
  });
});

/**
 * [BDD:2025-12-02] 補充測試以提升覆蓋率
 * 目標：evaluator.ts 91.03% → 95%
 * 未覆蓋行：56, 261, 303, 312
 */
describe('覆蓋率補充測試', () => {
  describe('邊緣情況 - 空白與特殊輸入', () => {
    it('應處理只有空白的表達式', () => {
      expect(() => calculateExpression('   ')).toThrow('表達式不可為空');
    });

    it('應處理 null/undefined 類型輸入', () => {
      // @ts-expect-error 測試非法輸入
      expect(() => calculateExpression(null)).toThrow();
      // @ts-expect-error 測試非法輸入
      expect(() => calculateExpression(undefined)).toThrow();
    });
  });

  describe('數字解析邊緣情況', () => {
    it('應處理負數開頭的表達式', () => {
      expect(calculateExpression('-5')).toBe(-5);
      expect(calculateExpression('-5 + 10')).toBe(5);
    });

    it('應處理括號內的負數', () => {
      expect(calculateExpression('(-5) + 10')).toBe(5);
      expect(calculateExpression('10 + (-5)')).toBe(5);
    });

    it('應處理小數點開頭的數字', () => {
      expect(calculateExpression('.5 + .5')).toBe(1);
      expect(calculateExpression('.25 × 4')).toBe(1);
    });
  });

  describe('運算符優先級邊緣情況', () => {
    it('應處理相同優先級的連續運算', () => {
      expect(calculateExpression('10 - 5 - 3')).toBe(2); // 左結合：(10-5)-3
      expect(calculateExpression('100 / 10 / 2')).toBe(5); // 左結合：(100/10)/2
    });

    it('應處理混合優先級的複雜表達式', () => {
      expect(calculateExpression('2 + 3 * 4 - 5 / 5')).toBe(13); // 2+12-1
      expect(calculateExpression('(2 + 3) * (4 - 1) / 3')).toBe(5);
    });
  });

  describe('大數與精度測試', () => {
    it('應處理大數運算', () => {
      expect(calculateExpression('1000000 + 2000000')).toBe(3000000);
      expect(calculateExpression('999999 × 2')).toBe(1999998);
    });

    it('應處理極小數', () => {
      expect(calculateExpression('0.001 + 0.002')).toBeCloseTo(0.003);
      expect(calculateExpression('0.0001 × 10000')).toBeCloseTo(1);
    });

    it('應處理浮點數精度問題', () => {
      // 經典的浮點數精度問題
      expect(calculateExpression('0.1 + 0.2')).toBeCloseTo(0.3, 10);
    });
  });

  describe('括號處理邊緣情況', () => {
    it('應處理多層巢狀括號', () => {
      expect(calculateExpression('(((1 + 2)))')).toBe(3);
      expect(calculateExpression('((2 + 3) × (4 - 1))')).toBe(15);
    });

    it('應處理空括號後的運算', () => {
      // 這應該拋出錯誤，因為空括號無效
      expect(() => calculateExpression('() + 5')).toThrow();
    });

    it('應處理括號內只有數字', () => {
      expect(calculateExpression('(42)')).toBe(42);
      expect(calculateExpression('(3.14)')).toBe(3.14);
    });
  });

  describe('特殊運算符組合', () => {
    it('應拒絕無效的運算符開頭', () => {
      expect(() => calculateExpression('* 5')).toThrow();
      expect(() => calculateExpression('/ 5')).toThrow();
    });

    it('應處理負數與括號的組合', () => {
      // 負數在括號內
      expect(calculateExpression('(-5) + 3')).toBe(-2);
      expect(calculateExpression('10 + (-3)')).toBe(7);
    });
  });

  describe('formatResult 邊緣情況', () => {
    it('應處理非常大的數字', () => {
      expect(formatResult(1e10)).toBe('10000000000');
    });

    it('應處理非常小的數字', () => {
      expect(formatResult(0.000001, 6)).toBe('0.000001');
    });

    it('應處理零', () => {
      expect(formatResult(0)).toBe('0');
      expect(formatResult(-0)).toBe('0');
    });

    it('應處理負小數', () => {
      expect(formatResult(-1.234)).toBe('-1.23');
      expect(formatResult(-0.1)).toBe('-0.1');
    });
  });

  describe('isValidExpression 邊緣情況', () => {
    it('應驗證只有數字的表達式', () => {
      expect(isValidExpression('12345')).toBe(true);
      expect(isValidExpression('0')).toBe(true);
    });

    it('應拒絕只有運算符的表達式', () => {
      expect(isValidExpression('+-*/')).toBe(false);
    });

    it('應驗證帶有空格的複雜表達式', () => {
      expect(isValidExpression('  1   +   2   ')).toBe(true);
    });
  });
});
