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
