const parsePositiveInteger = (value: string | undefined, fallback: number): number => {
  if (value === undefined || value.trim() === '') return fallback;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const readEnvString = (key: string): string | undefined => {
  const value = (import.meta.env as Readonly<Record<string, unknown>>)[key];
  return typeof value === 'string' ? value : undefined;
};

export const TREND_CHART_DEFER_MS = parsePositiveInteger(
  readEnvString('VITE_TREND_CHART_DEFER_MS'),
  10_000,
);

export const TREND_CHART_IDLE_TIMEOUT_MS = parsePositiveInteger(
  readEnvString('VITE_TREND_CHART_IDLE_TIMEOUT_MS'),
  2_000,
);

export const ANALYTICS_INIT_DELAY_MS = parsePositiveInteger(
  readEnvString('VITE_ANALYTICS_INIT_DELAY_MS'),
  6_000,
);

export const ANALYTICS_IDLE_TIMEOUT_MS = parsePositiveInteger(
  readEnvString('VITE_ANALYTICS_IDLE_TIMEOUT_MS'),
  2_000,
);

export const PWA_STORAGE_INIT_DELAY_MS = parsePositiveInteger(
  readEnvString('VITE_PWA_STORAGE_INIT_DELAY_MS'),
  8_000,
);

export const PWA_STORAGE_IDLE_TIMEOUT_MS = parsePositiveInteger(
  readEnvString('VITE_PWA_STORAGE_IDLE_TIMEOUT_MS'),
  2_000,
);
