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
 * 雪花類型 - 不同大小模擬大雪小雪
 * - SMALL: 小雪 (0.4-0.8rem) - 50% 機率
 * - MEDIUM: 中雪 (0.8-1.2rem) - 35% 機率
 * - LARGE: 大雪 (1.2-1.8rem) - 15% 機率
 */

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
 * 生成隨機雪花大小（根據雪花類型）
 */
function getSnowflakeSize(): number {
  const rand = Math.random();
  // 50% 小雪, 35% 中雪, 15% 大雪
  if (rand < 0.5) return 0.4 + Math.random() * 0.4; // 0.4-0.8rem
  if (rand < 0.85) return 0.8 + Math.random() * 0.4; // 0.8-1.2rem
  return 1.2 + Math.random() * 0.6; // 1.2-1.8rem
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
    size: getSnowflakeSize(), // 隨機大小模擬大雪小雪
    opacity: 0.5 + Math.random() * 0.4, // 0.5-0.9 透明度（更明顯）
    symbol: '❄', // 統一使用白色雪花符號
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
