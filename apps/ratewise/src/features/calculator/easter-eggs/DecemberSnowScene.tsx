/**
 * December Snow Scene - Ambient Snow Animation Component
 * @file DecemberSnowScene.tsx
 * @description 12 月常駐的浪漫下雪場景動畫
 *
 * 特性：
 * - 響應式粒子數量（桌面 40、平板 25、手機 15）
 * - CSS GPU 加速
 * - 尊重 prefers-reduced-motion
 * - SSR 安全
 */

import { useMemo, useState, useEffect } from 'react';
import './styles/december-theme.css';

/**
 * 雪花配置
 */
interface Snowflake {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
  symbol: string;
}

/**
 * 雪花符號 - 使用多種形狀增加視覺豐富度
 */
const SNOWFLAKE_SYMBOLS = ['❄', '❅', '❆', '✦', '✧', '*'];

/**
 * 獲取響應式雪花數量
 */
function getResponsiveSnowflakeCount(): number {
  if (typeof window === 'undefined') return 25; // SSR 預設值

  const width = window.innerWidth;
  if (width >= 1024) return 40; // 桌面
  if (width >= 768) return 25; // 平板
  return 15; // 手機
}

/**
 * 生成隨機雪花配置
 */
function generateSnowflakes(count: number): Snowflake[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 8 + Math.random() * 12, // 8-20 秒，更慢更浪漫
    size: 0.6 + Math.random() * 1.0, // 0.6-1.6rem
    opacity: 0.4 + Math.random() * 0.5, // 0.4-0.9 透明度
    symbol: SNOWFLAKE_SYMBOLS[Math.floor(Math.random() * SNOWFLAKE_SYMBOLS.length)] ?? '❄',
  }));
}

/**
 * 12 月常駐下雪場景組件
 * @description 浪漫唯美的全頁面下雪效果
 */
export function DecemberSnowScene() {
  const [count, setCount] = useState(25);

  // 響應式調整雪花數量
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateCount = () => {
      setCount(getResponsiveSnowflakeCount());
    };

    updateCount();
    window.addEventListener('resize', updateCount);
    return () => window.removeEventListener('resize', updateCount);
  }, []);

  // 使用 useMemo 快取雪花配置
  const snowflakes = useMemo(() => generateSnowflakes(count), [count]);

  return (
    <div className="december-snow-container" aria-hidden="true">
      {snowflakes.map((flake) => (
        <span
          key={flake.id}
          className="december-snowflake"
          style={{
            left: `${flake.left}%`,
            animationDelay: `${flake.delay}s`,
            animationDuration: `${flake.duration}s`,
            fontSize: `${flake.size}rem`,
            opacity: flake.opacity,
          }}
        >
          {flake.symbol}
        </span>
      ))}
    </div>
  );
}
