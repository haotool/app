import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import RateWise from '../RateWise';
import { useConverterStore } from '../../../stores/converterStore';
import { markRestoreAttempted, shouldRestoreToMulti } from './coldStartRestore';

/**
 * 首頁路由包裝：冷啟動時依 persist 中的 lastConverterView 還原到上次停留的換算模式。
 * - 初始 hydrated=false，與 SSG 預渲染的單幣別內容一致，避免 hydration mismatch。
 * - hydrate 完成後才於 effect 評估還原，並只導向一次（旗標寫入在 effect，相容並行渲染）。
 */
export function RememberedHomeRoute() {
  const isTestEnv = import.meta.env.MODE === 'test';
  const [searchParams] = useSearchParams();
  const lastConverterView = useConverterStore((state) => state.lastConverterView);
  const [hydrated, setHydrated] = useState(isTestEnv);

  useEffect(() => {
    if (useConverterStore.persist.hasHydrated()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- persist hydration marker
      setHydrated(true);
      return undefined;
    }
    return useConverterStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
  }, []);

  const hasDeepLink =
    searchParams.has('from') || searchParams.has('to') || searchParams.has('amount');
  const restoreToMulti = shouldRestoreToMulti({ hydrated, hasDeepLink, lastConverterView });
  // hydrate 未完成或即將導向 multi 時，禁止 RateWise 寫入偏好，避免覆寫 persist 的 lastConverterView。
  const allowRememberView = hydrated && !restoreToMulti;

  // hydrate 完成後標記已嘗試還原，確保冷啟動只導向一次。
  useEffect(() => {
    if (hydrated) {
      markRestoreAttempted();
    }
  }, [hydrated]);

  if (restoreToMulti) {
    return <Navigate to="/multi" replace />;
  }

  return <RateWise rememberConverterView={allowRememberView} />;
}
