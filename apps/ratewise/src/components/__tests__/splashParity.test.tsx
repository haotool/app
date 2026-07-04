/**
 * Splash 雙版一致性守門（SSOT anti-drift）
 *
 * index.html 內嵌 splash（冷啟動首屏）與 React SplashScreen（設定頁預覽）
 * 必須共用同一份視覺來源：標記 class、SVG 幾何鏡射 SplashScreen 輸出，
 * 樣式與動畫只允許定義在 src/index.css 的 .ratewise-splash 區塊。
 * 任一側漂移時本測試必須紅燈。
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { render, screen, act } from '@testing-library/react';
import { SplashScreen } from '../SplashScreen';
import {
  SPLASH_PREVIEW_EVENT,
  SPLASH_STORAGE_KEY,
  SPLASH_SESSION_KEY,
  __resetSplashAutoShowForTests,
} from '../../utils/splashPreference';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const indexHtml = readFileSync(resolve(ROOT, 'index.html'), 'utf-8');
const indexCss = readFileSync(resolve(ROOT, 'src/index.css'), 'utf-8');
const viteConfig = readFileSync(resolve(ROOT, 'vite.config.ts'), 'utf-8');

/** 取出 index.html 內嵌 splash 標記區塊（div#rw-splash 至對應收尾）。 */
function extractInlineSplashMarkup(): string {
  const match = /<div id="rw-splash"[\s\S]*?<\/div>/.exec(indexHtml);
  expect(match, 'index.html 必須存在 #rw-splash 標記').not.toBeNull();
  return match![0];
}

/** 渲染 React 版 splash（走預覽事件路徑）並回傳根節點。 */
function renderReactSplash(): HTMLElement {
  render(<SplashScreen />);
  act(() => {
    window.dispatchEvent(new CustomEvent(SPLASH_PREVIEW_EVENT));
  });
  return screen.getByTestId('splash-screen');
}

describe('splash 雙版一致性守門', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    __resetSplashAutoShowForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('inline 版標記鏡射 React 版：容器 class 與所有子元素 class 一致', () => {
    const inline = extractInlineSplashMarkup();
    const reactSplash = renderReactSplash();

    // 容器：共用 .ratewise-splash 樣式與 enter 相位。
    expect(inline).toContain('class="ratewise-splash"');
    expect(inline).toContain('data-phase="enter"');
    expect(reactSplash.className).toContain('ratewise-splash');
    expect(reactSplash.getAttribute('data-phase')).toBe('enter');

    // React 版子樹使用的每個 class token 必須出現在 inline 標記中。
    const reactClassTokens = new Set(
      Array.from(reactSplash.querySelectorAll('[class]')).flatMap((el) =>
        (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean),
      ),
    );
    expect(reactClassTokens.size).toBeGreaterThan(0);
    for (const token of reactClassTokens) {
      expect(inline, `inline splash 缺少 class token: ${token}`).toContain(token);
    }
  });

  it('inline 版 SVG 幾何鏡射 React BrandMark（cx/cy/r/stroke-width）', () => {
    const inline = extractInlineSplashMarkup();
    const reactSplash = renderReactSplash();

    const circles = Array.from(reactSplash.querySelectorAll('circle'));
    expect(circles.length).toBeGreaterThan(0);
    for (const circle of circles) {
      for (const attr of ['cx', 'cy', 'r', 'stroke-width'] as const) {
        const value = circle.getAttribute(attr);
        if (value === null) continue;
        expect(inline, `inline splash SVG 缺少 ${attr}="${value}"`).toContain(`${attr}="${value}"`);
      }
    }
  });

  it('品牌文案由 APP_INFO 佔位符注入（wordmark 拆分 + tagline）', () => {
    const inline = extractInlineSplashMarkup();
    expect(inline).toContain('__BRAND_WORDMARK_PREFIX__');
    expect(inline).toContain('__BRAND_WORDMARK_ACCENT__');
    expect(inline).toContain('__BRAND_SUBTITLE__');
    // vite.config.ts 必須以 APP_INFO 對應欄位替換佔位符。
    expect(viteConfig).toMatch(/__BRAND_WORDMARK_PREFIX__\/g,\s*APP_INFO\.wordmarkPrefix/);
    expect(viteConfig).toMatch(/__BRAND_WORDMARK_ACCENT__\/g,\s*APP_INFO\.wordmarkAccent/);
    expect(viteConfig).toMatch(/__BRAND_SUBTITLE__\/g,\s*APP_INFO\.subtitle/);
  });

  it('視覺 CSS SSOT 在 index.css：index.html 不得重複定義 splash 動畫或舊版樣式', () => {
    expect(indexHtml).not.toMatch(/@keyframes\s+splash-/);
    expect(indexHtml).not.toContain('rw-splash-title');
    expect(indexHtml).not.toContain('rw-splash-out');

    // index.css 必須提供完整動畫序列與 exit 相位。
    for (const keyframes of [
      'splash-coin-solid-in',
      'splash-coin-ring-in',
      'splash-fade-up',
      'splash-halo-in',
    ]) {
      expect(indexCss).toContain(`@keyframes ${keyframes}`);
    }
    expect(indexCss).toContain(".ratewise-splash[data-phase='exit']");
  });

  it('inline script 與 splashPreference 共用 storage key 且淡出走共用 exit 相位', () => {
    expect(indexHtml).toContain(`'${SPLASH_STORAGE_KEY}'`);
    expect(indexHtml).toContain(`'${SPLASH_SESSION_KEY}'`);
    expect(indexHtml).toContain("setAttribute('data-phase', 'exit')");
  });
});
