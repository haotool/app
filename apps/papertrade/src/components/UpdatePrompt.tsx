import { useUpdatePrompt } from '../hooks/useUpdatePrompt';

export function UpdatePrompt() {
  if (typeof window === 'undefined') return null;
  return <UpdatePromptClient />;
}

function UpdatePromptClient() {
  const { visible, needRefresh, handleUpdate, handleDismiss } = useUpdatePrompt();

  if (!visible) return null;

  return (
    <div
      role={needRefresh ? 'alert' : 'status'}
      aria-live={needRefresh ? 'assertive' : 'polite'}
      className="toast-in fixed bottom-[calc(4.5rem+var(--sab))] left-1/2 z-30 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 rounded-card border border-border bg-surface/95 px-4 py-3 backdrop-blur"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-label font-semibold">{needRefresh ? '新版本可用' : '離線就緒'}</p>
          <p className="text-caption text-text-2">
            {needRefresh ? '更新後即可使用最新功能。' : '已快取應用外殼，離線也能開啟。'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {needRefresh && (
            <button
              type="button"
              onClick={handleUpdate}
              className="min-h-11 rounded-control bg-primary px-3 text-label font-semibold text-text active:bg-primary-pressed"
            >
              立即更新
            </button>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            className="min-h-11 rounded-control bg-surface-2 px-3 text-label text-text-2 active:bg-border"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}
