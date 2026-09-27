import { useEffect, useState } from 'react';
import type { Engine } from '../render/Engine';

/** 以約 8 Hz 觸發重繪（UI 讀取 SimState 快照），避免每幀 React 重算 */
export function useTick(engine: Engine | null, hz = 8): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!engine) return undefined;
    const id = window.setInterval(() => setN((v) => v + 1), 1000 / hz);
    return () => window.clearInterval(id);
  }, [engine, hz]);
  return n;
}

export function useIsMobile(): { mobile: boolean; portrait: boolean } {
  const get = (): { mobile: boolean; portrait: boolean } => ({
    mobile:
      window.matchMedia('(pointer: coarse)').matches ||
      Math.min(window.innerWidth, window.innerHeight) < 560,
    portrait: window.innerHeight > window.innerWidth,
  });
  const [v, setV] = useState(get);
  useEffect(() => {
    const on = (): void => setV(get());
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
    };
  }, []);
  return v;
}
