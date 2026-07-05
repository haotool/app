/**
 * 桌面指標微互動 hooks（motion-deep-dive §2 S5-b/S5-c）。
 * 共用三重媒體閘（≥1024 ∧ pointer: fine ∧ 非 reduced-motion，同 HeroStage 模式）
 * 與 rAF 節流 pointer 追蹤；行動/平板完全不掛監聽。
 */
import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

function desktopPointerEnhancementsEnabled(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return (
    window.matchMedia('(min-width: 1024px)').matches &&
    window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

// rAF 節流：pointermove 正規化為相對元素中心的偏移（-1..1），pointerleave 歸零。
function attachNormalizedPointer(
  element: HTMLElement,
  write: (x: number, y: number) => void,
): () => void {
  let frame = 0;
  let nextX = 0;
  let nextY = 0;

  const flush = () => {
    frame = 0;
    write(nextX, nextY);
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(flush);
  };
  const handleMove = (event: PointerEvent) => {
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    nextX = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
    nextY = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
    schedule();
  };
  const handleLeave = () => {
    nextX = 0;
    nextY = 0;
    schedule();
  };

  element.addEventListener('pointermove', handleMove as EventListener, { passive: true });
  element.addEventListener('pointerleave', handleLeave, { passive: true });
  return () => {
    element.removeEventListener('pointermove', handleMove as EventListener);
    element.removeEventListener('pointerleave', handleLeave);
    if (frame) cancelAnimationFrame(frame);
  };
}

/**
 * S5-b magnetic hover：寫 --mx/--my 至內層 .magnet-item，
 * 位移 = 偏移 × --magnet-max（4px）；歸位過渡 320ms spring-tap 由 CSS 承載。
 */
export function useMagnetic<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !desktopPointerEnhancementsEnabled()) return undefined;
    const item = element.querySelector<HTMLElement>('.magnet-item');
    if (!item) return undefined;
    return attachNormalizedPointer(element, (x, y) => {
      item.style.setProperty('--mx', String(x));
      item.style.setProperty('--my', String(y));
    });
  }, []);

  return ref;
}

/**
 * S5-c pointer tilt：寫 --rx/--ry 至 .tilt-inner，
 * 傾角 = 偏移 × --tilt-max（4deg）；--rx 由 Y 軸反向推導。
 */
export function useTilt<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !desktopPointerEnhancementsEnabled()) return undefined;
    const inner = element.querySelector<HTMLElement>('.tilt-inner');
    if (!inner) return undefined;
    return attachNormalizedPointer(element, (x, y) => {
      inner.style.setProperty('--rx', String(-y));
      inner.style.setProperty('--ry', String(x));
    });
  }, []);

  return ref;
}
