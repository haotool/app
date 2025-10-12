import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
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
