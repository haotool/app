/**
 * Snow Accumulation Effect - Component
 * @file SnowAccumulation.tsx
 * @description 積雪效果組件 - 在 UI 元素頂部顯示浪漫的積雪曲線
 *
 * 設計風格：浪漫唯美派
 * - 柔和的白色積雪曲線
 * - 微妙的閃爍效果模擬雪花反光
 * - 自然的不規則雪堆形狀
 */

import './styles/december-theme.css';

/**
 * 積雪效果 Props
 */
export interface SnowAccumulationProps {
  /** 積雪高度（預設 16px） */
  height?: number;
  /** 積雪樣式變體 */
  variant?: 'default' | 'thick' | 'thin';
  /** 自定義 className */
  className?: string;
}

/**
 * 積雪效果組件
 * @description 在 UI 元素頂部顯示浪漫的積雪效果
 */
export function SnowAccumulation({
  height = 16,
  variant = 'default',
  className = '',
}: SnowAccumulationProps) {
  // 根據變體調整高度
  const actualHeight =
    variant === 'thick' ? height * 1.5 : variant === 'thin' ? height * 0.7 : height;

  return (
    <div
      className={`snow-accumulation snow-accumulation--${variant} ${className}`}
      style={{ height: actualHeight }}
      aria-hidden="true"
    >
      {/* 主積雪層 - SVG 自然曲線 */}
      <svg
        className="snow-accumulation__main"
        viewBox="0 0 200 20"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 底層雪堆 - 較深的陰影 */}
        <path
          d="M0 20 L0 12 Q10 8 20 10 Q35 6 50 9 Q65 5 80 8 Q100 4 120 7 Q140 5 160 9 Q180 6 200 10 L200 20 Z"
          fill="rgba(255, 255, 255, 0.6)"
        />
        {/* 中層雪堆 */}
        <path
          d="M0 20 L0 14 Q15 10 30 12 Q50 8 70 11 Q90 7 110 10 Q130 6 150 11 Q170 8 190 12 L200 13 L200 20 Z"
          fill="rgba(255, 255, 255, 0.8)"
        />
        {/* 頂層雪堆 - 最亮 */}
        <path
          d="M0 20 L0 16 Q20 13 40 15 Q60 11 80 14 Q100 10 120 13 Q140 11 160 14 Q180 12 200 15 L200 20 Z"
          fill="white"
        />
      </svg>

      {/* 閃爍的雪花點綴 */}
      <div className="snow-accumulation__sparkles">
        <span className="snow-sparkle" style={{ left: '10%', animationDelay: '0s' }}>
          ✦
        </span>
        <span className="snow-sparkle" style={{ left: '25%', animationDelay: '0.5s' }}>
          ✧
        </span>
        <span className="snow-sparkle" style={{ left: '45%', animationDelay: '1s' }}>
          ✦
        </span>
        <span className="snow-sparkle" style={{ left: '65%', animationDelay: '1.5s' }}>
          ✧
        </span>
        <span className="snow-sparkle" style={{ left: '80%', animationDelay: '0.3s' }}>
          ✦
        </span>
        <span className="snow-sparkle" style={{ left: '92%', animationDelay: '0.8s' }}>
          ✧
        </span>
      </div>
    </div>
  );
}
