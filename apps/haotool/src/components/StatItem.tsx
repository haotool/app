import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';
import { EASE_OUT_QUART } from './Reveal';

interface StatItemProps {
  value: number;
  suffix?: string;
  label: string;
}

/**
 * 統計數字（§4.4）：inView once 觸發 count-up 1200ms（0→終值），進度映射整數。
 * SSG 與未觸發前皆直接輸出終值（AEO 可讀、無 hydration 閃動）；
 * reduced-motion 直接渲染終值；tabular-nums 確保動畫期間寬度穩定。
 */
export default function StatItem({ value, suffix, label }: StatItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const startedRef = useRef(false);

  useEffect(() => {
    if (reducedMotion || !inView || startedRef.current) return undefined;
    startedRef.current = true;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: EASE_OUT_QUART,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, reducedMotion, value]);

  return (
    <div ref={ref} className="flex flex-col items-center text-center">
      <p className="text-stat tabular-nums text-text">
        {display}
        {suffix}
      </p>
      <p className="mt-2 text-caption text-text-muted">{label}</p>
    </div>
  );
}
