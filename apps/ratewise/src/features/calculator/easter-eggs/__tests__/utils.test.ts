/**
 * Christmas Easter Egg Utils - BDD Tests
 * @file utils.test.ts
 * @description 測試聖誕彩蛋的觸發條件檢測
 *
 * 彩蛋觸發條件：
 * - 表達式：106575 ÷ 1225
 * - 結果：87
 * - 隱藏含義：1225 = 12月25日聖誕節
 */

import { describe, it, expect } from 'vitest';
import { isChristmasEasterEgg, normalizeExpressionForEasterEgg } from '../utils';

describe('Christmas Easter Egg Detection', () => {
  describe('isChristmasEasterEgg', () => {
    it('should detect 106575 ÷ 1225 as Christmas Easter Egg', () => {
      expect(isChristmasEasterEgg('106575 ÷ 1225')).toBe(true);
    });

    it('should detect 106575 / 1225 as Christmas Easter Egg (alternative notation)', () => {
      expect(isChristmasEasterEgg('106575 / 1225')).toBe(true);
    });

    it('should detect without spaces', () => {
      expect(isChristmasEasterEgg('106575÷1225')).toBe(true);
      expect(isChristmasEasterEgg('106575/1225')).toBe(true);
    });

    it('should NOT detect other expressions', () => {
      expect(isChristmasEasterEgg('100 + 200')).toBe(false);
      expect(isChristmasEasterEgg('1225 + 1225')).toBe(false);
      expect(isChristmasEasterEgg('106575 + 1225')).toBe(false);
      expect(isChristmasEasterEgg('106575 × 1225')).toBe(false);
      expect(isChristmasEasterEgg('')).toBe(false);
    });

    it('should NOT detect partial matches', () => {
      expect(isChristmasEasterEgg('106575')).toBe(false);
      expect(isChristmasEasterEgg('1225')).toBe(false);
      expect(isChristmasEasterEgg('106575 ÷')).toBe(false);
    });
  });

  describe('normalizeExpressionForEasterEgg', () => {
    it('should normalize spaces', () => {
      expect(normalizeExpressionForEasterEgg('106575 ÷ 1225')).toBe('106575÷1225');
      expect(normalizeExpressionForEasterEgg('106575  ÷  1225')).toBe('106575÷1225');
    });

    it('should convert / to ÷', () => {
      expect(normalizeExpressionForEasterEgg('106575 / 1225')).toBe('106575÷1225');
    });

    it('should handle empty string', () => {
      expect(normalizeExpressionForEasterEgg('')).toBe('');
    });
  });
});
