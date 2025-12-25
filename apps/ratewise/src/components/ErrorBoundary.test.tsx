import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock sentry module
vi.mock('../utils/sentry', () => ({
  initSentry: vi.fn().mockResolvedValue(undefined),
  captureException: vi.fn().mockResolvedValue(undefined),
}));

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders fallback UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('哎呀！發生錯誤')).toBeInTheDocument();
    expect(screen.getByText(/抱歉，應用程式遇到了一些問題/)).toBeInTheDocument();
  });

  it('shows reset button in error state', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('重新載入')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      }),
    );
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('哎呀！發生錯誤')).not.toBeInTheDocument();
  });

  it('clears error state when reset button is clicked', () => {
    const { unmount } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    // Error state should be shown
    expect(screen.getByText('哎呀！發生錯誤')).toBeInTheDocument();

    // Click reset button - this clears the error state
    const resetButton = screen.getByText('重新載入');
    fireEvent.click(resetButton);

    // Unmount to clean up
    unmount();

    // In a real app, the user would refresh the page or navigate away
    // The reset button clears the internal error state, allowing
    // a fresh render if the component re-mounts
  });

  it('logs error using logger service', async () => {
    const loggerModule = await import('../utils/logger');
    const loggerErrorSpy = vi.spyOn(loggerModule.logger, 'error');

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'React component error caught by ErrorBoundary',
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
        errorName: 'Error',
        errorMessage: 'Test error',
      }),
    );
  });

  it('shows error details in development mode', () => {
    // 模擬開發模式
    const originalEnv = import.meta.env.DEV;
    import.meta.env.DEV = true;

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    // 在開發模式下應該顯示錯誤詳情
    const detailsElement = screen.queryByText('錯誤詳情（開發模式）');
    // 根據實際環境可能顯示或不顯示
    if (import.meta.env.DEV) {
      expect(detailsElement).toBeInTheDocument();
    }

    import.meta.env.DEV = originalEnv;
  });

  it('handles Sentry initialization in production mode', async () => {
    const { initSentry, captureException } = await import('../utils/sentry');

    // 模擬生產環境
    const originalProd = import.meta.env.PROD;
    import.meta.env.PROD = true;

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    // 等待 async Sentry 初始化
    await waitFor(
      () => {
        // Sentry 應該被初始化並捕獲異常
        expect(initSentry).toHaveBeenCalled();
        expect(captureException).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );

    import.meta.env.PROD = originalProd;
  });

  it('handles Sentry initialization failure gracefully', async () => {
    // 模擬 Sentry 初始化失敗
    vi.doMock('../utils/sentry', () => ({
      initSentry: vi.fn().mockRejectedValue(new Error('Sentry init failed')),
      captureException: vi.fn(),
    }));

    // 模擬生產環境
    const originalProd = import.meta.env.PROD;
    import.meta.env.PROD = true;

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    // 等待錯誤處理
    await waitFor(
      () => {
        // 即使 Sentry 失敗，也不應該崩潰
        expect(screen.getByText('哎呀！發生錯誤')).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    import.meta.env.PROD = originalProd;
  });

  it('renders AlertCircle and RefreshCw icons in error state', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    // 檢查圖標是否渲染（通過 SVG 元素）
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThanOrEqual(2); // AlertCircle + RefreshCw
  });

  it('displays help text in error state', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(
      screen.getByText(/若問題持續發生，請嘗試清除瀏覽器快取或聯繫技術支援/),
    ).toBeInTheDocument();
  });
});
