/**
 * 歷史 token 相容性測試
 *
 * @see ../../../DESIGN.md
 */

import { describe, it, expect } from 'vitest';
import colors from 'tailwindcss/colors';

describe('Legacy Brand Token Consistency', () => {
  describe('歷史品牌 token 與相容層一致性', () => {
    describe('Given: 相容層保留歷史品牌漸變色彩', () => {
      describe('When: 檢查 Design Token 定義', () => {
        it('Then: brand 色系應該維持既有 blue-indigo-purple 相容映射', async () => {
          const { semanticColors, defaultTheme } = await import('../design-tokens');

          // Then: 驗證 CSS Variables 格式
          expect(semanticColors.brand.from).toBe('rgb(var(--color-brand-from) / <alpha-value>)');
          expect(semanticColors.brand.via).toBe('rgb(var(--color-brand-via) / <alpha-value>)');
          expect(semanticColors.brand.to).toBe('rgb(var(--color-brand-to) / <alpha-value>)');

          // Then: 驗證 defaultTheme 維持既有相容映射
          expect(defaultTheme.brand.from).toBe(colors.blue[50]);
          expect(defaultTheme.brand.via).toBe(colors.indigo[50]);
          expect(defaultTheme.brand.to).toBe(colors.purple[50]);
        });

        it('Then: primary 色系應該維持 violet 相容層', async () => {
          const { semanticColors, defaultTheme } = await import('../design-tokens');

          // Then: 驗證 CSS Variables 格式
          expect(semanticColors.primary.light).toBe(
            'rgb(var(--color-primary-light) / <alpha-value>)',
          );
          expect(semanticColors.primary.DEFAULT).toBe('rgb(var(--color-primary) / <alpha-value>)');
          expect(semanticColors.primary.dark).toBe(
            'rgb(var(--color-primary-dark) / <alpha-value>)',
          );
          expect(semanticColors.primary.darker).toBe(
            'rgb(var(--color-primary-darker) / <alpha-value>)',
          );

          // Then: 驗證 defaultTheme 維持 violet 相容層
          expect(defaultTheme.primary.light).toBe(colors.violet[100]);
          expect(defaultTheme.primary.DEFAULT).toBe(colors.violet[600]);
          expect(defaultTheme.primary.dark).toBe(colors.violet[700]);
          expect(defaultTheme.primary.darker).toBe(colors.violet[800]);
        });

        it('Then: neutral 色系應該使用 slate 作為中性色', async () => {
          const { semanticColors, defaultTheme } = await import('../design-tokens');

          // Then: 驗證 CSS Variables 格式
          expect(semanticColors.neutral.light).toBe(
            'rgb(var(--color-neutral-light) / <alpha-value>)',
          );
          expect(semanticColors.neutral.DEFAULT).toBe('rgb(var(--color-neutral) / <alpha-value>)');
          expect(semanticColors.neutral.dark).toBe(
            'rgb(var(--color-neutral-dark) / <alpha-value>)',
          );
          expect(semanticColors.neutral.text).toBe(
            'rgb(var(--color-neutral-text) / <alpha-value>)',
          );
          expect(semanticColors.neutral.bg).toBe('rgb(var(--color-neutral-bg) / <alpha-value>)');

          // Then: 驗證 defaultTheme 使用 slate
          expect(defaultTheme.neutral.light).toBe(colors.slate[100]);
          expect(defaultTheme.neutral.DEFAULT).toBe(colors.slate[200]);
          expect(defaultTheme.neutral.dark).toBe(colors.slate[300]);
          expect(defaultTheme.neutral.text).toBe(colors.slate[900]);
          expect(defaultTheme.neutral.bg).toBe(colors.slate[50]);
        });
      });
    });

    describe('Given: 色彩映射表定義了語義化名稱', () => {
      describe('When: 比較舊類別與新類別', () => {
        it('Then: neutral-light 應該對應 slate-100', async () => {
          const { semanticColors, defaultTheme } = await import('../design-tokens');

          // 驗證 CSS Variables 格式
          expect(semanticColors.neutral.light).toBe(
            'rgb(var(--color-neutral-light) / <alpha-value>)',
          );

          // 驗證映射關係
          expect(defaultTheme.neutral.light).toBe(colors.slate[100]);
        });

        it('Then: primary-light 應該對應 violet-100', async () => {
          const { semanticColors, defaultTheme } = await import('../design-tokens');

          // 驗證 CSS Variables 格式
          expect(semanticColors.primary.light).toBe(
            'rgb(var(--color-primary-light) / <alpha-value>)',
          );

          // 驗證映射關係
          expect(defaultTheme.primary.light).toBe(colors.violet[100]);
        });

        it('Then: primary (DEFAULT) 應該對應 violet-600', async () => {
          const { semanticColors, defaultTheme } = await import('../design-tokens');

          // 驗證 CSS Variables 格式
          expect(semanticColors.primary.DEFAULT).toBe('rgb(var(--color-primary) / <alpha-value>)');

          // 驗證映射關係
          expect(defaultTheme.primary.DEFAULT).toBe(colors.violet[600]);
        });

        it('Then: danger-light 應該對應 red-100', async () => {
          const { semanticColors, defaultTheme } = await import('../design-tokens');

          // 驗證 CSS Variables 格式
          expect(semanticColors.danger.light).toBe(
            'rgb(var(--color-danger-light) / <alpha-value>)',
          );

          // 驗證映射關係
          expect(defaultTheme.danger.light).toBe(colors.red[100]);
        });

        it('Then: warning-light 應該對應 amber-100', async () => {
          const { semanticColors, defaultTheme } = await import('../design-tokens');

          // 驗證 CSS Variables 格式
          expect(semanticColors.warning.light).toBe(
            'rgb(var(--color-warning-light) / <alpha-value>)',
          );

          // 驗證映射關係
          expect(defaultTheme.warning.light).toBe(colors.amber[100]);
        });
      });
    });

    describe('Given: Tailwind 配置需要 extend.colors', () => {
      describe('When: 生成 Tailwind 主題配置', () => {
        it('Then: generateTailwindThemeExtension() 應該包含所有色系', async () => {
          const { generateTailwindThemeExtension } = await import('../design-tokens');
          const themeConfig = generateTailwindThemeExtension();

          expect(themeConfig).toBeDefined();
          expect(themeConfig!.extend?.colors).toBeDefined();
          expect(themeConfig!.extend!.colors).toHaveProperty('neutral');
          expect(themeConfig!.extend!.colors).toHaveProperty('primary');
          expect(themeConfig!.extend!.colors).toHaveProperty('danger');
          expect(themeConfig!.extend!.colors).toHaveProperty('warning');
          expect(themeConfig!.extend!.colors).toHaveProperty('brand');
        });

        it('Then: 配置應該可以直接用於 tailwind.config.ts', async () => {
          const { generateTailwindThemeExtension } = await import('../design-tokens');
          const themeConfig = generateTailwindThemeExtension();

          // 驗證結構符合 Tailwind Config 型別
          expect(themeConfig).toBeDefined();
          expect(themeConfig!).toHaveProperty('extend');
          expect(typeof themeConfig!.extend!).toBe('object');
        });
      });
    });
  });
});
