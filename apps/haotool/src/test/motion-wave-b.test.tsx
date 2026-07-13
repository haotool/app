/**
 * E2 wave-B 動效單元測試（motion-deep-dive §2 S4-b/S4-c/S5-b/S5-c、§3 F2）：
 * magnetic/tilt DOM 契約與三重閘、draw-in 觸發訊號、scroll progress、F2 出貨列。
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TOOLS } from '../config/tools';
import Footer from '../components/Footer';
import Header from '../components/Header';
import Reveal from '../components/Reveal';
import ScrollProgress from '../components/ScrollProgress';
import ToolCard from '../components/ToolCard';
import Home from '../pages/Home';

// F2：模擬 vite define 注入（vi.hoisted 先於模組載入；vitest 檔案級隔離不外漏）。
vi.hoisted(() => {
  (globalThis as Record<string, unknown>)['__LATEST_SHIP__'] = '9.9.9';
});

const originalMatchMedia = window.matchMedia;

/** 三重媒體閘 stub：desktop=true 模擬 ≥1024＋fine pointer＋非 reduced-motion。 */
function stubMatchMedia(desktop: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: desktop ? !query.includes('prefers-reduced-motion') : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function mockRect(element: HTMLElement) {
  element.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0 }) as DOMRect;
}

async function flushFrame() {
  await act(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function firePointer(element: HTMLElement, type: string, clientX = 0, clientY = 0) {
  act(() => {
    element.dispatchEvent(new MouseEvent(type, { clientX, clientY, bubbles: true }));
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: originalMatchMedia,
  });
});

const ratewise = TOOLS.find((tool) => tool.id === 'ratewise');
if (!ratewise) throw new Error('缺少 ratewise 工具資料');

describe('S5-b magnetic hover（±4px、pointer fine 限定）', () => {
  it('desktop 閘開啟：pointermove 寫入內層 --mx/--my（-1..1），pointerleave 歸零', async () => {
    stubMatchMedia(true);
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    // MobileMenu 內另有 GitHub 文字連結；Header icon 鈕為第一個實例。
    const github = screen.getAllByRole('link', { name: 'GitHub' })[0]!;
    const item = github.querySelector<HTMLSpanElement>('.magnet-item');
    expect(item).not.toBeNull();
    mockRect(github);

    firePointer(github, 'pointermove', 100, 0);
    await flushFrame();
    expect(item!.style.getPropertyValue('--mx')).toBe('1');
    expect(item!.style.getPropertyValue('--my')).toBe('-1');

    firePointer(github, 'pointerleave');
    await flushFrame();
    expect(item!.style.getPropertyValue('--mx')).toBe('0');
    expect(item!.style.getPropertyValue('--my')).toBe('0');
  });

  it('coarse/行動閘關閉：pointermove 不寫入任何變數', async () => {
    stubMatchMedia(false);
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    const github = screen.getAllByRole('link', { name: 'GitHub' })[0]!;
    mockRect(github);
    firePointer(github, 'pointermove', 100, 0);
    await flushFrame();
    expect(
      github.querySelector<HTMLSpanElement>('.magnet-item')!.style.getPropertyValue('--mx'),
    ).toBe('');
  });

  it('hero 主/次 CTA 皆有 magnet-item 內層（範圍收斂 3 元素）', () => {
    stubMatchMedia(false);
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    const primary = screen.getByRole('link', { name: '看看我做的工具' });
    const secondary = screen.getByRole('link', { name: '和我聊專案' });
    expect(primary.querySelector('.magnet-item')).not.toBeNull();
    expect(secondary.querySelector('.magnet-item')).not.toBeNull();
  });
});

describe('S5-c ToolCard pointer tilt（≤4deg、Y 軸反向、行動禁用）', () => {
  it('desktop 閘開啟：右上角 pointer → --rx=1（-y）、--ry=1（x）', async () => {
    stubMatchMedia(true);
    const { container } = render(<ToolCard tool={ratewise} />);
    const scene = container.querySelector<HTMLDivElement>('.tilt-scene');
    const inner = container.querySelector<HTMLAnchorElement>('a.tilt-inner');
    expect(scene).not.toBeNull();
    expect(inner).not.toBeNull();
    mockRect(scene!);

    firePointer(scene!, 'pointermove', 100, 0);
    await flushFrame();
    expect(inner!.style.getPropertyValue('--rx')).toBe('1');
    expect(inner!.style.getPropertyValue('--ry')).toBe('1');

    firePointer(scene!, 'pointerleave');
    await flushFrame();
    expect(inner!.style.getPropertyValue('--rx')).toBe('0');
    expect(inner!.style.getPropertyValue('--ry')).toBe('0');
  });

  it('coarse/行動閘關閉：不寫入 --rx/--ry（完全不掛監聽）', async () => {
    stubMatchMedia(false);
    const { container } = render(<ToolCard tool={ratewise} />);
    const scene = container.querySelector<HTMLDivElement>('.tilt-scene')!;
    mockRect(scene);
    firePointer(scene, 'pointermove', 100, 0);
    await flushFrame();
    expect(
      container.querySelector<HTMLAnchorElement>('a.tilt-inner')!.style.getPropertyValue('--rx'),
    ).toBe('');
  });
});

describe('S4-b 工藝證明 draw-in（clip-path 揭示）', () => {
  it('三張工藝卡 icon 帶 draw-in 類且 --draw-delay 繼承卡片 stagger', () => {
    stubMatchMedia(false);
    const { container } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    const icons = Array.from(container.querySelectorAll<SVGElement>('svg.draw-in'));
    expect(icons).toHaveLength(3);
    const holders = icons.map((icon) => icon.parentElement!);
    expect(holders[0]!.style.getPropertyValue('--draw-delay')).toBe('0ms');
    expect(holders[1]!.style.getPropertyValue('--draw-delay')).toBe('70ms');
    expect(holders[2]!.style.getPropertyValue('--draw-delay')).toBe('140ms');
  });

  it('Reveal inView 後標記 data-inview（draw-in 的 CSS 觸發訊號）', async () => {
    stubMatchMedia(false);
    // 立即觸發 isIntersecting 的 IO stub（同 wave-A odometer 測試模式）。
    class TriggeringIntersectionObserver implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds: readonly number[] = [];
      private readonly callback: IntersectionObserverCallback;
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
      }
      observe = (target: Element) => {
        this.callback(
          [{ isIntersecting: true, intersectionRatio: 1, target } as IntersectionObserverEntry],
          this,
        );
      };
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = (): IntersectionObserverEntry[] => [];
    }
    const original = window.IntersectionObserver;
    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      value: TriggeringIntersectionObserver,
    });

    try {
      const { container } = render(
        <Reveal>
          <p>內容</p>
        </Reveal>,
      );
      await waitFor(() => {
        expect(container.querySelector('[data-inview="true"]')).not.toBeNull();
      });
    } finally {
      Object.defineProperty(window, 'IntersectionObserver', {
        writable: true,
        value: original,
      });
    }
  });
});

describe('S4-c scroll progress（純 CSS scroll-timeline）', () => {
  it('為純裝飾 1px 條且僅 Home 掛載', () => {
    stubMatchMedia(false);
    const { container } = render(<ScrollProgress />);
    const bar = container.querySelector('.scroll-progress');
    expect(bar).not.toBeNull();
    expect(bar).toHaveAttribute('aria-hidden', 'true');

    cleanup();
    const home = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(home.container.querySelector('.scroll-progress')).not.toBeNull();
  });
});

describe('F2「正在打造」列（build-time define、零 runtime fetch）', () => {
  it('顯示「最近出貨 · HaoRate v<version>」並連至 GitHub releases', () => {
    stubMatchMedia(false);
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    const row = screen.getByTestId('latest-ship');
    expect(row).toHaveTextContent('最近出貨 ·');
    const link = screen.getByRole('link', { name: 'HaoRate v9.9.9' });
    expect(link).toHaveAttribute('href', 'https://github.com/haotool/app/releases');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
