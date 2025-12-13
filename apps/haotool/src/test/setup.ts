/**
 * Test Setup
 * Configures vitest for React testing
 */
import '@testing-library/jest-dom/vitest';

// Mock IntersectionObserver
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: readonly number[] = [];

  constructor(callback: IntersectionObserverCallback) {
    // Immediately call callback with empty entries
    setTimeout(() => {
      callback([], this);
    }, 0);
  }

  disconnect(): void {
    // Mock implementation
  }
  observe(): void {
    // Mock implementation
  }
  unobserve(): void {
    // Mock implementation
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: (): void => {
      // Mock implementation
    },
    removeListener: (): void => {
      // Mock implementation
    },
    addEventListener: (): void => {
      // Mock implementation
    },
    removeEventListener: (): void => {
      // Mock implementation
    },
    dispatchEvent: () => false,
  }),
});

// Mock scroll behavior
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: (): void => {
    // Mock implementation
  },
});
