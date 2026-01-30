/**
 * Animation Token System - 微互動動畫 SSOT
 *
 * 統一管理應用程式動畫效果，實現高級 App 體驗
 * 支援 Reduced Motion 無障礙需求
 *
 * 設計原則:
 * - 使用 transform/opacity（GPU 加速）
 * - 避免 layout-affecting 屬性
 * - 支援 prefers-reduced-motion
 *
 * @see https://motion.dev/docs/performance
 * @see WCAG 2.1 - 2.3.3 Animation from Interactions
 */

import type { Transition, Variants } from 'motion/react';

/**
 * 基礎動畫過渡配置
 */
export const transitions = {
  /** 快速回饋（按鈕點擊） */
  instant: { duration: 0.1, ease: 'easeOut' } as Transition,

  /** 標準過渡（UI 狀態變化） */
  default: { duration: 0.2, ease: 'easeOut' } as Transition,

  /** 平滑過渡（頁面切換） */
  smooth: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } as Transition,

  /** 彈性過渡（選單、卡片） */
  spring: { type: 'spring', stiffness: 500, damping: 30 } as Transition,

  /** 輕柔彈性（Toast、提示） */
  gentle: { type: 'spring', stiffness: 300, damping: 25 } as Transition,
} as const;

/**
 * 按鈕微互動動畫變體
 */
export const buttonVariants: Variants = {
  idle: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
  disabled: { opacity: 0.5, scale: 1 },
};

/**
 * 卡片懸停動畫變體
 */
export const cardVariants: Variants = {
  idle: { scale: 1, y: 0 },
  hover: { scale: 1.01, y: -2 },
  tap: { scale: 0.99, y: 0 },
};

/**
 * 淡入動畫變體
 */
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * 滑入動畫變體（從下方）
 */
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/**
 * 縮放淡入動畫變體
 */
export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

/**
 * 列表項目交錯動畫容器
 */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

/**
 * 列表項目動畫
 */
export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Tailwind 微互動類名
 * 用於不需要 Motion 的簡單效果
 */
export const microInteractionClasses = {
  /** 按鈕基礎互動 */
  button: 'transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]',

  /** 按鈕帶陰影 */
  buttonWithShadow:
    'transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-md active:scale-[0.98]',

  /** 卡片懸停效果 */
  card: 'transition-all duration-200 ease-out hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-lg',

  /** 連結懸停效果 */
  link: 'transition-colors duration-200 ease-out hover:text-primary',

  /** 圖標旋轉效果 */
  iconRotate: 'transition-transform duration-200 ease-out hover:rotate-12',

  /** 圖標縮放效果 */
  iconScale: 'transition-transform duration-200 ease-out hover:scale-110 active:scale-95',

  /** 透明度過渡 */
  opacity: 'transition-opacity duration-200 ease-out',

  /** 導覽項目效果 */
  navItem: 'transition-all duration-200 ease-out active:scale-95',
} as const;

/**
 * 獲取考慮 Reduced Motion 的動畫配置
 * @param prefersReducedMotion - 是否偏好減少動畫
 */
export function getMotionProps(prefersReducedMotion: boolean) {
  if (prefersReducedMotion) {
    return {
      initial: false,
      animate: false,
      exit: false,
      transition: { duration: 0 },
    };
  }
  return {};
}

/**
 * Reduced Motion 安全的過渡配置
 * @param transition - 原始過渡配置
 * @param prefersReducedMotion - 是否偏好減少動畫
 */
export function safeTransition(transition: Transition, prefersReducedMotion: boolean): Transition {
  if (prefersReducedMotion) {
    return { duration: 0 };
  }
  return transition;
}
