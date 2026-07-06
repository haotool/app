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
 * E1 動效 Token（SSOT，與 index.css --duration-* 同值）
 *
 * 全站動效收斂三類：press-scale(0.97)、頁面 slide 轉場、數字 count-up。
 * 常駐 infinite 動畫與 hover-scale 已清零（splash 脈動與載入 spinner 豁免）。
 */
export const motionDurations = {
  /** 150ms - 按壓回饋 */
  fast: 150,
  /** 200ms - UI 狀態變化 */
  base: 200,
  /** 300ms - 頁面/面板轉場 */
  slow: 300,
} as const;

/** 全站統一按壓縮放比例 */
export const PRESS_SCALE = 0.97;

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

  /** 計算機回饋（iOS 150ms 標準） */
  calculatorFeedback: { duration: 0.15, ease: 'easeOut' } as Transition,

  /** 計算機鍵盤 Bottom Sheet 彈出 */
  keyboardSheet: { type: 'spring', stiffness: 300, damping: 30 } as Transition,
} as const;

/**
 * 按鈕微互動動畫變體（E1：hover 不縮放，僅保留 press-scale）
 */
export const buttonVariants: Variants = {
  idle: { scale: 1 },
  hover: { scale: 1 },
  tap: { scale: PRESS_SCALE },
  disabled: { opacity: 0.5, scale: 1 },
};

/**
 * 卡片動畫變體（E1：hover 不縮放不位移，抬升交給 surface 層差）
 */
export const cardVariants: Variants = {
  idle: { scale: 1, y: 0 },
  hover: { scale: 1, y: 0 },
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
 * 計算機按鍵動畫變體
 *
 * 與標準 buttonVariants 不同：
 * - tap 放大到 1.1（強調觸覺回饋，iOS Calculator 風格）
 * - hover 不縮放（E1 hover-scale 清零）
 */
export const calculatorKeyVariants = {
  hover: { scale: 1 },
  tap: { scale: 1.1 },
} as const;

/**
 * 趨勢圖動畫過渡配置
 *
 * 用於 MiniTrendChart 的進場與 Tooltip 動畫：
 * - fadeIn: Material Design 標準曲線，圖表載入淡入
 * - tooltipBounce: overshoot 曲線，Tooltip 彈跳出現
 */
export const chartTransitions = {
  /** 圖表載入淡入（Material Design 標準曲線） */
  fadeIn: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } as Transition,

  /** Tooltip 彈跳出現（overshoot 曲線） */
  tooltipBounce: { duration: 0.18, ease: [0.34, 1.56, 0.64, 1] } as Transition,
} as const;

/**
 * Segmented Switch 動畫配置
 *
 * 統一所有「分段切換」元件的動畫行為：
 * - 語言切換（Settings）
 * - 即期/現金切換（SingleConverter）
 * - 常用貨幣/轉換歷史 tab（Favorites）
 *
 * 使用 motion layoutId 實現滑動背景指示器
 */
export const segmentedSwitch = {
  /** 滑動背景指示器過渡（layoutId 用） */
  indicator: transitions.spring,

  /** 選中項目圖標/emoji 縮放 */
  activeIconScale: 1.1,

  /** 未選中項目透明度 */
  inactiveOpacity: 0.6,

  /** 切換按鈕的微互動（E1：hover 不縮放，僅 press-scale） */
  item: {
    whileHover: { scale: 1 },
    whileTap: { scale: PRESS_SCALE },
  },

  /** 容器樣式 token（rounded-card = 20px 三級制容器圓角） */
  containerClass: 'bg-surface-soft rounded-card p-1.5 flex gap-1 relative shadow-inner',
  indicatorClass: 'absolute inset-0 rounded-2xl shadow-sm z-[-1] bg-[rgb(var(--color-surface))]',
  // focus-visible ring：鍵盤導覽焦點可見（WCAG 2.4.7），SSOT 供 Favorites tabs 與 Settings 分段控制共用。
  itemBaseClass:
    'flex-1 py-3 rounded-2xl flex items-center justify-center gap-1 relative z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset',
} as const;

/**
 * 列表項目活躍高亮動畫配置
 *
 * 用於列表中「選中項目」的滑動高亮效果：
 * - 多幣別轉換器的基準貨幣指示器（MultiConverter）
 *
 * 使用 motion layoutId 實現高亮在列表項目間的平滑滑動
 * 與 segmentedSwitch 的差異：segmentedSwitch 用於固定選項切換，
 * activeHighlight 用於動態列表項目的選中狀態
 */
export const activeHighlight = {
  /** 高亮滑動過渡（layoutId 用，柔和彈性避免列表跳動） */
  transition: transitions.gentle,

  /** 高亮層樣式（絕對定位，作為選中背景） */
  highlightClass: 'absolute inset-0 rounded-xl bg-primary/10 ring-2 ring-primary/30',

  /** 列表項目基礎樣式（需 relative 定位以容納高亮層） */
  itemBaseClass: 'relative flex items-center justify-between px-3 py-2.5 rounded-xl',

  /** 未選中項目互動樣式 */
  itemInactiveClass:
    'bg-surface-soft cursor-pointer hover:bg-primary/5 hover:shadow-sm active:scale-[0.99]',

  /** 選中項目樣式（不可點擊） */
  itemActiveClass: 'cursor-default',
} as const;

export type TransitionDirection = -1 | 0 | 1;

const TOP_LEVEL_ROUTES = ['/', '/multi', '/favorites', '/settings'] as const;

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

/** 取得底部導覽頁面的順序索引，非底導頁面回傳 -1 */
export function getTopLevelRouteIndex(pathname: string): number {
  const normalizedPath = normalizePathname(pathname);
  return TOP_LEVEL_ROUTES.indexOf(normalizedPath as (typeof TOP_LEVEL_ROUTES)[number]);
}

/** 計算頁面切換方向：右移為 +1，左移為 -1，淡入淡出為 0 */
export function getTopLevelTransitionDirection(
  fromPath: string,
  toPath: string,
): TransitionDirection {
  const fromIndex = getTopLevelRouteIndex(fromPath);
  const toIndex = getTopLevelRouteIndex(toPath);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return 0;
  }

  return toIndex > fromIndex ? 1 : -1;
}

/**
 * 頁面切換動畫：enter-only 進場動畫（無 exit）
 *
 * 採用 enter-only 策略避免 AnimatePresence mode="wait" 的空白閃爍。
 * 此為 iOS/Android tab bar 切換的業界標準做法。
 *
 * AppLayout 直接使用 transition + inline initial/animate props。
 */
export const pageTransition = {
  transition: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] } as Transition,
} as const;

/**
 * PWA 更新通知動畫配置
 *
 * 通知入場（底部彈入）動畫，搭配 notificationTokens 使用。
 *
 * @see src/components/UpdatePrompt.tsx
 * @see notificationTokens in design-tokens.ts
 */
export const notificationAnimations = {
  /** 通知入場（底部彈入）
   * 注意：使用 x: '-50%' 實現水平置中，避免與 CSS transform 衝突
   * 參考：https://www.w3docs.com/snippets/css/how-to-center-an-element-with-a-fixed-position.html
   */
  enter: {
    transition: transitions.gentle,
    variants: {
      hidden: { opacity: 0, y: 16, x: '-50%' },
      visible: { opacity: 1, y: 0, x: '-50%' },
      exit: { opacity: 0, y: 16, x: '-50%' },
    } as Variants,
  },
} as const;

/**
 * Tailwind 微互動類名
 * 用於不需要 Motion 的簡單效果
 */
export const microInteractionClasses = {
  /** 按鈕基礎互動（E1：press-scale 0.97，無 hover 縮放） */
  button: 'transition-all duration-200 ease-out active:scale-[0.97]',

  /** 按鈕帶陰影（E1：陰影不隨 hover 變化） */
  buttonWithShadow: 'transition-all duration-200 ease-out active:scale-[0.97]',

  /** 卡片互動（E1：不縮放不位移，僅色彩/陰影過渡） */
  card: 'transition-shadow duration-200 ease-out',

  /** 連結懸停效果 */
  link: 'transition-colors duration-200 ease-out hover:text-primary',

  /** 圖標過渡（E1：移除 hover 旋轉） */
  iconRotate: 'transition-transform duration-200 ease-out',

  /** 圖標按壓效果（E1：移除 hover 縮放） */
  iconScale: 'transition-transform duration-200 ease-out active:scale-95',

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
