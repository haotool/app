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
    // 浮層 scale：nav z-50 < sheet z-[60] < dialog z-[70] < 更新橫幅 z-[80]。
    // 更新橫幅必須永不被蓋（編輯 sheet、確認 dialog 開啟時也要能看到新版提示）。
    // bottom 疊加 --home-panel-h（與 CatCompanion 同 SSOT）：Home 固定面板開啟時橫幅上移，不遮鍵盤末列。
    <div
      className="fixed left-1/2 z-[80] w-[min(560px,calc(100vw-24px))] -translate-x-1/2 rounded-3xl border border-outline-variant/30 bg-surface-bright/95 px-4 py-3 shadow-ambient backdrop-blur-xl"
      style={{
        bottom: 'calc(var(--overlay-bottom) + var(--undo-toast-h, 0px) + var(--home-panel-h, 0px))',
      }}
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
              className="min-h-11 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-on-primary shadow-ambient"
              onClick={handleUpdate}
            >
              {t('update.update_button')}
            </button>
          ) : null}

          <button
            type="button"
            className="min-h-11 rounded-full bg-surface-container px-3 py-2 text-xs font-semibold text-on-surface"
            onClick={handleDismiss}
          >
            {t('update.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
