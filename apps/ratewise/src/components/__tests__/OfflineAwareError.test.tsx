import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type * as ReactRouterDom from 'react-router-dom';
import type * as ChunkLoadRecovery from '../../utils/chunkLoadRecovery';
import { ChunkErrorBoundary, OfflineAwareError, OfflineAwareFallback } from '../OfflineAwareError';

const useRouteErrorMock = vi.fn();
let reloadMock: ReturnType<typeof vi.fn>;

const { recoverFromChunkLoadErrorMock, recordPwaDiagnosticMock } = vi.hoisted(() => ({
  recoverFromChunkLoadErrorMock: vi.fn(() => Promise.resolve(true)),
  recordPwaDiagnosticMock: vi.fn(),
}));

vi.mock('../../utils/chunkLoadRecovery', async () => {
  const actual = await vi.importActual<typeof ChunkLoadRecovery>('../../utils/chunkLoadRecovery');
  return {
    ...actual,
    recoverFromChunkLoadError: recoverFromChunkLoadErrorMock,
  };
});

vi.mock('../../utils/pwaDiagnostics', () => ({
  recordPwaDiagnostic: recordPwaDiagnosticMock,
}));

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
    recoverFromChunkLoadErrorMock.mockReset();
    recoverFromChunkLoadErrorMock.mockResolvedValue(true);
    recordPwaDiagnosticMock.mockReset();
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

  it('chunk 錯誤且在線時應顯示更新中狀態並觸發一次自動恢復', async () => {
    render(<OfflineAwareFallback error={new TypeError('Load failed')} />);

    expect(screen.getByText('正在更新至最新版本…')).toBeInTheDocument();
    expect(screen.getByText('偵測到新版本資源，正在自動重新載入。')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(recoverFromChunkLoadErrorMock).toHaveBeenCalledTimes(1);
    });
    expect(recordPwaDiagnosticMock).toHaveBeenCalledWith(
      'route-error-boundary',
      { message: 'Load failed' },
      'warn',
    );
  });

  it('自動恢復被 cooldown 擋下時應退回手動重試 UI', async () => {
    recoverFromChunkLoadErrorMock.mockResolvedValue(false);

    render(<OfflineAwareFallback error={new TypeError('Load failed')} />);

    await waitFor(() => {
      expect(screen.getByText('離線模式')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: '重新載入' })).toBeInTheDocument();
  });

  it('online 事件觸發時應自動重新載入', () => {
    render(<OfflineAwareFallback error={new Error('unexpected route error')} />);

    fireEvent(window, new Event('online'));

    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('非 chunk 錯誤時不應觸發自動恢復', () => {
    render(<OfflineAwareFallback error={new Error('unexpected route error')} />);

    expect(screen.getByText('頁面載入失敗')).toBeInTheDocument();
    expect(recoverFromChunkLoadErrorMock).not.toHaveBeenCalled();
  });

  it('離線遇到 chunk 錯誤時不應觸發自動恢復，維持離線 UI', () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      writable: true,
      value: false,
    });

    render(<OfflineAwareFallback error={new TypeError('Load failed')} />);

    expect(screen.getByText('離線模式')).toBeInTheDocument();
    expect(recoverFromChunkLoadErrorMock).not.toHaveBeenCalled();
  });

  it('ChunkErrorBoundary 應攔截 chunk 載入錯誤並渲染 fallback', async () => {
    recoverFromChunkLoadErrorMock.mockResolvedValue(false);

    render(
      <ChunkErrorBoundary>
        <ThrowError error={new Error('Loading chunk 123 failed')} />
      </ChunkErrorBoundary>,
    );

    await waitFor(() => {
      expect(screen.getByText('離線模式')).toBeInTheDocument();
    });
  });

  it('OfflineAwareError 應讀取 route error 並委派給 fallback', async () => {
    recoverFromChunkLoadErrorMock.mockResolvedValue(false);
    useRouteErrorMock.mockReturnValue(new TypeError('Load failed'));

    render(<OfflineAwareError />);

    await waitFor(() => {
      expect(screen.getByText('離線模式')).toBeInTheDocument();
    });
  });
});
