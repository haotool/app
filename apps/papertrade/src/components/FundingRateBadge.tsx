import clsx from 'clsx';
import { formatFundingRate } from '../lib/format';
import { FundingCountdown } from './FundingCountdown';

interface FundingRateBadgeProps {
  rate: number | undefined;
  nextFundingTime: number | undefined;
}

// 費率±色與結算倒數的組合顯示（圖表頁統計列與交易頁 header 共用）。
// 「費率 / 倒數」以斜線分隔，對標 Bybit 資金費率/倒數雙欄（R6-3）。
export function FundingRateBadge({ rate, nextFundingTime }: FundingRateBadgeProps) {
  return (
    <span className="inline-flex gap-1 tabular-nums">
      <span
        className={clsx(
          rate === undefined ? 'text-text-2' : rate >= 0 ? 'text-long' : 'text-short',
        )}
      >
        {rate !== undefined ? formatFundingRate(rate) : '--'}
      </span>
      <span aria-hidden className="text-text-3">
        /
      </span>
      <span className="text-text-2">
        <FundingCountdown nextFundingTime={nextFundingTime} />
      </span>
    </span>
  );
}
