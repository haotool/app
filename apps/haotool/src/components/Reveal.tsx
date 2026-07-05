import type { ReactNode } from 'react';
import * as m from 'motion/react-m';

/** 全站唯一 easing（--ease-out-quart 的 JS 對映）。 */
export const EASE_OUT_QUART: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * 首屏以下進場動效 SSOT（§1.4）：whileInView once、480ms、opacity + translateY(16px→0)。
 * reduced-motion 由 Layout 的 MotionConfig reducedMotion="user" 統一降級為僅 opacity。
 */
export default function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.48, ease: EASE_OUT_QUART, delay }}
    >
      {children}
    </m.div>
  );
}
