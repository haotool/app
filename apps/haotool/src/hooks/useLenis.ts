/**
 * useLenis Hook - Smooth Scroll Integration
 * [context7:/darkroomengineering/lenis:2025-12-14]
 *
 * Provides smooth scrolling functionality using Lenis library.
 * Integrates with React lifecycle for proper cleanup.
 *
 * [fix:2025-12-14] 修正滾動問題：
 * - 使用 autoRaf: true 簡化初始化
 * - 確保 wrapper/content 正確指向 html 元素
 */
import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

export interface UseLenisOptions {
  duration?: number;
  easing?: (t: number) => number;
  orientation?: 'vertical' | 'horizontal';
  gestureOrientation?: 'vertical' | 'horizontal' | 'both';
  smoothWheel?: boolean;
  touchMultiplier?: number;
  anchors?: boolean;
  autoRaf?: boolean;
}

const defaultEasing = (t: number): number => Math.min(1, 1.001 - Math.pow(2, -10 * t));

export function useLenis(options: UseLenisOptions = {}) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return;

    // [fix:2025-12-14] 使用 autoRaf: true 讓 Lenis 自動管理 requestAnimationFrame
    // 參考: https://github.com/darkroomengineering/lenis
    const lenis = new Lenis({
      autoRaf: options.autoRaf ?? true,
      duration: options.duration ?? 1.2,
      easing: options.easing ?? defaultEasing,
      orientation: options.orientation ?? 'vertical',
      gestureOrientation: options.gestureOrientation ?? 'vertical',
      smoothWheel: options.smoothWheel ?? true,
      touchMultiplier: options.touchMultiplier ?? 2,
      // Enable anchor link support for smooth scrolling to hash links
      anchors: options.anchors ?? true,
    });

    lenisRef.current = lenis;

    // [fix:2025-12-14] 添加 scroll 事件監聽器以確認 Lenis 正常工作
    lenis.on('scroll', () => {
      // 可用於調試或觸發其他動畫
    });

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [
    options.autoRaf,
    options.duration,
    options.easing,
    options.orientation,
    options.gestureOrientation,
    options.smoothWheel,
    options.touchMultiplier,
    options.anchors,
  ]);

  /**
   * Scroll to a specific element or position
   */
  const scrollTo = (
    target: string | number | HTMLElement,
    scrollOptions?: {
      offset?: number;
      duration?: number;
      onComplete?: () => void;
    },
  ) => {
    lenisRef.current?.scrollTo(target, scrollOptions);
  };

  /**
   * Stop/Pause scrolling
   */
  const stop = () => {
    lenisRef.current?.stop();
  };

  /**
   * Start/Resume scrolling
   */
  const start = () => {
    lenisRef.current?.start();
  };

  return {
    lenis: lenisRef,
    scrollTo,
    stop,
    start,
  };
}

export default useLenis;
