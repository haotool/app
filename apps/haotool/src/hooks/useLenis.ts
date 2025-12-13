/**
 * useLenis Hook - Smooth Scroll Integration
 * [context7:/darkroomengineering/lenis:2025-12-14]
 *
 * Provides smooth scrolling functionality using Lenis library.
 * Integrates with React lifecycle for proper cleanup.
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
}

const defaultEasing = (t: number): number => Math.min(1, 1.001 - Math.pow(2, -10 * t));

export function useLenis(options: UseLenisOptions = {}) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return;

    const lenis = new Lenis({
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

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
      cancelAnimationFrame(rafId);
    };
  }, [
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
