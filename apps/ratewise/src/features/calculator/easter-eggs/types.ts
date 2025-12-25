/**
 * Easter Eggs - TypeScript Type Definitions
 * @file types.ts
 * @description 彩蛋功能的類型定義
 */

/**
 * 彩蛋類型
 * @description 支援的彩蛋種類
 */
export type EasterEggType = 'christmas' | null;

/**
 * 聖誕彩蛋 Props
 */
export interface ChristmasEasterEggProps {
  /** 是否顯示彩蛋 */
  isVisible: boolean;
  /** 關閉彩蛋的回調函數 */
  onClose: () => void;
}

/**
 * 雪花動畫 Props
 */
export interface SnowAnimationProps {
  /** 雪花數量 */
  count?: number;
}

/**
 * 聖誕樹 Props
 */
export interface ChristmasTreeProps {
  /** 尺寸（寬度，高度自動計算） */
  size?: number;
}
