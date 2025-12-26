/**
 * Easter Eggs Module - Public API
 * @file index.ts
 * @description 彩蛋模組的公開介面
 */

// 原有彩蛋組件
export { ChristmasEasterEgg } from './ChristmasEasterEgg';
export { ChristmasTree } from './ChristmasTree';
export { SnowAnimation } from './SnowAnimation';

// 12 月常駐主題組件
export { DecemberTheme } from './DecemberTheme';
export { DecemberSnowScene } from './DecemberSnowScene';
export { SnowAccumulation } from './SnowAccumulation';
export { MiniChristmasTree } from './MiniChristmasTree';

// 工具函數
export {
  isChristmasEasterEgg,
  normalizeExpressionForEasterEgg,
  CHRISTMAS_EASTER_EGG_DURATION,
} from './utils';

// 類型定義
export type {
  EasterEggType,
  ChristmasEasterEggProps,
  ChristmasTreeProps,
  SnowAnimationProps,
} from './types';
export type { SnowAccumulationProps } from './SnowAccumulation';
export type { MiniChristmasTreeProps } from './MiniChristmasTree';
