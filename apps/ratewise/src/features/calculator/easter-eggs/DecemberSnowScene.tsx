/**
 * December Snow Scene - Enhanced SVG Snow Animation Component
 * @file DecemberSnowScene.tsx
 * @description 12 月常駐的浪漫下雪場景動畫（精緻 SVG 雪花）
 *
 * 設計特性：
 * - 8 種精緻 SVG 雪花變體，純白色無藍色
 * - 三種雪花類型：大雪(15%)、中雪(35%)、小雪(50%)
 * - 精緻動畫效果：不同下落速度、搖擺幅度、旋轉方向
 * - 響應式粒子數量（桌面 55、平板 35、手機 20）
 * - CSS GPU 加速
 * - 尊重 prefers-reduced-motion
 * - SSR 安全
 *
 * @author UIUX Designer Upgrade 2025-12-27T02:56:00+08:00
 * @version 1.4.0
 */

import { useMemo, useState, useEffect } from 'react';
import './styles/december-theme.css';

/**
 * 雪花類型枚舉
 * - SMALL: 小雪 (50% 機率) - 快速下落，輕微搖擺
 * - MEDIUM: 中雪 (35% 機率) - 中等速度，適中搖擺
 * - LARGE: 大雪 (15% 機率) - 緩慢下落，大幅搖擺
 */
type SnowflakeType = 'small' | 'medium' | 'large';

/**
 * 雪花配置介面
 */
interface Snowflake {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
  type: SnowflakeType;
  rotationDirection: 'cw' | 'ccw'; // 順時針/逆時針
  swayIntensity: number; // 搖擺強度 (0.5-1.5)
  variant: number; // SVG 變體 (1-8)
}

/**
 * 雪花類型配置（增大 50% 提升可見性）
 */
const SNOWFLAKE_CONFIG = {
  small: {
    sizeRange: [6, 12], // 6-12px (+50%)
    durationRange: [6, 10], // 6-10 秒
    opacityRange: [0.4, 0.65],
    swayRange: [0.5, 0.8],
  },
  medium: {
    sizeRange: [12, 20], // 12-20px (+50%)
    durationRange: [10, 15], // 10-15 秒
    opacityRange: [0.55, 0.8],
    swayRange: [0.8, 1.2],
  },
  large: {
    sizeRange: [20, 32], // 20-32px (+50%)
    durationRange: [14, 22], // 14-22 秒
    opacityRange: [0.7, 0.95],
    swayRange: [1.0, 1.5],
  },
} as const;

/**
 * 獲取隨機雪花類型
 * - 50% 小雪、35% 中雪、15% 大雪
 */
function getSnowflakeType(): SnowflakeType {
  const rand = Math.random();
  if (rand < 0.5) return 'small';
  if (rand < 0.85) return 'medium';
  return 'large';
}

/**
 * 在範圍內生成隨機數
 */
function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * 獲取響應式雪花數量
 */
function getResponsiveSnowflakeCount(): number {
  if (typeof window === 'undefined') return 35; // SSR 預設值

  const width = window.innerWidth;
  if (width >= 1024) return 55; // 桌面
  if (width >= 768) return 35; // 平板
  return 20; // 手機
}

/**
 * 生成隨機雪花配置
 */
function generateSnowflakes(count: number): Snowflake[] {
  return Array.from({ length: count }, (_, i) => {
    const type = getSnowflakeType();
    const config = SNOWFLAKE_CONFIG[type];

    return {
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 12, // 0-12 秒延遲，更分散
      duration: randomInRange(config.durationRange[0], config.durationRange[1]),
      size: randomInRange(config.sizeRange[0], config.sizeRange[1]),
      opacity: randomInRange(config.opacityRange[0], config.opacityRange[1]),
      type,
      rotationDirection: Math.random() > 0.5 ? 'cw' : 'ccw',
      swayIntensity: randomInRange(config.swayRange[0], config.swayRange[1]),
      variant: Math.floor(Math.random() * 8) + 1, // 1-8
    };
  });
}

/**
 * 精緻 SVG 雪花圖形組件
 * 8 種精緻雪花變體，純白色無藍色
 */
function SnowflakeSVG({ variant, size }: { variant: number; size: number }) {
  const baseProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    'aria-hidden': true as const,
  };

  switch (variant) {
    case 1:
      // 經典六角雪花
      return (
        <svg {...baseProps}>
          <path
            d="M12 0L12 24M0 12L24 12M3.515 3.515L20.485 20.485M20.485 3.515L3.515 20.485"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <circle cx="12" cy="4" r="1.2" fill="currentColor" />
          <circle cx="12" cy="20" r="1.2" fill="currentColor" />
          <circle cx="4" cy="12" r="1.2" fill="currentColor" />
          <circle cx="20" cy="12" r="1.2" fill="currentColor" />
        </svg>
      );
    case 2:
      // 星形雪花
      return (
        <svg {...baseProps}>
          <path
            d="M12 2L12 22M2 12L22 12M5.636 5.636L18.364 18.364M18.364 5.636L5.636 18.364"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <path d="M12 2L10.5 5L12 6L13.5 5Z M12 22L10.5 19L12 18L13.5 19Z" fill="currentColor" />
          <path d="M2 12L5 10.5L6 12L5 13.5Z M22 12L19 10.5L18 12L19 13.5Z" fill="currentColor" />
        </svg>
      );
    case 3:
      // 圓形雪花
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="5" r="1" fill="currentColor" />
          <circle cx="12" cy="19" r="1" fill="currentColor" />
          <circle cx="5" cy="12" r="1" fill="currentColor" />
          <circle cx="19" cy="12" r="1" fill="currentColor" />
          <circle cx="7" cy="7" r="0.8" fill="currentColor" />
          <circle cx="17" cy="7" r="0.8" fill="currentColor" />
          <circle cx="7" cy="17" r="0.8" fill="currentColor" />
          <circle cx="17" cy="17" r="0.8" fill="currentColor" />
          <path
            d="M12 3L12 7M12 17L12 21M3 12L7 12M17 12L21 12"
            stroke="currentColor"
            strokeWidth="0.8"
            fill="none"
          />
        </svg>
      );
    case 4:
      // 簡約雪花
      return (
        <svg {...baseProps}>
          <path
            d="M12 1L12 23M1 12L23 12M4.222 4.222L19.778 19.778M19.778 4.222L4.222 19.778"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      );
    case 5:
      // 花瓣雪花 (NEW)
      return (
        <svg {...baseProps}>
          <ellipse cx="12" cy="6" rx="2" ry="4" fill="currentColor" opacity="0.8" />
          <ellipse cx="12" cy="18" rx="2" ry="4" fill="currentColor" opacity="0.8" />
          <ellipse cx="6" cy="12" rx="4" ry="2" fill="currentColor" opacity="0.8" />
          <ellipse cx="18" cy="12" rx="4" ry="2" fill="currentColor" opacity="0.8" />
          <ellipse
            cx="7.76"
            cy="7.76"
            rx="2"
            ry="4"
            fill="currentColor"
            opacity="0.6"
            transform="rotate(45 7.76 7.76)"
          />
          <ellipse
            cx="16.24"
            cy="16.24"
            rx="2"
            ry="4"
            fill="currentColor"
            opacity="0.6"
            transform="rotate(45 16.24 16.24)"
          />
          <circle cx="12" cy="12" r="2.5" fill="currentColor" />
        </svg>
      );
    case 6:
      // 樹枝雪花 (NEW)
      return (
        <svg {...baseProps}>
          <path d="M12 2L12 22" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M2 12L22 12" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M12 5L9 8M12 5L15 8" stroke="currentColor" strokeWidth="0.8" fill="none" />
          <path d="M12 19L9 16M12 19L15 16" stroke="currentColor" strokeWidth="0.8" fill="none" />
          <path d="M5 12L8 9M5 12L8 15" stroke="currentColor" strokeWidth="0.8" fill="none" />
          <path d="M19 12L16 9M19 12L16 15" stroke="currentColor" strokeWidth="0.8" fill="none" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    case 7:
      // 菱形雪花 (NEW)
      return (
        <svg {...baseProps}>
          <path d="M12 2L22 12L12 22L2 12Z" stroke="currentColor" strokeWidth="1" fill="none" />
          <path
            d="M12 6L18 12L12 18L6 12Z"
            stroke="currentColor"
            strokeWidth="0.8"
            fill="none"
            opacity="0.7"
          />
          <path
            d="M12 2L12 6M12 18L12 22M2 12L6 12M18 12L22 12"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    case 8:
    default:
      // 複雜結晶雪花 (NEW)
      return (
        <svg {...baseProps}>
          <path d="M12 1L12 23" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M1 12L23 12" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M4.93 4.93L19.07 19.07" stroke="currentColor" strokeWidth="0.8" fill="none" />
          <path d="M19.07 4.93L4.93 19.07" stroke="currentColor" strokeWidth="0.8" fill="none" />
          <circle cx="12" cy="3" r="1" fill="currentColor" />
          <circle cx="12" cy="21" r="1" fill="currentColor" />
          <circle cx="3" cy="12" r="1" fill="currentColor" />
          <circle cx="21" cy="12" r="1" fill="currentColor" />
          <circle cx="6.34" cy="6.34" r="0.7" fill="currentColor" />
          <circle cx="17.66" cy="6.34" r="0.7" fill="currentColor" />
          <circle cx="6.34" cy="17.66" r="0.7" fill="currentColor" />
          <circle cx="17.66" cy="17.66" r="0.7" fill="currentColor" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      );
  }
}

/**
 * 12 月常駐下雪場景組件
 * @description 浪漫唯美的全頁面下雪效果，使用精緻 SVG 雪花
 */
export function DecemberSnowScene() {
  const [count, setCount] = useState(35);

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
        <div
          key={flake.id}
          className={`december-snowflake december-snowflake--${flake.type} december-snowflake--${flake.rotationDirection}`}
          style={
            {
              left: `${flake.left}%`,
              animationDelay: `${flake.delay}s`,
              animationDuration: `${flake.duration}s`,
              opacity: flake.opacity,
              '--sway-intensity': flake.swayIntensity,
            } as React.CSSProperties
          }
        >
          <SnowflakeSVG variant={flake.variant} size={flake.size} />
        </div>
      ))}
    </div>
  );
}
