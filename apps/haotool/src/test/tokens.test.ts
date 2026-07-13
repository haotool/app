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

  it('唯一安靜陰影值與全站唯一 bezier', () => {
    expect(tokenValue('--shadow-quiet')).toBe('0 1px 2px rgb(15 23 42 / 0.04)');
    expect(tokenValue('--ease-out-quart')).toBe('cubic-bezier(0.16, 1, 0.3, 1)');
  });

  it('動效時長 tokens 對齊 brief §2（M8：--dur-count 廢止，odometer 取代）', () => {
    expect(tokenValue('--dur-tap')).toBe('120ms');
    expect(tokenValue('--dur-hover')).toBe('200ms');
    expect(tokenValue('--dur-reveal')).toBe('480ms');
    expect(tokenValue('--stagger')).toBe('70ms');
    expect(css).not.toContain('--dur-count:');
    expect(tokenValue('--dur-odometer')).toBe('900ms');
    expect(tokenValue('--stagger-digit')).toBe('60ms');
  });

  it('三檔 spring token（M6）：基線回落唯一 bezier、linear() 於 @supports 覆寫', () => {
    // 基線宣告（不支援 linear() 的環境）指向唯一 bezier。
    expect(tokenValue('--ease-spring-tap')).toBe('var(--ease-out-quart)');
    expect(tokenValue('--ease-spring-reveal')).toBe('var(--ease-out-quart)');
    expect(tokenValue('--ease-spring-hero')).toBe('var(--ease-out-quart)');
    // @supports 覆寫存在且為 motion-deep-dive §1.1 定稿控制點。
    expect(css).toContain(
      '--ease-spring-tap: linear(0, 0.55 25%, 0.92 45%, 1.03 62%, 0.99 80%, 1)',
    );
    expect(css).toContain(
      '--ease-spring-reveal: linear(0, 0.4 18%, 0.78 38%, 0.94 60%, 0.99 80%, 1)',
    );
    expect(css).toContain(
      '--ease-spring-hero: linear(0, 0.29 12%, 0.71 24%, 0.94 36%, 1.06 52%, 1.01 70%, 0.99 84%, 1)',
    );
  });

  it('wave-A 動效 tokens（S1/S2/S5/S6）', () => {
    expect(tokenValue('--dur-press-release')).toBe('320ms');
    expect(tokenValue('--dur-intro-word')).toBe('560ms');
    expect(tokenValue('--dur-intro-char')).toBe('480ms');
    expect(tokenValue('--dur-vt')).toBe('240ms');
    expect(tokenValue('--dur-vt-out')).toBe('200ms');
    expect(tokenValue('--dur-pill-slide')).toBe('250ms');
    expect(tokenValue('--stagger-word')).toBe('45ms');
    expect(tokenValue('--stagger-char')).toBe('30ms');
    expect(tokenValue('--drift-a')).toBe('9s');
    expect(tokenValue('--drift-b')).toBe('11.5s');
    expect(tokenValue('--drift-c')).toBe('14s');
  });

  it('wave-B 動效 tokens（S4/S5-b/S5-c/S7）', () => {
    expect(tokenValue('--dur-draw')).toBe('600ms');
    expect(tokenValue('--dur-focus')).toBe('200ms');
    expect(tokenValue('--magnet-max')).toBe('4px');
    expect(tokenValue('--tilt-max')).toBe('4deg');
  });

  it('S7-a 舞台深度係數升級（前 ±8 / 中 ±5 / 後 ±3，T6）', () => {
    // 依卡片宣告順序抽出全部 --depth 值：card1..3（行動含桌面覆寫前值）→ card4/5。
    const depths = Array.from(css.matchAll(/--depth:\s*([^;]+);/g), (match) => match[1]);
    expect(depths).toEqual(['8px', '5px', '5px', '3px', '3px']);
  });

  it('wave-C tokens（A5/A6/A7，mobile-beauty §5.1）', () => {
    expect(tokenValue('--sticker-rotate-1')).toBe('-2deg');
    expect(tokenValue('--sticker-rotate-2')).toBe('1.5deg');
    expect(tokenValue('--sticker-rotate-live')).toBe('2deg');
    expect(tokenValue('--kinetic-y')).toBe('12px');
    // pattern 為靜態 SVG data URI（零濾鏡）；圓點 r=1.5、24px 方格、--color-border 色。
    expect(css).toMatch(/--pattern-dots:\s*url\("data:image\/svg\+xml/);
    expect(css).toContain("circle cx='2' cy='2' r='1.5' fill='%23E2E8F0'");
  });

  it('A9：全站段落 text-wrap pretty（標題維持 balance）', () => {
    expect(css).toMatch(/p\s*\{\s*text-wrap:\s*pretty;\s*\}/);
    expect(css).toMatch(/text-wrap:\s*balance/);
  });

  it('A9：bento 嵌套圓角守公式 inner = outer − gap（稽核表 #4/#5＋feature 28/24、32/27）', () => {
    // mini 行動 frame：outer 20 − border 3 = inner 17。
    expect(css).toMatch(/\.bento-mini-frame\s*\{[^}]*border: 3px solid/);
    expect(css).toMatch(/\.bento-mini-frame\s*\{[^}]*border-radius: 20px 20px 0 0/);
    expect(css).toMatch(/\.bento-mini-frame img\s*\{[^}]*border-radius: 17px 17px 0 0/);
    // feature 行動 frame：outer 28 − border 4 = inner 24（現行 device frame 語彙）。
    expect(css).toMatch(/\.bento-feature-frame\s*\{[^}]*border: 4px solid/);
    expect(css).toMatch(/\.bento-feature-frame\s*\{[^}]*border-radius: 28px 28px 0 0/);
    expect(css).toMatch(/\.bento-feature-frame img\s*\{[^}]*border-radius: 24px 24px 0 0/);
    // 桌面覆寫：mini/row 24−4=20；feature 32−5=27（同舞台桌面卡）。
    expect(css).toMatch(/\.bento-mini-frame img\s*\{[^}]*border-radius: 20px 20px 0 0/);
    expect(css).toMatch(/\.bento-feature-frame img\s*\{[^}]*border-radius: 27px 27px 0 0/);
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
