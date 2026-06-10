import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_THEME_CONFIG,
  STYLE_DEFINITIONS,
  STYLE_OPTIONS,
  getChartColors,
  getStyleColors,
} from '../themes';

function toRgbColor(spaceDelimited: string): string {
  return `rgb(${spaceDelimited.split(' ').join(', ')})`;
}

const cssSource = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
const nitroSurfaceCriticalFiles = [
  'src/components/CurrencyLandingPage.tsx',
  'src/components/Footer.tsx',
  'src/pages/Guide.tsx',
  'src/pages/FAQ.tsx',
  'src/pages/About.tsx',
  'src/pages/OpenData.tsx',
  'src/pages/SeoTech.tsx',
  'src/pages/Privacy.tsx',
  'src/pages/Settings.tsx',
  'src/components/PageNavHeader.tsx',
  'src/pages/ColorSchemeComparison.tsx',
  'src/features/calculator/easter-eggs/ChristmasEasterEgg.tsx',
  'src/features/calculator/components/CalculatorKeyboard.tsx',
  'src/components/RatingModal.tsx',
  'src/components/OfflineAwareError.tsx',
  'src/components/SkeletonLoader.tsx',
  'src/components/ErrorBoundary.tsx',
  'src/components/RouteErrorBoundary.tsx',
  'src/features/ratewise/RateWise.tsx',
  'src/pages/Favorites.tsx',
  'src/pages/NotFound.tsx',
  'src/components/AuthorityGuidePage.tsx',
  'src/pages/MultiConverter.tsx',
  'src/features/ratewise/components/RateSelector.tsx',
  'src/features/ratewise/components/SingleConverter.tsx',
  'src/components/HomepageSEOSection.tsx',
  'src/pages/UIShowcase.tsx',
  'src/pages/ThemeShowcase.tsx',
] as const;
const fixedTailwindTonePattern =
  /\b(?:dark:|(?:bg|text|border|fill|stroke)-(?:black|white)(?:\/|\[|\s|`|["'])|(?:bg|text|border|fill|stroke)-(?:slate|gray|red|green|blue|sky|amber|yellow|orange|emerald|purple|pink|rose)-)/;

function extractStyleBlock(selector: string): string {
  const selectorIndex = cssSource.indexOf(selector);
  expect(selectorIndex).toBeGreaterThanOrEqual(0);

  const blockStart = cssSource.indexOf('{', selectorIndex);
  expect(blockStart).toBeGreaterThanOrEqual(0);

  let depth = 0;
  for (let index = blockStart; index < cssSource.length; index += 1) {
    const char = cssSource[index];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return cssSource.slice(blockStart + 1, index);
    }
  }

  throw new Error(`Unable to extract CSS block for ${selector}`);
}

function extractCssVars(block: string): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const match of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    const name = match[1];
    const value = match[2];
    if (!name || !value) continue;

    vars[name] = value.trim();
  }

  return vars;
}

function rgbTripletToNumbers(value: string): [number, number, number] {
  const values = value
    .trim()
    .split(/\s+/)
    .map((part) => Number.parseInt(part, 10));

  expect(values).toHaveLength(3);
  return values as [number, number, number];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const normalize = (channel: number): number => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };

  return normalize(r) * 0.2126 + normalize(g) * 0.7152 + normalize(b) * 0.0722;
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminosity = relativeLuminance(rgbTripletToNumbers(foreground));
  const backgroundLuminosity = relativeLuminance(rgbTripletToNumbers(background));
  const lighter = Math.max(foregroundLuminosity, backgroundLuminosity);
  const darker = Math.min(foregroundLuminosity, backgroundLuminosity);

  return (lighter + 0.05) / (darker + 0.05);
}

function getCssVar(vars: Record<string, string>, variable: string): string {
  const value = vars[variable];
  expect(value, `${variable} is missing`).toBeDefined();
  return value!;
}

function resolveCssVar(vars: Record<string, string>, variable: string): string {
  const value = getCssVar(vars, variable);
  const reference = /^var\(--([\w-]+)\)$/.exec(value);

  return reference?.[1] ? resolveCssVar(vars, reference[1]) : value;
}

describe('themes SSOT', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('STYLE_OPTIONS 應從 STYLE_DEFINITIONS 派生 preview 色票', () => {
    for (const option of STYLE_OPTIONS) {
      const style = STYLE_DEFINITIONS[option.value];

      expect(option.label).toBe(style.label);
      expect(option.labelEn).toBe(style.labelEn);
      expect(option.description).toBe(style.description);
      expect(option.previewBg).toBe(toRgbColor(style.colors.background));
      expect(option.previewText).toBe(toRgbColor(style.colors.text));
      expect(option.previewAccent).toBe(toRgbColor(style.colors.primary));
    }
  });

  it('getChartColors 在 SSR 環境應使用預設風格 fallback', () => {
    vi.stubGlobal('window', undefined);

    const fallback = getStyleColors(DEFAULT_THEME_CONFIG.style);

    expect(getChartColors()).toEqual({
      lineColor: toRgbColor(fallback.chartLine),
      topColor: `rgba(${fallback.chartAreaTop.split(' ').join(', ')}, 0.25)`,
      bottomColor: `rgba(${fallback.chartAreaBottom.split(' ').join(', ')}, 0)`,
      markerBackground: 'rgb(255, 255, 255)',
    });
  });

  it('DEFAULT_THEME_CONFIG 應對應可用的 style 定義', () => {
    expect(STYLE_DEFINITIONS).toHaveProperty(DEFAULT_THEME_CONFIG.style);
    expect(Object.keys(STYLE_DEFINITIONS)).toContain(DEFAULT_THEME_CONFIG.style);
  });

  it('Tailwind 色彩 alias 應支援目前產品內使用的 semantic class', async () => {
    const { default: tailwindConfig } = await import('../../../tailwind.config');
    const colors = tailwindConfig.theme.extend.colors;

    expect(colors.surface).toHaveProperty('soft');
    expect(colors.surface).toHaveProperty('border');
    expect(colors.text).toHaveProperty('DEFAULT');
    expect(colors.text).toHaveProperty('muted');
    expect(colors.primary).toHaveProperty('foreground');
  });

  it('Nitro CSS variables 應完整覆蓋 legacy semantic tokens，避免繼承 Zen 淺色值', () => {
    const nitroVars = extractCssVars(extractStyleBlock("[data-style='nitro']"));
    const requiredNitroVars = [
      'color-primary-foreground',
      'color-foreground-secondary',
      'color-foreground-muted',
      'color-card',
      'color-card-foreground',
      'color-ring',
      'color-overlay',
      'color-neutral',
      'color-neutral-dark',
      'color-neutral-darker',
      'color-neutral-border',
      'color-destructive-hover',
      'color-destructive-foreground',
      'color-success-foreground',
      'color-warning-foreground',
      'color-danger-bg',
      'color-danger-light',
      'color-danger-hover',
      'color-danger-active',
      'color-danger-text',
      'color-danger',
      'color-success-bg',
      'color-success-light',
      'color-success-hover',
      'color-success-active',
      'color-warning-light',
      'color-warning-hover',
      'color-warning-active',
      'color-favorite-light',
      'color-favorite',
      'color-highlight-from',
      'color-highlight-to',
      'color-footer-from',
      'color-footer-via',
      'color-footer-to',
    ];

    for (const variable of requiredNitroVars) {
      expect(nitroVars, `${variable} is missing from [data-style='nitro']`).toHaveProperty(
        variable,
      );
    }
  });

  it('所有風格應覆蓋互動狀態 foreground token 並符合 AA 對比', () => {
    for (const option of STYLE_OPTIONS) {
      const vars = extractCssVars(extractStyleBlock(`[data-style='${option.value}']`));

      for (const variable of [
        'color-card',
        'color-card-foreground',
        'color-ring',
        'color-destructive-hover',
        'color-destructive-foreground',
        'color-success-foreground',
        'color-warning-foreground',
      ]) {
        expect(vars, `${variable} is missing from [data-style='${option.value}']`).toHaveProperty(
          variable,
        );
      }

      for (const background of ['color-destructive', 'color-destructive-hover']) {
        expect(
          contrastRatio(
            resolveCssVar(vars, 'color-destructive-foreground'),
            resolveCssVar(vars, background),
          ),
          `${option.value} ${background} contrast is below AA`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('Nitro 主要文字、次要文字與 primary foreground 應達到一般文字 AA 對比', () => {
    const nitroVars = extractCssVars(extractStyleBlock("[data-style='nitro']"));

    expect(
      contrastRatio(getCssVar(nitroVars, 'color-text'), getCssVar(nitroVars, 'color-background')),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(
        getCssVar(nitroVars, 'color-text-muted'),
        getCssVar(nitroVars, 'color-surface'),
      ),
    ).toBeGreaterThanOrEqual(4.5);
    // primary-foreground/primary 用於 RateSelector 大文字 UI 元件，採 WCAG AA Large Text 3:1。
    expect(
      contrastRatio(
        getCssVar(nitroVars, 'color-primary-foreground'),
        getCssVar(nitroVars, 'color-primary'),
      ),
    ).toBeGreaterThanOrEqual(3);
  });

  it('Nitro 高風險頁面不得再使用固定 Tailwind 淺色或 dark: 補丁', () => {
    for (const filePath of nitroSurfaceCriticalFiles) {
      const source = readFileSync(resolve(process.cwd(), filePath), 'utf8');
      const match = fixedTailwindTonePattern.exec(source);

      expect(match?.[0], `${filePath} still uses fixed tone class`).toBeUndefined();
    }
  });
});
