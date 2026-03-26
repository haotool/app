import { useTranslation } from 'react-i18next';
import { useUpdatePrompt } from '../hooks/useUpdatePrompt';

export function UpdatePrompt() {
  if (typeof window === 'undefined') return null;
  return <UpdatePromptClient />;
}

function UpdatePromptClient() {
  const { t } = useTranslation();
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
            {needRefresh ? t('update.new_version') : t('update.offline_ready')}
          </div>
          <div className="text-xs text-on-surface-variant">
            {needRefresh ? t('update.new_version_desc') : t('update.offline_ready_desc')}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {needRefresh ? (
            <button
              type="button"
              className="rounded-full bg-primary px-3 py-2 text-xs font-semibold text-on-primary shadow-ambient"
              onClick={handleUpdate}
            >
              {t('update.update_button')}
            </button>
          ) : null}

          <button
            type="button"
            className="rounded-full bg-surface-container px-3 py-2 text-xs font-semibold text-on-surface"
            onClick={handleDismiss}
          >
            {t('update.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
