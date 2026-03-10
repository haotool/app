import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type * as ReactRouterDom from 'react-router-dom';
import { ChunkErrorBoundary, OfflineAwareError, OfflineAwareFallback } from '../OfflineAwareError';

const useRouteErrorMock = vi.fn();
let reloadMock: ReturnType<typeof vi.fn>;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof ReactRouterDom>('react-router-dom');
  return {
    ...actual,
    useRouteError: () => useRouteErrorMock(),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

function ThrowError({ error }: { error: Error }): never {
  throw error;
}

describe('OfflineAwareError', () => {
  beforeEach(() => {
    useRouteErrorMock.mockReset();
    reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: reloadMock },
    });
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      writable: true,
      value: true,
    });
  });

  it('在線且非 chunk 錯誤時應顯示一般載入失敗 UI，且可重新載入', () => {
    render(<OfflineAwareFallback error={new Error('unexpected route error')} />);

    fireEvent.click(screen.getByRole('button', { name: '重新載入' }));

    expect(screen.getByText('頁面載入失敗')).toBeInTheDocument();
    expect(screen.queryByText('離線模式')).not.toBeInTheDocument();
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('離線時應顯示離線友善提示', () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      writable: true,
      value: false,
    });

    render(<OfflineAwareFallback error={new Error('network unavailable')} />);

    expect(screen.getByText('離線模式')).toBeInTheDocument();
    expect(screen.getByText(/此頁面需要網路連線才能載入/)).toBeInTheDocument();
  });

  it('ChunkErrorBoundary 應攔截 chunk 載入錯誤並渲染 fallback', () => {
    render(
      <ChunkErrorBoundary>
        <ThrowError error={new Error('Loading chunk 123 failed')} />
      </ChunkErrorBoundary>,
    );

    expect(screen.getByText('離線模式')).toBeInTheDocument();
  });

  it('OfflineAwareError 應讀取 route error 並委派給 fallback', () => {
    useRouteErrorMock.mockReturnValue(new TypeError('Load failed'));

    render(<OfflineAwareError />);

    expect(screen.getByText('離線模式')).toBeInTheDocument();
  });
});
