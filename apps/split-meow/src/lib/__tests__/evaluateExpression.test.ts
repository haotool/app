import { describe, it, expect } from 'vitest';
import { evaluateExpression } from '../evaluateExpression';

describe('evaluateExpression', () => {
  describe('基本數字', () => {
    it('解析整數', () => expect(evaluateExpression('42')).toBe(42));
    it('解析小數', () => expect(evaluateExpression('3.14')).toBeCloseTo(3.14));
    it('空字串回傳 0', () => expect(evaluateExpression('')).toBe(0));
    it('只有空白回傳 0', () => expect(evaluateExpression('   ')).toBe(0));
    it('過長字串回傳 0', () => expect(evaluateExpression('1'.repeat(201))).toBe(0));
  });

  describe('基本四則運算', () => {
    it('加法', () => expect(evaluateExpression('100+50')).toBe(150));
    it('減法', () => expect(evaluateExpression('100-30')).toBe(70));
    it('乘法', () => expect(evaluateExpression('6*7')).toBe(42));
    it('除法', () => expect(evaluateExpression('100/4')).toBe(25));
    it('除以零回傳 0', () => expect(evaluateExpression('5/0')).toBe(0));
    it('浮點加法', () => expect(evaluateExpression('1.5+2.5')).toBeCloseTo(4));
    it('浮點減法', () => expect(evaluateExpression('5.5-2.2')).toBeCloseTo(3.3));
  });

  describe('運算子優先順序', () => {
    it('先乘後加', () => expect(evaluateExpression('2+3*4')).toBe(14));
    it('先除後減', () => expect(evaluateExpression('10-6/2')).toBe(7));
    it('混合優先順序', () => expect(evaluateExpression('2*3+4*5')).toBe(26));
  });

  describe('括號', () => {
    it('括號優先', () => expect(evaluateExpression('(2+3)*4')).toBe(20));
    it('巢狀括號', () => expect(evaluateExpression('((2+3))*4')).toBe(20));
    it('括號影響減法', () => expect(evaluateExpression('10-(3+2)')).toBe(5));
    it('括號影響除法', () => expect(evaluateExpression('(2+4)/3')).toBe(2));
  });

  describe('百分比', () => {
    it('10% = 0.1', () => expect(evaluateExpression('10%')).toBeCloseTo(0.1));
    it('50% = 0.5', () => expect(evaluateExpression('50%')).toBeCloseTo(0.5));
    it('100% = 1', () => expect(evaluateExpression('100%')).toBeCloseTo(1));
    it('百分比乘法', () => expect(evaluateExpression('200*10%')).toBeCloseTo(20));
  });

  describe('一元負號', () => {
    it('負數', () => expect(evaluateExpression('-5')).toBe(-5));
    it('負數加法', () => expect(evaluateExpression('-5+3')).toBe(-2));
  });

  describe('× ÷ 符號替換', () => {
    it('× 替換為乘', () => expect(evaluateExpression('3×4')).toBe(12));
    it('÷ 替換為除', () => expect(evaluateExpression('12÷4')).toBe(3));
  });

  describe('多運算子複合', () => {
    it('三個數字相加', () => expect(evaluateExpression('1+2+3')).toBe(6));
    it('混合加減乘除', () => expect(evaluateExpression('10+20*2-5')).toBe(45));
    it('含括號與百分比', () => expect(evaluateExpression('100*(1+10%)')).toBeCloseTo(110));
    it('分帳場景：三人平分', () => expect(evaluateExpression('300/3')).toBe(100));
    it('分帳場景：含稅 10%', () => expect(evaluateExpression('100+100*10%')).toBeCloseTo(110));
  });

  describe('無效輸入', () => {
    it('字母字元回傳 0', () => expect(evaluateExpression('abc')).toBe(0));
    it('不完整運算式', () => expect(evaluateExpression('5+')).toBe(0));
    it('不對稱括號', () => expect(evaluateExpression('(5+3')).toBe(0));
    it('多個小數點', () => expect(evaluateExpression('1.2.3')).toBe(0));
  });
});
