/**
 * ChartContainer - 趨勢圖容器
 *
 * @description 統一圖表容器，控制寬高比例避免圖表太寬或太高
 *
 * 設計原則：
 * - Mobile: 100% 寬度，aspect-ratio 16:9 (較矮)
 * - Tablet: max-width 600px，aspect-ratio 2:1
 * - Desktop: max-width 480px，aspect-ratio 2.5:1 (更緊湊)
 *
 * 高度限制：
 * - 最大高度 200px，避免佔用過多垂直空間
 * - 最小高度 120px，確保圖表可讀性
 *
 * @version 1.0.0
 * @created 2025-01-18
 */

import type { ReactNode } from 'react';

interface ChartContainerProps {
  children: ReactNode;
  /** 圖表變體 */
  variant?: 'inline' | 'card' | 'full';
  /** 自訂 className */
  className?: string;
  /** 顯示標題 */
  title?: string;
  /** 副標題 */
  subtitle?: string;
}

/**
 * 圖表尺寸配置
 *
 * variant 說明：
 * - inline: 內嵌在卡片中的小圖表 (max-height: 120px)
 * - card: 獨立卡片中的圖表 (max-height: 180px)
 * - full: 全寬圖表頁面 (max-height: 240px)
 */
const variantStyles = {
  inline: {
    maxWidth: '100%',
    maxHeight: '120px',
    minHeight: '80px',
    aspectRatio: '3 / 1',
  },
  card: {
    maxWidth: '480px',
    maxHeight: '180px',
    minHeight: '120px',
    aspectRatio: '2.5 / 1',
  },
  full: {
    maxWidth: '600px',
    maxHeight: '240px',
    minHeight: '160px',
    aspectRatio: '2 / 1',
  },
};

export function ChartContainer({
  children,
  variant = 'card',
  className = '',
  title,
  subtitle,
}: ChartContainerProps) {
  const styles = variantStyles[variant];

  return (
    <div className={`chart-container ${className}`}>
      {/* Header */}
      {(title !== undefined || subtitle !== undefined) && (
        <div className="mb-2">
          {title && (
            <h3
              style={{
                fontSize: 'var(--font-size-sm, 14px)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
              }}
            >
              {title}
            </h3>
          )}
          {subtitle && (
            <p
              style={{
                fontSize: 'var(--font-size-xs, 14px)',
                color: 'var(--color-text-tertiary)',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Chart Area */}
      <div
        className="relative w-full"
        style={{
          maxWidth: styles.maxWidth,
          maxHeight: styles.maxHeight,
          minHeight: styles.minHeight,
          aspectRatio: styles.aspectRatio,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * MiniChart - 迷你圖表容器（用於列表項目）
 *
 * @description 極簡圖表，高度固定 40px
 */
interface MiniChartProps {
  children: ReactNode;
  className?: string;
}

export function MiniChart({ children, className = '' }: MiniChartProps) {
  return (
    <div
      className={`mini-chart ${className}`}
      style={{
        width: '80px',
        height: '40px',
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

/**
 * TrendIndicator - 趨勢指示器（數字+箭頭）
 *
 * @description 顯示漲跌趨勢的小型指示器
 */
interface TrendIndicatorProps {
  value: number;
  /** 百分比還是絕對值 */
  type?: 'percent' | 'absolute';
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
}

export function TrendIndicator({ value, type = 'percent', size = 'md' }: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  const sizeStyles = {
    sm: { fontSize: '12px', iconSize: 12 },
    md: { fontSize: '14px', iconSize: 14 },
    lg: { fontSize: '16px', iconSize: 16 },
  };

  const { fontSize, iconSize } = sizeStyles[size];

  const displayValue =
    type === 'percent' ? `${isPositive ? '+' : ''}${value.toFixed(2)}%` : value.toFixed(4);

  return (
    <span
      className="inline-flex items-center gap-0.5"
      style={{
        fontSize,
        fontWeight: 500,
        color: isNeutral
          ? 'var(--color-text-tertiary)'
          : isPositive
            ? 'var(--color-status-success)'
            : 'var(--color-status-error)',
      }}
    >
      {!isNeutral && (
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: isPositive ? 'rotate(0deg)' : 'rotate(180deg)',
          }}
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      )}
      {displayValue}
    </span>
  );
}
