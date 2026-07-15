export const INITIAL_BALANCE_USDT = 10_000;
export const TAKER_FEE_RATE = 0.00055;
export const MAKER_FEE_RATE = 0.0002;
export const MAINTENANCE_MARGIN_RATE = 0.005;
export const LEVERAGE_MIN = 1;
export const LEVERAGE_MAX = 125;
export const DEFAULT_LEVERAGE = 10;
export const MIN_ORDER_NOTIONAL_USDT = 5;

export const SIZE_PERCENT_PRESETS = [10, 25, 50, 75, 100] as const;
export const CLOSE_PERCENT_PRESETS = [25, 50, 75, 100] as const;
export const LEVERAGE_PRESETS = [1, 5, 10, 25, 50, 75, 100, 125] as const;
export const QTY_DISPLAY_DECIMALS = 6;

// 平倉歷史僅保留最近 N 筆，避免長期使用讓 persist payload 無上限膨脹。
export const HISTORY_MAX_ENTRIES = 200;

export const TOAST_DURATION_MS = 4500;
export const TOAST_MAX_VISIBLE = 3;

export const TRADE_STORAGE_KEY = 'papertrade:account';
export const TRADE_STORAGE_VERSION = 2;
export const DISCLAIMER_STORAGE_KEY = 'papertrade:disclaimer-ack';
