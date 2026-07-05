import { useRef, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import * as m from 'motion/react-m';
import { useInView } from 'motion/react';

/** 全站唯一 easing（--ease-out-quart 的 JS 對映）。 */
export const EASE_OUT_QUART: [number, number, number, number] = [0.16, 1, 0.3, 1];

// React 官方 hydration 偵測模式：server snapshot=false、client snapshot=true，
// 首輪 hydration 與 SSR 輸出一致（無 setState-in-effect 的雙重 render 反模式）。
const emptySubscribe = () => () => undefined;
function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * 首屏以下進場動效 SSOT（§1.4）：inView once、480ms、opacity + translateY(16px→0)。
 * SSG 韌性（motion 官方 SSR 語意：initial=false 以 animate 值輸出可見狀態）：
 * 伺服端與 hydration 首輪皆不輸出 opacity:0 inline style，
 * 爬蟲與 JS 失效使用者可見完整內容；hydration 完成後才進入動畫初始態（duration 0），
 * 再由 useInView once 觸發進場，動畫體驗與原 whileInView 一致。
 * reduced-motion 由 Layout 的 MotionConfig reducedMotion="user" 統一降級為僅 opacity。
 */
export default function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const hydrated = useHydrated();

  const hidden = hydrated && !inView;

  return (
    <m.div
      ref={ref}
      className={className}
      initial={false}
      animate={hidden ? { opacity: 0, y: 16 } : { opacity: 1, y: 0 }}
      transition={hidden ? { duration: 0 } : { duration: 0.48, ease: EASE_OUT_QUART, delay }}
    >
      {children}
    </m.div>
  );
}
