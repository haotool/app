/**
 * Design Token System Test Suite
 * 測試色彩定義的完整性與一致性
 *
 * @see docs/prompt/BDD.md - BDD 開發流程
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

describe('Design Token System', () => {
  describe('色彩 Token 定義', () => {
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

      expect(fontSize['2xs']).toHaveProperty('size', '0.75rem');
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
      expect(rateWiseLayoutTokens.content.className).toContain('py-6');
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
      expect(multiConverterLayoutTokens.content.className).toContain('py-6');
      expect(multiConverterLayoutTokens.card.className).toContain('card');
      expect(multiConverterLayoutTokens.info.text).toContain('text-xs');
    });
  });

  describe('🟢 GREEN: 內容頁導覽與頁面 shell SSOT', () => {
    it('contentPageTokens.shell 應直接沿用 pageLayoutTokens.content.className', async () => {
      const { contentPageTokens, pageLayoutTokens } = await import('./design-tokens');

      expect(contentPageTokens.shell).toBe(pageLayoutTokens.content.className);
      expect(pageLayoutTokens.content.maxWidth).toBe(1024);
    });

    it('PageNavHeader 應為 in-flow 區塊（禁止 sticky），Breadcrumb 集中定義截斷規則', async () => {
      const { breadcrumbTokens, pageNavHeaderTokens } = await import('./design-tokens');

      expect(pageNavHeaderTokens.root).not.toContain('sticky');
      expect(pageNavHeaderTokens.root).not.toContain('safe-area-inset-top');
      expect(pageNavHeaderTokens.root).not.toContain('backdrop-blur');
      expect(pageNavHeaderTokens.backButton).toContain('min-h-11');
      expect(pageNavHeaderTokens.backButton).toContain('rounded-full');
      expect(pageNavHeaderTokens.breadcrumbSlot).toContain('min-w-0');
      expect(breadcrumbTokens.list).toContain('touch-pan-x');
      expect(breadcrumbTokens.list).toContain('overflow-x-auto');
      expect(breadcrumbTokens.list).toContain('whitespace-nowrap');
      expect(breadcrumbTokens.current).toContain('truncate');
    });

    it('內容頁與 app 頁面 family token 應覆蓋 article、callout、result、table 與 row pattern', async () => {
      const { appPageTokens, contentPageTokens } = await import('./design-tokens');

      expect(contentPageTokens.article.card).toContain('rounded-card');
      expect(contentPageTokens.article.card).toContain('border-border');
      expect(contentPageTokens.result.card).toContain('bg-surface-elevated');
      expect(contentPageTokens.callouts.warning).toContain('border-warning');
      expect(contentPageTokens.table.wrapperBlock).toContain('overflow-x-auto');
      expect(contentPageTokens.buttons.primary).toContain('min-h-11');
      expect(contentPageTokens.buttons.primary).toContain('focus-visible:ring-2');
      expect(appPageTokens.linkRow).toContain('min-h-11');
      expect(appPageTokens.statRow).toContain('rounded-control');
    });

    it('互動與回饋 family token 應收斂快速金額與錯誤復原 UI', async () => {
      const { feedbackSurfaceTokens, quickAmountButtonTokens } = await import('./design-tokens');

      expect(quickAmountButtonTokens.className).toContain('rounded-compact');
      expect(quickAmountButtonTokens.className).toContain('transition-[background-color');
      expect(feedbackSurfaceTokens.card).toContain('rounded-card');
      expect(feedbackSurfaceTokens.actionButton).toContain('min-h-11');
      expect(feedbackSurfaceTokens.actionButton).toContain('focus-visible:ring-2');
    });

    it('radiusTokens 與 shadowTokens 應作為 Tailwind 與 CSS component 的單一真相', async () => {
      const { getDesignTokens, radiusTokens, shadowTokens } = await import('./design-tokens');
      const tokens = getDesignTokens();

      expect(tokens.radius).toBe(radiusTokens);
      expect(tokens.shadow).toBe(shadowTokens);
      expect(radiusTokens.values.card).toBe('1.5rem');
      expect(radiusTokens.values.control).toBe('1rem');
      expect(radiusTokens.values.compact).toBe('0.5rem');
      expect(radiusTokens.values.lg).toBe('0.5rem');
      expect(radiusTokens.className.card).toBe('rounded-card');
      expect(radiusTokens.className.control).toBe('rounded-control');
      expect(shadowTokens.values.card).toContain('rgb(15 23 42');
      expect(shadowTokens.values.lg).toBeDefined();
      expect(shadowTokens.className.floating).toBe('shadow-floating');
    });

    it('正式頁核心 shell 不應再使用 Tailwind 任意 rgb(var()) 色彩 class', () => {
      const coreFiles = [
        'src/components/AppLayout.tsx',
        'src/components/AnswerCapsule.tsx',
        'src/components/AuthorityGuidePage.tsx',
        'src/components/BottomNavigation.tsx',
        'src/components/Breadcrumb.tsx',
        'src/components/CurrencyLandingPage.tsx',
        'src/components/ErrorBoundary.tsx',
        'src/components/Footer.tsx',
        'src/components/HomepageSEOSection.tsx',
        'src/components/PageNavHeader.tsx',
        'src/components/PullToRefreshIndicator.tsx',
        'src/components/RouteErrorBoundary.tsx',
        'src/components/SideNavigation.tsx',
        'src/components/SkeletonLoader.tsx',
        'src/components/SupportContactLinks.tsx',
        'src/components/Toast/ToastProvider.tsx',
        'src/components/UpdatePrompt.tsx',
        'src/components/UpdatePromptPreview.tsx',
        'src/features/calculator/components/CalculatorKey.tsx',
        'src/features/calculator/components/ExpressionDisplay.tsx',
        'src/features/ratewise/RateWise.tsx',
        'src/features/ratewise/components/ConversionHistory.tsx',
        'src/features/ratewise/components/CurrencyList.tsx',
        'src/features/ratewise/components/FavoritesList.tsx',
        'src/features/ratewise/components/MultiConverter.tsx',
        'src/features/ratewise/components/SingleConverter.tsx',
        'src/pages/ColorSchemeComparison.tsx',
        'src/pages/Favorites.tsx',
        'src/pages/MultiConverter.tsx',
        'src/pages/NotFound.tsx',
        'src/pages/OpenData.tsx',
        'src/pages/SeoTech.tsx',
        'src/pages/Settings.tsx',
        'src/pages/ThemeShowcase.tsx',
        'src/pages/UIShowcase.tsx',
        'src/config/animations.ts',
      ];
      const forbiddenArbitraryColorClass = /\b(?:text|bg|border)-\[rgb\(var\(--color-/;

      for (const filePath of coreFiles) {
        const source = readFileSync(resolve(process.cwd(), filePath), 'utf8');
        const match = forbiddenArbitraryColorClass.exec(source);

        expect(match?.[0], `${filePath} still uses arbitrary color class`).toBeUndefined();
      }
    });

    it('核心 UI family 不應保留 transition-all、legacy radius/shadow utility 或 div role button 回歸', () => {
      const coreFiles = [
        'src/components/AuthorityGuidePage.tsx',
        'src/components/BottomNavigation.tsx',
        'src/components/CurrencyLandingPage.tsx',
        'src/components/ErrorBoundary.tsx',
        'src/components/Footer.tsx',
        'src/components/HomepageSEOSection.tsx',
        'src/components/OfflineAwareError.tsx',
        'src/components/OfflineIndicator.tsx',
        'src/components/RouteErrorBoundary.tsx',
        'src/components/SkeletonLoader.tsx',
        'src/components/SupportContactLinks.tsx',
        'src/components/Toast/ToastProvider.tsx',
        'src/components/UpdatePrompt.tsx',
        'src/components/UpdatePromptPreview.tsx',
        'src/features/calculator/components/CalculatorKey.tsx',
        'src/features/calculator/components/ExpressionDisplay.tsx',
        'src/features/ratewise/RateWise.tsx',
        'src/features/ratewise/components/ConversionHistory.tsx',
        'src/features/ratewise/components/CurrencyList.tsx',
        'src/features/ratewise/components/FavoritesList.tsx',
        'src/features/ratewise/components/MultiConverter.tsx',
        'src/features/ratewise/components/SingleConverter.tsx',
        'src/pages/ColorSchemeComparison.tsx',
        'src/pages/Favorites.tsx',
        'src/pages/MultiConverter.tsx',
        'src/pages/NotFound.tsx',
        'src/pages/OpenData.tsx',
        'src/pages/SeoTech.tsx',
        'src/pages/Settings.tsx',
        'src/pages/ThemeShowcase.tsx',
        'src/pages/UIShowcase.tsx',
        'src/config/animations.ts',
        'src/config/design-tokens.ts',
        'src/index.css',
      ];
      const forbidden =
        /transition-all|transition:\s*all|rounded-(?:sm|md|lg|xl|2xl|3xl|4xl|\[[0-9][^\]]*\])|shadow-(?:sm|md|lg|xl|2xl)|role="button"|border-black\/5|border-surface-border|divide-surface-border/;

      for (const filePath of coreFiles) {
        const source = readFileSync(resolve(process.cwd(), filePath), 'utf8');
        const match = forbidden.exec(source);

        expect(match?.[0], `${filePath} still has UI drift`).toBeUndefined();
      }
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
    });
  });
});
