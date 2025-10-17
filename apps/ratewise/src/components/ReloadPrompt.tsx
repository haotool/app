import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import './ReloadPrompt.css';

/**
 * PWA Update Prompt Component
 *
 * Simpler, more reliable approach using direct registerSW
 * Follows Linus principle: simplicity over complexity
 *
 * Based on vite-plugin-pwa best practices
 * https://vite-pwa-org.netlify.app/guide/prompt-for-update.html
 */
export function ReloadPrompt() {
  const [offlineReady, setOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateSW, setUpdateSW] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    const sw = registerSW({
      onNeedRefresh() {
        console.log('[PWA] New content available');
        setNeedRefresh(true);
      },
      onOfflineReady() {
        console.log('[PWA] App ready to work offline');
        setOfflineReady(true);
      },
      onRegistered(registration) {
        console.log('[PWA] Service Worker registered:', registration);

        // Periodic update check (every hour)
        if (registration) {
          setInterval(
            () => {
              void (async () => {
                // Skip if installing or offline
                if (registration.installing || !navigator.onLine) return;

                try {
                  await registration.update();
                  console.log('[PWA] Checked for updates');
                } catch (error) {
                  console.error('[PWA] Update check failed:', error);
                }
              })();
            },
            60 * 60 * 1000,
          ); // 1 hour
        }
      },
      onRegisterError(error) {
        console.error('[PWA] Service Worker registration error:', error);
      },
    });

    setUpdateSW(() => sw);
  }, []);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  const reload = () => {
    if (updateSW) {
      void updateSW(true);
    }
  };

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div className="reload-prompt-container">
      <div className="reload-prompt-toast" role="alert" aria-live="polite">
        <div className="reload-prompt-message">
          {offlineReady ? (
            <span>✅ 應用已可離線使用</span>
          ) : (
            <span>🎉 發現新版本，點擊更新按鈕以獲取最新功能</span>
          )}
        </div>
        <div className="reload-prompt-actions">
          {needRefresh && (
            <button
              className="reload-prompt-button reload-prompt-button-primary"
              onClick={reload}
              aria-label="更新到最新版本"
            >
              更新
            </button>
          )}
          <button
            className="reload-prompt-button reload-prompt-button-secondary"
            onClick={close}
            aria-label="關閉提示"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}
