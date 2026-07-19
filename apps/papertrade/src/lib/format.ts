import { type MarketSymbol } from '../config/market';
import { pricePrecisionFor } from './priceScale';

// 價格顯示 SSOT（ADR-R6-01）：精度由 symbol 的 tick size 反推，全站一致。
export function formatPrice(value: number, symbol: MarketSymbol): string {
  if (!Number.isFinite(value)) return '--';
  const decimals = pricePrecisionFor(symbol);
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// 簽名百分比（損益率顯示 SSOT，輸入為百分比值，50 = 50%）：
// |value| 低於 2 位顯示精度半格（0.005）時視為 0，不帶符號，避免微幅值顯示「−0.00%」。
export function formatSignedPercent(percent: number): string {
  if (!Number.isFinite(percent)) return '--';
  if (Math.abs(percent) < 0.005) return '0.00%';
  return `${percent >= 0 ? '+' : '−'}${Math.abs(percent).toFixed(2)}%`;
}

export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return '--';
  return value.toLocaleString('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  });
}

export function formatAmount(value: number, maxDecimals = 3): string {
  if (!Number.isFinite(value)) return '--';
  return value.toLocaleString('en-US', {
    maximumFractionDigits: maxDecimals,
  });
}

// 簽名 USDT 金額（損益顯示 SSOT）：|value| 低於 2 位顯示精度半格（0.005）時視為 0，
// 不帶符號，避免微幅值顯示「−0 USDT」／「+0 USDT」。
export function formatSignedPnl(value: number): string {
  if (!Number.isFinite(value)) return '--';
  if (Math.abs(value) < 0.005) return '0.00';
  return `${value >= 0 ? '+' : '−'}${formatAmount(Math.abs(value), 2)}`;
}

export function formatFundingRate(rate: number): string {
  if (!Number.isFinite(rate)) return '--';
  const percent = rate * 100;
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(4)}%`;
}

// 恆定 hh:mm:ss（R6-3 對標 Bybit「資金費率/倒數」格式）。
export function formatCountdown(msRemaining: number): string {
  if (!Number.isFinite(msRemaining)) return '--:--';
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const ss = String(totalSeconds % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function formatClockTime(epochMs: number): string {
  if (!Number.isFinite(epochMs)) return '--';
  return new Date(epochMs).toLocaleTimeString('en-GB', { hour12: false });
}
