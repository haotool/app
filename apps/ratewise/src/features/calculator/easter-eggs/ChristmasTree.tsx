/**
 * Christmas Tree - SVG Component
 * @file ChristmasTree.tsx
 * @description 漂亮的 SVG 聖誕樹，帶有裝飾品和星星
 */

import type { ChristmasTreeProps } from './types';

/**
 * 聖誕樹 SVG 組件
 * @description 使用 SVG 繪製的精美聖誕樹，包含：
 * - 多層綠色樹冠
 * - 樹頂金色星星
 * - 彩色裝飾球
 * - 棕色樹幹
 */
export function ChristmasTree({ size = 200 }: ChristmasTreeProps) {
  const height = size * 1.4;

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 200 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="christmas-tree"
      aria-label="聖誕樹"
      role="img"
    >
      {/* 樹頂星星 */}
      <g className="christmas-star">
        <polygon
          points="100,5 105,25 125,25 110,38 115,58 100,45 85,58 90,38 75,25 95,25"
          fill="#fbbf24"
          stroke="#f59e0b"
          strokeWidth="1"
        />
        {/* 星星光芒 */}
        <circle cx="100" cy="30" r="8" fill="#fef08a" opacity="0.6" />
      </g>

      {/* 第一層樹冠（最上層） */}
      <polygon points="100,50 140,100 60,100" fill="#166534" stroke="#14532d" strokeWidth="1" />
      <polygon points="100,50 135,95 65,95" fill="#22c55e" />

      {/* 第二層樹冠 */}
      <polygon points="100,80 155,145 45,145" fill="#166534" stroke="#14532d" strokeWidth="1" />
      <polygon points="100,80 150,140 50,140" fill="#22c55e" />

      {/* 第三層樹冠（最底層） */}
      <polygon points="100,120 170,200 30,200" fill="#166534" stroke="#14532d" strokeWidth="1" />
      <polygon points="100,120 165,195 35,195" fill="#22c55e" />

      {/* 樹幹 */}
      <rect x="85" y="195" width="30" height="40" fill="#78350f" stroke="#451a03" strokeWidth="1" />
      <rect x="88" y="195" width="24" height="40" fill="#92400e" />

      {/* 樹幹底座 */}
      <rect x="75" y="230" width="50" height="15" rx="3" fill="#dc2626" stroke="#b91c1c" strokeWidth="1" />

      {/* 裝飾球 - 紅色 */}
      <circle cx="85" cy="85" r="6" fill="#ef4444" stroke="#dc2626" strokeWidth="1" />
      <circle cx="115" cy="90" r="5" fill="#ef4444" stroke="#dc2626" strokeWidth="1" />
      <circle cx="70" cy="130" r="7" fill="#ef4444" stroke="#dc2626" strokeWidth="1" />
      <circle cx="130" cy="135" r="6" fill="#ef4444" stroke="#dc2626" strokeWidth="1" />
      <circle cx="55" cy="175" r="7" fill="#ef4444" stroke="#dc2626" strokeWidth="1" />
      <circle cx="145" cy="180" r="6" fill="#ef4444" stroke="#dc2626" strokeWidth="1" />

      {/* 裝飾球 - 金色 */}
      <circle cx="100" cy="100" r="5" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
      <circle cx="90" cy="150" r="6" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
      <circle cx="110" cy="155" r="5" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
      <circle cx="80" cy="185" r="6" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
      <circle cx="120" cy="190" r="5" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />

      {/* 裝飾球 - 藍色 */}
      <circle cx="75" cy="105" r="5" fill="#3b82f6" stroke="#2563eb" strokeWidth="1" />
      <circle cx="125" cy="110" r="6" fill="#3b82f6" stroke="#2563eb" strokeWidth="1" />
      <circle cx="100" cy="170" r="7" fill="#3b82f6" stroke="#2563eb" strokeWidth="1" />
      <circle cx="65" cy="155" r="5" fill="#3b82f6" stroke="#2563eb" strokeWidth="1" />
      <circle cx="135" cy="160" r="6" fill="#3b82f6" stroke="#2563eb" strokeWidth="1" />

      {/* 雪花裝飾 */}
      <text x="50" y="120" fontSize="10" fill="white" opacity="0.8">
        *
      </text>
      <text x="150" y="125" fontSize="10" fill="white" opacity="0.8">
        *
      </text>
      <text x="45" y="165" fontSize="12" fill="white" opacity="0.7">
        *
      </text>
      <text x="155" y="170" fontSize="12" fill="white" opacity="0.7">
        *
      </text>
    </svg>
  );
}
