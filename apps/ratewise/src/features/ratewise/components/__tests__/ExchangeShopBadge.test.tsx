import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import i18n from 'i18next';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ExchangeShopBadge } from '../ExchangeShopBadge';
import type { ExchangeShopRate } from '../../../../services/moneyboxRateService';
import en from '../../../../i18n/locales/en';

const baseRate: ExchangeShopRate = {
  currency: 'KRW',
  sell: 43.2,
  buy: 44.1,
  updateTime: '2026-05-07 09:30:00',
  source: 'MoneyBox',
  sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
  providerName: '明洞換錢所',
  isFallback: false,
};

describe('ExchangeShopBadge', () => {
  beforeAll(() => {
    i18n.addResourceBundle('en', 'translation', en, true, true);
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
});
