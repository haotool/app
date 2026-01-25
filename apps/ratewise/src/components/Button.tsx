/**
 * Button Component - Unified Button System (SSOT)
 *
 * 統一應用程式按鈕系統，支援多種變體與尺寸。
 * 使用 design-tokens.ts 中的 buttonTokens 作為 SSOT。
 *
 * @example
 * ```tsx
 * // 基本用法
 * <Button>Click me</Button>
 *
 * // 變體
 * <Button variant="primary">Primary</Button>
 * <Button variant="secondary">Secondary</Button>
 * <Button variant="ghost">Ghost</Button>
 * <Button variant="danger">Danger</Button>
 *
 * // 尺寸
 * <Button size="sm">Small</Button>
 * <Button size="md">Medium</Button>
 * <Button size="lg">Large</Button>
 *
 * // 帶圖標
 * <Button leftIcon={<PlusIcon />}>Add Item</Button>
 * <Button rightIcon={<ArrowRightIcon />}>Continue</Button>
 *
 * // 載入狀態
 * <Button loading>Saving...</Button>
 *
 * // 滿版寬度
 * <Button fullWidth>Full Width</Button>
 * ```
 *
 * @see src/config/design-tokens.ts - buttonTokens SSOT
 * @created 2026-01-25
 * @version 1.0.0
 */

import React from 'react';
import { buttonTokens } from '../config/design-tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按鈕變體 */
  variant?: ButtonVariant;
  /** 按鈕尺寸 */
  size?: ButtonSize;
  /** 左側圖標 */
  leftIcon?: React.ReactNode;
  /** 右側圖標 */
  rightIcon?: React.ReactNode;
  /** 載入狀態 */
  loading?: boolean;
  /** 滿版寬度 */
  fullWidth?: boolean;
  /** 子元素 */
  children: React.ReactNode;
}

/**
 * 組合按鈕類別名稱
 */
function getButtonClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean,
  loading: boolean,
  className?: string,
): string {
  const { base, sizes, variants } = buttonTokens;
  const sizeConfig = sizes[size];
  const variantConfig = variants[variant];

  const classes = [
    // 基礎樣式
    base.display,
    base.typography,
    base.border,
    base.cursor,
    base.transition,
    base.focus,
    base.disabled,
    // 尺寸
    sizeConfig.padding,
    sizeConfig.fontSize,
    sizeConfig.height,
    sizeConfig.gap,
    // 變體
    variantConfig.default,
    variantConfig.hover,
    variantConfig.active,
    // 條件樣式
    fullWidth ? 'w-full' : '',
    loading ? 'relative' : '',
    // 自定義類別
    className ?? '',
  ];

  return classes.filter(Boolean).join(' ');
}

/**
 * 載入動畫 Spinner
 */
function LoadingSpinner({ size }: { size: ButtonSize }) {
  const iconSize = buttonTokens.sizes[size].iconSize;

  return (
    <svg
      className={`animate-spin ${iconSize}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Button 組件
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      leftIcon,
      rightIcon,
      loading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = Boolean(disabled) || Boolean(loading);
    const iconSize = buttonTokens.sizes[size].iconSize;

    return (
      <button
        ref={ref}
        className={getButtonClasses(variant, size, fullWidth, loading, className)}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {/* 載入狀態：覆蓋原內容 */}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner size={size} />
          </span>
        )}

        {/* 原內容：載入時透明化 */}
        <span
          className={`flex items-center ${buttonTokens.sizes[size].gap} ${loading ? 'opacity-0' : ''}`}
        >
          {leftIcon && <span className={iconSize}>{leftIcon}</span>}
          {children}
          {rightIcon && <span className={iconSize}>{rightIcon}</span>}
        </span>
      </button>
    );
  },
);

Button.displayName = 'Button';

/**
 * IconButton - 純圖標按鈕
 */
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  /** 圖標 */
  icon: React.ReactNode;
  /** 無障礙標籤 (必填) */
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, variant = 'ghost', size = 'md', className, ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={`${sizeClasses[size]} !p-0 ${className ?? ''}`}
        {...props}
      >
        {icon}
      </Button>
    );
  },
);

IconButton.displayName = 'IconButton';

export default Button;
