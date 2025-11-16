/**
 * evaluator.test.ts - expr-eval 封裝測試
 *
 * BDD 測試：測試行為而非實作細節
 */

import { describe, it, expect } from 'vitest';
import { calculateExpression } from '../evaluator';

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
});
