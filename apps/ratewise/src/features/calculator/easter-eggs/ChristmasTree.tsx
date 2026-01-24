/**
 * Christmas Tree - SVG Component
 * @file ChristmasTree.tsx
 * @description 漂亮的 SVG 聖誕樹，帶有裝飾品和星星
 *
 * @design 使用 Design Token 系統支援 6 種主題風格
 *         顏色從 CSS Variables 動態讀取，確保主題一致性
 *
 * @tokens 使用 --color-seasonal-* 系列 tokens
 *         - star: 星星顏色
 *         - tree: 樹冠顏色
 *         - trunk: 樹幹顏色
 *         - ornament-*: 裝飾球顏色
 *         - base: 底座顏色
 *         - snow: 積雪顏色
 *
 * @created 2025-12-xx
 * @updated 2026-01-24 - 遷移至 Design Token 系統
 */

import { useState, useEffect } from 'react';
import type { ChristmasTreeProps } from './types';
import { getSeasonalColors, type SeasonalColors } from '../../../config/themes';

/**
 * 聖誕樹 SVG 組件
 * @description 使用 SVG 繪製的精美聖誕樹，包含：
 * - 多層綠色樹冠（主題感知）
 * - 樹頂金色星星（主題感知）
 * - 彩色裝飾球（主題感知）
 * - 棕色樹幹（主題感知）
 */
export function ChristmasTree({ size = 200 }: ChristmasTreeProps) {
  const height = size * 1.4;

  /* ------------------------------------------------------------------
   * 主題顏色狀態 - 從 CSS Variables 動態讀取
   * ------------------------------------------------------------------ */
  const [colors, setColors] = useState<SeasonalColors>(() => getSeasonalColors());

  /**
   * 監聽主題變更並更新顏色
   * 使用 MutationObserver 觀察 data-style 屬性變化
   */
  useEffect(() => {
    const updateColors = () => {
      setColors(getSeasonalColors());
    };

    // 初始化
    updateColors();

    // 監聽主題變更
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'data-style') {
          updateColors();
          break;
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-style'],
    });

    return () => observer.disconnect();
  }, []);

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
      {/* 樹頂星星 - 使用 seasonal-star token */}
      <g className="christmas-star">
        <polygon
          points="100,5 105,25 125,25 110,38 115,58 100,45 85,58 90,38 75,25 95,25"
          fill={colors.star}
          stroke={colors.starStroke}
          strokeWidth="1"
        />
        {/* 星星光芒 */}
        <circle cx="100" cy="30" r="8" fill={colors.starGlow} opacity="0.6" />
      </g>

      {/* 第一層樹冠（最上層）- 使用 seasonal-tree token */}
      <polygon
        points="100,50 140,100 60,100"
        fill={colors.treeDark}
        stroke={colors.treeStroke}
        strokeWidth="1"
      />
      <polygon points="100,50 135,95 65,95" fill={colors.tree} />

      {/* 第二層樹冠 */}
      <polygon
        points="100,80 155,145 45,145"
        fill={colors.treeDark}
        stroke={colors.treeStroke}
        strokeWidth="1"
      />
      <polygon points="100,80 150,140 50,140" fill={colors.tree} />

      {/* 第三層樹冠（最底層） */}
      <polygon
        points="100,120 170,200 30,200"
        fill={colors.treeDark}
        stroke={colors.treeStroke}
        strokeWidth="1"
      />
      <polygon points="100,120 165,195 35,195" fill={colors.tree} />

      {/* 樹幹 - 使用 seasonal-trunk token */}
      <rect
        x="85"
        y="195"
        width="30"
        height="40"
        fill={colors.trunkDark}
        stroke={colors.trunkStroke}
        strokeWidth="1"
      />
      <rect x="88" y="195" width="24" height="40" fill={colors.trunk} />

      {/* 樹幹底座 - 使用 seasonal-base token */}
      <rect
        x="75"
        y="230"
        width="50"
        height="15"
        rx="3"
        fill={colors.base}
        stroke={colors.baseStroke}
        strokeWidth="1"
      />

      {/* 裝飾球 - 紅色 - 使用 seasonal-ornament-red token */}
      <circle
        cx="85"
        cy="85"
        r="6"
        fill={colors.ornamentRed}
        stroke={colors.ornamentRedStroke}
        strokeWidth="1"
      />
      <circle
        cx="115"
        cy="90"
        r="5"
        fill={colors.ornamentRed}
        stroke={colors.ornamentRedStroke}
        strokeWidth="1"
      />
      <circle
        cx="70"
        cy="130"
        r="7"
        fill={colors.ornamentRed}
        stroke={colors.ornamentRedStroke}
        strokeWidth="1"
      />
      <circle
        cx="130"
        cy="135"
        r="6"
        fill={colors.ornamentRed}
        stroke={colors.ornamentRedStroke}
        strokeWidth="1"
      />
      <circle
        cx="55"
        cy="175"
        r="7"
        fill={colors.ornamentRed}
        stroke={colors.ornamentRedStroke}
        strokeWidth="1"
      />
      <circle
        cx="145"
        cy="180"
        r="6"
        fill={colors.ornamentRed}
        stroke={colors.ornamentRedStroke}
        strokeWidth="1"
      />

      {/* 裝飾球 - 金色 - 使用 seasonal-ornament-gold token */}
      <circle
        cx="100"
        cy="100"
        r="5"
        fill={colors.ornamentGold}
        stroke={colors.ornamentGoldStroke}
        strokeWidth="1"
      />
      <circle
        cx="90"
        cy="150"
        r="6"
        fill={colors.ornamentGold}
        stroke={colors.ornamentGoldStroke}
        strokeWidth="1"
      />
      <circle
        cx="110"
        cy="155"
        r="5"
        fill={colors.ornamentGold}
        stroke={colors.ornamentGoldStroke}
        strokeWidth="1"
      />
      <circle
        cx="80"
        cy="185"
        r="6"
        fill={colors.ornamentGold}
        stroke={colors.ornamentGoldStroke}
        strokeWidth="1"
      />
      <circle
        cx="120"
        cy="190"
        r="5"
        fill={colors.ornamentGold}
        stroke={colors.ornamentGoldStroke}
        strokeWidth="1"
      />

      {/* 裝飾球 - 藍色 - 使用 seasonal-ornament-blue token */}
      <circle
        cx="75"
        cy="105"
        r="5"
        fill={colors.ornamentBlue}
        stroke={colors.ornamentBlueStroke}
        strokeWidth="1"
      />
      <circle
        cx="125"
        cy="110"
        r="6"
        fill={colors.ornamentBlue}
        stroke={colors.ornamentBlueStroke}
        strokeWidth="1"
      />
      <circle
        cx="100"
        cy="170"
        r="7"
        fill={colors.ornamentBlue}
        stroke={colors.ornamentBlueStroke}
        strokeWidth="1"
      />
      <circle
        cx="65"
        cy="155"
        r="5"
        fill={colors.ornamentBlue}
        stroke={colors.ornamentBlueStroke}
        strokeWidth="1"
      />
      <circle
        cx="135"
        cy="160"
        r="6"
        fill={colors.ornamentBlue}
        stroke={colors.ornamentBlueStroke}
        strokeWidth="1"
      />

      {/* 雪花裝飾 - 使用 seasonal-snow token */}
      <text x="50" y="120" fontSize="10" fill={colors.snow} opacity="0.8">
        *
      </text>
      <text x="150" y="125" fontSize="10" fill={colors.snow} opacity="0.8">
        *
      </text>
      <text x="45" y="165" fontSize="12" fill={colors.snow} opacity="0.7">
        *
      </text>
      <text x="155" y="170" fontSize="12" fill={colors.snow} opacity="0.7">
        *
      </text>
    </svg>
  );
}
