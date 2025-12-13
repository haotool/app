/**
 * Animated Counter Component
 */
import { useRef, useEffect, useState } from 'react';
import { useSpring, useInView } from 'framer-motion';

interface CounterProps {
  value: string;
  suffix?: string;
}

export function Counter({ value, suffix }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const numericValue = parseFloat(value.replace(/,/g, ''));
  const isNumber = !isNaN(numericValue);

  const springValue = useSpring(0, {
    damping: 30,
    stiffness: 100,
    mass: 1,
  });

  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView && isNumber) {
      springValue.set(numericValue);
    }
  }, [isInView, numericValue, springValue, isNumber]);

  useEffect(() => {
    return springValue.on('change', (latest) => {
      setDisplayValue(latest);
    });
  }, [springValue]);

  return (
    <span ref={ref} className="tabular-nums">
      {isNumber
        ? displayValue % 1 === 0
          ? displayValue.toFixed(0)
          : displayValue.toFixed(1)
        : value}
      {suffix && <span className="text-slate-500 text-lg ml-1 font-light">{suffix}</span>}
    </span>
  );
}

export default Counter;
