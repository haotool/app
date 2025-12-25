/**
 * Easter Eggs Module - Public API
 * @file index.ts
 * @description 彩蛋模組的公開介面
 */

export { ChristmasEasterEgg } from './ChristmasEasterEgg';
export { ChristmasTree } from './ChristmasTree';
export { SnowAnimation } from './SnowAnimation';
export { isChristmasEasterEgg, normalizeExpressionForEasterEgg, CHRISTMAS_EASTER_EGG_DURATION } from './utils';
export type { EasterEggType, ChristmasEasterEggProps, ChristmasTreeProps, SnowAnimationProps } from './types';
