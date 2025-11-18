/**
 * Calculator Number Formatter Tests
 * @file formatCalculatorNumber.test.ts
 * @description 千位分隔符格式化函數測試
 */

import { describe, it, expect } from 'vitest';
import { formatCalculatorNumber, formatExpression } from '../formatCalculatorNumber';

describe('formatCalculatorNumber', () => {
  it('應正確格式化整數（含千位分隔符）', () => {
    expect(formatCalculatorNumber(1234567)).toBe('1,234,567');
    expect(formatCalculatorNumber(1000)).toBe('1,000');
    expect(formatCalculatorNumber(100)).toBe('100');
  });

  it('應正確格式化小數（含千位分隔符）', () => {
    expect(formatCalculatorNumber(1234.5678)).toBe('1,234.5678');
    expect(formatCalculatorNumber(0.123456789)).toBe('0.12345679'); // 最多 8 位小數
  });

  it('應正確格式化負數', () => {
    expect(formatCalculatorNumber(-1234567)).toBe('-1,234,567');
    expect(formatCalculatorNumber(-1234.56)).toBe('-1,234.56');
  });

  it('應處理零', () => {
    expect(formatCalculatorNumber(0)).toBe('0');
  });

  it('應處理字串輸入', () => {
    expect(formatCalculatorNumber('1234567')).toBe('1,234,567');
    expect(formatCalculatorNumber('1234.56')).toBe('1,234.56');
  });

  it('應處理無效輸入（返回原值）', () => {
    expect(formatCalculatorNumber('invalid')).toBe('invalid');
    expect(formatCalculatorNumber(NaN)).toBe('NaN');
    expect(formatCalculatorNumber(Infinity)).toBe('Infinity');
  });
});

describe('formatExpression', () => {
  it('應格式化表達式中的所有數字', () => {
    expect(formatExpression('1234 + 5678')).toBe('1,234 + 5,678');
    expect(formatExpression('100 × 50')).toBe('100 × 50');
  });

  it('應保留運算符和空格', () => {
    expect(formatExpression('123 - 456 ÷ 789')).toBe('123 - 456 ÷ 789');
  });

  it('應處理小數', () => {
    expect(formatExpression('1234.56 + 7890.12')).toBe('1,234.56 + 7,890.12');
  });

  it('應處理負數', () => {
    expect(formatExpression('-1234 + 5678')).toBe('-1,234 + 5,678');
  });

  it('應處理空字串', () => {
    expect(formatExpression('')).toBe('');
  });

  it('應處理無數字的表達式', () => {
    expect(formatExpression('+ - ×')).toBe('+ - ×');
  });
});
