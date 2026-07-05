/**
 * Test Setup — Vitest + Testing Library
 * jsdom 未實作 matchMedia / IntersectionObserver / ResizeObserver，
 * motion（useInView / MotionConfig reducedMotion）與 HeroStage 需以最小 stub 補齊。
 */
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

if (typeof window !== 'undefined') {
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
