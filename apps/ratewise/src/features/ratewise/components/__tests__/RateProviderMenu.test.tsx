// @vitest-environment jsdom

/**
 * RateProviderMenu - Phase 1 / Phase 2 Gate 測試
 *
 * Phase 1：`shouldEnableBankProviderChoice()` 預設回 false（只有 bot 一家銀行），
 *   元件必須完全不渲染（不可佔用 DOM 節點，避免 SSG snapshot 變動）。
 * Phase 2 行為以 mock 模擬：當銀行 provider > 1 時，渲染推薦最佳 + 銀行清單 + 換錢所清單，
 *   並按 selectionMode / selectedRef 高亮對應項目。
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.resetModules();
});

describe('RateProviderMenu — Phase 1 phase gate（預設）', () => {
  it('shouldEnableBankProviderChoice()===false 時，元件不渲染任何 DOM', async () => {
    const { RateProviderMenu } = await import('../RateProviderMenu');
    const { container } = render(
      <RateProviderMenu selectionMode="manual" selectedRef={undefined} />,
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('rate-provider-menu')).toBeNull();
  });
});

describe('RateProviderMenu — Phase 2 模擬（mock 多銀行 provider）', () => {
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
