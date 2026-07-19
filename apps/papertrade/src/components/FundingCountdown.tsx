import { useEffect, useState } from 'react';
import { formatCountdown } from '../lib/format';

interface FundingCountdownProps {
  nextFundingTime: number | undefined;
  className?: string;
}

// 每秒 tick 的狀態封閉於此元件，隔離 re-render 邊界（設計 SSOT：不得整 header 重渲）。
export function FundingCountdown({ nextFundingTime, className }: FundingCountdownProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (nextFundingTime === undefined) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [nextFundingTime]);

  return (
    <span className={className}>
      {nextFundingTime === undefined ? '--:--:--' : formatCountdown(nextFundingTime - now)}
    </span>
  );
}
