import type { Config } from 'tailwindcss';
import { generateTailwindThemeExtension } from './src/config/design-tokens';

/**
 * Tailwind CSS Configuration
 *
 * @description 整合 Design Token SSOT 系統
 * @see src/config/design-tokens.ts - Design Token 定義
 * @see docs/dev/005_design_token_refactoring.md - 技術決策記錄
 *
 * @reference Context7 - Tailwind CSS Theme Configuration:
 * https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/theme.mdx
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    ...generateTailwindThemeExtension(),
    extend: {
      ...generateTailwindThemeExtension().extend,
      fontFamily: {
        sans: ['"Noto Sans TC"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  // Optimize for production builds
  corePlugins: {
    // Disable unused core plugins to reduce CSS size
    preflight: true, // Keep preflight for consistent styling
  },
  // Future-proof configuration
  future: {
    hoverOnlyWhenSupported: true, // Only apply hover on devices that support it
  },
} satisfies Config;
