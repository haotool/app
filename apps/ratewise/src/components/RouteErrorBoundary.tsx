/**
 * 路由級 Error Boundary
 *
 * 與全域 ErrorBoundary 的差異：
 * - 全域 ErrorBoundary：替換整個畫面（包括底部導覽），用於致命錯誤
 * - RouteErrorBoundary：僅替換路由內容區域，保留底部導覽可供切換
 *
 * 離線感知：
 * - 偵測到離線狀態時顯示離線專用 UI（提示恢復連線後重試）
 * - 在線時顯示重新載入按鈕（清除 SW 快取後重載）
 *
 * 解決問題：
 * - 舊 PWA 用戶切換頁面時 chunk 載入失敗，整個 App 被全域 ErrorBoundary 取代
 * - 離線冷啟動時 lazy chunk 載入失敗（Load failed），顯示友善離線提示
 * - 用戶無法透過底部導覽切換到其他頁面或重試
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { logger } from '../utils/logger';
import { isChunkLoadError } from '../utils/chunkLoadRecovery';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isOffline: boolean;
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isOffline: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    return { hasError: true, error, isOffline };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('Route component error', error, {
      componentStack: errorInfo.componentStack,
      isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : undefined,
      isChunkError: isChunkLoadError(error),
    });
  }

  override componentDidMount(): void {
    window.addEventListener('online', this.handleOnline);
  }

  override componentWillUnmount(): void {
    window.removeEventListener('online', this.handleOnline);
  }

  /** 恢復連線時自動重置錯誤狀態，讓 React 重新嘗試渲染 */
  handleOnline = () => {
    if (this.state.hasError) {
      this.setState({ hasError: false, error: null, isOffline: false });
    }
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, isOffline: false });
  };

  handleReload = () => {
    const reload = () => window.location.reload();

    if (typeof caches !== 'undefined') {
      void caches
        .keys()
        .then((names) => Promise.all(names.map((name) => caches.delete(name))))
        .then(reload)
        .catch(reload);
    } else {
      reload();
    }
  };

  override render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { isOffline, error } = this.state;
    const isChunkError = error ? isChunkLoadError(error) : false;

    // 離線 + chunk 載入失敗：顯示離線專用 UI
    if (isOffline || isChunkError) {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="card p-8 max-w-sm w-full text-center">
            <WifiOff className="text-warning mx-auto mb-4" size={40} />
            <h2 className="text-lg font-bold text-text mb-2">離線模式</h2>
            <p className="text-sm text-text-muted mb-6">
              此頁面需要網路連線才能載入。恢復連線後將自動重試，或點擊下方按鈕手動重試。
            </p>
            <button
              onClick={this.handleRetry}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-lg transition"
            >
              <RefreshCw size={18} />
              重試
            </button>
          </div>
        </div>
      );
    }

    // 在線但載入失敗：清除快取後重載
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="card p-8 max-w-sm w-full text-center">
          <AlertCircle className="text-destructive mx-auto mb-4" size={40} />
          <h2 className="text-lg font-bold text-text mb-2">頁面載入失敗</h2>
          <p className="text-sm text-text-muted mb-6">可能是版本更新中，請重新載入試試。</p>
          <button
            onClick={this.handleReload}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-lg transition"
          >
            <RefreshCw size={18} />
            重新載入
          </button>
        </div>
      </div>
    );
  }
}
