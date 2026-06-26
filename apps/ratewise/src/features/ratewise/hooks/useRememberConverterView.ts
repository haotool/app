import { useEffect } from 'react';
import type { ConverterMode } from '../types';
import { useConverterStore } from '../../../stores/converterStore';

/**
 * 掛載時記錄使用者目前停留的換算模式（single / multi）。
 * 延後至 microtask，避免冷啟動還原前覆寫 persist 中的 lastConverterView。
 */
export function useRememberConverterView(view: ConverterMode): void {
  const setLastConverterView = useConverterStore((state) => state.setLastConverterView);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setLastConverterView(view);
      }
    });
    return () => {
      active = false;
    };
  }, [view, setLastConverterView]);
}
