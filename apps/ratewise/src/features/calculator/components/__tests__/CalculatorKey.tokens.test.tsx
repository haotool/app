/**
 * CalculatorKey - Design Token Integration Test
 * 測試組件正確使用 Design Token（語義化類別）
 *
 * @see docs/prompt/BDD.md - BDD Given-When-Then 測試格式
 * @see src/config/design-tokens.ts - SSOT Design Token 定義
 * @see src/utils/classnames.ts - 類別名稱工具函數
 *
 * 🟢 GREEN Phase: 組件已遷移到 Design Token 系統
 * - 數字鍵使用 neutral-* 類別
 * - 運算符鍵使用 primary-* 類別
 * - 清除鍵使用 danger-* 類別
 * - 刪除鍵使用 warning-* 類別
 *
 * @created 2026-01-12
 * @version 1.0.0
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
 * 🟢 GREEN Phase: Design Token 整合測試
 * 驗證組件正確使用語義化類別
 */
describe('CalculatorKey - Design Token Integration', () => {
  describe('🟢 GREEN: 使用語義化類別', () => {
    describe('Given: 計算機按鍵需要統一色彩', () => {
      describe('When: 渲染數字鍵', () => {
        it('Then: 應該使用 neutral-* 類別', () => {
          // Given: 數字鍵定義
          const keyDef: KeyDefinition = {
            label: '7',
            value: '7',
            type: 'number',
            ariaLabel: '數字 7',
          };

          // When: 渲染組件
          const { container } = render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);

          // Then: 驗證使用語義化類別
          const button = container.querySelector('button');
          expect(button).toBeDefined();

          // 🟢 GREEN: 組件現在使用語義化 token
          expect(button?.className).toContain('bg-neutral-light');
          expect(button?.className).toContain('text-neutral-text');

          // 確認不再使用硬編碼類別
          expect(button?.className).not.toContain('bg-slate-100');
          expect(button?.className).not.toContain('text-slate-900');
        });

        it('Then: hover 狀態應該使用 hover:bg-neutral', () => {
          const keyDef: KeyDefinition = {
            label: '7',
            value: '7',
            type: 'number',
            ariaLabel: '數字 7',
          };

          const { container } = render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);

          const button = container.querySelector('button');

          // 🟢 GREEN: 驗證 hover 狀態使用語義化 token
          expect(button?.className).toContain('hover:bg-neutral');
          expect(button?.className).not.toContain('hover:bg-slate-200');
        });

        it('Then: active 狀態應該使用 active:bg-neutral-dark', () => {
          const keyDef: KeyDefinition = {
            label: '7',
            value: '7',
            type: 'number',
            ariaLabel: '數字 7',
          };

          const { container } = render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);

          const button = container.querySelector('button');

          // 🟢 GREEN: 驗證 active 狀態使用語義化 token
          expect(button?.className).toContain('active:bg-neutral-dark');
          expect(button?.className).not.toContain('active:bg-slate-300');
        });
      });

      describe('When: 渲染運算符鍵', () => {
        it('Then: 應該使用 primary-* 類別', () => {
          // Given: 運算符鍵定義
          const keyDef: KeyDefinition = {
            label: '+',
            value: '+',
            type: 'operator',
            ariaLabel: '加法',
          };

          // When: 渲染組件
          const { container } = render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);

          // Then: 驗證使用語義化類別
          const button = container.querySelector('button');
          expect(button).toBeDefined();

          // 🟢 GREEN: 組件現在使用語義化 token
          expect(button?.className).toContain('bg-primary-light');
          expect(button?.className).toContain('text-primary-text');

          // 確認不再使用硬編碼類別
          expect(button?.className).not.toContain('bg-violet-100');
          expect(button?.className).not.toContain('text-violet-700');
        });

        it('Then: 等號鍵應該使用 bg-primary 主色', () => {
          const keyDef: KeyDefinition = {
            label: '=',
            value: 'calculate',
            type: 'action', // 等號鍵類型為 action
            ariaLabel: '計算結果',
          };

          const { container } = render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);

          const button = container.querySelector('button');

          // 🟢 GREEN: 等號鍵使用 primary 主色
          expect(button?.className).toContain('bg-primary');
          expect(button?.className).not.toContain('bg-violet-600');
        });
      });

      describe('When: 渲染清除鍵', () => {
        it('Then: 應該使用 danger-* 類別', () => {
          const keyDef: KeyDefinition = {
            label: 'AC',
            value: 'clear',
            type: 'action',
            ariaLabel: '全部清除',
          };

          const { container } = render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);

          const button = container.querySelector('button');

          // 🟢 GREEN: 清除鍵使用 danger 語義化 token
          expect(button?.className).toContain('bg-danger-light');
          expect(button?.className).toContain('text-danger');

          expect(button?.className).not.toContain('bg-red-100');
        });
      });

      describe('When: 渲染刪除鍵', () => {
        it('Then: 應該使用 warning-* 類別', () => {
          const keyDef: KeyDefinition = {
            label: '⌫',
            value: 'backspace',
            type: 'action',
            ariaLabel: '刪除',
          };

          const { container } = render(<CalculatorKey keyDef={keyDef} onClick={vi.fn()} />);

          const button = container.querySelector('button');

          // 🟢 GREEN: 刪除鍵使用 warning 語義化 token
          expect(button?.className).toContain('bg-warning-light');
          expect(button?.className).toContain('text-warning');

          expect(button?.className).not.toContain('bg-amber-100');
        });
      });
    });
  });
});
