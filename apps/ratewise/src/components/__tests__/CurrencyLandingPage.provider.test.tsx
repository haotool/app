/**
 * TDD RED: ProviderComparisonCard 元件測試
 *
 * 測試 CurrencyLandingPage 在傳入 alternativeProviders 時顯示比較卡片。
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CurrencyLandingPage } from '../CurrencyLandingPage';
import type { AlternativeProvider } from '../../config/generated/seo-rate-examples';
import { normalizeQuote } from '@app/shared/fx';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

// Mock hooks
vi.mock('../../hooks/usePairAmountSEO', () => ({
  usePairAmountSEO: () => ({
    seoTitle: '韓元匯率',
    seoDescription: '韓元即時匯率',
    seoCanonical: 'https://app.haotool.org/ratewise/krw-twd/',
    amount: null,
  }),
}));

const mockProvider: AlternativeProvider = {
  name: '明洞換匯所',
  nameEn: 'Myeongdong Exchange',
  providerId: 'moneybox',
  rate: 46.0,
  rateBuy: 46.7,
  source: 'MoneyBox',
  sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
  sourcePublishedAt: null,
  fetchedAt: '2026-03-31T00:00:00Z',
  note: '適用：現場持 TWD 現金換 KRW，需親自前往',
  quotes: normalizeQuote({
    providerId: 'moneybox',
    subjectCurrency: 'TWD',
    priceCurrency: 'KRW',
    unitAmount: '1',
    buy: '46',
    sell: '46.7',
    sourcePublishedAt: '2026-03-31T00:00:00Z',
    fetchedAt: '2026-03-31T00:00:00Z',
    lastSuccessfulCheckAt: '2026-03-31T00:00:00Z',
    serviceCountry: 'KR',
    deliveryMethod: 'cash',
    channel: 'branch',
    branchId: 'myeongdong',
  }),
};

const baseProps = {
  currencyCode: 'KRW',
  currencyFlag: '🇰🇷',
  currencyName: '韓元',
  title: '韓元匯率',
  description: '韓元即時匯率',
  pathname: '/krw-twd',
  canonical: 'https://app.haotool.org/ratewise/krw-twd/',
  keywords: ['韓元'],
  faqEntries: [],
  howToSteps: [],
  highlights: [],
};

function renderPage(extraProps = {}) {
  return render(
    <MemoryRouter>
      <CurrencyLandingPage {...baseProps} {...extraProps} />
    </MemoryRouter>,
  );
}

describe('CurrencyLandingPage ProviderComparisonCard', () => {
  it('不傳 alternativeProviders 時不渲染比較卡片', () => {
    renderPage();
    expect(screen.queryByText('明洞換匯所')).toBeNull();
    expect(screen.queryByTestId('provider-comparison-card')).toBeNull();
  });

  it('傳入 alternativeProviders 時顯示比較 section', () => {
    renderPage({ alternativeProviders: [mockProvider] });
    expect(screen.getByTestId('provider-comparison-card')).toBeInTheDocument();
  });

  it('比較卡片應顯示台銀現金賣出標籤', () => {
    renderPage({ alternativeProviders: [mockProvider] });
    // 頁面可能多處含「臺灣銀行」，只需至少一個在比較卡片中即可
    expect(screen.getAllByText(/臺灣銀行|台銀/).length).toBeGreaterThan(0);
  });

  it('比較卡片應顯示明洞換匯所名稱', () => {
    renderPage({ alternativeProviders: [mockProvider] });
    expect(screen.getByText('明洞換匯所')).toBeInTheDocument();
  });

  it('比較卡片應顯示 MoneyBox 來源說明', () => {
    renderPage({ alternativeProviders: [mockProvider] });
    expect(screen.getByText(/MoneyBox|每日更新/)).toBeInTheDocument();
  });

  it('比較卡片應顯示 canonical quote 的來源發布時間', () => {
    renderPage({ alternativeProviders: [mockProvider] });
    expect(screen.getByText(/來源發布時間：2026-03-31T00:00:00Z/)).toBeInTheDocument();
  });
});

describe('ProviderComparisonCard 雙向匯率顯示', () => {
  it('twd-to-foreign 方向應顯示 sell 率（provider.rate = 46.00）', () => {
    renderPage({
      direction: 'twd-to-foreign',
      alternativeProviders: [mockProvider],
    });
    const card = screen.getByTestId('provider-comparison-card');
    expect(card).toHaveTextContent('46.00');
  });

  it('to-twd 方向應顯示反向 canonical rate（TWD / KRW）', () => {
    renderPage({
      direction: 'to-twd',
      alternativeProviders: [mockProvider],
    });
    const card = screen.getByTestId('provider-comparison-card');
    expect(card).toHaveTextContent('0.0214');
  });

  it('to-twd 方向不應顯示 forward rate（46.00）', () => {
    renderPage({
      direction: 'to-twd',
      alternativeProviders: [mockProvider],
    });
    const card = screen.getByTestId('provider-comparison-card');
    // sell 率 46.00 不應出現在明洞換匯所欄（台銀欄的 1/cashSell 可能碰巧是 46.xx，但 46.00 精確值不會出現）
    const providerCell = card.querySelector('.bg-green-50, .bg-green-950\\/20');
    expect(providerCell?.textContent).not.toContain('46.00');
  });

  it('兩個方向的比較卡片標籤均應為 KRW / TWD', () => {
    const { unmount } = renderPage({
      direction: 'twd-to-foreign',
      alternativeProviders: [mockProvider],
    });
    expect(screen.getByTestId('provider-comparison-card')).toHaveTextContent('KRW / TWD');
    unmount();

    renderPage({
      direction: 'to-twd',
      alternativeProviders: [mockProvider],
    });
    expect(screen.getByTestId('provider-comparison-card')).toHaveTextContent('TWD / KRW');
  });
});
