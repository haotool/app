/**
 * E2 wave-A 動效單元測試（motion-deep-dive §2/§6）：
 * S1 DOM 契約（wordmark 字元 span / H1 詞段 aria）、S2 chips、S3 odometer、S5-d pill 指示器。
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HeroChips from '../components/HeroChips';
import StatItem from '../components/StatItem';
import Wordmark from '../components/Wordmark';
import Header from '../components/Header';
import Home from '../pages/Home';
import Tools from '../pages/Tools';

// motion 的 useReducedMotion 以全域單例快取 media query，測試需以 mock 控制回傳值。
const reducedMotionState = vi.hoisted(() => ({ value: false }));
vi.mock('motion/react', async (importOriginal) => {
  const actual: object = await importOriginal();
  return {
    ...actual,
    useReducedMotion: () => reducedMotionState.value,
  };
});

const OriginalIntersectionObserver = window.IntersectionObserver;

// 立即觸發 isIntersecting 的 IO stub：驗證 inView 換入滾輪路徑。
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

function useTriggeringObserver() {
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: TriggeringIntersectionObserver,
  });
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    value: TriggeringIntersectionObserver,
  });
}

async function flushReelFrames() {
  // StatItem 以雙 rAF 設定目標數位；多排一輪確保 transition 目標已寫入。
  await act(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });
    });
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  reducedMotionState.value = false;
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: OriginalIntersectionObserver,
  });
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    value: OriginalIntersectionObserver,
  });
});

describe('S1 Wordmark 變體（M1）', () => {
  it('animated 變體輸出 7 個 wm-char（Hao 墨色 3 + Tool accent 4、--i 0..6、aria-hidden）', () => {
    const { container } = render(<Wordmark variant="animated" />);
    const wordmark = container.querySelector('.wordmark');
    expect(wordmark).not.toBeNull();
    expect(wordmark).toHaveAttribute('aria-hidden', 'true');

    const chars = Array.from(container.querySelectorAll<HTMLSpanElement>('.wm-char'));
    expect(chars.map((char) => char.textContent).join('')).toBe('HaoTool');
    chars.forEach((char, index) => {
      expect(char.style.getPropertyValue('--i')).toBe(String(index));
      expect(char.classList.contains('wm-char-accent')).toBe(index >= 3);
    });
  });

  it('預設（Footer/OG）維持 SVG 靜態結構', () => {
    const { container } = render(<Wordmark />);
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelector('.wm-char')).toBeNull();
  });

  it('Header 實例使用 animated 變體且可及名稱不變', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    const homeLink = screen.getAllByRole('link', { name: 'HaoTool 首頁' })[0]!;
    expect(homeLink.querySelector('.wm-char')).not.toBeNull();
  });
});

describe('S1 Hero H1（LCP 鐵律：僅位移、透明度恆 1、不拆詞段）', () => {
  it('H1 為單一 intro-h1 動畫單元（不拆 inline-block 詞段，保住 LCP=H1）', () => {
    const { container } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('把好想法，做成好工具。');
    expect(heading).toHaveClass('intro-h1');
    // 詞段拆分會使 H1 文字分裂為多個小 LCP 候選（副文 P 反成 LCP），禁止回歸。
    expect(container.querySelector('.intro-word')).toBeNull();

    // 副文＋CTA 列整組跟進（intro-follow ×2）。
    expect(container.querySelectorAll('.intro-follow')).toHaveLength(2);
  });
});

describe('S2 HeroChips', () => {
  it('三枚 chips 純裝飾（aria-hidden）且父 scroll 層/子 drift 層分離', () => {
    render(<HeroChips />);
    const chips = screen.getByTestId('hero-chips');
    expect(chips).toHaveAttribute('aria-hidden', 'true');
    for (const id of ['a', 'b', 'c']) {
      const scroll = chips.querySelector(`.chip-scroll-${id}`);
      expect(scroll).not.toBeNull();
      expect(scroll!.querySelector(`.hero-chip-${id}`)).not.toBeNull();
    }
    // 零點陣圖：icon 為 Lucide inline SVG。
    expect(chips.querySelectorAll('img')).toHaveLength(0);
    expect(chips.querySelectorAll('svg')).toHaveLength(3);
  });

  it('Home hero 掛載 chips', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('hero-chips')).toBeInTheDocument();
  });
});

describe('S3 StatItem odometer（M8 取代 count-up）', () => {
  it('未觸發前輸出純文字終值（SSG/AEO 路徑），無滾輪結構', () => {
    const { container } = render(<StatItem value={100} suffix="%" label="開源免費" />);
    expect(container.querySelector('.odo-reel')).toBeNull();
    expect(screen.getByLabelText('100%')).toHaveTextContent('100%');
  });

  it('inView 後換入滾輪：--i 低位優先、非首位 0 補尾滾整圈（--d:10）', async () => {
    useTriggeringObserver();
    const { container } = render(<StatItem value={100} suffix="%" label="開源免費" />);

    await waitFor(() => {
      expect(container.querySelectorAll('.odo-cell')).toHaveLength(3);
    });
    await flushReelFrames();

    const reels = Array.from(container.querySelectorAll<HTMLSpanElement>('.odo-reel'));
    // 百位 1：--d:1、--i:2（高位最後動）；兩個非首位 0：--d:10 滾整圈、11 個 glyph。
    expect(reels[0]!.style.getPropertyValue('--d')).toBe('1');
    expect(reels[0]!.style.getPropertyValue('--i')).toBe('2');
    expect(reels[0]!.querySelectorAll('.odo-glyph')).toHaveLength(10);
    for (const reel of reels.slice(1)) {
      expect(reel.style.getPropertyValue('--d')).toBe('10');
      expect(reel.querySelectorAll('.odo-glyph')).toHaveLength(11);
    }
    expect(reels[1]!.style.getPropertyValue('--i')).toBe('1');
    expect(reels[2]!.style.getPropertyValue('--i')).toBe('0');

    // a11y：外層終值 aria-label、滾輪整體 aria-hidden、後綴為靜態字元。
    const stat = screen.getByLabelText('100%');
    expect(stat.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(stat).toHaveTextContent('%');
  });

  it('統計 0 不滾動（靜止本身是訊息）', async () => {
    useTriggeringObserver();
    const { container } = render(<StatItem value={0} label="廣告與追蹤" />);
    await flushReelFrames();
    expect(container.querySelector('.odo-reel')).toBeNull();
    expect(screen.getByLabelText('0')).toHaveTextContent('0');
  });

  it('reduced-motion 維持純文字路徑（不換入滾輪）', async () => {
    useTriggeringObserver();
    reducedMotionState.value = true;
    const { container } = render(<StatItem value={90} suffix="+" label="Lighthouse 分數" />);
    await flushReelFrames();
    expect(container.querySelector('.odo-reel')).toBeNull();
    expect(screen.getByLabelText('90+')).toHaveTextContent('90+');
  });
});

describe('S5-d pill 滑動指示器（M4：CSS 變數方案）', () => {
  function renderTools() {
    return render(
      <MemoryRouter>
        <Tools />
      </MemoryRouter>,
    );
  }

  it('指示器為純裝飾且 mount 後同步選中 pill 位置、標記 ready', async () => {
    const { container } = renderTools();
    const indicator = container.querySelector<HTMLSpanElement>('.pill-indicator');
    expect(indicator).not.toBeNull();
    expect(indicator).toHaveAttribute('aria-hidden', 'true');

    await waitFor(() => {
      expect(indicator).toHaveAttribute('data-ready', 'true');
    });
    // jsdom 無版面量測（offsetLeft/Width = 0），僅驗證變數已由量測邏輯寫入。
    expect(indicator!.style.getPropertyValue('--pill-x')).toBe('0px');
    expect(indicator!.style.getPropertyValue('--pill-w')).toBe('0px');
  });

  it('切換分類後 aria-pressed 移轉且指示器重新同步（選中 pill ready 後透明底）', async () => {
    renderTools();
    const target = screen.getByRole('button', { name: '教育' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '全部' })).toHaveClass('bg-transparent');
    });

    fireEvent.click(target);
    expect(target).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '全部' })).toHaveAttribute('aria-pressed', 'false');
    expect(target).toHaveClass('bg-transparent');
  });
});
