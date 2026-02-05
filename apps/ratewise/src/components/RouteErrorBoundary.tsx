/**
 * 路由級 Error Boundary
 *
 * 與全域 ErrorBoundary 的差異：
 * - 全域 ErrorBoundary：替換整個畫面（包括底部導覽），用於致命錯誤
 * - RouteErrorBoundary：僅替換路由內容區域，保留底部導覽可供切換
 *
 * 解決問題：
 * - 舊 PWA 用戶切換頁面時 chunk 載入失敗，整個 App 被全域 ErrorBoundary 取代
 * - 用戶無法透過底部導覽切換到其他頁面或重試
 * - 英文錯誤訊息（瀏覽器原生）取代了中文 UI
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('Route component error', error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleReload = () => {
    // 清除 SW 快取後重載，確保取得最新 chunk
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
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="card p-8 max-w-sm w-full text-center">
            <AlertCircle className="text-destructive mx-auto mb-4" size={40} />
            <h2 className="text-lg font-bold text-text mb-2">頁面載入失敗</h2>
            <p className="text-sm text-text-muted mb-6">
              可能是網路問題或版本更新中，請重新載入試試。
            </p>
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

    return this.props.children;
  }
}
