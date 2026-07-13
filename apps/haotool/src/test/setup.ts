/**
 * Test Setup — Vitest + Testing Library
 * jsdom 未實作 matchMedia / IntersectionObserver / ResizeObserver，
 * motion（useInView / MotionConfig reducedMotion）與 HeroStage 需以最小 stub 補齊。
 */
import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';
import { vi } from 'vitest';

// 冷 cache 首跑時 lazy route chunk 的 vite-node 轉換可能超過預設 1s，
// 統一提高 async utils timeout 消除 CI 冷啟間歇紅（Testing Library 官方 configure API）。
configure({ asyncUtilTimeout: 5000 });

if (typeof window !== 'undefined') {
  // jsdom 未實作捲動 API；ScrollRestoration 與錨點捲動需 no-op stub 避免 Not implemented 噪音。
  window.scrollTo = vi.fn();
  if (typeof window.HTMLElement.prototype.scrollIntoView !== 'function') {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  }

  if (typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }

  if (typeof window.IntersectionObserver !== 'function') {
    class IntersectionObserverStub implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds: readonly number[] = [];
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = (): IntersectionObserverEntry[] => [];
    }
    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      value: IntersectionObserverStub,
    });
    Object.defineProperty(globalThis, 'IntersectionObserver', {
      writable: true,
      value: IntersectionObserverStub,
    });
  }

  if (typeof window.ResizeObserver !== 'function') {
    class ResizeObserverStub implements ResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    Object.defineProperty(window, 'ResizeObserver', {
      writable: true,
      value: ResizeObserverStub,
    });
    Object.defineProperty(globalThis, 'ResizeObserver', {
      writable: true,
      value: ResizeObserverStub,
    });
  }
}
