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
      className="fixed bottom-24 left-1/2 z-[60] w-[min(560px,calc(100vw-24px))] -translate-x-1/2 rounded-3xl border border-outline-variant/30 bg-surface-bright/95 px-4 py-3 shadow-ambient backdrop-blur-xl"
      role={needRefresh ? 'alert' : 'status'}
      aria-live={needRefresh ? 'assertive' : 'polite'}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-on-surface">
            {needRefresh ? '有新版本可更新' : '已可離線使用'}
          </div>
          <div className="text-xs text-on-surface-variant">
            {needRefresh ? '建議更新以套用最新修復。' : '網路中斷時仍可使用已快取內容。'}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {needRefresh ? (
            <button
              type="button"
              className="rounded-full bg-primary px-3 py-2 text-xs font-semibold text-on-primary shadow-ambient"
              onClick={handleUpdate}
            >
              立即更新
            </button>
          ) : null}

          <button
            type="button"
            className="rounded-full bg-surface-container px-3 py-2 text-xs font-semibold text-on-surface"
            onClick={handleDismiss}
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}
