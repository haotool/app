/**
 * useUpdatePrompt — PWA 版本更新偵測 hook
 *
 * 策略（prompt 模式）：
 * 1. SW 進入 waiting 狀態時 needRefresh = true
 * 2. 若裝置在線 → 自動靜默更新（updateServiceWorker(true) → 重載）
 * 3. 若離線或更新失敗 → 暴露狀態供 UpdatePrompt 顯示手動重試
 * 4. visibilitychange → 回前景時主動 r.update() 確保即時偵測
 * 5. 每 60 秒輪詢一次 SW 更新
 */
import { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const UPDATE_CHECK_INTERVAL_MS = 60_000;

export interface UpdatePromptState {
  offlineReady: boolean;
  setOfflineReady: (v: boolean) => void;
  needRefresh: boolean;
  setNeedRefresh: (v: boolean) => void;
  isUpdating: boolean;
  updateFailed: boolean;
  handleUpdate: () => Promise<void>;
  handleDismiss: () => void;
}

export function useUpdatePrompt(): UpdatePromptState {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const autoTriggeredRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateFailed, setUpdateFailed] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      if (!r) return;
      registrationRef.current = r;
      void r.update();
      intervalRef.current = setInterval(() => {
        void r.update();
      }, UPDATE_CHECK_INTERVAL_MS);
    },
  });

  // 回前景時主動偵測更新。
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && registrationRef.current) {
        void registrationRef.current.update();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // 清理輪詢計時器。
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, []);

  // 在線時自動靜默更新；離線時保留 needRefresh 讓 UpdatePrompt 顯示提示。
  useEffect(() => {
    if (!needRefresh || autoTriggeredRef.current || isUpdating) return;
    if (typeof navigator === 'undefined' || !navigator.onLine) return;

    autoTriggeredRef.current = true;
    setIsUpdating(true);
    setUpdateFailed(false);

    void updateServiceWorker(true)
      .catch(() => {
        autoTriggeredRef.current = false;
        setUpdateFailed(true);
      })
      .finally(() => {
        setIsUpdating(false);
      });
  }, [needRefresh, isUpdating, updateServiceWorker]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setUpdateFailed(false);
    autoTriggeredRef.current = true;
    try {
      await updateServiceWorker(true);
    } catch {
      autoTriggeredRef.current = false;
      setUpdateFailed(true);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setUpdateFailed(false);
    autoTriggeredRef.current = false;
  };

  return {
    offlineReady,
    setOfflineReady,
    needRefresh,
    setNeedRefresh,
    isUpdating,
    updateFailed,
    handleUpdate,
    handleDismiss,
  };
}
