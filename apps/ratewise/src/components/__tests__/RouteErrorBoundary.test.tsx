import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { RouteErrorBoundary } from '../RouteErrorBoundary';

vi.mock('../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

function ThrowError({ error }: { error: Error }): never {
  throw error;
}

describe('RouteErrorBoundary', () => {
  beforeEach(() => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });
  });

  it('在線時遇到 chunk 錯誤應提供重新載入', () => {
    const chunkError = new Error('Loading chunk 123 failed');

    render(
      <RouteErrorBoundary>
        <ThrowError error={chunkError} />
      </RouteErrorBoundary>,
    );

    expect(screen.getByText('頁面載入失敗')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重新載入' })).toBeInTheDocument();
    expect(screen.queryByText('離線模式')).not.toBeInTheDocument();
  });

  it('離線時應顯示離線重試介面', () => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false,
    });

    render(
      <RouteErrorBoundary>
        <ThrowError error={new Error('network unavailable')} />
      </RouteErrorBoundary>,
    );

    expect(screen.getByText('離線模式')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重試' })).toBeInTheDocument();
  });
});
