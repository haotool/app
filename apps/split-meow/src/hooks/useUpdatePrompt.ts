import { useMemo, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export interface UpdatePromptState {
  visible: boolean;
  needRefresh: boolean;
  offlineReady: boolean;
  handleUpdate: () => void;
  handleDismiss: () => void;
}

export function useUpdatePrompt(): UpdatePromptState {
  const [dismissed, setDismissed] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError() {
      // 失敗時不打擾使用者；仍可正常使用網頁版。
      setOfflineReady(false);
      setNeedRefresh(false);
    },
  });

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
