import { useEffect, useMemo, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export interface UpdatePromptState {
  visible: boolean;
  needRefresh: boolean;
  offlineReady: boolean;
  handleUpdate: () => void;
  handleDismiss: () => void;
}

const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

export function useUpdatePrompt(): UpdatePromptState {
  const [dismissed, setDismissed] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_, registration) {
      registrationRef.current = registration ?? null;
    },
    onRegisterError() {
      // 失敗時不打擾使用者；仍可正常使用網頁版。
      setOfflineReady(false);
      setNeedRefresh(false);
    },
  });

  // iOS PWA 安裝後會長期開啟而不重新載入頁面，定期呼叫 registration.update()
  // 才能偵測到新版 SW，否則使用者可能數天都收不到更新提示。
  useEffect(() => {
    const interval = setInterval(() => {
      void registrationRef.current?.update();
    }, UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const visible = useMemo(() => {
    if (needRefresh) return true;
    if (dismissed) return false;
    return offlineReady;
  }, [dismissed, offlineReady, needRefresh]);

  const handleUpdate = () => {
    void updateServiceWorker(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return { visible, needRefresh, offlineReady, handleUpdate, handleDismiss };
}
