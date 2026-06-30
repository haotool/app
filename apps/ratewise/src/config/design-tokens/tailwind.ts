import type { Config } from 'tailwindcss';
import { semanticColors } from './colors';

/**
 * 生成 Tailwind 主題擴展配置
 *
 * 基於 Context7 官方最佳實踐，生成可直接用於 tailwind.config.ts 的配置
 *
 * @returns Tailwind Config 的 theme 配置物件
 *
 * @example
 * ```typescript
 * // tailwind.config.ts
 * import { generateTailwindThemeExtension } from './src/config/design-tokens';
 *
 * export default {
 *   theme: {
 *     ...generateTailwindThemeExtension(),
 *   },
 * };
 * ```
 *
 * @reference Context7 - Tailwind CSS Theme Configuration:
 * https://tailwindcss.com/docs/customizing-colors#using-css-variables
 */
export function generateTailwindThemeExtension(): Config['theme'] {
  return {
    extend: {
      colors: semanticColors,
    },
  };
}
