function decimalsForPrice(value: number): number {
  const abs = Math.abs(value);
  if (abs >= 1000) return 1;
  if (abs >= 100) return 2;
  if (abs >= 1) return 3;
  if (abs >= 0.01) return 5;
  return 6;
}

export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return '--';
  const decimals = decimalsForPrice(value);
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatSignedPercent(ratio: number): string {
  if (!Number.isFinite(ratio)) return '--';
  const percent = ratio * 100;
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
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

// 已實現損益 toast 文案：|value| 低於 2 位顯示精度半格（0.005）時視為 0，避免出現「−0 USDT」。
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

export function formatCountdown(msRemaining: number): string {
  if (!Number.isFinite(msRemaining)) return '--:--';
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatClockTime(epochMs: number): string {
  if (!Number.isFinite(epochMs)) return '--';
  return new Date(epochMs).toLocaleTimeString('en-GB', { hour12: false });
}
