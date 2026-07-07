/**
 * SingleConverter flag gate 測試：converter-v2 flag off 時渲染 legacy（SSG/hydration 紅線），
 * on 時分流至 SingleConverterV2。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot, type Root } from 'react-dom/client';
import '@testing-library/jest-dom/vitest';
import {
  SingleConverter,
  preheatConverterV2Chunk,
  resetConverterHydrationForTests,
} from '../SingleConverter';
import { useConverterStore } from '../../../../stores/converterStore';
import type { CurrencyCode } from '../../types';
import zhTW from '../../../../i18n/locales/zh-TW';
import en from '../../../../i18n/locales/en';
import ja from '../../../../i18n/locales/ja';
import ko from '../../../../i18n/locales/ko';

// Mock services（避免測試觸網）
vi.mock('../../../../services/exchangeRateHistoryService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../services/exchangeRateHistoryService')>()),
  fetchHistoricalRatesRange: vi.fn().mockResolvedValue([]),
  fetchLatestRates: vi.fn().mockResolvedValue({
    updateTime: '2026/07/05 08:00:00',
    source: 'Taiwan Bank',
    rates: {},
  }),
}));

vi.mock('../converter-v2/useConverterTrend', () => ({
  useConverterTrend: vi.fn(() => ({ data: [], isLoading: false })),
}));

const mockExchangeRates: Record<CurrencyCode, number | null> = {
  TWD: 1,
  USD: 31.665,
  EUR: 36.94,
  JPY: 0.2047,
  GBP: 42.49,
  AUD: 20.96,
  CAD: 22.89,
  SGD: 24.56,
  CHF: 39.46,
  KRW: 0.0236,
  CNY: 4.506,
  HKD: 4.081,
  NZD: 18.38,
  THB: 1.0393,
  PHP: 0.6016,
  IDR: 0.0022,
  VND: 0.0014,
  MYR: 8.097,
};

const mockProps = {
  fromCurrency: 'TWD' as CurrencyCode,
  toCurrency: 'USD' as CurrencyCode,
  fromAmount: '1000',
  toAmount: '31.58',
  exchangeRates: mockExchangeRates,
  rateType: 'spot' as const,
  onFromCurrencyChange: vi.fn(),
  onToCurrencyChange: vi.fn(),
  onFromAmountChange: vi.fn(),
  onToAmountChange: vi.fn(),
  onQuickAmount: vi.fn(),
  onSwapCurrencies: vi.fn(),
  onAddToHistory: vi.fn(),
  onRateTypeChange: vi.fn(),
};

describe('SingleConverter - converter-v2 flag gate', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, '', '/');
    useConverterStore.setState({ singleConverterVariant: 'legacy' });
    resetConverterHydrationForTests();
    Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), writable: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('flag off（預設）：渲染 legacy 版面，無 v2 元素', () => {
    render(<SingleConverter {...mockProps} />);

    expect(screen.getByTestId('amount-input')).toBeInTheDocument();
    expect(screen.queryByTestId('converter-v2')).not.toBeInTheDocument();
  });

  it('flag on（使用者設定 v2）：chunk 就緒前以 v2 骨架佔位，就緒後分流至等值雙列 v2', async () => {
    useConverterStore.setState({ singleConverterVariant: 'v2' });
    render(<SingleConverter {...mockProps} />);

    // lazy 尚未 resolve：Suspense fallback 為 v2 佈局輪廓骨架，而非空白（issue #583）。
    if (!screen.queryByTestId('converter-v2')) {
      expect(screen.getByTestId('converter-v2-skeleton')).toBeInTheDocument();
    }

    expect(await screen.findByTestId('converter-v2')).toBeInTheDocument();
    expect(screen.queryByTestId('converter-v2-skeleton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('amount-input')).not.toBeInTheDocument();
  });

  it('冷啟動預熱：persisted 偏好為 v2 時觸發 v2 chunk 預取，legacy 時不觸發', async () => {
    expect(preheatConverterV2Chunk()).toBeNull();

    useConverterStore.setState({ singleConverterVariant: 'v2' });
    const preheat = preheatConverterV2Chunk();
    expect(preheat).not.toBeNull();
    await expect(preheat).resolves.toMatchObject({ default: expect.any(Function) });
  });

  it('flag on（URL override）：?converter=v2 直接啟用', async () => {
    window.history.replaceState(null, '', '/?converter=v2');
    render(<SingleConverter {...mockProps} />);

    expect(await screen.findByTestId('converter-v2')).toBeInTheDocument();
  });

  // issue #653：persisted v2 冷載 two-pass render 契約（審查 R1 強化版，拆兩條不變量）。
  //
  // 宣稱範圍（誠實標注）：jsdom 中 React 的 useSyncExternalStore 在 hydration render
  // 一律讀取 getServerSnapshot（三變體共用常數 legacy），且 store 訂閱在 commit 後才建立，
  // hydration 窗口內的 store 更新不構成 React 可見事件——壞版無法在 jsdom 以 hydration
  // 錯誤（#418／onRecoverableError）重演，runtime mismatch 防回歸由 e2e
  // （converter-v2.spec.ts「設 v2 冷啟動重載」console 斷言）承擔。
  // 壞版鑑別由下一條「client-only 首幀契約」測試承擔（首次 commit 取樣）。
  it('persisted v2 hydration：SSR 恆 legacy、onRecoverableError 零錯誤、commit 後切 v2', async () => {
    useConverterStore.setState({ singleConverterVariant: 'v2' });

    // SSR pass：server snapshot 固定 legacy，persisted v2 不得影響 SSG 輸出。
    const html = renderToString(<SingleConverter {...mockProps} />);
    expect(html).toContain('data-testid="amount-input"');
    expect(html).not.toContain('data-testid="converter-v2"');

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    // onRecoverableError 為 hydration 錯誤（#418/#421/#423）的正確 API 鉤點；
    // jsdom＋React 19 的 mismatch 不走 console.error，console spy 會是空斷言。
    const recoverableErrors: unknown[] = [];
    let root: Root | undefined;
    act(() => {
      root = hydrateRoot(container, <SingleConverter {...mockProps} />, {
        onRecoverableError: (error) => recoverableErrors.push(error),
      });
      // 模擬 rehydrate／遷移於 hydration 同一同步窗口內觸發的 store 更新（#653 破口情境）。
      useConverterStore.setState({ singleConverterVariant: 'legacy' });
      useConverterStore.setState({ singleConverterVariant: 'v2' });
    });

    expect(recoverableErrors).toEqual([]);

    // commit 後依 persisted 偏好切 v2（chunk 就緒前允許骨架佔位）。
    await vi.waitFor(() => {
      expect(
        container.querySelector('[data-testid="converter-v2"]') ??
          container.querySelector('[data-testid="converter-v2-skeleton"]'),
      ).not.toBeNull();
    });
    expect(container.querySelector('[data-testid="amount-input"]')).toBeNull();

    act(() => {
      root?.unmount();
    });
    container.remove();
  });

  // 壞版鑑別核心（審查 R1）：首次 render pass 不得讀取 persisted 偏好。
  // hydration render 因 React 恆讀 server snapshot 而天然安全；真正的破口在
  // client render 路徑（hydration de-opt／早期更新 #423／SSG fallback guard 清 root），
  // 該路徑首次 render 直讀 client snapshot。以 callback ref 於首次 commit 的 layout
  // 階段（layout effect 切換 re-render 之前）同步取樣 DOM：
  // - 修法版：首幀 legacy（與 SSG 一致）→ 綠
  // - 壞版 A（還原 base：uSES 直讀 client snapshot）：首幀即 v2（骨架或雙列）→ 紅
  // - 壞版 C（hydrated 初值 true）：首幀即 v2 → 紅
  it('client-only 首幀契約：persisted v2 首次 commit 恆 legacy、切換後 v2（壞版必紅）', async () => {
    useConverterStore.setState({ singleConverterVariant: 'v2' });

    const firstCommitVariants: string[] = [];
    const probeRef = (node: HTMLDivElement | null) => {
      if (node !== null && firstCommitVariants.length === 0) {
        firstCommitVariants.push(
          node.querySelector('[data-testid="amount-input"]') !== null
            ? 'legacy'
            : node.querySelector(
                  '[data-testid="converter-v2"], [data-testid="converter-v2-skeleton"]',
                ) !== null
              ? 'v2'
              : 'unknown',
        );
      }
    };

    render(
      <div ref={probeRef}>
        <SingleConverter {...mockProps} />
      </div>,
    );

    expect(firstCommitVariants).toEqual(['legacy']);

    // layout effect 切換後：依 persisted 偏好呈現 v2，無 legacy 殘留。
    expect(await screen.findByTestId('converter-v2')).toBeInTheDocument();
    expect(screen.queryByTestId('amount-input')).not.toBeInTheDocument();
  });

  // i18next 缺 key 時回傳 key 本身（truthy），screen reader 會唸出 raw key。
  it.each(Object.entries({ 'zh-TW': zhTW, en, ja, ko }))(
    '%s 語系 converterV2.skeletonLoading 存在且非空（骨架 sr-only 文案）',
    (_lng, locale) => {
      expect(locale.converterV2.skeletonLoading).toBeTruthy();
      expect(typeof locale.converterV2.skeletonLoading).toBe('string');
    },
  );
});
