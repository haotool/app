import { isPprSymbol, PPR_BADGE_LABEL, PPR_DISCLAIMER } from './config';

// 行情列／交易對清單用「娛樂」pill：非 ppr symbol 回 null，呼叫端零判斷。
export function PprTag({ symbol }: { symbol: string }) {
  if (!isPprSymbol(symbol)) return null;
  return (
    <span className="shrink-0 rounded bg-warning/15 px-1.5 py-0.5 text-caption font-medium text-warning">
      {PPR_BADGE_LABEL}
    </span>
  );
}

// 圖表頁／交易頁 header 常駐揭露 chip（security SSOT 第 10 條）。
export function PprDisclaimerChip({ symbol }: { symbol: string }) {
  if (!isPprSymbol(symbol)) return null;
  return (
    <span className="inline-flex w-fit items-center rounded-full bg-warning/15 px-2 py-0.5 text-caption font-medium text-warning">
      {PPR_DISCLAIMER}
    </span>
  );
}
