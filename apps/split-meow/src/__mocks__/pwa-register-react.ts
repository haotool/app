/**
 * Mock for virtual:pwa-register/react
 *
 * 虛擬模組無法在測試環境解析，此 mock 提供相容實作。
 * Reference: https://vite-pwa-org.netlify.app/frameworks/react.html
 */
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

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

export interface UseRegisterSWReturn {
  needRefresh: [boolean, Dispatch<SetStateAction<boolean>>];
  offlineReady: [boolean, Dispatch<SetStateAction<boolean>>];
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
}

/** Mock useRegisterSW：預設無更新，測試可透過 setter 模擬狀態 */
export function useRegisterSW(_options?: RegisterSWOptions): UseRegisterSWReturn {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  const updateServiceWorker = async (_reloadPage?: boolean): Promise<void> => {
    return Promise.resolve();
  };

  return {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  };
}
