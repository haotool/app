/**
 * Snow Animation - Component
 * @file SnowAnimation.tsx
 * @description CSS 純動畫下雪效果
 */

import { useMemo } from 'react';
import type { SnowAnimationProps } from './types';

/**
 * 雪花符號陣列
 */
const SNOWFLAKE_SYMBOLS = ['*', '*', '*', '*', '*'];

/**
 * 生成隨機雪花配置
 */
function generateSnowflakes(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 5 + Math.random() * 10,
    size: 0.8 + Math.random() * 1.2,
    symbol: SNOWFLAKE_SYMBOLS[Math.floor(Math.random() * SNOWFLAKE_SYMBOLS.length)],
  }));
}

/**
 * 下雪動畫組件
 * @description 使用 CSS 動畫實現的下雪效果
 * @param count - 雪花數量（預設 50）
 */
export function SnowAnimation({ count = 50 }: SnowAnimationProps) {
  // 使用 useMemo 快取雪花配置，避免重新渲染時重新生成
  const snowflakes = useMemo(() => generateSnowflakes(count), [count]);

  return (
    <div className="christmas-snow-container" aria-hidden="true">
      {snowflakes.map((flake) => (
        <span
          key={flake.id}
          className="christmas-snowflake"
          style={{
            left: `${flake.left}%`,
            animationDelay: `${flake.delay}s`,
            animationDuration: `${flake.duration}s`,
            fontSize: `${flake.size}rem`,
          }}
        >
          {flake.symbol}
        </span>
      ))}
    </div>
  );
}
