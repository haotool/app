/**
 * Settings persisted 欄位首幀契約（issue #666，比照 #664 client-only 首幀取樣模式）。
 *
 * /settings 為預渲染頁（APP_ONLY_PRERENDER_PATHS）；persisted 偏好
 * （singleConverterVariant／rateMode／theme style／customPrimary／splash）若於首次
 * render 直讀，client render 路徑（hydration de-opt／早期更新 #423／SSG fallback guard）
 * 首幀輸出會偏離 SSG HTML（#653 同族 #418 破口）。
 *
 * 宣稱範圍（誠實標注，同 #664）：jsdom 中 React 的 hydration render 對 uSES 恆讀
 * getServerSnapshot、store 訂閱 commit 後才建立，壞版無法以 hydration 錯誤重演；
 * 壞版鑑別由「client-only 首幀取樣」承擔——callback ref 於首次 commit 的 layout 階段
 * （gate 的 layout effect 切換 re-render 之前）同步取樣 DOM：
 * - 修法版：首幀全部為 SSG 預設（zen／auto／legacy／splash on）→ 綠
 * - 壞版（移除 hydrated gate 或初值 true）：首幀即 persisted 值 → 紅
 * runtime mismatch 防回歸由 e2e settings-hydration.spec.ts（persisted 冷載 console 斷言）承擔。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot, type Root } from 'react-dom/client';
import { act, createElement, type ReactNode } from 'react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import Settings, { resetSettingsHydrationForTests } from './Settings';
import { useConverterStore } from '../stores/converterStore';

vi.mock('../components/SEOHelmet', () => ({
  SEOHelmet: () => null,
}));

vi.mock('react-i18next', () => ({
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children?: ReactNode }) => children ?? null,
  motion: new Proxy(
    {},
    {
      get:
        (_, tag: string) =>
        ({
          children,
          whileHover: _whileHover,
          whileTap: _whileTap,
          layoutId: _layoutId,
          transition: _transition,
          animate: _animate,
          initial: _initial,
          ...props
        }: Record<string, unknown>) =>
          createElement(tag, props, children as ReactNode),
    },
  ),
}));

const THEME_STORAGE_KEY = 'ratewise-theme';
const SPLASH_STORAGE_KEY = 'ratewise-splash-enabled';

/** 首幀取樣結構：涵蓋盤點表中 /settings 的全部破口欄位消費點。 */
interface SettingsFrameSample {
  /** singleConverterVariant：v2 選項 aria-pressed。 */
  variantV2Pressed: string | null;
  /** rateMode：sell 選項 aria-pressed。 */
  rateModeSellPressed: string | null;
  /** theme style：nitro 風格卡 aria-pressed。 */
  nitroPressed: string | null;
  /** splash 偏好：switch aria-checked。 */
  splashChecked: string | null;
  /** URL override 提示 badge 是否存在（結構性節點差異）。 */
  hasOverrideBadge: boolean;
  /** customPrimary：自訂主題卡 inline style 的 ring 色值。 */
  customCardStyle: string;
}

function findByText(node: ParentNode, selector: string, text: string): Element | null {
  return (
    Array.from(node.querySelectorAll(selector)).find((el) => el.textContent?.includes(text)) ?? null
  );
}

function sampleSettingsFrame(node: ParentNode): SettingsFrameSample {
  const nitroButton = Array.from(node.querySelectorAll('button')).find((el) =>
    el.getAttribute('aria-label')?.includes('styles.nitro'),
  );
  const customButton = Array.from(node.querySelectorAll('button')).find((el) =>
    el.getAttribute('aria-label')?.includes('styles.custom'),
  );
  return {
    variantV2Pressed:
      node.querySelector('[data-testid="converter-variant-v2"]')?.getAttribute('aria-pressed') ??
      null,
    rateModeSellPressed:
      findByText(node, 'button', 'settings.rateModeSell')?.getAttribute('aria-pressed') ?? null,
    nitroPressed: nitroButton?.getAttribute('aria-pressed') ?? null,
    splashChecked: node.querySelector('[role="switch"]')?.getAttribute('aria-checked') ?? null,
    hasOverrideBadge:
      node.querySelector('[data-testid="converter-variant-override-badge"]') !== null,
    customCardStyle: customButton?.getAttribute('style') ?? '',
  };
}

/** SSG 預設幀（server snapshot 契約值）：zen／auto／legacy／splash on／品牌藍。 */
const SSG_DEFAULT_FRAME = {
  variantV2Pressed: 'false',
  rateModeSellPressed: 'false',
  nitroPressed: 'false',
  splashChecked: 'true',
  hasOverrideBadge: false,
} as const;

/** 寫入全部破口欄位的非預設 persisted 值。 */
function seedNonDefaultPersistedState() {
  window.localStorage.setItem(
    THEME_STORAGE_KEY,
    JSON.stringify({ style: 'nitro', customPrimary: '#FF6B6B' }),
  );
  window.localStorage.setItem(SPLASH_STORAGE_KEY, '0');
  useConverterStore.setState({ singleConverterVariant: 'v2', rateMode: 'sell' });
}

const settingsElement = (
  <MemoryRouter initialEntries={['/settings']}>
    <Settings />
  </MemoryRouter>
);

describe('Settings persisted 欄位首幀契約（#666）', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, '', '/settings');
    useConverterStore.setState({ singleConverterVariant: 'legacy', rateMode: 'auto' });
    resetSettingsHydrationForTests();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  // 真 SSG 契約：window/document/localStorage 不存在（Node build 環境），
  // 即使 converterStore module state 已被污染，renderToString 輸出仍為預設
  // （zustand uSES 於 SSR 讀 getInitialState，theme/splash initializer 走 SSR 分支）。
  it('SSG server snapshot：persisted 非預設值不得影響預渲染輸出', () => {
    useConverterStore.setState({ singleConverterVariant: 'v2', rateMode: 'sell' });

    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;
    const originalLocalStorage = globalThis.localStorage;
    for (const key of ['window', 'document', 'localStorage'] as const) {
      Object.defineProperty(globalThis, key, {
        configurable: true,
        writable: true,
        value: undefined,
      });
    }

    let html = '';
    try {
      html = renderToString(settingsElement);
    } finally {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        writable: true,
        value: originalWindow,
      });
      Object.defineProperty(globalThis, 'document', {
        configurable: true,
        writable: true,
        value: originalDocument,
      });
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        writable: true,
        value: originalLocalStorage,
      });
    }

    const container = document.createElement('div');
    container.innerHTML = html;
    expect(sampleSettingsFrame(container)).toMatchObject(SSG_DEFAULT_FRAME);
    expect(container.querySelector('[data-testid="converter-variant-legacy"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  // 壞版鑑別核心（同 #664）：client render 路徑首次 commit 不得讀取 persisted 偏好。
  // callback ref 於首次 commit 的 layout 階段（gate layout effect 切換 re-render 之前）
  // 同步取樣 DOM；移除 gate（或 hydrated 初值 true）時首幀即 persisted 值 → 紅。
  it('client-only 首幀契約：persisted 非預設值首次 commit 恆為 SSG 預設、切換後呈現偏好（壞版必紅）', async () => {
    seedNonDefaultPersistedState();

    const firstFrames: SettingsFrameSample[] = [];
    const probeRef = (node: HTMLDivElement | null) => {
      if (node !== null && firstFrames.length === 0) {
        firstFrames.push(sampleSettingsFrame(node));
      }
    };

    const { container } = render(<div ref={probeRef}>{settingsElement}</div>);

    expect(firstFrames).toHaveLength(1);
    expect(firstFrames[0]).toMatchObject(SSG_DEFAULT_FRAME);
    expect(firstFrames[0]?.customCardStyle).toContain('#3182F6');
    expect(firstFrames[0]?.customCardStyle).not.toContain('#FF6B6B');

    // layout effect 切換後：全部欄位呈現 persisted 偏好，無殘留預設值。
    await vi.waitFor(() => {
      expect(sampleSettingsFrame(container)).toMatchObject({
        variantV2Pressed: 'true',
        rateModeSellPressed: 'true',
        nitroPressed: 'true',
        splashChecked: 'false',
        hasOverrideBadge: false,
      });
    });
    expect(sampleSettingsFrame(container).customCardStyle).toContain('#FF6B6B');
  });

  // URL override badge 為結構性節點（有/無），首幀出現即 #425/#418 同族破口：
  // effective variant 首幀必須走 server snapshot（legacy），badge 於切換後才可出現。
  it('URL override badge：首幀不得出現、hydration 完成後才顯示', async () => {
    window.history.replaceState(null, '', '/settings?converter=v2');

    const firstFrames: SettingsFrameSample[] = [];
    const probeRef = (node: HTMLDivElement | null) => {
      if (node !== null && firstFrames.length === 0) {
        firstFrames.push(sampleSettingsFrame(node));
      }
    };

    const { container } = render(<div ref={probeRef}>{settingsElement}</div>);

    expect(firstFrames[0]?.hasOverrideBadge).toBe(false);

    await vi.waitFor(() => {
      expect(sampleSettingsFrame(container).hasOverrideBadge).toBe(true);
    });
  });

  // SPA 導覽 remount：本次 page load 已完成 hydration，首幀直接依 persisted 偏好渲染，
  // 不重演 two-pass（零閃爍；同 #664 模組級旗標設計）。
  it('SPA remount：hydration 已完成後首幀直接呈現 persisted 偏好', () => {
    seedNonDefaultPersistedState();

    // 第一次 mount：完成 two-pass，模組旗標翻真。
    const first = render(settingsElement);
    first.unmount();

    const firstFrames: SettingsFrameSample[] = [];
    const probeRef = (node: HTMLDivElement | null) => {
      if (node !== null && firstFrames.length === 0) {
        firstFrames.push(sampleSettingsFrame(node));
      }
    };
    render(<div ref={probeRef}>{settingsElement}</div>);

    expect(firstFrames[0]).toMatchObject({
      variantV2Pressed: 'true',
      rateModeSellPressed: 'true',
      splashChecked: 'false',
    });
  });

  // hydration 契約（宣稱範圍見檔頭）：SSG HTML + persisted 非預設值 hydrate，
  // onRecoverableError 零錯誤；hydration 窗口內 store 更新（#653 情境）不得產生破口。
  it('persisted 非預設值 hydration：onRecoverableError 零錯誤、commit 後切 persisted 偏好', async () => {
    // 先產出乾淨 SSG HTML（真 SSG 環境模擬）。
    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;
    const originalLocalStorage = globalThis.localStorage;
    for (const key of ['window', 'document', 'localStorage'] as const) {
      Object.defineProperty(globalThis, key, {
        configurable: true,
        writable: true,
        value: undefined,
      });
    }
    let html = '';
    try {
      html = renderToString(settingsElement);
    } finally {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        writable: true,
        value: originalWindow,
      });
      Object.defineProperty(globalThis, 'document', {
        configurable: true,
        writable: true,
        value: originalDocument,
      });
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        writable: true,
        value: originalLocalStorage,
      });
    }

    seedNonDefaultPersistedState();

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    const recoverableErrors: unknown[] = [];
    let root: Root | undefined;
    act(() => {
      root = hydrateRoot(container, settingsElement, {
        onRecoverableError: (error) => recoverableErrors.push(error),
      });
      // 模擬 rehydrate／遷移於 hydration 同一同步窗口內觸發的 store 更新（#653 破口情境）。
      useConverterStore.setState({ singleConverterVariant: 'legacy' });
      useConverterStore.setState({ singleConverterVariant: 'v2' });
    });

    expect(recoverableErrors).toEqual([]);

    await vi.waitFor(() => {
      expect(sampleSettingsFrame(container)).toMatchObject({
        variantV2Pressed: 'true',
        rateModeSellPressed: 'true',
        splashChecked: 'false',
      });
    });

    act(() => {
      root?.unmount();
    });
    container.remove();
  });
});
