import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { logger } from '../utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary Component - React Error Boundary with Fallback UI
 *
 * @description Catches and handles React component errors gracefully
 *
 * @features
 * - Prevents entire app crashes by showing fallback UI
 * - Automatic error logging via logger service
 * - On-demand Sentry integration (production only)
 * - Custom fallback UI support
 * - Development mode error details display
 * - Design token integration for consistent styling
 *
 * @performance
 * - Lazy Sentry initialization (only on first error)
 * - Reduces initial bundle size
 *
 * @accessibility
 * - Clear error messaging
 * - Keyboard-accessible retry button
 *
 * @see https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 * @see docs/dev/005_design_token_refactoring.md - Design token migration
 *
 * @created 2025-01-01
 * @updated 2026-01-24
 * @version 2.0.0
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error using logger service
    logger.error('React component error caught by ErrorBoundary', error, {
      componentStack: errorInfo.componentStack,
      errorName: error.name,
      errorMessage: error.message,
    });

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // 🚀 [Lighthouse-optimization:2025-10-30] On-demand Sentry 初始化
    // 只在真正發生錯誤時才載入 Sentry（首次錯誤時會初始化，後續直接使用）
    if (import.meta.env.PROD || import.meta.env.VITE_SENTRY_DSN) {
      void (async () => {
        try {
          const { initSentry, captureException } = await import('../utils/sentry');
          await initSentry(); // 首次初始化（如已初始化會跳過）
          await captureException(error, { react: errorInfo });
        } catch (sentryError) {
          logger.error(
            'Failed to send error to Sentry',
            sentryError instanceof Error ? sentryError : new Error(String(sentryError)),
          );
        }
      })();
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-danger-bg to-warning-light flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-danger" size={32} />
              <h1 className="text-2xl font-bold text-neutral-text">哎呀！發生錯誤</h1>
            </div>

            <p className="text-neutral-text-secondary mb-4">
              抱歉，應用程式遇到了一些問題。請重新整理頁面試試。
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm font-semibold text-neutral-text-secondary mb-2">
                  錯誤詳情（開發模式）
                </summary>
                <div className="bg-danger-bg border border-danger-light rounded-lg p-3">
                  <p className="text-xs font-mono text-danger mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-xs font-mono text-danger overflow-x-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-brand-button-to to-brand-button-from hover:from-brand-button-hover-to hover:to-brand-button-hover-from text-white font-semibold rounded-xl shadow-lg transition transform hover:scale-105"
            >
              <RefreshCw size={18} />
              重新載入
            </button>

            <p className="text-xs text-neutral-text-muted text-center mt-4">
              若問題持續發生，請嘗試清除瀏覽器快取或聯繫技術支援。
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
