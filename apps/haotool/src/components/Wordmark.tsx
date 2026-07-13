import type { CSSProperties } from 'react';
import { APP_INFO } from '../config/app-info';

interface WordmarkProps {
  className?: string;
  /**
   * 呈現載體（M1 裁決）：Header 實例用 'animated'（HTML 字元 span，S1 開場動畫載體；
   * SVG tspan 的 CSS transform 在 Safari 不可動畫）；Footer/OG 維持 'svg' 靜態。
   */
  variant?: 'svg' | 'animated';
}

// 字元陣列由品牌原子 SSOT 導出：prefix 墨色 + accent 品牌藍。
const WORDMARK_CHARS = [
  ...APP_INFO.wordmarkPrefix.split('').map((char) => ({ char, accent: false })),
  ...APP_INFO.wordmarkAccent.split('').map((char) => ({ char, accent: true })),
];

/**
 * 品牌標準字（素材 A1 同構）。
 * svg：textLength 鎖定兩段寬度，避免系統字型堆疊 metrics 差異造成裁切或跳動。
 * animated：HTML 字元 span（排印同構：800/-0.02em/系統字堆疊），僅首次 session 播放 S1 進場。
 * 純裝飾（aria-hidden）；可及名稱由外層連結或 sr-only 文字提供。
 */
export default function Wordmark({ className = 'h-6 w-auto', variant = 'svg' }: WordmarkProps) {
  if (variant === 'animated') {
    return (
      <span className={`wordmark ${className}`} aria-hidden="true">
        {WORDMARK_CHARS.map(({ char, accent }, index) => (
          <span
            key={`${char}-${index}`}
            className={accent ? 'wm-char wm-char-accent' : 'wm-char'}
            style={{ '--i': index } as CSSProperties}
          >
            {char}
          </span>
        ))}
      </span>
    );
  }

  return (
    <svg className={className} viewBox="0 0 84 24" aria-hidden="true" focusable="false">
      <text
        y="12.5"
        dominantBaseline="central"
        fontFamily="var(--font-sans)"
        fontSize="21"
        fontWeight="800"
        letterSpacing="-0.02em"
      >
        <tspan x="0" textLength="38" lengthAdjust="spacingAndGlyphs" fill="var(--color-text)">
          {APP_INFO.wordmarkPrefix}
        </tspan>
        <tspan x="40" textLength="44" lengthAdjust="spacingAndGlyphs" fill="var(--color-primary)">
          {APP_INFO.wordmarkAccent}
        </tspan>
      </text>
    </svg>
  );
}
