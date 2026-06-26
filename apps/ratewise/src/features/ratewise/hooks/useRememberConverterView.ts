import { useEffect } from 'react';
import type { ConverterMode } from '../types';
import { useConverterStore } from '../../../stores/converterStore';

interface UseRememberConverterViewOptions {
  /** 是否寫入偏好；deep-link 等臨時進入不應覆寫 lastConverterView，預設 true。 */
  enabled?: boolean;
}

/**
 * 掛載時記錄使用者目前停留的換算模式（single / multi）。
 * 延後至 microtask，避免冷啟動還原前覆寫 persist 中的 lastConverterView。
 * 透過 enabled=false 可在 deep-link 等臨時進入情境下略過寫入，保護既有偏好。
 */
export function useRememberConverterView(
  view: ConverterMode,
  options: UseRememberConverterViewOptions = {},
): void {
  const { enabled = true } = options;
  const setLastConverterView = useConverterStore((state) => state.setLastConverterView);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setLastConverterView(view);
      }
    });
    return () => {
      active = false;
    };
  }, [view, enabled, setLastConverterView]);
}
