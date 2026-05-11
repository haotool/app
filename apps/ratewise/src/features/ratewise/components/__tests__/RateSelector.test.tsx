import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import i18n from 'i18next';
import { afterEach, beforeAll, describe, it, expect, vi, type Mock } from 'vitest';
import { RateSelector } from '../RateSelector';
import type { ReactNode } from 'react';
import type { RateSource, RateType } from '../../types';
import type { RateTypeAvailability } from '../../../../utils/exchangeRateCalculation';
import en from '../../../../i18n/locales/en';

vi.mock('../../../../components/RateTypeTooltip', () => ({
  RateTypeTooltip: ({
    children,
    isDisabled,
  }: {
    children: ReactNode;
    message: string;
    isDisabled: boolean;
  }) => <span data-tooltip-disabled={isDisabled}>{children}</span>,
}));

describe('RateSelector', () => {
  beforeAll(() => {
    i18n.addResourceBundle('en', 'translation', en, true, true);
  });

  afterEach(() => {
    void i18n.changeLanguage('zh-TW');
  });

  interface SetupProps {
    rateType: RateType;
    rateSource: RateSource;
    rateTypeAvailability: RateTypeAvailability;
    hasExchangeShop: boolean;
    onRateTypeChange: Mock<(type: RateType) => void>;
    onRateSourceChange: Mock<(source: RateSource) => void>;
  }

  const setup = (
    overrides: Partial<Omit<SetupProps, 'onRateTypeChange' | 'onRateSourceChange'>> = {},
  ) => {
    const props: SetupProps = {
      rateType: 'spot' as RateType,
      rateSource: 'bank' as RateSource,
      rateTypeAvailability: { spot: true, cash: true },
      hasExchangeShop: false,
      onRateTypeChange: vi.fn<(type: RateType) => void>(),
      onRateSourceChange: vi.fn<(source: RateSource) => void>(),
      ...overrides,
    };

    render(<RateSelector {...props} />);

    return props;
  };

  it('hasExchangeShop=false 時只顯示即期與現金', () => {
    setup({ hasExchangeShop: false });

    expect(screen.getByRole('button', { name: /即期/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /現金/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /換錢所/ })).not.toBeInTheDocument();
  });

  it('點現金會先切回銀行來源再呼叫 onRateTypeChange', () => {
    const props = setup({ rateType: 'spot', rateSource: 'exchange-shop', hasExchangeShop: true });

    fireEvent.click(screen.getByRole('button', { name: /現金/ }));

    expect(props.onRateSourceChange).toHaveBeenCalledWith('bank');
    expect(props.onRateTypeChange).toHaveBeenCalledWith('cash');
    expect(props.onRateSourceChange).toHaveBeenCalledBefore(props.onRateTypeChange);
  });

  it('hasExchangeShop=true 時顯示即期、現金與換錢所', () => {
    setup({ hasExchangeShop: true });

    expect(screen.getByRole('button', { name: /即期/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /現金/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /換錢所/ })).toBeInTheDocument();
  });

  it('cash-only availability 下即期 button disabled 且不能觸發切換', () => {
    const props = setup({
      rateType: 'cash',
      rateTypeAvailability: { spot: false, cash: true },
    });
    const spotButton = screen.getByRole('button', { name: /即期/ });

    expect(spotButton).toBeDisabled();
    fireEvent.click(spotButton);

    expect(props.onRateSourceChange).not.toHaveBeenCalled();
    expect(props.onRateTypeChange).not.toHaveBeenCalled();
  });

  it('點換錢所呼叫 onRateSourceChange', () => {
    const props = setup({ hasExchangeShop: true });

    fireEvent.click(screen.getByRole('button', { name: /換錢所/ }));

    expect(props.onRateSourceChange).toHaveBeenCalledWith('exchange-shop');
    expect(props.onRateTypeChange).not.toHaveBeenCalled();
  });

  it('rateSource=exchange-shop 時換錢所 aria-pressed=true', () => {
    setup({ hasExchangeShop: true, rateSource: 'exchange-shop' });

    expect(screen.getByRole('button', { name: /換錢所/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('uses locale strings for exchange-shop option and group label', async () => {
    await i18n.changeLanguage('en');

    setup({ hasExchangeShop: true });

    expect(screen.getByRole('group', { name: 'Rate type' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Switch to exchange shop rate' })).toHaveTextContent(
      'Exchange shop',
    );
    expect(screen.queryByRole('button', { name: /換錢所/ })).not.toBeInTheDocument();
  });
});
