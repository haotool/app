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
  rate: 46.0,
  rateInverse: 0.02174,
  source: 'MoneyBox',
  sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
  rateDate: '2026-03-31',
  note: '適用：現場持 TWD 現金換 KRW，需親自前往',
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

  it('比較卡片應顯示 rateDate 資訊', () => {
    renderPage({ alternativeProviders: [mockProvider] });
    // 應顯示日期資訊
    expect(screen.getByText(/2026-03-31|2026\/03\/31/)).toBeInTheDocument();
  });
});
