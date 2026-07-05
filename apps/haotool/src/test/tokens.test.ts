// @vitest-environment node
/**
 * Design Tokens 對照測試（NFR-006）：
 * index.css @theme 色值必須與 PRD §4.2 13 色（RateWise Zen SSOT）零 drift；
 * 同時守門扁平鐵律（零漸層、零毛玻璃濾鏡）與唯一安靜陰影值。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('../index.css', import.meta.url)), 'utf-8');

// PRD §4.2 色彩 Tokens 全表（來源：apps/ratewise/src/index.css Zen 主題）。
const PRD_COLOR_TOKENS = {
  '--color-primary': '#3182f6',
  '--color-primary-strong': '#1b64da',
  '--color-primary-bg': '#eff6ff',
  '--color-secondary': '#6366f1',
  '--color-background': '#f8fafc',
  '--color-surface': '#ffffff',
  '--color-surface-sunken': '#f1f5f9',
  '--color-text': '#0f172a',
  '--color-text-muted': '#64748b',
  '--color-border': '#e2e8f0',
  '--color-success': '#22c55e',
  '--color-warning': '#f59e0b',
  '--color-danger': '#ef4444',
} as const;

// design-deep-dive §1.1 互動態衍生值（既有 Zen 藍階 / slate 階，禁止另創色值）。
// primary-dark：R2-1 AA 裁決新增（白字實底 hover；RateWise Zen 既有 30 64 175）。
const DERIVED_COLOR_TOKENS = {
  '--color-primary-bg-hover': '#dbeafe',
  '--color-primary-dark': '#1e40af',
  '--color-border-strong': '#cbd5e1',
  '--color-disabled-bg': '#e2e8f0',
  '--color-disabled-text': '#94a3b8',
  '--color-banner-bg': '#1b64da',
  '--color-banner-text': '#ffffff',
  '--color-banner-sub': '#eff6ff',
  '--color-focus': '#3182f6',
  '--color-focus-inverse': '#ffffff',
} as const;

function tokenValue(token: string): string | null {
  const match = new RegExp(`${token}:\\s*([^;]+);`).exec(css);
  return match?.[1]?.trim().toLowerCase() ?? null;
}

describe('design tokens 對照（NFR-006）', () => {
  it.each(Object.entries(PRD_COLOR_TOKENS))('%s = %s（PRD §4.2）', (token, expected) => {
    expect(tokenValue(token)).toBe(expected);
  });

  it.each(Object.entries(DERIVED_COLOR_TOKENS))('%s = %s（deep-dive §1.1）', (token, expected) => {
    expect(tokenValue(token)).toBe(expected);
  });

  it('唯一安靜陰影值與全站唯一 easing', () => {
    expect(tokenValue('--shadow-quiet')).toBe('0 1px 2px rgb(15 23 42 / 0.04)');
    expect(tokenValue('--ease-out-quart')).toBe('cubic-bezier(0.16, 1, 0.3, 1)');
  });

  it('動效時長 tokens 對齊 brief §2', () => {
    expect(tokenValue('--dur-tap')).toBe('120ms');
    expect(tokenValue('--dur-hover')).toBe('200ms');
    expect(tokenValue('--dur-reveal')).toBe('480ms');
    expect(tokenValue('--stagger')).toBe('70ms');
    expect(tokenValue('--dur-count')).toBe('1200ms');
  });
});

describe('扁平鐵律（brief §1.1）', () => {
  // 以組字建構禁字，避免守門字串本身被扁平鐵律 rg 掃描命中。
  const forbidden = ['linear-', 'radial-'].map((prefix) => `${prefix}gradient`);
  const backdrop = ['backdrop', 'filter'].join('-');
  const googleFonts = ['fonts', 'googleapis'].join('.');

  it('index.css 零漸層、零毛玻璃濾鏡', () => {
    expect(css).not.toMatch(new RegExp(`${forbidden.join('|')}|${backdrop}`));
  });

  it('不引入 webfont（無 @font-face、無 Google Fonts CDN）', () => {
    expect(css).not.toMatch(new RegExp(`@font-face|${googleFonts.replace('.', '\\.')}`));
  });
});
