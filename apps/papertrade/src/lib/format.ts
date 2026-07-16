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
