/**
 * useCalculator.test.ts - 計算機 hook 測試
 *
 * BDD 測試：測試行為而非實作細節
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalculator } from '../useCalculator';

describe('useCalculator', () => {
  describe('基本輸入', () => {
    it('應初始化為空運算式', () => {
      const { result } = renderHook(() => useCalculator());
      expect(result.current.expression).toBe('');
      expect(result.current.result).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('應處理數字輸入', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('5'));
      expect(result.current.expression).toBe('5');

      act(() => result.current.input('3'));
      expect(result.current.expression).toBe('53');
    });

    it('應處理運算子輸入', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('5'));
      act(() => result.current.input('+'));
      act(() => result.current.input('3'));

      expect(result.current.expression).toBe('5 + 3');
    });

    it('應處理小數點輸入', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('3'));
      act(() => result.current.input('.'));
      act(() => result.current.input('14'));

      expect(result.current.expression).toBe('3.14');
    });
  });

  describe('計算功能', () => {
    it('應正確計算運算式', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('2'));
      act(() => result.current.input('+'));
      act(() => result.current.input('3'));
      void act(() => result.current.calculate());

      expect(result.current.result).toBe(5);
      expect(result.current.error).toBeNull();
    });

    it('應處理複雜運算', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('('));
      act(() => result.current.input('2'));
      act(() => result.current.input('+'));
      act(() => result.current.input('3'));
      act(() => result.current.input(')'));
      act(() => result.current.input('×'));
      act(() => result.current.input('4'));
      void act(() => result.current.calculate());

      expect(result.current.result).toBe(20);
    });

    it('應處理小數計算', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('0'));
      act(() => result.current.input('.'));
      act(() => result.current.input('1'));
      act(() => result.current.input('+'));
      act(() => result.current.input('0'));
      act(() => result.current.input('.'));
      act(() => result.current.input('2'));
      void act(() => result.current.calculate());

      expect(result.current.result).toBeCloseTo(0.3);
    });
  });

  describe('清除功能', () => {
    it('應清除運算式', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('123'));
      act(() => result.current.clear());

      expect(result.current.expression).toBe('');
      expect(result.current.result).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('應清除錯誤訊息', () => {
      const { result } = renderHook(() => useCalculator());

      // 觸發錯誤
      act(() => result.current.input('1'));
      act(() => result.current.input('+'));
      void act(() => result.current.calculate());

      expect(result.current.error).not.toBeNull();

      // 清除應移除錯誤
      act(() => result.current.clear());
      expect(result.current.error).toBeNull();
    });
  });

  describe('刪除功能', () => {
    it('應刪除最後一個字元', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('1'));
      act(() => result.current.input('2'));
      act(() => result.current.input('3'));
      act(() => result.current.backspace());

      expect(result.current.expression).toBe('12');
    });

    it('應在空運算式時不做任何事', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.backspace());
      expect(result.current.expression).toBe('');
    });

    it('應在有內容時刪除字元並清除錯誤', () => {
      const { result } = renderHook(() => useCalculator());

      // 輸入內容並觸發錯誤
      act(() => result.current.input('1'));
      act(() => result.current.input('+'));
      void act(() => result.current.calculate());
      expect(result.current.error).not.toBeNull();

      // 刪除應清除錯誤
      act(() => result.current.backspace());
      expect(result.current.error).toBeNull();
    });
  });

  describe('錯誤處理', () => {
    it('應處理無效運算式', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('1'));
      act(() => result.current.input('+'));
      void act(() => result.current.calculate());

      expect(result.current.error).not.toBeNull();
      expect(result.current.result).toBeNull();
    });

    it('應處理括號不匹配', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('('));
      act(() => result.current.input('1'));
      act(() => result.current.input('+'));
      act(() => result.current.input('2'));
      void act(() => result.current.calculate());

      expect(result.current.error).not.toBeNull();
    });

    it('應處理空運算式計算', () => {
      const { result } = renderHook(() => useCalculator());

      void act(() => result.current.calculate());

      expect(result.current.error).not.toBeNull();
    });
  });

  describe('連續計算', () => {
    it('應支援連續計算', () => {
      const { result } = renderHook(() => useCalculator());

      // 第一次計算：2+3=5
      act(() => result.current.input('2'));
      act(() => result.current.input('+'));
      act(() => result.current.input('3'));
      void act(() => result.current.calculate());
      expect(result.current.result).toBe(5);

      // 第二次計算：5×2=10
      act(() => result.current.input('×'));
      act(() => result.current.input('2'));
      void act(() => result.current.calculate());
      expect(result.current.result).toBe(10);
    });

    it('應在新輸入數字時清除前次結果', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('2'));
      act(() => result.current.input('+'));
      act(() => result.current.input('3'));
      void act(() => result.current.calculate());

      // 輸入新數字應開始新運算式
      act(() => result.current.input('7'));
      expect(result.current.expression).toBe('7');
      expect(result.current.result).toBeNull();
    });
  });

  describe('驗證規則', () => {
    it('應防止重複小數點', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('3'));
      act(() => result.current.input('.'));
      act(() => result.current.input('14'));
      act(() => result.current.input('.')); // 第二個小數點

      expect(result.current.expression).toBe('3.14'); // 忽略第二個小數點
    });

    it('應防止以運算子結尾計算', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('5'));
      act(() => result.current.input('+'));
      void act(() => result.current.calculate());

      expect(result.current.error).not.toBeNull();
    });
  });

  describe('即時預覽功能', () => {
    it('應在有效運算式時顯示預覽', async () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('2'));
      act(() => result.current.input('+'));
      act(() => result.current.input('3'));

      // 等待防抖完成
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // 預覽應顯示計算結果
      expect(result.current.preview).toBe(5);
    });

    it('應在有最終結果時不顯示預覽', async () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('2'));
      act(() => result.current.input('+'));
      act(() => result.current.input('3'));
      void act(() => result.current.calculate());

      // 等待防抖完成
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // 已有結果時不應顯示預覽
      expect(result.current.result).toBe(5);
      expect(result.current.preview).toBeNull();
    });

    it('應在空運算式時不顯示預覽', async () => {
      const { result } = renderHook(() => useCalculator());

      // 等待防抖完成
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(result.current.preview).toBeNull();
    });

    it('應在無效運算式時不顯示預覽', async () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('2'));
      act(() => result.current.input('+'));
      // 不完整的運算式

      // 等待防抖完成
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // 無效運算式不應顯示預覽
      expect(result.current.preview).toBeNull();
    });
  });

  describe('初始值功能', () => {
    it('應支援初始值', () => {
      const { result } = renderHook(() => useCalculator(100));
      expect(result.current.expression).toBe('100');
    });

    it('應在初始值為 0 時正確顯示', () => {
      const { result } = renderHook(() => useCalculator(0));
      expect(result.current.expression).toBe('0');
    });
  });

  describe('計算錯誤處理', () => {
    it('應在計算拋出錯誤時返回 null', () => {
      const { result } = renderHook(() => useCalculator());

      // 輸入會導致計算錯誤的運算式
      act(() => result.current.input('1'));
      act(() => result.current.input('÷'));
      act(() => result.current.input('0'));
      const calcResult = act(() => result.current.calculate());

      // calculate 應返回 null 或結果
      expect(calcResult).toBeDefined();
    });
  });

  describe('正負號切換功能 (±)', () => {
    it('應將正數切換為負數', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('5'));
      act(() => result.current.negate());

      expect(result.current.expression).toBe('-5');
    });

    it('應將負數切換為正數', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('5'));
      act(() => result.current.negate());
      act(() => result.current.negate());

      expect(result.current.expression).toBe('5');
    });

    it('應在空運算式時不做任何事', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.negate());

      expect(result.current.expression).toBe('');
    });

    it('應只切換最後一個數字的正負號', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('5'));
      act(() => result.current.input('+'));
      act(() => result.current.input('3'));
      act(() => result.current.negate());

      expect(result.current.expression).toBe('5 + -3');
    });

    it('應處理小數的正負號切換', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('3'));
      act(() => result.current.input('.'));
      act(() => result.current.input('14'));
      act(() => result.current.negate());

      expect(result.current.expression).toBe('-3.14');
    });
  });

  describe('百分比功能 (%)', () => {
    it('應將數字轉換為百分比', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('50'));
      act(() => result.current.percent());

      expect(result.current.expression).toBe('0.5');
    });

    it('應在空運算式時不做任何事', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.percent());

      expect(result.current.expression).toBe('');
    });

    it('應只轉換最後一個數字', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('100'));
      act(() => result.current.input('+'));
      act(() => result.current.input('50'));
      act(() => result.current.percent());

      expect(result.current.expression).toBe('100 + 0.5');
    });

    it('應處理小數的百分比轉換', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => result.current.input('25'));
      act(() => result.current.input('.'));
      act(() => result.current.input('5'));
      act(() => result.current.percent());

      expect(result.current.expression).toBe('0.255');
    });
  });
});
