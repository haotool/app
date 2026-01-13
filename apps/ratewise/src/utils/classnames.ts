/**
 * Class Names Utility Functions
 * @file classnames.ts
 * @description 統一管理 Tailwind 類別生成邏輯，配合 Design Token 系統使用
 *
 * @see src/config/design-tokens.ts - Design Token SSOT 定義
 * @see docs/dev/005_design_token_refactoring.md - 技術決策記錄
 *
 * @created 2026-01-12
 * @version 1.0.0
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合併 Tailwind 類別名稱
 *
 * @description 使用 clsx 處理條件邏輯，twMerge 解決 Tailwind 類別衝突
 *
 * @param inputs - 類別名稱陣列（支援字串、物件、陣列）
 * @returns 合併後的類別名稱字串
 *
 * @example
 * ```typescript
 * cn('bg-primary', isActive && 'bg-primary-dark')
 * // => 'bg-primary-dark' (後者覆蓋前者)
 * ```
 *
 * @reference shadcn/ui - className utility
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 預定義的 Token 組合類別
 * @description 提供常用的 design token 類別組合，減少重複程式碼
 */
export const tokenClasses = {
  /**
   * 中性色系組合（數字鍵）
   */
  neutral: {
    base: 'bg-neutral-light text-neutral-text',
    hover: 'hover:bg-neutral',
    active: 'active:bg-neutral-dark',
    all: 'bg-neutral-light text-neutral-text hover:bg-neutral active:bg-neutral-dark',
  },

  /**
   * 中性色系組合（功能鍵：%, +/-）
   */
  neutralFunction: {
    base: 'bg-neutral text-neutral-text-secondary',
    hover: 'hover:bg-neutral-dark',
    active: 'active:bg-neutral-darker',
    all: 'bg-neutral text-neutral-text-secondary hover:bg-neutral-dark active:bg-neutral-darker',
  },

  /**
   * 品牌主色組合（運算符）
   */
  primaryLight: {
    base: 'bg-primary-light text-primary-text',
    hover: 'hover:bg-primary-hover',
    active: 'active:bg-primary-active',
    all: 'bg-primary-light text-primary-text hover:bg-primary-hover active:bg-primary-active',
  },

  /**
   * 品牌主色組合（等號鍵）
   */
  primaryStrong: {
    base: 'bg-primary text-white',
    hover: 'hover:bg-primary-dark',
    active: 'active:bg-primary-darker',
    all: 'bg-primary text-white hover:bg-primary-dark active:bg-primary-darker',
  },

  /**
   * 危險色系組合（清除鍵）
   */
  danger: {
    base: 'bg-danger-light text-danger',
    hover: 'hover:bg-danger-hover',
    active: 'active:bg-danger-active',
    all: 'bg-danger-light text-danger hover:bg-danger-hover active:bg-danger-active',
  },

  /**
   * 警告色系組合（刪除鍵）
   */
  warning: {
    base: 'bg-warning-light text-warning',
    hover: 'hover:bg-warning-hover',
    active: 'active:bg-warning-active',
    all: 'bg-warning-light text-warning hover:bg-warning-hover active:bg-warning-active',
  },
} as const;

/**
 * 按鈕類別生成器
 *
 * @description 根據變體類型生成完整的按鈕類別字串
 *
 * @param variant - 按鈕變體類型
 * @param additionalClasses - 額外的類別名稱（可選）
 * @returns 完整的類別名稱字串
 *
 * @example
 * ```typescript
 * getButtonClasses('neutral', 'text-2xl')
 * // => 'bg-neutral-light text-neutral-text hover:bg-neutral active:bg-neutral-dark text-2xl'
 * ```
 */
export function getButtonClasses(
  variant: keyof typeof tokenClasses,
  additionalClasses?: string,
): string {
  const tokenClass = tokenClasses[variant];
  return cn(tokenClass.all, additionalClasses);
}

/**
 * 計算機按鍵類別生成器
 *
 * @description 專門為計算機按鍵生成類別，包含基礎樣式和 token 組合
 *
 * @param variant - 按鍵變體類型
 * @param options - 配置選項
 * @returns 完整的按鍵類別字串
 *
 * @example
 * ```typescript
 * getCalculatorKeyClasses('neutral', { size: 'text-2xl' })
 * // => 'calculator-key relative h-16 rounded-xl font-semibold select-none overflow-hidden bg-neutral-light text-neutral-text hover:bg-neutral active:bg-neutral-dark text-2xl'
 * ```
 */
export function getCalculatorKeyClasses(
  variant: keyof typeof tokenClasses,
  options: {
    size?: string;
    customClass?: string;
    includeBase?: boolean;
  } = {},
): string {
  const { size = 'text-2xl', customClass = '', includeBase = true } = options;

  const baseStyles = includeBase
    ? 'calculator-key relative h-16 rounded-xl font-semibold select-none overflow-hidden'
    : '';

  return cn(baseStyles, tokenClasses[variant].all, size, customClass);
}
