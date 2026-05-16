/**
 * Design Token System - BDD Test Suite
 * 測試色彩定義的完整性與一致性
 *
 * @see docs/prompt/BDD.md - BDD 開發流程
 * @see /Users/azlife.eth/.claude/plans/federated-foraging-summit.md - 重構計劃
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, it, expect } from 'vitest';
import tailwindConfig from '../../tailwind.config';
import { CRITICAL_STYLE_BY_THEME, STYLE_DEFINITIONS, type ThemeStyle } from './themes';

function findRatewiseRoot(): string {
  const candidates = [process.cwd(), join(process.cwd(), 'apps/ratewise')];
  const root = candidates.find(
    (candidate) =>
      existsSync(join(candidate, 'index.html')) && existsSync(join(candidate, 'src/index.css')),
  );

  if (!root) throw new Error('Unable to locate apps/ratewise root for design token drift tests');

  return root;
}

const ratewiseRoot = findRatewiseRoot();
const indexCss = readFileSync(join(ratewiseRoot, 'src/index.css'), 'utf8');
const indexHtml = readFileSync(join(ratewiseRoot, 'index.html'), 'utf8');
const themeStyles = Object.keys(STYLE_DEFINITIONS) as ThemeStyle[];

function rgbTripletToHex(triplet: string): string {
  return `#${triplet
    .split(/\s+/)
    .map((channel) => Number(channel).toString(16).padStart(2, '0'))
    .join('')}`;
}

function getThemeCssBlock(style: ThemeStyle): string {
  const pattern =
    style === 'zen'
      ? /:root,\s*\n\s*\[data-style='zen'\]\s*\{[\s\S]*?\n\s*\}/
      : new RegExp(`\\[data-style='${style}'\\]\\s*\\{[\\s\\S]*?\\n\\s*\\}`);

  const block = indexCss.match(pattern)?.[0];
  expect(block).toBeDefined();

  return block ?? '';
}

function getThemeCssVar(style: ThemeStyle, name: string): string | undefined {
  const block = getThemeCssBlock(style);
  const match = new RegExp(`${name}: ([^;]+);`).exec(block);

  return match?.[1]?.trim();
}

function relativeLuminance(triplet: string): number {
  const [red, green, blue] = parseRgbTriplet(triplet);
  const [redLinear = 0, greenLinear = 0, blueLinear = 0] = [red, green, blue].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * redLinear + 0.7152 * greenLinear + 0.0722 * blueLinear;
}

function parseRgbTriplet(triplet: string): [number, number, number] {
  const [red = 0, green = 0, blue = 0] = triplet.split(/\s+/).map(Number);
  return [red, green, blue];
}

function compositeRgbTriplet(
  foreground: string,
  background: string,
  foregroundAlpha: number,
): string {
  const foregroundChannels = parseRgbTriplet(foreground);
  const backgroundChannels = parseRgbTriplet(background);

  return foregroundChannels
    .map((channel, index) => {
      const backgroundChannel = backgroundChannels[index] ?? 0;
      return channel * foregroundAlpha + backgroundChannel * (1 - foregroundAlpha);
    })
    .join(' ');
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function getCriticalBootstrapEntry(style: ThemeStyle) {
  const match = new RegExp(`${style}: \\['([^']+)', '([^']+)', '(light|dark)'\\]`).exec(indexHtml);
  expect(match).not.toBeNull();

  return {
    background: match?.[1],
    text: match?.[2],
    colorScheme: match?.[3],
  };
}

function getCriticalBootstrapStyles(): ThemeStyle[] {
  return [...indexHtml.matchAll(/^\s+(\w+): \['#[^']+', '#[^']+', '(?:light|dark)'\],$/gm)].map(
    ([, style]) => style as ThemeStyle,
  );
}

function getSkeletonBlock(style: ThemeStyle): string {
  const pattern =
    style === 'zen'
      ? /:root,\s*\n\s*\[data-style='zen'\]\s*\{[\s\S]*?\n\s*\}/
      : new RegExp(`\\[data-style='${style}'\\]\\s*\\{[\\s\\S]*?\\n\\s*\\}`);

  const block = indexHtml.match(pattern)?.[0];
  expect(block).toBeDefined();

  return block ?? '';
}

function getSkeletonVar(style: ThemeStyle, name: string): string | undefined {
  const block = getSkeletonBlock(style);
  const match = new RegExp(`${name}: ([^;]+);`).exec(block);

  return match?.[1];
}

afterEach(() => {
  document.documentElement.removeAttribute('data-style');
  document.documentElement.removeAttribute('style');
});

/**
 * 🔴 RED Phase: 這些測試預期會失敗
 * 因為 getDesignTokens() 函數尚未實作
 */
describe('Design Token System - BDD', () => {
  describe('🔴 RED: 色彩 Token 定義', () => {
    describe('Given: 應用需要統一的色彩系統', () => {
      describe('When: 讀取 Design Token 配置', () => {
        it('Then: 應該定義 neutral 色系（數字鍵用）', async () => {
          // Given: 從配置讀取 token
          const { getDesignTokens } = await import('./design-tokens');
          const tokens = getDesignTokens();

          // When: 檢查 neutral 色系
          const neutral = tokens.colors.neutral;

          // Then: 驗證定義完整性
          expect(neutral).toBeDefined();
          expect(neutral).toHaveProperty('light');
          expect(neutral).toHaveProperty('DEFAULT');
          expect(neutral).toHaveProperty('dark');
          expect(neutral).toHaveProperty('text');
          expect(neutral).toHaveProperty('bg');
        });

        it('Then: 應該定義 primary 色系（運算符用）', async () => {
          const { getDesignTokens } = await import('./design-tokens');
          const tokens = getDesignTokens();
          const primary = tokens.colors.primary;

          expect(primary).toBeDefined();
          expect(primary).toHaveProperty('light');
          expect(primary).toHaveProperty('DEFAULT');
          expect(primary).toHaveProperty('dark');
          expect(primary).toHaveProperty('darker');
          expect(primary).toHaveProperty('text');
        });

        it('Then: 應該定義 danger 色系（清除鍵用）', async () => {
          const { getDesignTokens } = await import('./design-tokens');
          const tokens = getDesignTokens();
          const danger = tokens.colors.danger;

          expect(danger).toBeDefined();
          expect(danger).toHaveProperty('light');
          expect(danger).toHaveProperty('DEFAULT');
          expect(danger).toHaveProperty('hover');
          expect(danger).toHaveProperty('active');
        });

        it('Then: 應該定義 warning 色系（刪除鍵用）', async () => {
          const { getDesignTokens } = await import('./design-tokens');
          const tokens = getDesignTokens();
          const warning = tokens.colors.warning;

          expect(warning).toBeDefined();
          expect(warning).toHaveProperty('light');
          expect(warning).toHaveProperty('DEFAULT');
          expect(warning).toHaveProperty('hover');
          expect(warning).toHaveProperty('active');
        });

        it('Then: 應該定義 brand 色系（品牌漸變）', async () => {
          const { getDesignTokens } = await import('./design-tokens');
          const tokens = getDesignTokens();
          const brand = tokens.colors.brand;

          expect(brand).toBeDefined();
          expect(brand).toHaveProperty('from');
          expect(brand).toHaveProperty('via');
          expect(brand).toHaveProperty('to');
        });

        it('Then: generateTailwindThemeExtension() 應該返回有效的 Tailwind 配置', async () => {
          const { generateTailwindThemeExtension } = await import('./design-tokens');
          const themeConfig = generateTailwindThemeExtension();

          expect(themeConfig).toBeDefined();
          expect(themeConfig!).toHaveProperty('extend');
          expect(themeConfig!.extend!).toHaveProperty('colors');
        });
      });
    });
  });

  describe('🟢 GREEN: 間距 Token 定義 (spacingTokens)', () => {
    it('應該導出 spacingTokens', async () => {
      const { spacingTokens } = await import('./design-tokens');
      expect(spacingTokens).toBeDefined();
    });

    it('應該有基礎單位 (4px)', async () => {
      const { spacingTokens } = await import('./design-tokens');
      expect(spacingTokens.base).toBe(4);
    });

    it('應該有完整的間距比例表', async () => {
      const { spacingTokens } = await import('./design-tokens');
      const scale = spacingTokens.scale;

      expect(scale.xs).toEqual({ px: 4, rem: '0.25rem', class: '1' });
      expect(scale.sm).toEqual({ px: 8, rem: '0.5rem', class: '2' });
      expect(scale.md).toEqual({ px: 16, rem: '1rem', class: '4' });
      expect(scale.lg).toEqual({ px: 24, rem: '1.5rem', class: '6' });
      expect(scale.xl).toEqual({ px: 32, rem: '2rem', class: '8' });
      expect(scale['2xl']).toEqual({ px: 48, rem: '3rem', class: '12' });
      expect(scale['3xl']).toEqual({ px: 64, rem: '4rem', class: '16' });
    });

    it('應該有常用組合模式', async () => {
      const { spacingTokens } = await import('./design-tokens');
      const patterns = spacingTokens.patterns;

      expect(patterns.cardPadding).toBe('p-4');
      expect(patterns.sectionGap).toBe('gap-6');
      expect(patterns.pageHorizontal).toBe('px-5');
      expect(patterns.pageVertical).toBe('py-6');
    });
  });

  describe('🟢 GREEN: 字型 Token 定義 (typographyTokens)', () => {
    it('應該導出 typographyTokens', async () => {
      const { typographyTokens } = await import('./design-tokens');
      expect(typographyTokens).toBeDefined();
    });

    it('應該有字型家族定義', async () => {
      const { typographyTokens } = await import('./design-tokens');
      expect(typographyTokens.fontFamily.sans).toContain('Inter');
      expect(typographyTokens.fontFamily.sans).toContain('"Noto Sans TC"');
      expect(typographyTokens.fontFamily.mono).toContain('ui-monospace');
    });

    it('應該有完整的字型大小比例表', async () => {
      const { typographyTokens } = await import('./design-tokens');
      const fontSize = typographyTokens.fontSize;

      expect(fontSize['2xs']).toHaveProperty('size', '0.625rem');
      expect(fontSize.xs).toHaveProperty('size', '0.75rem');
      expect(fontSize.sm).toHaveProperty('size', '0.875rem');
      expect(fontSize.base).toHaveProperty('size', '1rem');
      expect(fontSize.lg).toHaveProperty('size', '1.125rem');
      expect(fontSize.xl).toHaveProperty('size', '1.25rem');
      expect(fontSize['2xl']).toHaveProperty('size', '1.5rem');
    });

    it('應該有字重定義', async () => {
      const { typographyTokens } = await import('./design-tokens');
      const fontWeight = typographyTokens.fontWeight;

      expect(fontWeight.regular.value).toBe(400);
      expect(fontWeight.medium.value).toBe(500);
      expect(fontWeight.semibold.value).toBe(600);
      expect(fontWeight.bold.value).toBe(700);
      expect(fontWeight.black.value).toBe(900);
    });

    it('應該有常用組合模式', async () => {
      const { typographyTokens } = await import('./design-tokens');
      const patterns = typographyTokens.patterns;

      expect(patterns.pageTitle).toContain('text-2xl');
      expect(patterns.pageTitle).toContain('font-bold');
      expect(patterns.numeric).toContain('tabular-nums');
    });
  });

  describe('🟢 GREEN: 斷點 Token 定義 (breakpointTokens)', () => {
    it('應該導出 breakpointTokens', async () => {
      const { breakpointTokens } = await import('./design-tokens');
      expect(breakpointTokens).toBeDefined();
    });

    it('應該有 Tailwind 標準斷點', async () => {
      const { breakpointTokens } = await import('./design-tokens');
      const screens = breakpointTokens.screens;

      expect(screens.sm.min).toBe('640px');
      expect(screens.md.min).toBe('768px');
      expect(screens.lg.min).toBe('1024px');
      expect(screens.xl.min).toBe('1280px');
      expect(screens['2xl'].min).toBe('1536px');
    });

    it('應該有高度斷點設定', async () => {
      const { breakpointTokens } = await import('./design-tokens');
      const screens = breakpointTokens.screens;

      expect(screens.compact.raw).toBe('(max-height: 760px)');
      expect(screens.short.raw).toBe('(max-height: 700px)');
      expect(screens.tiny.raw).toBe('(max-height: 650px)');
      expect(screens.micro.raw).toBe('(max-height: 600px)');
      expect(screens.nano.raw).toBe('(max-height: 560px)');
      expect(screens.tall.raw).toBe('(min-height: 761px)');
    });

    it('應該有容器最大寬度定義', async () => {
      const { breakpointTokens } = await import('./design-tokens');
      const container = breakpointTokens.container;

      expect(container.sm).toBe('640px');
      expect(container.md).toBe('768px');
      expect(container.lg).toBe('1024px');
    });

    it('應該有響應式模式', async () => {
      const { breakpointTokens } = await import('./design-tokens');
      const patterns = breakpointTokens.patterns;

      expect(patterns.desktopOnly).toBe('hidden md:block');
      expect(patterns.mobileOnly).toBe('block md:hidden');
      expect(patterns.responsiveGrid).toContain('grid-cols-1');
    });

    it('應該有高度斷點顯示模式', async () => {
      const { breakpointTokens } = await import('./design-tokens');
      const patterns = breakpointTokens.patterns;

      expect(patterns.shortHidden).toBe('short:hidden');
      expect(patterns.tinyHidden).toBe('tiny:hidden');
      expect(patterns.microHidden).toBe('micro:hidden');
      expect(patterns.nanoHidden).toBe('nano:hidden');
    });

    it('應該有媒體查詢輔助', async () => {
      const { breakpointTokens } = await import('./design-tokens');
      const mediaQueries = breakpointTokens.mediaQueries;

      expect(mediaQueries.mobile).toBe('@media (max-width: 639px)');
      expect(mediaQueries.tablet).toBe('@media (min-width: 768px)');
      expect(mediaQueries.reducedMotion).toBe('@media (prefers-reduced-motion: reduce)');
    });
  });

  describe('🟢 GREEN: 單幣別 RWD 佈局 Token 定義', () => {
    it('應該導出 rateWiseLayoutTokens', async () => {
      const { rateWiseLayoutTokens } = await import('./design-tokens');

      expect(rateWiseLayoutTokens).toBeDefined();
      expect(rateWiseLayoutTokens.content.className).toContain('py-4');
      // 資料來源最後隱藏 (nano 斷點)
      expect(rateWiseLayoutTokens.info.visibility).toBe('nano:hidden');
    });

    it('應該導出 singleConverterLayoutTokens', async () => {
      const { singleConverterLayoutTokens } = await import('./design-tokens');

      expect(singleConverterLayoutTokens).toBeDefined();

      // 隱藏優先順序：快速金額(來源) → 快速金額(結果) → 交換按鈕 → 資料來源
      expect(singleConverterLayoutTokens.quickAmounts.fromVisibility).toBe('short:hidden');
      expect(singleConverterLayoutTokens.quickAmounts.toVisibility).toBe('tiny:hidden');
      expect(singleConverterLayoutTokens.swap.visibility).toBe('micro:hidden');

      // 流體縮放配置
      expect(singleConverterLayoutTokens.rateCard.chartHeight).toContain('compact:h-16');
      expect(singleConverterLayoutTokens.rateCard.rateTypeContainer).toContain('absolute');
      expect(singleConverterLayoutTokens.rateCard.rateTypeButton).toContain('px-');
    });
  });

  describe('🟢 GREEN: 多幣別頁面佈局 Token 定義', () => {
    it('應該導出 multiConverterLayoutTokens', async () => {
      const { multiConverterLayoutTokens } = await import('./design-tokens');

      expect(multiConverterLayoutTokens).toBeDefined();
      expect(multiConverterLayoutTokens.content.className).toContain('py-4');
      expect(multiConverterLayoutTokens.card.className).toContain('card');
      expect(multiConverterLayoutTokens.info.text).toContain('text-[10px]');
    });
  });

  describe('🟢 GREEN: 按鈕 Token 定義 (buttonTokens)', () => {
    it('應該導出 buttonTokens', async () => {
      const { buttonTokens } = await import('./design-tokens');
      expect(buttonTokens).toBeDefined();
    });

    it('應該有基礎樣式', async () => {
      const { buttonTokens } = await import('./design-tokens');
      const base = buttonTokens.base;

      expect(base.display).toContain('inline-flex');
      expect(base.transition).toContain('transition');
      expect(base.disabled).toContain('disabled:opacity-50');
      expect(base.focus).toContain('focus-visible:ring-offset-background');
    });

    it('應該有三種尺寸 (sm, md, lg)', async () => {
      const { buttonTokens } = await import('./design-tokens');
      const sizes = buttonTokens.sizes;

      expect(sizes.sm.height).toBe('h-8');
      expect(sizes.md.height).toBe('h-10');
      expect(sizes.lg.height).toBe('h-12');
    });

    it('應該有四種變體 (primary, secondary, ghost, danger)', async () => {
      const { buttonTokens } = await import('./design-tokens');
      const variants = buttonTokens.variants;

      expect(variants.primary.default).toContain('bg-primary');
      expect(variants.secondary.default).toContain('bg-surface-elevated');
      expect(variants.ghost.default).toContain('bg-transparent');
      expect(variants.danger.default).toContain('bg-destructive');
    });

    it('應該有預組合的 pattern', async () => {
      const { buttonTokens } = await import('./design-tokens');
      const patterns = buttonTokens.patterns;

      expect(patterns.primaryMd).toContain('bg-primary');
      expect(patterns.primaryMd).toContain('h-10');
      expect(patterns.secondaryMd).toContain('bg-surface-elevated');
      expect(patterns.ghostMd).toContain('bg-transparent');
      expect(patterns.dangerMd).toContain('bg-destructive');

      for (const pattern of Object.values(patterns)) {
        expect(pattern).toContain('focus-visible:ring-offset-background');
      }
    });
  });

  describe('🟢 GREEN: Tailwind 語義色彩 Alias 覆蓋', () => {
    it('應該把元件已使用的語義色彩 class 映射回 CSS variables', () => {
      const extendColors = (tailwindConfig.theme?.extend?.colors ?? {}) as Record<string, unknown>;
      const surface = extendColors['surface'] as Record<string, unknown>;

      expect(extendColors['secondary']).toBe('rgb(var(--color-secondary) / <alpha-value>)');
      expect(extendColors['accent']).toBe('rgb(var(--color-accent) / <alpha-value>)');
      expect(extendColors['info']).toBe('rgb(var(--color-info) / <alpha-value>)');
      expect(extendColors['error']).toBe('rgb(var(--color-error) / <alpha-value>)');
      expect(extendColors['active-pill-foreground']).toBe(
        'rgb(var(--color-active-pill-foreground) / <alpha-value>)',
      );
      expect(surface['secondary']).toBe('rgb(var(--color-surface-secondary) / <alpha-value>)');
      expect(surface['card']).toBe('rgb(var(--color-surface-card) / <alpha-value>)');
      expect(surface['border']).toBe('rgb(var(--color-surface-border) / <alpha-value>)');
    });
  });

  describe('🟢 GREEN: Nitro 主題 CSS Variable 覆蓋', () => {
    it('應該覆蓋 legacy primary tokens，避免深色主題回落到 Zen 淺色值', () => {
      const nitroBlock = /\[data-style='nitro'\]\s*\{[\s\S]*?\n {2}\}/.exec(indexCss)?.[0] ?? '';

      expect(nitroBlock).toContain('color-scheme: dark');
      expect(nitroBlock).toContain('--color-primary-active:');
      expect(nitroBlock).toContain('--color-primary-text-light:');
      expect(nitroBlock).toContain('--color-primary-ring:');
      expect(nitroBlock).not.toContain('--color-primary-active: 196 181 253');
      expect(nitroBlock).not.toContain('--color-primary-text-light: 167 139 250');
      expect(nitroBlock).not.toContain('--color-primary-ring: 139 92 246');
    });

    it('應該以語義 alias 收斂 surface 與 ring offset token', () => {
      const zenBlock =
        /:root,\s*\n\s*\[data-style='zen'\]\s*\{[\s\S]*?\n {2}\}/.exec(indexCss)?.[0] ?? '';

      expect(zenBlock).toContain('color-scheme: light');
      expect(zenBlock).toContain('--color-surface-secondary: var(--color-surface-elevated);');
      expect(zenBlock).toContain('--color-surface-card: var(--color-surface);');
      expect(zenBlock).toContain('--color-surface-border: var(--color-border);');
      expect(indexCss).toContain('--tw-ring-offset-color: rgb(var(--color-background));');
    });

    it('應該讓 HTML body 使用語義背景，避免 Nitro 與 PWA overscroll 露出淺色底', () => {
      expect(indexHtml).toContain('background: var(--sk-bg, #f8fafc);');
      expect(indexHtml).toContain('color: var(--sk-text, #1e293b);');
      expect(indexHtml).toContain('html {');
      expect(indexHtml).toContain("nitro: ['#020617', '#ffffff', 'dark']");
      expect(indexHtml).toContain("r.style.setProperty('--sk-bg', c[0]);");
      expect(indexHtml).toContain("r.style.setProperty('--sk-text', c[1]);");
      expect(indexHtml).toContain("if (c[2] === 'dark') r.style.colorScheme = c[2];");
      expect(indexHtml).toContain("else r.style.removeProperty('color-scheme');");
      expect(indexHtml).toContain('<body class="bg-background text-text">');
      expect(indexHtml).not.toContain('class="bg-slate-50"');
    });

    it('applyTheme 應該同步 critical 變數，避免互動切換後 color-scheme 被 inline style 卡住', async () => {
      const { applyTheme } = await import('./themes');
      const root = document.documentElement;

      applyTheme({ style: 'nitro' });

      expect(root.dataset['style']).toBe('nitro');
      expect(root.style.getPropertyValue('--sk-bg')).toBe('#020617');
      expect(root.style.getPropertyValue('--sk-text')).toBe('#ffffff');
      expect(root.style.colorScheme).toBe('dark');

      applyTheme({ style: 'zen' });

      expect(root.dataset['style']).toBe('zen');
      expect(root.style.getPropertyValue('--sk-bg')).toBe('#f8fafc');
      expect(root.style.getPropertyValue('--sk-text')).toBe('#0f172a');
      expect(root.style.colorScheme).toBe('');
    });

    it('critical bootstrap 與 skeleton 變數應該對齊 theme SSOT，避免跨檔漂移', () => {
      expect(getCriticalBootstrapStyles().sort()).toEqual([...themeStyles].sort());

      for (const style of themeStyles) {
        const definition = STYLE_DEFINITIONS[style];
        const colorScheme = style === 'nitro' ? 'dark' : 'light';
        const expected = {
          background: rgbTripletToHex(definition.colors.background),
          surface: rgbTripletToHex(definition.colors.surface),
          border: rgbTripletToHex(definition.colors.border),
          text: rgbTripletToHex(definition.colors.text),
          textMuted: rgbTripletToHex(definition.colors.textMuted),
        };

        expect(CRITICAL_STYLE_BY_THEME[style]).toEqual({
          background: expected.background,
          text: expected.text,
          colorScheme,
        });
        expect(getCriticalBootstrapEntry(style)).toEqual({
          background: expected.background,
          text: expected.text,
          colorScheme,
        });
        expect(getSkeletonVar(style, '--sk-bg')).toBe(expected.background);
        expect(getSkeletonVar(style, '--sk-surface')).toBe(expected.surface);
        expect(getSkeletonVar(style, '--sk-border')).toBe(expected.border);
        expect(getSkeletonVar(style, '--sk-text')).toBe(expected.text);
        expect(getSkeletonVar(style, '--sk-text-muted')).toBe(expected.textMuted);
      }
    });

    it('active pill 前景 token 應該對齊 theme SSOT 並符合 WCAG AA', () => {
      for (const style of themeStyles) {
        const definition = STYLE_DEFINITIONS[style];
        const foreground = definition.colors.activePillForeground;
        const activePillBackground = compositeRgbTriplet(
          definition.colors.primary,
          definition.colors.surface,
          0.1,
        );

        expect(getThemeCssVar(style, '--color-active-pill-foreground')).toBe(foreground);
        expect(contrastRatio(foreground, activePillBackground)).toBeGreaterThanOrEqual(4.5);
      }
    });
  });
});
