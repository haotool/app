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

  it('cash-only availability 下即期 button aria-disabled 且不能觸發切換', () => {
    const props = setup({
      rateType: 'cash',
      rateTypeAvailability: { spot: false, cash: true },
    });
    const spotButton = screen.getByRole('button', { name: /即期/ });

    // 用 aria-disabled 而非原生 disabled：保留點擊事件讓禁用原因 tooltip 可觸發。
    expect(spotButton).not.toBeDisabled();
    expect(spotButton).toHaveAttribute('aria-disabled', 'true');
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

  // #651 前置：佈局改為內容驅動，欄數由 pills 數量隱式決定，禁止回退硬編碼寬度。
  it('容器為內容驅動 inline-grid，無 grid-cols-N 與硬編碼寬度 class', () => {
    setup({ hasExchangeShop: true });

    const group = screen.getByRole('group', { name: /匯率類型/ });
    expect(group.className).toContain('inline-grid');
    expect(group.className).toContain('grid-flow-col');
    expect(group.className).toContain('auto-cols-[minmax(max-content,1fr)]');
    expect(group.className).not.toMatch(/grid-cols-\d/);
    // 硬編碼固定寬度（w-[...]）禁止回歸；max-w-[...] 為安全上限、允許保留。
    expect(group.className).not.toMatch(/(?:^|\s)w-\[/);
  });

  it('每顆 pill 具 44px 熱區（min-h-11＋負邊距抵銷），視覺 pill 維持 h-6', () => {
    setup({ hasExchangeShop: true });

    const pills = screen.getAllByRole('button');
    expect(pills).toHaveLength(3);
    for (const pill of pills) {
      expect(pill.className).toContain('min-h-11');
      expect(pill.className).toContain('-my-[10px]');
      const visual = pill.querySelector('span');
      expect(visual?.className).toContain('h-6');
      expect(visual?.className).toContain('whitespace-nowrap');
    }
  });
});
