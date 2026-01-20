/**
 * Mock for virtual:pwa-register/react
 *
 * Virtual modules cannot be resolved in test environment.
 * This mock provides a test-compatible implementation.
 *
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

/**
 * Mock useRegisterSW hook
 * 返回預設的 false 狀態，模擬無更新可用的情況
 */
export function useRegisterSW(_options?: RegisterSWOptions): UseRegisterSWReturn {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  const updateServiceWorker = async (_reloadPage?: boolean): Promise<void> => {
    // Mock implementation - do nothing in tests
    return Promise.resolve();
  };

  return {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  };
}
