export const INITIAL_BALANCE_USDT = 10_000;
export const TAKER_FEE_RATE = 0.00055;
export const MAKER_FEE_RATE = 0.0002;
export const MAINTENANCE_MARGIN_RATE = 0.005;
export const LEVERAGE_MIN = 1;
export const LEVERAGE_MAX = 1000;
export const DEFAULT_LEVERAGE = 10;
export const MIN_ORDER_NOTIONAL_USDT = 5;
// 限價相對標記價的允許帶寬（±50%，對標 Bybit 價格保護簡化版）：超帶寬拒單，防天價/地板價造成荒謬數量。
export const LIMIT_PRICE_BAND = 0.5;

export const SIZE_SLIDER_TICKS = [0, 25, 50, 75, 100] as const;
export const CLOSE_PERCENT_PRESETS = [25, 50, 75, 100] as const;
export const LEVERAGE_PRESETS = [1, 10, 25, 50, 100, 200, 500, 1000] as const;
// 超過此倍數視為極高槓桿：UI 轉 warning 色並顯示風險文案。
export const HIGH_LEVERAGE_THRESHOLD = 100;
export const QTY_DISPLAY_DECIMALS = 6;

// 平倉歷史僅保留最近 N 筆，避免長期使用讓 persist payload 無上限膨脹。
export const HISTORY_MAX_ENTRIES = 200;

export const TOAST_DURATION_MS = 4500;
export const TOAST_MAX_VISIBLE = 3;

export const TRADE_STORAGE_KEY = 'papertrade:account';
export const TRADE_STORAGE_VERSION = 4;
export const DISCLAIMER_STORAGE_KEY = 'papertrade:disclaimer-ack';
