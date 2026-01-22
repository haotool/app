/**
 * CalculatorKey - Design Token Integration Test
 * 測試組件正確使用 Design Token（iOS-inspired 計算機專用 token）
 *
 * @see docs/prompt/BDD.md - BDD Given-When-Then 測試格式
 * @see src/utils/classnames.ts - 計算機專用 token 類別
 * @see src/index.css - 6 種風格的 CSS Variables 定義
 *
 * 🟢 GREEN Phase: 組件已遷移到 iOS-inspired 計算機配色系統
 * - 數字鍵使用 calc-number-* 類別（深灰背景、白字）
 * - 運算符鍵使用 calc-operator-* 類別（橙色背景、白字）- 含等號
 * - 功能鍵使用 calc-function-* 類別（淺灰背景、深色字）- AC, ⌫, %, +/-
 *
 * @reference Apple Calculator、UX Collective 最佳實踐
 * @created 2026-01-12
 * @updated 2026-01-22 - 遷移到 iOS-inspired 計算機配色系統
 * @version 2.0.0
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
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
        ...props
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
        const handleClick = (e: React.MouseEvent) => {
          onTapStart?.();
          onTap?.();
          onClick?.(e);
        };

        return (
          <button onClick={handleClick} className={className} disabled={disabled} {...props}>
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
 * 🟢 GREEN Phase: iOS-inspired 計算機配色系統整合測試
 * 驗證組件正確使用三色分組 token
 */
describe('CalculatorKey - Design Token Integration', () => {
  describe('🟢 GREEN: 使用 iOS-inspired 計算機專用 token', () => {
    describe('Given: 計算機按鍵需要符合 iOS 設計標準', () => {
      describe('When: 渲染數字鍵 (0-9, .)', () => {
        it('Then: 應該使用 calc-number-* 類別（深灰背景、白字）', () => {
          // Given: 數字鍵定義
          const keyDef: KeyDefinition = {
            label: '7',
            value: '7',
            type: 'number',
            ariaLabel: '數字 7',
          };

          // When: 渲染組件
          const { container } = render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);

          // Then: 驗證使用計算機專用 token
          const button = container.querySelector('button');
          expect(button).toBeDefined();

          // 🟢 GREEN: 數字鍵使用 calc-number token
          expect(button?.className).toContain('bg-calc-number');
          expect(button?.className).toContain('text-calc-number-text');

          // 確認不再使用舊的 neutral 類別
          expect(button?.className).not.toContain('bg-neutral-light');
          expect(button?.className).not.toContain('bg-slate-100');
        });

        it('Then: hover 狀態應該使用 hover:bg-calc-number-hover', () => {
          const keyDef: KeyDefinition = {
            label: '7',
            value: '7',
            type: 'number',
            ariaLabel: '數字 7',
          };

          const { container } = render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);

          const button = container.querySelector('button');

          // 🟢 GREEN: 驗證 hover 狀態使用計算機專用 token
          expect(button?.className).toContain('hover:bg-calc-number-hover');
          expect(button?.className).not.toContain('hover:bg-neutral');
        });

        it('Then: active 狀態應該使用 active:bg-calc-number-active', () => {
          const keyDef: KeyDefinition = {
            label: '7',
            value: '7',
            type: 'number',
            ariaLabel: '數字 7',
          };

          const { container } = render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);

          const button = container.querySelector('button');

          // 🟢 GREEN: 驗證 active 狀態使用計算機專用 token
          expect(button?.className).toContain('active:bg-calc-number-active');
          expect(button?.className).not.toContain('active:bg-neutral-dark');
        });
      });

      describe('When: 渲染運算符鍵 (+, -, ×, ÷)', () => {
        it('Then: 應該使用 calc-operator-* 類別（橙色背景、白字）', () => {
          // Given: 運算符鍵定義
          const keyDef: KeyDefinition = {
            label: '+',
            value: '+',
            type: 'operator',
            ariaLabel: '加法',
          };

          // When: 渲染組件
          const { container } = render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);

          // Then: 驗證使用計算機專用 token
          const button = container.querySelector('button');
          expect(button).toBeDefined();

          // 🟢 GREEN: 運算符鍵使用 calc-operator token
          expect(button?.className).toContain('bg-calc-operator');
          expect(button?.className).toContain('text-calc-operator-text');

          // 確認不再使用舊的 primary-light 類別
          expect(button?.className).not.toContain('bg-primary-light');
          expect(button?.className).not.toContain('bg-violet-100');
        });

        it('Then: 等號鍵應該與運算符使用相同配色（iOS 標準）', () => {
          const keyDef: KeyDefinition = {
            label: '=',
            value: 'calculate',
            type: 'action', // 等號鍵類型為 action
            ariaLabel: '計算結果',
          };

          const { container } = render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);

          const button = container.querySelector('button');

          // 🟢 GREEN: 等號鍵使用 calc-operator（與運算符同色 - iOS 標準）
          expect(button?.className).toContain('bg-calc-operator');
          expect(button?.className).toContain('text-calc-operator-text');
          expect(button?.className).not.toContain('bg-primary');
        });
      });

      describe('When: 渲染功能鍵 (AC, ⌫, %, +/-)', () => {
        it('Then: 清除鍵應該使用 calc-function-* 類別（淺灰背景、深色字）', () => {
          const keyDef: KeyDefinition = {
            label: 'AC',
            value: 'clear',
            type: 'action',
            ariaLabel: '全部清除',
          };

          const { container } = render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);

          const button = container.querySelector('button');

          // 🟢 GREEN: 清除鍵使用 calc-function token（iOS 標準淺灰色）
          expect(button?.className).toContain('bg-calc-function');
          expect(button?.className).toContain('text-calc-function-text');

          // 確認不再使用舊的 danger 類別
          expect(button?.className).not.toContain('bg-danger-light');
          expect(button?.className).not.toContain('text-danger');
        });

        it('Then: 刪除鍵應該使用 calc-function-* 類別', () => {
          const keyDef: KeyDefinition = {
            label: '⌫',
            value: 'backspace',
            type: 'action',
            ariaLabel: '刪除',
          };

          const { container } = render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);

          const button = container.querySelector('button');

          // 🟢 GREEN: 刪除鍵使用 calc-function token（iOS 標準淺灰色）
          expect(button?.className).toContain('bg-calc-function');
          expect(button?.className).toContain('text-calc-function-text');

          // 確認不再使用舊的 warning 類別
          expect(button?.className).not.toContain('bg-warning-light');
          expect(button?.className).not.toContain('text-warning');
        });

        it('Then: 百分比鍵應該使用 calc-function-* 類別', () => {
          const keyDef: KeyDefinition = {
            label: '%',
            value: 'percent',
            type: 'action',
            ariaLabel: '百分比',
          };

          const { container } = render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);

          const button = container.querySelector('button');

          // 🟢 GREEN: 百分比鍵使用 calc-function token
          expect(button?.className).toContain('bg-calc-function');
          expect(button?.className).toContain('text-calc-function-text');
        });

        it('Then: 正負號鍵應該使用 calc-function-* 類別', () => {
          const keyDef: KeyDefinition = {
            label: '+/-',
            value: 'negate',
            type: 'action',
            ariaLabel: '正負號切換',
          };

          const { container } = render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);

          const button = container.querySelector('button');

          // 🟢 GREEN: 正負號鍵使用 calc-function token
          expect(button?.className).toContain('bg-calc-function');
          expect(button?.className).toContain('text-calc-function-text');
        });
      });
    });
  });

  describe('🎨 iOS-inspired 三色分組原則驗證', () => {
    it('所有數字鍵使用相同配色（背景級）', () => {
      const numberKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

      numberKeys.forEach((num) => {
        const keyDef: KeyDefinition = {
          label: num,
          value: num,
          type: 'number',
          ariaLabel: `數字 ${num}`,
        };

        const { container } = render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);
        const button = container.querySelector('button');

        expect(button?.className).toContain('bg-calc-number');
      });
    });

    it('所有運算符使用相同配色（最高優先級）', () => {
      const operators = [
        { label: '+', value: '+' },
        { label: '-', value: '-' },
        { label: '×', value: '×' },
        { label: '÷', value: '÷' },
      ];

      operators.forEach((op) => {
        const keyDef: KeyDefinition = {
          label: op.label,
          value: op.value,
          type: 'operator',
          ariaLabel: `運算符 ${op.label}`,
        };

        const { container } = render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);
        const button = container.querySelector('button');

        expect(button?.className).toContain('bg-calc-operator');
      });
    });

    it('所有功能鍵使用相同配色（中等優先級）', () => {
      const functionKeys = [
        { label: 'AC', value: 'clear' },
        { label: '⌫', value: 'backspace' },
        { label: '%', value: 'percent' },
        { label: '+/-', value: 'negate' },
      ];

      functionKeys.forEach((fn) => {
        const keyDef: KeyDefinition = {
          label: fn.label,
          value: fn.value,
          type: 'action',
          ariaLabel: fn.label,
        };

        const { container } = render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);
        const button = container.querySelector('button');

        expect(button?.className).toContain('bg-calc-function');
      });
    });
  });
});
