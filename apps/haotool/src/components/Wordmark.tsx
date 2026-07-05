import { APP_INFO } from '../config/app-info';

interface WordmarkProps {
  className?: string;
}

/**
 * 品牌標準字 inline SVG（素材 A1 同構）：prefix 墨色 + accent 品牌藍。
 * textLength 鎖定兩段寬度，避免系統字型堆疊 metrics 差異造成裁切或跳動。
 * 純裝飾（aria-hidden）；可及名稱由外層連結或 sr-only 文字提供。
 */
export default function Wordmark({ className = 'h-6 w-auto' }: WordmarkProps) {
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
