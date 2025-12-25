/**
 * Test Setup
 * Configures vitest for React testing
 */
import '@testing-library/jest-dom/vitest';
import { vi, expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// [fix:2025-12-25] 顯式擴展 expect 以確保 jest-dom matchers 可用
expect.extend(matchers);
import { type PropsWithChildren } from 'react';
import * as React from 'react';

// Mock motion value type
interface MockMotionValue {
  get: () => number;
  set: () => void;
  on: () => () => void;
  onChange?: () => () => void;
  destroy?: () => void;
}

// Create mock motion value factory
function createMockMotionValue(value = 0): MockMotionValue {
  return {
    get: () => value,
    set: () => void 0,
    on: () => () => void 0,
    onChange: () => () => void 0,
    destroy: () => void 0,
  };
}

// Filter out framer-motion specific props
function filterMotionProps(props: Record<string, unknown>): Record<string, unknown> {
  const {
    initial: _initial,
    animate: _animate,
    exit: _exit,
    transition: _transition,
    whileHover: _whileHover,
    whileInView: _whileInView,
    whileTap: _whileTap,
    variants: _variants,
    viewport: _viewport,
    layoutId: _layoutId,
    style,
    ...rest
  } = props;
  return { ...rest, style: style as React.CSSProperties | undefined };
}

// Create motion component factory
function createMotionComponent(Tag: keyof React.JSX.IntrinsicElements) {
  const Component = ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => {
    const filteredProps = filterMotionProps(props);
    return React.createElement(Tag, filteredProps, children);
  };
  Component.displayName = `motion.${String(Tag)}`;
  return Component;
}

// Mock framer-motion with inline implementation
vi.mock('framer-motion', () => ({
  motion: {
    div: createMotionComponent('div'),
    span: createMotionComponent('span'),
    h1: createMotionComponent('h1'),
    h2: createMotionComponent('h2'),
    h3: createMotionComponent('h3'),
    p: createMotionComponent('p'),
    a: createMotionComponent('a'),
    button: createMotionComponent('button'),
    section: createMotionComponent('section'),
    header: createMotionComponent('header'),
    footer: createMotionComponent('footer'),
    nav: createMotionComponent('nav'),
    ul: createMotionComponent('ul'),
    li: createMotionComponent('li'),
    img: createMotionComponent('img'),
    article: createMotionComponent('article'),
    aside: createMotionComponent('aside'),
    main: createMotionComponent('main'),
  },
  AnimatePresence: ({ children }: PropsWithChildren) => children,
  MotionConfig: ({ children }: PropsWithChildren) => children,
  useInView: () => true,
  useSpring: (value: number) => createMockMotionValue(value),
  useTransform: () => createMockMotionValue(0),
  useMotionValue: (value: number) => createMockMotionValue(value),
  useAnimation: () => ({
    start: () => Promise.resolve(),
    stop: () => void 0,
    set: () => void 0,
  }),
  useScroll: () => ({
    scrollY: createMockMotionValue(0),
    scrollX: createMockMotionValue(0),
    scrollYProgress: createMockMotionValue(0),
    scrollXProgress: createMockMotionValue(0),
  }),
  useMotionTemplate: (strings: TemplateStringsArray, ...values: unknown[]) => {
    // Simple template literal implementation - just return empty string for tests
    void values;
    return strings.join('');
  },
}));

// Mock @react-three/fiber
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: PropsWithChildren) =>
    React.createElement('div', { 'data-testid': 'three-canvas' }, children),
  useFrame: () => void 0,
  useThree: () => ({
    mouse: { x: 0, y: 0 },
    viewport: { width: 1, height: 1 },
    gl: {},
    camera: {},
    scene: {},
    size: { width: 800, height: 600 },
  }),
}));

// Mock @react-three/drei
vi.mock('@react-three/drei', () => ({
  Float: ({ children }: PropsWithChildren) => children,
  Environment: () => null,
  MeshTransmissionMaterial: () => null,
  ContactShadows: () => null,
  PerformanceMonitor: ({ children }: PropsWithChildren) => children,
  Lightformer: () => null,
}));

// Mock @react-three/postprocessing
vi.mock('@react-three/postprocessing', () => ({
  EffectComposer: ({ children }: PropsWithChildren) => children,
  Bloom: () => null,
  Noise: () => null,
}));

// Mock lenis for smooth scroll
vi.mock('lenis', () => ({
  default: class Lenis {
    raf(): void {
      /* mock */
    }
    scrollTo(): void {
      /* mock */
    }
    stop(): void {
      /* mock */
    }
    start(): void {
      /* mock */
    }
    destroy(): void {
      /* mock */
    }
    on(): () => void {
      return () => void 0;
    }
    off(): void {
      /* mock */
    }
  },
}));

// Mock ResizeObserver (required for @react-three/fiber)
class MockResizeObserver {
  constructor(_callback: ResizeObserverCallback) {
    // Mock implementation
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
}

global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

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

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  return setTimeout(() => callback(0), 0) as unknown as number;
};

global.cancelAnimationFrame = (handle: number): void => {
  clearTimeout(handle);
};
