import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import i18n from 'i18next';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ExchangeShopBadge } from '../ExchangeShopBadge';
import type { ExchangeShopRate } from '../../../../services/moneyboxRateService';
import en from '../../../../i18n/locales/en';

const baseRate: ExchangeShopRate = {
  currency: 'KRW',
  sell: 43.2,
  buy: 44.1,
  updateTime: '2026-05-07 09:30:00',
  timestamp: '2026-05-07T04:00:00.000Z',
  source: 'MoneyBox',
  sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
  providerName: '明洞換錢所',
  isFallback: false,
};

// baseRate.timestamp 為 2026-05-07T04:00:00Z；固定系統時間使「新鮮／過期」判定可重現，
// 否則 fixture 會隨真實時間流逝從新鮮變成過期，測試語意漂移。
const FRESH_NOW = new Date('2026-05-07T05:00:00.000Z');

describe('ExchangeShopBadge', () => {
  beforeAll(() => {
    i18n.addResourceBundle('en', 'translation', en, true, true);
    vi.useFakeTimers();
    vi.setSystemTime(FRESH_NOW);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    void i18n.changeLanguage('zh-TW');
  });

  it('renders provider name and update time', () => {
    render(<ExchangeShopBadge rate={baseRate} />);

    expect(screen.getByText('明洞換錢所')).toBeInTheDocument();
    expect(screen.getByText('2026-05-07 09:30:00')).toBeInTheDocument();
  });

  it('renders source link to MoneyBox exchange page', () => {
    render(<ExchangeShopBadge rate={baseRate} />);

    const link = screen.getByRole('link', { name: 'MoneyBox' });
    expect(link).toHaveAttribute('href', 'https://moneybox-exchange.com/zh-CHT/exchange');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('shows fallback marker when rate is fallback', () => {
    render(<ExchangeShopBadge rate={{ ...baseRate, isFallback: true }} />);

    expect(screen.getByText('參考值')).toBeInTheDocument();
  });

  it('does not show fallback marker when rate is not fallback', () => {
    render(<ExchangeShopBadge rate={{ ...baseRate, isFallback: false }} />);

    expect(screen.queryByText('參考值')).not.toBeInTheDocument();
  });

  it('localizes fallback marker', async () => {
    await i18n.changeLanguage('en');

    render(<ExchangeShopBadge rate={{ ...baseRate, isFallback: true }} />);

    expect(screen.getByText('Reference')).toBeInTheDocument();
    expect(screen.queryByText('參考值')).not.toBeInTheDocument();
  });

  describe('資料過期揭露（issue：上游停更 38h 而畫面毫無提示）', () => {
    it('資料未達門檻時不顯示過期提示', () => {
      render(<ExchangeShopBadge rate={baseRate} />);

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('資料逾 24 小時未更新時顯示過期提示與實際時數', () => {
      vi.setSystemTime(new Date('2026-05-08T09:00:00.000Z')); // +29h
      try {
        render(<ExchangeShopBadge rate={baseRate} />);

        expect(screen.getByRole('status')).toHaveTextContent('逾 29 小時未更新');
      } finally {
        vi.setSystemTime(FRESH_NOW);
      }
    });

    it('剛好在門檻邊界（24h）即揭露', () => {
      vi.setSystemTime(new Date('2026-05-08T04:00:00.000Z')); // +24h
      try {
        render(<ExchangeShopBadge rate={baseRate} />);

        expect(screen.getByRole('status')).toHaveTextContent('逾 24 小時未更新');
      } finally {
        vi.setSystemTime(FRESH_NOW);
      }
    });

    it('timestamp 缺失（fallback 值）時不揭露——不顯示錯誤年齡優於顯示猜測值', () => {
      vi.setSystemTime(new Date('2027-01-01T00:00:00.000Z'));
      try {
        render(<ExchangeShopBadge rate={{ ...baseRate, timestamp: null, isFallback: true }} />);

        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(screen.getByText('參考值')).toBeInTheDocument();
      } finally {
        vi.setSystemTime(FRESH_NOW);
      }
    });

    it('過期提示可在地化', async () => {
      vi.setSystemTime(new Date('2026-05-08T09:00:00.000Z'));
      await i18n.changeLanguage('en');
      try {
        render(<ExchangeShopBadge rate={baseRate} />);

        expect(screen.getByRole('status')).toHaveTextContent('Not updated for 29h');
      } finally {
        vi.setSystemTime(FRESH_NOW);
      }
    });
  });
});
