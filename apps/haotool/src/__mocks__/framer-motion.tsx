/**
 * Framer Motion Mock
 * Global mock for framer-motion to avoid animation issues in tests
 */
import { type PropsWithChildren } from 'react';

// Filter out framer-motion specific props and return a simple element
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
    const Element = Tag as React.ElementType;
    return <Element {...filteredProps}>{children}</Element>;
  };
  Component.displayName = `motion.${String(Tag)}`;
  return Component;
}

// Export motion components
export const motion = {
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
};

// Export AnimatePresence
export function AnimatePresence({ children }: PropsWithChildren) {
  return <>{children}</>;
}

// Mock motion value type
interface MockMotionValue {
  get: () => number;
  set: () => void;
  on: () => () => void;
}

// Export hooks
export function useInView() {
  return true;
}

export function useSpring(value: number): MockMotionValue {
  return {
    get: () => value,
    set: () => void 0,
    on: () => () => void 0, // Return unsubscribe function
  };
}

export function useTransform(_: unknown, callback: (v: number) => unknown) {
  return {
    get: () => callback(0),
    on: () => () => void 0,
  };
}

export function useMotionValue(value: number): MockMotionValue {
  return {
    get: () => value,
    set: () => void 0,
    on: () => () => void 0,
  };
}

export function useAnimation() {
  return {
    start: () => Promise.resolve(),
    stop: () => void 0,
    set: () => void 0,
  };
}

export function useScroll() {
  const mockMotionValue: MockMotionValue = {
    get: () => 0,
    set: () => void 0,
    on: () => () => void 0,
  };
  return {
    scrollY: mockMotionValue,
    scrollX: mockMotionValue,
    scrollYProgress: mockMotionValue,
    scrollXProgress: mockMotionValue,
  };
}
