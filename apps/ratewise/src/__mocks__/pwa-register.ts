/**
 * Mock for virtual:pwa-register
 *
 * 以 navigator.serviceWorker.register 模擬真實註冊流程，
 * 讓測試可透過 spy/stub 控制註冊成敗並斷言呼叫次數（#593）。
 *
 * Reference: https://vite-pwa-org.netlify.app/guide/register-service-worker.html
 */

export interface RegisterSWOptions {
  immediate?: boolean;
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
  onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
  onRegisteredSW?: (
    swScriptUrl: string,
    registration: ServiceWorkerRegistration | undefined,
  ) => void;
  onRegisterError?: (error: unknown) => void;
}

export function registerSW(
  options: RegisterSWOptions = {},
): (reloadPage?: boolean) => Promise<void> {
  const { onRegistered, onRegisteredSW, onRegisterError } = options;

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    void navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        if (onRegisteredSW) {
          onRegisteredSW('/sw.js', registration);
        } else {
          onRegistered?.(registration);
        }
      })
      .catch((error: unknown) => {
        onRegisterError?.(error);
      });
  }

  return async (_reloadPage?: boolean): Promise<void> => {
    // 測試環境不執行實際更新。
  };
}
