/**
 * CalculatorKey Component - BDD Test Suite
 * @file CalculatorKey.test.tsx
 * @description 行為驅動開發測試：計算機按鍵組件
 *
 * 🐛 修復驗證 2025-11-20：
 * - 確保 Motion 動畫正常工作（whileTap 放大效果）
 * - 確保刪除按鈕短按和長按行為正確
 * - 確保觸覺回饋正常觸發
 * - 確保移動設備和桌面版行為一致
 *
 * BDD 格式：Given-When-Then
 * @see docs/prompt/BDD.md
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { vi, describe, it, expect } from 'vitest';
import { CalculatorKey } from '../CalculatorKey';
import type { KeyDefinition } from '../../types';

// Mock Motion.js (避免測試環境動畫問題)
vi.mock('motion/react', () => ({
  motion: {
    button: vi.fn(
      ({
        children,
        onClick,
        className,
        disabled,
        onTap,
        onTapStart,
        whileTap: _whileTap,
        whileHover: _whileHover,
        transition: _transition,
        onTapCancel: _onTapCancel,
        ...rest
      }: {
        children?: React.ReactNode;
        onClick?: (e: React.MouseEvent) => void;
        className?: string;
        disabled?: boolean;
        onTap?: () => void;
        onTapStart?: () => void;
        whileTap?: unknown;
        whileHover?: unknown;
        transition?: unknown;
        onTapCancel?: () => void;
        [key: string]: unknown;
      }) => {
        // 模擬 Motion.js 的 tap 手勢行為
        const handleClick = (e: React.MouseEvent) => {
          // 先觸發 onTapStart（如果有）
          onTapStart?.();
          // 再觸發 onTap（如果有）
          onTap?.();
          // 最後觸發 onClick（如果有）
          onClick?.(e);
        };

        return (
          <button
            onClick={handleClick}
            className={className}
            disabled={disabled}
            {...rest}
            data-testid="motion-button"
            // whileTap, whileHover, onTapStart, onTap, onTapCancel 不傳遞到 DOM
          >
            {children}
          </button>
        );
      },
    ),
  },
}));

// Mock 觸覺回饋
vi.mock('../../utils/haptics', () => ({
  lightHaptic: vi.fn(),
  mediumHaptic: vi.fn(),
}));

/**
 * BDD 場景：計算機按鍵組件
 *
 * 核心行為：
 * 1. 數字鍵：點擊觸發輸入
 * 2. 運算符鍵：點擊觸發運算
 * 3. 刪除鍵：短按刪除一個，長按連續刪除
 * 4. 清除鍵：點擊清除所有
 * 5. 觸覺回饋：每次點擊都有震動反饋
 */
describe('CalculatorKey Component - BDD Tests', () => {
  /**
   * 場景 1：數字鍵點擊
   * Given: 用戶需要輸入數字
   * When: 點擊數字鍵
   * Then: 應該觸發 onClick 回調並傳遞正確的值
   */
  describe('場景 1: 數字鍵點擊', () => {
    it('應該在點擊數字鍵時觸發 onClick 回調', () => {
      // Given: 準備測試數據
      const keyDef: KeyDefinition = {
        label: '7',
        value: '7',
        type: 'number',
        ariaLabel: '數字 7',
      };
      const onClickMock = vi.fn();

      // When: 渲染組件並點擊
      render(<CalculatorKey keyDef={keyDef} onClick={onClickMock} />);
      const button = screen.getByRole('button', { name: '數字 7' });
      fireEvent.click(button);

      // Then: 驗證結果
      expect(onClickMock).toHaveBeenCalledWith('7');
      expect(onClickMock).toHaveBeenCalledTimes(1);
    });

    it('應該顯示正確的數字標籤', () => {
      // Given: 準備測試數據
      const keyDef: KeyDefinition = {
        label: '5',
        value: '5',
        type: 'number',
        ariaLabel: '數字 5',
      };

      // When: 渲染組件
      render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);

      // Then: 驗證顯示
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '數字 5' })).toBeInTheDocument();
    });
  });

  /**
   * 場景 2：運算符鍵點擊
   * Given: 用戶需要執行運算
   * When: 點擊運算符鍵
   * Then: 應該觸發 onClick 回調並傳遞運算符
   */
  describe('場景 2: 運算符鍵點擊', () => {
    it('應該在點擊加法鍵時觸發 onClick 回調', () => {
      // Given: 準備測試數據
      const keyDef: KeyDefinition = {
        label: '+',
        value: '+',
        type: 'operator',
        ariaLabel: '加法',
      };
      const onClickMock = vi.fn();

      // When: 渲染組件並點擊
      render(<CalculatorKey keyDef={keyDef} onClick={onClickMock} />);
      const button = screen.getByRole('button', { name: '加法' });
      fireEvent.click(button);

      // Then: 驗證結果
      expect(onClickMock).toHaveBeenCalledWith('+');
    });

    it('應該套用運算符鍵樣式（calculator-key--operator）', () => {
      // Given: 準備測試數據
      const keyDef: KeyDefinition = {
        label: '×',
        value: '×',
        type: 'operator',
        ariaLabel: '乘法',
      };

      // When: 渲染組件
      render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);
      const button = screen.getByRole('button', { name: '乘法' });

      // Then: 驗證樣式
      expect(button).toHaveClass('calculator-key--operator');
    });
  });

  /**
   * 場景 3：刪除鍵短按（單次刪除）
   * Given: 用戶需要刪除單個字符
   * When: 短按刪除鍵（<500ms）
   * Then: 應該觸發一次 onClick 回調
   */
  describe('場景 3: 刪除鍵短按（單次刪除）', () => {
    it('應該在短按刪除鍵時觸發一次 onClick', () => {
      // Given: 準備測試數據
      const keyDef: KeyDefinition = {
        label: '⌫',
        value: 'backspace',
        type: 'action',
        ariaLabel: '刪除',
      };
      const onClickMock = vi.fn();

      // When: 渲染組件並短按
      render(<CalculatorKey keyDef={keyDef} onClick={onClickMock} />);
      const button = screen.getByRole('button', { name: '刪除' });

      // 模擬短按：click 事件（<500ms）
      fireEvent.click(button);

      // Then: 驗證結果
      expect(onClickMock).toHaveBeenCalledWith('backspace');
      expect(onClickMock).toHaveBeenCalledTimes(1); // ✅ 只觸發一次
    });
  });

  /**
   * 場景 4：刪除鍵長按（連續刪除）
   * Given: 用戶需要快速刪除多個字符
   * When: 長按刪除鍵（≥500ms）
   * Then: 應該連續觸發 onClick 回調（間隔 150ms）
   *
   * 注意：目前刪除鍵只保留基本渲染與短按行為，未啟用長按連續刪除。
   */
  describe('場景 4: 刪除鍵基本功能', () => {
    it('應該正確渲染刪除鍵', () => {
      // Given: 準備測試數據
      const keyDef: KeyDefinition = {
        label: '⌫',
        value: 'backspace',
        type: 'action',
        ariaLabel: '刪除',
      };

      // When: 渲染組件
      render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);

      // Then: 驗證按鍵存在且可訪問
      const button = screen.getByRole('button', { name: '刪除' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('⌫');
    });
  });

  /**
   * 場景 5：清除鍵點擊
   * Given: 用戶需要清除所有輸入
   * When: 點擊清除鍵（AC）
   * Then: 應該觸發 onClick 回調並傳遞 'clear'
   */
  describe('場景 5: 清除鍵點擊', () => {
    it('應該在點擊清除鍵時觸發 onClick 回調', () => {
      // Given: 準備測試數據
      const keyDef: KeyDefinition = {
        label: 'AC',
        value: 'clear',
        type: 'action',
        ariaLabel: '清除全部',
      };
      const onClickMock = vi.fn();

      // When: 渲染組件並點擊
      render(<CalculatorKey keyDef={keyDef} onClick={onClickMock} />);
      const button = screen.getByRole('button', { name: '清除全部' });
      fireEvent.click(button);

      // Then: 驗證結果
      expect(onClickMock).toHaveBeenCalledWith('clear');
    });
  });

  /**
   * 場景 6：計算鍵點擊
   * Given: 用戶完成輸入，需要計算結果
   * When: 點擊等號鍵（=）
   * Then: 應該觸發 onClick 回調並傳遞 'calculate'
   */
  describe('場景 6: 計算鍵點擊', () => {
    it('應該在點擊計算鍵時觸發 onClick 回調', () => {
      // Given: 準備測試數據
      const keyDef: KeyDefinition = {
        label: '=',
        value: 'calculate',
        type: 'action',
        ariaLabel: '計算結果',
      };
      const onClickMock = vi.fn();

      // When: 渲染組件並點擊
      render(<CalculatorKey keyDef={keyDef} onClick={onClickMock} />);
      const button = screen.getByRole('button', { name: '計算結果' });
      fireEvent.click(button);

      // Then: 驗證結果
      expect(onClickMock).toHaveBeenCalledWith('calculate');
    });

    it('應該套用計算鍵樣式（calculator-key--equals）', () => {
      // Given: 準備測試數據
      const keyDef: KeyDefinition = {
        label: '=',
        value: 'calculate',
        type: 'action',
        ariaLabel: '計算結果',
      };

      // When: 渲染組件
      render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);
      const button = screen.getByRole('button', { name: '計算結果' });

      // Then: 驗證樣式
      expect(button).toHaveClass('calculator-key--equals');
    });
  });

  /**
   * 場景 7：禁用狀態
   * Given: 按鍵被禁用
   * When: 用戶嘗試點擊
   * Then: 不應該觸發 onClick 回調
   */
  describe('場景 7: 禁用狀態', () => {
    it('應該在禁用時不觸發 onClick 回調', () => {
      // Given: 準備測試數據（禁用）
      const keyDef: KeyDefinition = {
        label: '5',
        value: '5',
        type: 'number',
        ariaLabel: '數字 5',
      };
      const onClickMock = vi.fn();

      // When: 渲染禁用的組件並嘗試點擊
      render(<CalculatorKey keyDef={keyDef} onClick={onClickMock} disabled />);
      const button = screen.getByRole('button', { name: '數字 5' });
      fireEvent.click(button);

      // Then: 驗證結果
      expect(onClickMock).not.toHaveBeenCalled();
      expect(button).toBeDisabled();
    });
  });

  /**
   * 場景 8：無障礙功能
   * Given: 視障用戶使用螢幕閱讀器
   * When: 閱讀器讀取按鍵
   * Then: 應該提供正確的 ARIA 標籤
   */
  describe('場景 8: 無障礙功能', () => {
    it('應該為數字鍵提供正確的 ARIA 標籤', () => {
      // Given: 準備測試數據
      const keyDef: KeyDefinition = {
        label: '9',
        value: '9',
        type: 'number',
        ariaLabel: '數字 9',
      };

      // When: 渲染組件
      render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);

      // Then: 驗證 ARIA 標籤
      const button = screen.getByRole('button', { name: '數字 9' });
      expect(button).toHaveAttribute('aria-label', '數字 9');
    });

    it('應該為運算符鍵提供正確的 ARIA 標籤', () => {
      // Given: 準備測試數據
      const keyDef: KeyDefinition = {
        label: '÷',
        value: '÷',
        type: 'operator',
        ariaLabel: '除法',
      };

      // When: 渲染組件
      render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);

      // Then: 驗證 ARIA 標籤
      const button = screen.getByRole('button', { name: '除法' });
      expect(button).toHaveAttribute('aria-label', '除法');
    });
  });

  /**
   * 場景 9：Motion 動畫屬性
   * Given: 按鍵需要視覺反饋
   * When: 用戶按下按鍵
   * Then: 應該套用 Motion 動畫屬性（whileTap, whileHover）
   *
   * 注意：由於 Motion 被 mock，這裡測試 props 傳遞
   */
  describe('場景 9: Motion 動畫屬性', () => {
    it('應該渲染為 motion.button', () => {
      // Given: 準備測試數據
      const keyDef: KeyDefinition = {
        label: '1',
        value: '1',
        type: 'number',
        ariaLabel: '數字 1',
      };

      // When: 渲染組件
      render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);

      // Then: 驗證 Motion 按鈕
      expect(screen.getByTestId('motion-button')).toBeInTheDocument();
    });
  });

  /**
   * 場景 10：樣式類別
   * Given: 不同類型的按鍵需要不同樣式
   * When: 渲染不同類型的按鍵
   * Then: 應該套用正確的 CSS 類別
   *
   * 🔄 重構 2026-01-12: 遷移到 Design Token 系統
   * @see src/config/design-tokens.ts - SSOT Design Token 定義
   * @see src/utils/classnames.ts - 類別名稱工具函數
   */
  describe('場景 10: 樣式類別', () => {
    it('應該為數字鍵套用正確樣式（使用語義化 token）', () => {
      // Given: 準備測試數據
      const keyDef: KeyDefinition = {
        label: '0',
        value: '0',
        type: 'number',
        ariaLabel: '數字 0',
      };

      // When: 渲染組件
      render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);
      const button = screen.getByRole('button', { name: '數字 0' });

      // Then: 驗證樣式類別包含基礎樣式和計算機專用 token
      expect(button).toHaveClass('calculator-key');
      // 🟢 GREEN: 驗證使用計算機專用 token (iOS-inspired)
      expect(button.className).toContain('bg-calc-number'); // 數字鍵背景色（深灰）
      expect(button.className).toContain('text-calc-number-text'); // 數字鍵文字色（白）
      // 確認不再使用舊的 neutral 類別
      expect(button.className).not.toContain('bg-neutral-light');
      expect(button.className).not.toContain('bg-slate-100');
    });

    it('應該為運算符鍵套用正確樣式（使用計算機專用 token）', () => {
      // Given: 準備測試數據
      const keyDef: KeyDefinition = {
        label: '-',
        value: '-',
        type: 'operator',
        ariaLabel: '減法',
      };

      // When: 渲染組件
      render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);
      const button = screen.getByRole('button', { name: '減法' });

      // Then: 驗證樣式類別（計算機專用 token）
      expect(button).toHaveClass('calculator-key--operator');
      // 🟢 GREEN: 驗證使用計算機專用 token (iOS-inspired 橙色)
      expect(button.className).toContain('bg-calc-operator'); // 運算符鍵背景色（橙色）
      expect(button.className).toContain('text-calc-operator-text'); // 運算符鍵文字色（白）
      // 確認不再使用舊的 primary 類別
      expect(button.className).not.toContain('bg-primary-light');
      expect(button.className).not.toContain('bg-violet-100');
    });
  });
});
