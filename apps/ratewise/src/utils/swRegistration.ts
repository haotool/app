/**
 * Service Worker 註冊單例（修復 #593 register() 重試風暴）。
 *
 * 根因：useRegisterSW 在 useState initializer 內執行 registerSW()；
 * UpdatePrompt 位於尚未 commit 的 Suspense 子樹時，每次 render attempt
 * 都會重跑 initializer。註冊被阻擋的環境（私密瀏覽、iOS Lockdown、WebView）
 * 中 onRegisterError 的 setState 立即觸發重新 render，形成無上限熱迴圈
 * （QA 實測 2 秒內最高 13,379 次 register()）。
 *
 * 治理：模組層單例——同一頁面生命週期最多 MAX_SW_REGISTER_ATTEMPTS 次註冊
 * （指數退避），全數失敗後寫入 session 旗標；同 session 重載改為靜默降級，
 * 不再嘗試註冊也不再打擾使用者。註冊成功時清除旗標。
 */

import { registerSW } from 'virtual:pwa-register';
import { logger } from './logger';

// index.html 的 injectRegister inline 腳本另有 1 次註冊；
// 單例鏈上限 2 次讓每次載入總計 ≤3 次，對齊 QA 驗收（#593）。
export const MAX_SW_REGISTER_ATTEMPTS = 2;
export const SW_REGISTER_BACKOFF_BASE_MS = 1_000;
export const SW_REGISTER_FAILED_SESSION_KEY = 'rw-sw-register-failed';

export type SwRegistrationStatus = 'idle' | 'registering' | 'registered' | 'failed';

export interface SwRegistrationSnapshot {
  status: SwRegistrationStatus;
  registration: ServiceWorkerRegistration | undefined;
  needRefresh: boolean;
  offlineReady: boolean;
}

const SERVER_SNAPSHOT: SwRegistrationSnapshot = {
  status: 'idle',
  registration: undefined,
  needRefresh: false,
  offlineReady: false,
};

let snapshot: SwRegistrationSnapshot = SERVER_SNAPSHOT;
let started = false;
let attemptCount = 0;
let updater: ((reloadPage?: boolean) => Promise<void>) | null = null;
const listeners = new Set<() => void>();

function emit(partial: Partial<SwRegistrationSnapshot>): void {
  snapshot = { ...snapshot, ...partial };
  listeners.forEach((listener) => listener());
}

function hasRegistrationFailedThisSession(): boolean {
  try {
    return sessionStorage.getItem(SW_REGISTER_FAILED_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function markRegistrationFailedThisSession(): void {
  try {
    sessionStorage.setItem(SW_REGISTER_FAILED_SESSION_KEY, '1');
  } catch {
    // sessionStorage 不可用時略過；模組層 started 旗標仍防止同頁重試。
  }
}

function clearRegistrationFailedThisSession(): void {
  try {
    sessionStorage.removeItem(SW_REGISTER_FAILED_SESSION_KEY);
  } catch {
    // 略過。
  }
}

function attemptRegistration(): void {
  attemptCount += 1;
  updater = registerSW({
    immediate: true,
    onRegisteredSW(_swScriptUrl, registration) {
      // 註冊成功：清除失敗旗標，讓環境恢復後的 session 重新啟用 PWA。
      clearRegistrationFailedThisSession();
      emit({ status: 'registered', registration });
    },
    onNeedRefresh() {
      emit({ needRefresh: true });
    },
    onOfflineReady() {
      emit({ offlineReady: true });
    },
    onRegisterError(error) {
      const errorObject = error instanceof Error ? error : new Error(String(error));
      if (attemptCount < MAX_SW_REGISTER_ATTEMPTS) {
        const delayMs = SW_REGISTER_BACKOFF_BASE_MS * 2 ** (attemptCount - 1);
        logger.warn('Service Worker registration failed, retrying with backoff', {
          attempt: attemptCount,
          maxAttempts: MAX_SW_REGISTER_ATTEMPTS,
          retryInMs: delayMs,
        });
        setTimeout(attemptRegistration, delayMs);
        return;
      }
      // 重試耗盡：記錄 session 旗標，本 session 後續載入靜默降級。
      markRegistrationFailedThisSession();
      logger.error('Service Worker registration error', errorObject);
      emit({ status: 'failed' });
    },
  });
}

/**
 * 冪等啟動註冊：無論元件 mount／render 幾次，只會啟動一條註冊嘗試鏈。
 * 必須從 useEffect 呼叫，避免在被捨棄的 render attempt 產生副作用。
 */
export function ensureSwRegistration(): void {
  if (started || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  started = true;

  // 同 session 已確認註冊不可用：靜默降級（不重試、不顯示提示）。
  if (hasRegistrationFailedThisSession()) {
    logger.warn('Service Worker registration previously failed this session — skipping');
    return;
  }

  emit({ status: 'registering' });
  attemptRegistration();
}

/** prompt 流程：對 waiting SW 送出 SKIP_WAITING（委派給 registerSW 回傳的 updater）。 */
export async function updateServiceWorker(reloadPage?: boolean): Promise<void> {
  if (updater) {
    await updater(reloadPage);
  }
}

export function subscribeSwRegistration(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSwRegistrationSnapshot(): SwRegistrationSnapshot {
  return snapshot;
}

export function getSwRegistrationServerSnapshot(): SwRegistrationSnapshot {
  return SERVER_SNAPSHOT;
}

export function dismissSwNeedRefresh(): void {
  emit({ needRefresh: false });
}

export function dismissSwOfflineReady(): void {
  emit({ offlineReady: false });
}
