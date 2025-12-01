/**
 * Calculator Validator Tests
 * @file validator.test.ts
 * @description 計算機驗證工具測試（包含數字範圍驗證）
 */

import { describe, it, expect } from 'vitest';
import {
  validateExpression,
  canAddOperator,
  canAddDecimal,
  isNumberOutOfRange,
  canAddDigit,
  getLastNumber,
  sanitizeExpression,
  hasDivisionByZero,
} from '../validator';

describe('validateExpression', () => {
  it('應拒絕空表達式', () => {
    const result = validateExpression('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('表達式不可為空');
  });

  it('應接受正確的表達式', () => {
    expect(validateExpression('100 + 50').isValid).toBe(true);
    expect(validateExpression('100 - 50 × 2').isValid).toBe(true);
  });

  it('應拒絕非法字元', () => {
    const result = validateExpression('100 + abc');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('包含非法字元');
  });

  it('應拒絕以運算符開頭（除負號外）', () => {
    expect(validateExpression('+ 100').isValid).toBe(false);
    expect(validateExpression('× 100').isValid).toBe(false);
    expect(validateExpression('-100').isValid).toBe(true); // 負號可以
  });

  it('應拒絕以運算符結尾', () => {
    const result = validateExpression('100 +');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('運算符後缺少數字');
  });

  it('應拒絕連續運算符', () => {
    const result = validateExpression('100 ++ 50');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('運算符不可連續出現');
  });

  it('應拒絕連續小數點', () => {
    const result = validateExpression('100..5');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('小數點格式錯誤');
  });

  it('應拒絕括號不匹配', () => {
    const result = validateExpression('(100 + 50');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('括號不匹配');
  });

  it('應拒絕空括號', () => {
    const result = validateExpression('100 + ()');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('括號內不可為空');
  });

  it('應接受有效的括號表達式', () => {
    expect(validateExpression('(100 + 50) × 2').isValid).toBe(true);
    expect(validateExpression('((100 + 50) × 2)').isValid).toBe(true);
  });
});

describe('canAddOperator', () => {
  it('空表達式不可添加運算符', () => {
    expect(canAddOperator('')).toBe(false);
  });

  it('數字後可添加運算符', () => {
    expect(canAddOperator('100')).toBe(true);
  });

  it('運算符後不可再添加運算符', () => {
    expect(canAddOperator('100 +')).toBe(false);
  });

  it('小數點後不可添加運算符', () => {
    expect(canAddOperator('100.')).toBe(false);
  });
});

describe('canAddDecimal', () => {
  it('空表達式可添加小數點', () => {
    expect(canAddDecimal('')).toBe(true);
  });

  it('整數可添加小數點', () => {
    expect(canAddDecimal('100')).toBe(true);
  });

  it('已有小數點的數字不可再添加', () => {
    expect(canAddDecimal('100.5')).toBe(false);
  });

  it('運算符後的新數字可添加小數點', () => {
    expect(canAddDecimal('100 + 50')).toBe(true);
    expect(canAddDecimal('100 + 50.5')).toBe(false);
  });
});

describe('isNumberOutOfRange', () => {
  it('應接受 JavaScript 安全整數範圍內的數字', () => {
    expect(isNumberOutOfRange('9007199254740991')).toBe(false); // MAX_SAFE_INTEGER
    expect(isNumberOutOfRange('1000000000')).toBe(false); // 10 億（印尼盾房地產）
    expect(isNumberOutOfRange('999999999')).toBe(false); // 9 位整數
  });

  it('應拒絕超出 JavaScript 安全整數範圍的數字', () => {
    expect(isNumberOutOfRange('9007199254740992')).toBe(true); // MAX_SAFE_INTEGER + 1
    expect(isNumberOutOfRange('10000000000000000')).toBe(true); // 超出安全範圍
  });

  it('應接受 8 位小數（iOS 標準上限）', () => {
    expect(isNumberOutOfRange('123.12345678')).toBe(false);
  });

  it('應拒絕 9 位小數（超出 iOS 標準）', () => {
    expect(isNumberOutOfRange('123.123456789')).toBe(true);
  });

  it('應正確處理負數', () => {
    expect(isNumberOutOfRange('-9007199254740991')).toBe(false); // MIN_SAFE_INTEGER
    expect(isNumberOutOfRange('-9007199254740992')).toBe(true); // 超出範圍
  });

  it('應處理邊界情況', () => {
    expect(isNumberOutOfRange('0')).toBe(false);
    expect(isNumberOutOfRange('0.00000001')).toBe(false);
  });

  it('應支援高面額貨幣（印尼盾、韓元、日元）', () => {
    expect(isNumberOutOfRange('1000000000')).toBe(false); // 10 億盾
    expect(isNumberOutOfRange('5000000000')).toBe(false); // 50 億盾
    expect(isNumberOutOfRange('100000000000')).toBe(false); // 1000 億韓元
  });
});

describe('canAddDigit', () => {
  it('應允許添加數字到空表達式', () => {
    expect(canAddDigit('', '1')).toBe(true);
  });

  it('應允許添加數字到正常範圍內', () => {
    expect(canAddDigit('12345', '6')).toBe(true);
    expect(canAddDigit('1000000000', '0')).toBe(true); // 10 億 → 100 億，印尼盾 OK
  });

  it('應拒絕添加數字到 MAX_SAFE_INTEGER 邊界', () => {
    expect(canAddDigit('9007199254740991', '0')).toBe(false); // MAX_SAFE_INTEGER → 超出
    expect(canAddDigit('900719925474099', '2')).toBe(false); // 超出 MAX_SAFE_INTEGER
  });

  it('應允許在 8 位以內添加小數', () => {
    expect(canAddDigit('123.1234567', '8')).toBe(true);
  });

  it('應拒絕添加小數到 8 位小數（達上限）', () => {
    expect(canAddDigit('123.12345678', '9')).toBe(false);
  });

  it('應正確處理表達式中的最後一個數字', () => {
    expect(canAddDigit('100 + 9007199254740991', '0')).toBe(false); // 超出範圍
    expect(canAddDigit('100 + 1000000000', '0')).toBe(true); // 10 億 → 100 億 OK
  });

  it('應支援高面額貨幣計算', () => {
    expect(canAddDigit('500000000', '0')).toBe(true); // 5 億 → 50 億盾
    expect(canAddDigit('10000000000', '0')).toBe(true); // 100 億 → 1000 億韓元
  });
});

describe('getLastNumber', () => {
  it('應提取最後一個數字', () => {
    expect(getLastNumber('100 + 50')).toBe('50');
  });

  it('應提取包含小數點的數字', () => {
    expect(getLastNumber('123.45')).toBe('123.45');
  });

  it('運算符後無數字應返回空字串', () => {
    expect(getLastNumber('100 +')).toBe('');
  });

  it('應處理負數', () => {
    expect(getLastNumber('100 + -50')).toBe('50'); // 不包含負號
  });
});

describe('sanitizeExpression', () => {
  it('應移除多餘空格', () => {
    expect(sanitizeExpression('  100  +  50  ')).toBe('100 + 50');
  });

  it('應在運算符前後添加空格', () => {
    expect(sanitizeExpression('100+50')).toBe('100 + 50');
    expect(sanitizeExpression('100×50')).toBe('100 × 50');
  });

  it('應處理括號', () => {
    expect(sanitizeExpression('(100+50)')).toBe('( 100 + 50 )');
  });

  it('應處理複雜表達式', () => {
    expect(sanitizeExpression('100+50×2-30÷3')).toBe('100 + 50 × 2 - 30 ÷ 3');
  });
});

describe('hasDivisionByZero', () => {
  it('應檢測除以零', () => {
    expect(hasDivisionByZero('100 ÷ 0')).toBe(true);
    expect(hasDivisionByZero('100 / 0')).toBe(true);
  });

  it('應不誤判正常除法', () => {
    expect(hasDivisionByZero('100 ÷ 5')).toBe(false);
    expect(hasDivisionByZero('100 / 10')).toBe(false);
  });

  it('應不誤判加減零', () => {
    expect(hasDivisionByZero('100 + 0')).toBe(false);
    expect(hasDivisionByZero('100 - 0')).toBe(false);
  });

  it('應檢測表達式末尾的除以零', () => {
    expect(hasDivisionByZero('(100 + 50) ÷ 0')).toBe(true);
  });

  it('應處理零後有空格的情況', () => {
    expect(hasDivisionByZero('100 ÷ 0 ')).toBe(true);
  });
});

describe('isNumberOutOfRange - 邊界情況', () => {
  it('應處理空字串', () => {
    expect(isNumberOutOfRange('')).toBe(false);
    expect(isNumberOutOfRange('   ')).toBe(false);
  });

  it('應處理非數字字串', () => {
    expect(isNumberOutOfRange('(')).toBe(false);
    expect(isNumberOutOfRange('+')).toBe(false);
    expect(isNumberOutOfRange('abc')).toBe(false);
  });

  it('應處理只有小數點的字串', () => {
    expect(isNumberOutOfRange('.')).toBe(false);
  });
});
