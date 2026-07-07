import { useEffect, useLayoutEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import RateWise from '../RateWise';
import { useConverterStore } from '../../../stores/converterStore';
import {
  isDeepLinkEntry,
  markRestoreAttempted,
  shouldRestoreToMulti,
  isPersistedMultiPendingStoreSync,
  readPersistedLastConverterView,
} from './coldStartRestore';

// SSR 環境呼叫 useLayoutEffect 會產生 React 警告；依 window 存在與否切換，
// client 端維持 paint 前執行（消除單幣→多幣的可見跳轉 frame），SSR 端退回 useEffect。
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * 首頁路由包裝：冷啟動時依 persist 中的 lastConverterView 還原到上次停留的換算模式。
 * - 初始 hydrated=false，與 SSG 預渲染的單幣別內容一致，避免 hydration mismatch。
 * - hydrate 完成後才於 layout effect（paint 前）評估還原，並只導向一次
 *   （旗標寫入在 effect，相容並行渲染）。
 */
export function RememberedHomeRoute() {
  const isTestEnv = import.meta.env.MODE === 'test';
  const [searchParams] = useSearchParams();
  const lastConverterView = useConverterStore((state) => state.lastConverterView);
  const [hydrated, setHydrated] = useState(isTestEnv);

  useIsomorphicLayoutEffect(() => {
    let active = true;
    const markHydrated = () => {
      if (active) {
        setHydrated(true);
      }
    };

    const isStoreSyncedWithPersist = (): boolean => {
      const persisted = readPersistedLastConverterView();
      if (persisted === null) return true;
      return useConverterStore.getState().lastConverterView === persisted;
    };

    if (useConverterStore.persist.hasHydrated()) {
      markHydrated();
      return () => {
        active = false;
      };
    }

    // persist 尚未回報 hydrate，但 localStorage（同步讀取）與 store 已一致：
    // 同步 markHydrated，讓 Navigate 在首個 client paint 前送出，消除單幣中間畫面。
    if (isStoreSyncedWithPersist()) {
      markHydrated();
      return () => {
        active = false;
      };
    }

    const unsubFinish = useConverterStore.persist.onFinishHydration(markHydrated);

    // SSG/CSR：store 可能已 merge persist，但 onFinishHydration 未觸發（microtask 後備）。
    queueMicrotask(() => {
      if (isStoreSyncedWithPersist()) {
        markHydrated();
      }
    });

    const unsubStore = useConverterStore.subscribe((state, prevState) => {
      if (state.lastConverterView !== prevState.lastConverterView && isStoreSyncedWithPersist()) {
        markHydrated();
      }
    });

    return () => {
      active = false;
      unsubFinish();
      unsubStore();
    };
  }, []);

  // 任何帶 query 的進站（?converter=／?cardRate=／?from= 等）皆為 URL override 深連結，
  // 一律豁免 remembered redirect；通用豁免取代白名單，避免新增參數時漂移（#654）。
  const hasDeepLink = isDeepLinkEntry(searchParams);
  const restoreToMulti = shouldRestoreToMulti({ hydrated, hasDeepLink, lastConverterView });
  // hydrate 未完成或即將導向 multi 時，禁止 RateWise 寫入偏好，避免覆寫 persist 的 lastConverterView。
  const allowRememberView = hydrated && !restoreToMulti;

  // hydrate 完成後標記已嘗試還原；須等 store 與 persist 同步後再標記，避免錯失 multi 還原。
  useEffect(() => {
    if (!hydrated) return undefined;

    if (shouldRestoreToMulti({ hydrated, hasDeepLink, lastConverterView })) {
      markRestoreAttempted();
      return undefined;
    }

    if (isPersistedMultiPendingStoreSync(lastConverterView)) {
      return undefined;
    }

    markRestoreAttempted();
    return undefined;
  }, [hydrated, hasDeepLink, lastConverterView]);

  if (restoreToMulti) {
    return <Navigate to="/multi" replace />;
  }

  return <RateWise rememberConverterView={allowRememberView} />;
}
