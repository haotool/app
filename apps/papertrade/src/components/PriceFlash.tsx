import { type ReactNode } from 'react';
import clsx from 'clsx';
import { type TickDirection } from '../stores/marketStore';

interface PriceFlashProps {
  direction: TickDirection;
  revision: number;
  className?: string;
  children: ReactNode;
}

export function PriceFlash({ direction, revision, className, children }: PriceFlashProps) {
  return (
    <span
      key={revision}
      className={clsx(
        'tabular-nums',
        direction === 'up' && 'flash-long',
        direction === 'down' && 'flash-short',
        className,
      )}
    >
      {children}
    </span>
  );
}
