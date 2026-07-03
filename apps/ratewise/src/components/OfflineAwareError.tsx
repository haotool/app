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
import { isChunkLoadError, recoverFromChunkLoadError } from '../utils/chunkLoadRecovery';
import { recordPwaDiagnostic } from '../utils/pwaDiagnostics';

// ── 共用 fallback UI ─────────────────────────────────────────────────────────

interface FallbackProps {
  error?: unknown;
}

export function OfflineAwareFallback({ error }: FallbackProps) {
  const { t } = useTranslation();
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  const showOfflineUI = offline || isChunkLoadError(error);
  // chunk 錯誤且在線時先進入自動恢復狀態；cooldown 擋下才退回手動 UI。
  const [recovering, setRecovering] = React.useState(() => isChunkLoadError(error) && !offline);

  // 掛載時記錄路由層錯誤診斷，供觀察性追蹤。
  React.useEffect(() => {
    recordPwaDiagnostic(
      'route-error-boundary',
      { message: String((error as Error)?.message ?? error) },
      'warn',
    );
  }, [error]);

  // chunk 錯誤且在線時自動觸發一次溫和恢復；被 cooldown 擋下則退回手動重試 UI。
  // ref 守門防止 StrictMode 雙執行：第二次呼叫會被 cooldown 擋下而誤退手動 UI。
  const recoveryAttemptedRef = React.useRef(false);
  React.useEffect(() => {
    if (!isChunkLoadError(error)) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    if (recoveryAttemptedRef.current) return;
    recoveryAttemptedRef.current = true;
    void recoverFromChunkLoadError().then((triggered) => {
      if (!triggered) setRecovering(false);
    });
  }, [error]);

  // 恢復連線後自動重試，兌現離線文案的自動重試承諾。
  React.useEffect(() => {
    const handleOnline = () => {
      window.location.reload();
    };
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (recovering) {
    return (
      <div
        data-ratewise-watchdog-ready="true"
        className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center gap-4"
      >
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30">
          <RefreshCw
            className="w-8 h-8 text-amber-600 dark:text-amber-400 animate-spin"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t('errors.recoveringTitle', '正在更新至最新版本…')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            {t('errors.recoveringDescription', '偵測到新版本資源，正在自動重新載入。')}
          </p>
        </div>
      </div>
    );
  }

  if (showOfflineUI) {
    return (
      <div
        data-ratewise-watchdog-ready="true"
        className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center gap-4"
      >
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30">
          <WifiOff className="w-8 h-8 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t('errors.offlineModeTitle', '離線模式')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            {t(
              'errors.offlineModeDescription',
              '此頁面需要網路連線才能載入。恢復連線後將自動重試，或點擊下方按鈕手動重試。',
            )}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-icon-from text-brand-text hover:bg-brand-icon-from/90 active:scale-95 transition-all duration-150"
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
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30">
        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {t('errors.routeLoadFailedTitle', '頁面載入失敗')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          {t(
            'errors.routeLoadFailedDescription',
            '可能是最近版本更新造成資源不一致，請重新載入試試。',
          )}
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-icon-from text-brand-text hover:bg-brand-icon-from/90 active:scale-95 transition-all duration-150"
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
