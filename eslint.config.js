// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // 全域忽略設定
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.example/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/public/**',
      '**/playwright-report/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/*.config.cjs',
      '**/*.d.ts',
      '**/scripts/**/*.js',
      '**/scripts/**/*.mjs',
      '**/*.cjs',
      '**/tests/e2e/**', // E2E 測試使用獨立的 Playwright TypeScript 配置
      '**/playwright.config.ts', // Playwright 配置文件
    ],
  },

  // ESLint 推薦規則
  eslint.configs.recommended,

  // TypeScript 推薦規則（僅針對 TypeScript 檔案）
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.ts', '**/*.tsx'],
  })),
  ...tseslint.configs.stylisticTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.ts', '**/*.tsx'],
  })),

  // TypeScript 專案設定
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // React 相關設定
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React 推薦規則
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,

      // [fix:2025-12-14] 忽略 React Three Fiber 專有屬性
      // 參考: https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/no-unknown-property.md
      // @react-three/fiber 使用許多 Three.js 特有的 JSX 屬性
      'react/no-unknown-property': [
        'error',
        {
          ignore: [
            // Three.js Object3D 屬性
            'position',
            'rotation',
            'scale',
            'castShadow',
            'receiveShadow',
            // Three.js Light 屬性
            'intensity',
            'angle',
            'penumbra',
            'distance',
            'decay',
            // Three.js Geometry 屬性
            'args',
            'attach',
            // Three.js Material 屬性
            'metalness',
            'roughness',
            'emissive',
            'toneMapped',
            'transparent',
            'opacity',
            'depthWrite',
            'side',
            // Three.js Camera 屬性
            'fov',
            'near',
            'far',
            'makeDefault',
            // drei 屬性
            'object',
            'material',
          ],
        },
      ],

      // React Hooks 規則
      ...reactHooksPlugin.configs.recommended.rules,

      // React Refresh 規則
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // TypeScript 特定規則調整
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],

      // TypeScript 嚴格規則（提升程式碼品質）
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
    },
  },

  // 測試檔案與 Mock 特殊規則
  {
    files: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/__mocks__/**/*.ts',
      '**/__mocks__/**/*.tsx',
    ],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },

  // 開發腳本特殊規則
  {
    files: ['scripts/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Prettier 配置（必須放在最後）
  prettierConfig,
);
