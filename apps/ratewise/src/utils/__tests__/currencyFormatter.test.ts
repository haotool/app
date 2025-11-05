/**
 * 貨幣格式化工具測試
 *
 * 測試覆蓋：
 * - getCurrencyDecimalPlaces
 * - formatCurrency
 * - formatExchangeRate
 * - formatAmountInput
 * - formatAmountDisplay
 */

import { describe, it, expect } from 'vitest';
import {
  getCurrencyDecimalPlaces,
  formatCurrency,
  formatExchangeRate,
  formatAmountInput,
  formatAmountDisplay,
} from '../currencyFormatter';
import type { CurrencyCode } from '../../features/ratewise/types';

describe('currencyFormatter', () => {
  describe('getCurrencyDecimalPlaces', () => {
    it('應返回 TWD 的小數位數 (2)', () => {
      expect(getCurrencyDecimalPlaces('TWD')).toBe(2);
    });

    it('應返回 USD 的小數位數 (2)', () => {
      expect(getCurrencyDecimalPlaces('USD')).toBe(2);
    });

    it('應返回 JPY 的小數位數 (0)', () => {
      expect(getCurrencyDecimalPlaces('JPY')).toBe(0);
    });

    it('應返回 KRW 的小數位數 (0)', () => {
      expect(getCurrencyDecimalPlaces('KRW')).toBe(0);
    });

    it('應返回 EUR 的小數位數 (2)', () => {
      expect(getCurrencyDecimalPlaces('EUR')).toBe(2);
    });
  });

  describe('formatCurrency', () => {
    it('應正確格式化 TWD (2 位小數)', () => {
      expect(formatCurrency(1000, 'TWD')).toBe('1,000.00');
      expect(formatCurrency(1000.5, 'TWD')).toBe('1,000.50');
      expect(formatCurrency(30970.123, 'TWD')).toBe('30,970.12');
    });

    it('應正確格式化 USD (2 位小數)', () => {
      expect(formatCurrency(1000, 'USD')).toBe('1,000.00');
      expect(formatCurrency(1000.99, 'USD')).toBe('1,000.99');
    });

    it('應正確格式化 JPY (0 位小數)', () => {
      expect(formatCurrency(1000, 'JPY')).toBe('1,000');
      expect(formatCurrency(151813.7255, 'JPY')).toBe('151,814');
    });

    it('應正確格式化 KRW (0 位小數)', () => {
      expect(formatCurrency(4233700, 'KRW')).toBe('4,233,700');
    });

    it('應處理零值', () => {
      expect(formatCurrency(0, 'USD')).toBe('0.00');
      expect(formatCurrency(0, 'JPY')).toBe('0');
    });

    it('應處理負數', () => {
      const usdNegative = formatCurrency(-1000, 'USD');
      const jpyNegative = formatCurrency(-1000, 'JPY');

      // 允許 "-1,000.00" 或 "- 1,000.00" (locale 差異)
      expect(usdNegative.replace(/\s/g, '')).toBe('-1,000.00');
      expect(jpyNegative.replace(/\s/g, '')).toBe('-1,000');
    });

    it('應處理小數點', () => {
      expect(formatCurrency(0.01, 'USD')).toBe('0.01');
      expect(formatCurrency(0.99, 'USD')).toBe('0.99');
    });
  });

  describe('formatExchangeRate', () => {
    it('應格式化為 4 位小數', () => {
      expect(formatExchangeRate(0.0323)).toBe('0.0323');
      expect(formatExchangeRate(30.97)).toBe('30.9700');
      expect(formatExchangeRate(151.8137)).toBe('151.8137');
    });

    it('應處理大數字', () => {
      expect(formatExchangeRate(1290.4167)).toBe('1,290.4167');
    });

    it('應處理零值', () => {
      expect(formatExchangeRate(0)).toBe('0.0000');
    });

    it('應處理負數', () => {
      expect(formatExchangeRate(-0.0323)).toBe('-0.0323');
    });
  });

  describe('formatAmountInput', () => {
    it('應處理空字串', () => {
      expect(formatAmountInput('', 'USD')).toBe('');
    });

    it('應處理有效數字', () => {
      const result = formatAmountInput('1000', 'USD');
      // formatAmountInput 不添加格式化，只處理輸入
      expect(result).toBe('1000');
    });

    it('應處理小數', () => {
      expect(formatAmountInput('1000.50', 'USD')).toBe('1000.50');
    });

    it('應限制小數位數 (USD: 2 位)', () => {
      const result = formatAmountInput('1000.999', 'USD');
      // 四捨五入並限制小數位數
      expect(result).toBe('1000.99');
    });

    it('應處理 JPY（無小數）', () => {
      // formatAmountInput 只限制小數位數，保留小數點
      expect(formatAmountInput('1000.50', 'JPY')).toBe('1000.');
      expect(formatAmountInput('1000', 'JPY')).toBe('1000');
    });

    it('應移除非數字字符', () => {
      expect(formatAmountInput('abc', 'USD')).toBe('');
    });

    it('應處理多個小數點（只保留第一個）', () => {
      const result = formatAmountInput('10.5.5', 'USD');
      // 第一個點後的第二個點會被移除
      expect(result).toBe('10.55');
    });
  });

  describe('formatAmountDisplay', () => {
    it('應處理 null 和 undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      expect(formatAmountDisplay(null as any, 'USD')).toBe('');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      expect(formatAmountDisplay(undefined as any, 'USD')).toBe('');
    });

    it('應處理空字串', () => {
      expect(formatAmountDisplay('', 'USD')).toBe('');
      expect(formatAmountDisplay('   ', 'USD')).toBe('');
    });

    it('應格式化有效字串數字', () => {
      expect(formatAmountDisplay('1000', 'USD')).toBe('1,000.00');
      expect(formatAmountDisplay('1000.50', 'USD')).toBe('1,000.50');
    });

    it('應格式化數字類型', () => {
      expect(formatAmountDisplay(1000, 'USD')).toBe('1,000.00');
      expect(formatAmountDisplay(1000.5, 'JPY')).toBe('1,001');
    });

    it('應處理無效輸入（NaN）', () => {
      expect(formatAmountDisplay(NaN, 'USD')).toBe('');
      expect(formatAmountDisplay('invalid', 'USD')).toBe('invalid');
    });

    it('應處理 Infinity', () => {
      expect(formatAmountDisplay(Infinity, 'USD')).toBe('');
      expect(formatAmountDisplay(-Infinity, 'USD')).toBe('');
    });

    it('應處理零值', () => {
      expect(formatAmountDisplay(0, 'USD')).toBe('0.00');
      expect(formatAmountDisplay('0', 'USD')).toBe('0.00');
    });

    it('應處理負數', () => {
      const result1 = formatAmountDisplay(-1000, 'USD');
      const result2 = formatAmountDisplay('-1000', 'USD');

      // 允許 locale 差異
      expect(result1.replace(/\s/g, '')).toBe('-1,000.00');
      expect(result2.replace(/\s/g, '')).toBe('-1,000.00');
    });
  });

  describe('整合測試', () => {
    it('應支援所有支援的貨幣', () => {
      const currencies: CurrencyCode[] = [
        'TWD',
        'USD',
        'JPY',
        'KRW',
        'EUR',
        'GBP',
        'CHF',
        'CNY',
        'HKD',
        'AUD',
        'SGD',
        'CAD',
      ];

      currencies.forEach((currency) => {
        const decimals = getCurrencyDecimalPlaces(currency);
        expect(decimals).toBeGreaterThanOrEqual(0);
        expect(decimals).toBeLessThanOrEqual(4);

        const formatted = formatCurrency(1000, currency);
        expect(formatted).toContain('1,000');

        const display = formatAmountDisplay(1000, currency);
        expect(display).toBeTruthy();
      });
    });
  });
});
