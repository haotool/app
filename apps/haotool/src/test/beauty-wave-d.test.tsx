/**
 * E3 wave-D 增強測試（mobile-beauty §3/§4/§6）：
 * A2 sticky 三幕 DOM 契約與 CSS 降級閘、A3 morph 靜態 view-transition-name、
 * A4 素材整合（brand 檔案存在、Home/About 頭像、banner 插畫版位）。
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TOOLS } from '../config/tools';
import ToolCard from '../components/ToolCard';
import About from '../pages/About';
import Home from '../pages/Home';

// jsdom 環境 import.meta.url 為 http scheme，檔案讀取以 vitest root（apps/haotool）定位。
const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf-8');
const publicDir = `${resolve(process.cwd(), 'public')}/`;

afterEach(() => {
  cleanup();
});

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

const ratewise = TOOLS.find((tool) => tool.id === 'ratewise');
if (!ratewise) throw new Error('缺少 ratewise 工具資料');

describe('A2 sticky 敘事一幕（Home 區 5）', () => {
  it('pin 容器內三幕依序掛 craft-scene-1/2/3；標題組在 pin 之外（不進幕）', () => {
    const { container } = renderHome();
    const pin = container.querySelector('.craft-pin');
    expect(pin).not.toBeNull();
    const scenes = Array.from(pin!.querySelectorAll('.craft-scene'));
    expect(scenes.map((scene) => scene.className)).toEqual([
      'craft-scene craft-scene-1',
      'craft-scene craft-scene-2',
      'craft-scene craft-scene-3',
    ]);
    expect(pin!.querySelector('#craft-heading')).toBeNull();
    expect(container.querySelector('#craft-heading')).not.toBeNull();
  });

  it('SSG 內容完整：三幕 overline／巨型數據／標題句／描述／證據錨點（FR-012）全在 DOM', () => {
    const { container } = renderHome();
    const pin = container.querySelector<HTMLElement>('.craft-pin')!;
    for (const overline of ['PERFORMANCE', 'RELIABILITY', 'HONESTY']) {
      expect(pin.textContent).toContain(overline);
    }
    for (const title of ['快，是第一個功能。', '斷網，也照常工作。', '程式碼公開，歡迎檢視。']) {
      expect(pin.textContent).toContain(title);
    }
    // 幕 2 的「離線」二字帶品牌色 span（§3.1）。
    const offline = Array.from(pin.querySelectorAll('.craft-data .text-primary-strong'));
    expect(offline.some((node) => node.textContent === '離線')).toBe(true);
    // 每幕一個外連證據錨點。
    const anchors = Array.from(pin.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]'));
    expect(anchors).toHaveLength(3);
    for (const anchor of anchors) {
      expect(anchor.href).toMatch(/^https:\/\//);
    }
  });

  it('CSS 降級閘：enhanced 限 @supports view()＋no-preference＋min-height 480；pin 高度 300svh 靜態宣告', () => {
    expect(css).toMatch(
      /@supports \(animation-timeline: view\(\)\) \{\s*\n\s*@media \(prefers-reduced-motion: no-preference\) and \(min-height: 480px\)/,
    );
    expect(css).toMatch(/\.craft-pin \{[^}]*height: 300svh;[^}]*view-timeline: --craft block;/s);
    // 幕動畫掛名 timeline 與 §3.2 精確 animation-range。
    expect(css).toContain('animation-timeline: --craft;');
    expect(css).toMatch(/\.craft-scene-1 \{[^}]*animation-range: cover 0% cover 45%;/s);
    expect(css).toMatch(/\.craft-scene-2 \{[^}]*animation-range: cover 38% cover 62%;/s);
    expect(css).toMatch(/\.craft-scene-3 \{[^}]*animation-range: cover 55% cover 78%;/s);
  });

  it('幕 keyframes 僅 opacity＋translateY（compositor-only）；N8：enhanced 幕內 draw-in 整格隱藏', () => {
    for (const name of ['craft-hold-out', 'craft-in-out', 'craft-in-hold']) {
      const match = new RegExp(`@keyframes ${name} \\{([\\s\\S]*?)\\n\\}`).exec(css);
      expect(match).not.toBeNull();
      const body = match![1]!;
      const properties = Array.from(body.matchAll(/([a-z-]+):/g), (m) => m[1]);
      expect(new Set(properties)).toEqual(new Set(['opacity', 'transform']));
      const transforms = Array.from(body.matchAll(/transform:\s*([^;]+);/g), (m) => m[1]);
      for (const value of transforms) {
        expect(value).toMatch(/^(none|translateY\(-?24px\))$/);
      }
    }
    expect(css).toMatch(/\.craft-icon \{\s*display: none;\s*\}/);
    // 基線（fallback）overline 隱藏、卡版維持現行三卡網格。
    expect(css).toMatch(/\.craft-overline \{\s*display: none;\s*\}/);
  });
});

describe('A3 View Transition morph（靜態 view-transition-name，N4）', () => {
  it('ToolCard 四 variant 根元素皆掛 tool-vt 與 --vt-name: tool-<id>', () => {
    for (const variant of ['default', 'feature', 'mini'] as const) {
      const { container, unmount } = render(<ToolCard tool={ratewise} variant={variant} />);
      const root = container.firstElementChild as HTMLElement;
      expect(root.classList.contains('tool-vt')).toBe(true);
      expect(root.style.getPropertyValue('--vt-name')).toBe('tool-ratewise');
      unmount();
    }
  });

  it('Home 5 卡 --vt-name 唯一且 = tool-<id>（兩頁靜態同名自動配對）', () => {
    const { container } = renderHome();
    const names = Array.from(container.querySelectorAll<HTMLElement>('.bento .tool-vt')).map(
      (node) => node.style.getPropertyValue('--vt-name'),
    );
    expect(names).toEqual(TOOLS.map((tool) => `tool-${tool.id}`));
    expect(new Set(names).size).toBe(names.length);
  });

  it('CSS：name 宣告包在 no-preference（reduced-motion 一鍵歸零）；group 280ms quart＋快照高度基準', () => {
    // .tool-vt 必須位於 prefers-reduced-motion: no-preference 區塊內。
    const media = /@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n\}/g;
    const inMedia = Array.from(css.matchAll(media)).some((block) => block[0].includes('.tool-vt'));
    expect(inMedia).toBe(true);
    expect(css).toMatch(
      /\.tool-vt \{[^}]*view-transition-name: var\(--vt-name\);[^}]*view-transition-class: tool-card;/s,
    );
    expect(css).toMatch(
      /::view-transition-group\(\.tool-card\) \{[^}]*animation-duration: 280ms;[^}]*animation-timing-function: var\(--ease-out-quart\);/s,
    );
    expect(css).toMatch(
      /::view-transition-old\(\.tool-card\),\s*::view-transition-new\(\.tool-card\) \{[^}]*height: 100%;[^}]*width: auto;[^}]*overflow: clip;/s,
    );
  });
});

describe('A4 素材整合（快照制產物與版位）', () => {
  it('brand 產物齊備：logomark 三尺寸＋avatar 640＋illus-desk png/webp', () => {
    for (const file of [
      'brand/logomark.png',
      'brand/logomark-512.png',
      'brand/logomark-192.png',
      'brand/avatar.png',
      'brand/illus-desk.png',
      'brand/illus-desk.webp',
    ]) {
      expect(existsSync(`${publicDir}${file}`), file).toBe(true);
    }
  });

  it('Home 區 6：「好」字佔位換 avatar img（alt／width／height／lazy 零 CLS 契約）', () => {
    const { container } = renderHome();
    const avatar = container.querySelector<HTMLImageElement>('img[src="/brand/avatar.png"]');
    expect(avatar).not.toBeNull();
    expect(avatar).toHaveAttribute('alt', '阿璋的吉祥物頭像——手持扳手的品牌藍小方塊');
    expect(avatar).toHaveAttribute('width', '640');
    expect(avatar).toHaveAttribute('height', '640');
    expect(avatar).toHaveAttribute('loading', 'lazy');
    expect(container.textContent).not.toContain('好字佔位');
  });

  it('About 頁同步同資產頭像', () => {
    const { container } = render(
      <MemoryRouter>
        <About />
      </MemoryRouter>,
    );
    const avatar = container.querySelector<HTMLImageElement>('img[src="/brand/avatar.png"]');
    expect(avatar).not.toBeNull();
    expect(avatar).toHaveAttribute('width', '640');
  });

  it('聯繫 banner 右下角插畫：aria-hidden＋lazy＋banner-illus（CSS 基線隱藏、≥1024 顯示）', () => {
    const { container } = renderHome();
    const illus = container.querySelector<HTMLImageElement>('img.banner-illus');
    expect(illus).not.toBeNull();
    expect(illus).toHaveAttribute('aria-hidden', 'true');
    expect(illus).toHaveAttribute('alt', '');
    expect(illus).toHaveAttribute('loading', 'lazy');
    expect(css).toMatch(/\.banner-illus \{\s*display: none;\s*\}/);
    expect(css).toMatch(
      /@media \(min-width: 1024px\) \{\s*\.banner-illus \{[^}]*position: absolute;[^}]*right: 48px;[^}]*bottom: 0;[^}]*width: 240px;/s,
    );
  });
});
