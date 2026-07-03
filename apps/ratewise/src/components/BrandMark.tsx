/**
 * BrandMark - 雙幣交會品牌符號（Twin Coins，主題感知）
 *
 * 幾何 SSOT：scripts/source-images/brand/haorate-mark.svg（實心＝本幣、鏤空＝外幣、交會＝匯率）。
 * 顏色改由主題 token 驅動（--color-primary / --color-primary-strong / --color-surface），
 * 切換主題時 LOGO 主色即時跟隨；靜態資產（favicon、PWA icons）維持品牌藍不受影響。
 */

import { useId } from 'react';

interface BrandMarkProps {
  className?: string;
  /** splash 模式：為各圖層加上啟動頁動畫 class。 */
  variant?: 'static' | 'splash';
}

export function BrandMark({ className = '', variant = 'static' }: BrandMarkProps) {
  // 同頁可能出現多個實例（header + splash），漸層 id 必須唯一。
  const gradientId = useId();
  const isSplash = variant === 'splash';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'rgb(var(--color-primary))', stopOpacity: 0.82 }} />
          <stop offset="0.5" style={{ stopColor: 'rgb(var(--color-primary))' }} />
          <stop
            offset="1"
            style={{ stopColor: 'rgb(var(--color-primary-strong,var(--color-primary)))' }}
          />
        </linearGradient>
      </defs>
      <g
        className={isSplash ? 'splash-halo' : undefined}
        opacity="0.18"
        style={{ filter: 'blur(2.5px)' }}
      >
        <circle cx="38" cy="50" r="18" fill="rgb(var(--color-primary))" />
        <circle
          cx="62"
          cy="50"
          r="18"
          fill="none"
          stroke="rgb(var(--color-primary))"
          strokeWidth="7.5"
        />
      </g>
      <g className={isSplash ? 'splash-coin-solid' : undefined}>
        <circle cx="38" cy="50" r="18" fill={`url(#${gradientId})`} />
      </g>
      <g className={isSplash ? 'splash-coin-ring' : undefined}>
        <circle
          cx="62"
          cy="50"
          r="18"
          fill="rgb(var(--color-surface))"
          stroke={`url(#${gradientId})`}
          strokeWidth="7.5"
        />
      </g>
    </svg>
  );
}
