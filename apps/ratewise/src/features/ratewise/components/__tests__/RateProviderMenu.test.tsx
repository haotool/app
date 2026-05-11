// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.resetModules();
});

describe('RateProviderMenu — 單銀行預設狀態', () => {
  it('shouldEnableBankProviderChoice()===false 時，元件不渲染任何 DOM', async () => {
    const { RateProviderMenu } = await import('../RateProviderMenu');
    const { container } = render(
      <RateProviderMenu selectionMode="manual" selectedRef={undefined} />,
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('rate-provider-menu')).toBeNull();
  });
});

describe('RateProviderMenu — 多銀行 provider 模擬', () => {
  it('啟用後渲染推薦最佳 + 銀行清單 + 換錢所清單', async () => {
    vi.doMock('../../../../config/rateProviders', async () => {
      const actual = await vi.importActual<typeof import('../../../../config/rateProviders')>(
        '../../../../config/rateProviders',
      );
      const fakeBank2 = {
        id: 'fake-bank',
        sourceKind: 'bank',
        label: '示範銀行',
        shortLabel: '示銀',
        supportedRateTypes: ['spot', 'cash'] as const,
        supportedCurrencies: 'all' as const,
        priority: 50,
        isDefault: false,
      };
      return {
        ...actual,
        shouldEnableBankProviderChoice: () => true,
        getProvidersBySourceKind: (kind: 'bank' | 'exchange-shop') => {
          if (kind === 'bank') {
            return [actual.RATE_PROVIDERS.bot, fakeBank2];
          }
          return [actual.RATE_PROVIDERS.moneybox];
        },
      };
    });
    const { RateProviderMenu } = await import('../RateProviderMenu');
    render(<RateProviderMenu selectionMode="best" selectedRef={undefined} />);
    expect(screen.getByTestId('rate-provider-menu')).toBeInTheDocument();
    expect(screen.getByTestId('rate-provider-menu-item-best')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByTestId('rate-provider-menu-item-bot')).toBeInTheDocument();
    expect(screen.getByTestId('rate-provider-menu-item-fake-bank')).toBeInTheDocument();
    expect(screen.getByTestId('rate-provider-menu-item-moneybox')).toBeInTheDocument();
  });

  it('manual 模式下，selectedRef 對應的 provider 應 aria-checked=true', async () => {
    vi.doMock('../../../../config/rateProviders', async () => {
      const actual = await vi.importActual<typeof import('../../../../config/rateProviders')>(
        '../../../../config/rateProviders',
      );
      const fakeBank2 = {
        id: 'fake-bank',
        sourceKind: 'bank',
        label: '示範銀行',
        shortLabel: '示銀',
        supportedRateTypes: ['spot', 'cash'] as const,
        supportedCurrencies: 'all' as const,
        priority: 50,
        isDefault: false,
      };
      return {
        ...actual,
        shouldEnableBankProviderChoice: () => true,
        getProvidersBySourceKind: (kind: 'bank' | 'exchange-shop') => {
          if (kind === 'bank') {
            return [actual.RATE_PROVIDERS.bot, fakeBank2];
          }
          return [actual.RATE_PROVIDERS.moneybox];
        },
      };
    });
    const { RateProviderMenu } = await import('../RateProviderMenu');
    render(
      <RateProviderMenu
        selectionMode="manual"
        selectedRef={{ sourceKind: 'bank', providerId: 'fake-bank' }}
      />,
    );
    expect(screen.getByTestId('rate-provider-menu-item-fake-bank')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByTestId('rate-provider-menu-item-bot')).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(screen.getByTestId('rate-provider-menu-item-best')).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });
});
