/**
 * 離線或 chunk 載入失敗的錯誤邊界。
 *
 * 兩種使用方式：
 * 1. `<ChunkErrorBoundary>` 包裹 Suspense + lazy 元件，捕捉 chunk 載入錯誤。
 * 2. `<OfflineAwareError>` 作為 React Router errorElement（備用，需 useRouteError）。
 */
import * as React from 'react';
import { useRouteError } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { isChunkLoadError } from '../utils/chunkLoadRecovery';
import { notificationTokens } from '../config/design-tokens';

// ── 共用 fallback UI ─────────────────────────────────────────────────────────

interface FallbackProps {
  error?: unknown;
}

export function OfflineAwareFallback({ error }: FallbackProps) {
  const { t } = useTranslation();
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  const showOfflineUI = offline || isChunkLoadError(error);

  if (showOfflineUI) {
    return (
      <div
        data-ratewise-watchdog-ready="true"
        className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center gap-4"
      >
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-warning/10">
          <WifiOff className="w-8 h-8 text-warning" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-text">
            {t('errors.offlineModeTitle', '離線模式')}
          </h2>
          <p className="text-sm text-text-muted max-w-xs">
            {t(
              'errors.offlineModeDescription',
              '此頁面需要網路連線才能載入。恢復連線後將自動重試，或點擊下方按鈕手動重試。',
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className={`${notificationTokens.actions.primary} gap-2 rounded-lg px-4 py-2 text-sm`}
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          {t('errors.reload', '重新載入')}
        </button>
      </div>
    );
  }

  return (
    <div
      data-ratewise-watchdog-ready="true"
      className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center gap-4"
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
        <AlertTriangle className="w-8 h-8 text-destructive" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-text">
          {t('errors.routeLoadFailedTitle', '頁面載入失敗')}
        </h2>
        <p className="text-sm text-text-muted max-w-xs">
          {t(
            'errors.routeLoadFailedDescription',
            '可能是最近版本更新造成資源不一致，請重新載入試試。',
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className={`${notificationTokens.actions.primary} gap-2 rounded-lg px-4 py-2 text-sm`}
      >
        <RefreshCw className="w-4 h-4" aria-hidden="true" />
        {t('errors.reload', '重新載入')}
      </button>
    </div>
  );
}

// ── Class error boundary（包裹 Suspense + lazy）───────────────────────────────

interface BoundaryState {
  hasError: boolean;
  error: unknown;
}

/**
 * 包裹 Suspense + lazy 元件使用。
 * 捕捉 chunk 載入錯誤並顯示離線友善提示，防止 "Unexpected Application Error!" 崩潰畫面。
 */
export class ChunkErrorBoundary extends React.Component<
  React.PropsWithChildren<unknown>,
  BoundaryState
> {
  override state: BoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return { hasError: true, error };
  }

  override render() {
    if (this.state.hasError) {
      return <OfflineAwareFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

// ── React Router errorElement 版本（備用）───────────────────────────────────

/** 搭配 React Router errorElement 使用（需 data router）。 */
export function OfflineAwareError() {
  const error = useRouteError();
  return <OfflineAwareFallback error={error} />;
}
