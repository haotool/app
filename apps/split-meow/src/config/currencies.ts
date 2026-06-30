export type CurrencyCode = 'TWD' | 'KRW';

/** KRW 上線前 localStorage 舊帳目皆為 TWD；缺 currency 欄位時不可跟著全域幣別漂移。 */
const LEGACY_DEFAULT_CURRENCY: CurrencyCode = 'TWD';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  flag: string;
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  TWD: { code: 'TWD', symbol: 'NT$', flag: '🇹🇼', locale: 'zh-TW' },
  KRW: { code: 'KRW', symbol: '₩', flag: '🇰🇷', locale: 'ko-KR' },
};

const TIMEZONE_TO_CURRENCY: Record<string, CurrencyCode> = {
  'Asia/Seoul': 'KRW',
  'Asia/Busan': 'KRW',
  'Asia/Taipei': 'TWD',
};

export function detectCurrencyFromTimezone(): CurrencyCode | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_TO_CURRENCY[tz] ?? null;
  } catch {
    return null;
  }
}

export function formatAmount(amount: number, currency: CurrencyCode): string {
  const rounded = Math.round(amount);
  if (currency === 'KRW') return `₩${rounded.toLocaleString('ko-KR')}`;
  return `NT$ ${rounded.toLocaleString('zh-TW')}`;
}

export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCIES[currency].symbol;
}

/** 單筆費用的顯示幣別；舊資料缺欄位時視為 TWD。 */
export function resolveExpenseCurrency(
  expense: { currency?: CurrencyCode },
  _tripCurrency: CurrencyCode,
): CurrencyCode {
  return expense.currency ?? LEGACY_DEFAULT_CURRENCY;
}

/** 行程主導幣別：最舊一筆記帳的幣別快照；舊資料 fallback TWD，空行程 fallback 全域幣別。 */
export function resolveTripCurrency(
  expenses: { currency?: CurrencyCode }[],
  globalCurrency: CurrencyCode,
): CurrencyCode {
  const oldest = expenses[expenses.length - 1];
  if (!oldest) return globalCurrency;
  return oldest.currency ?? LEGACY_DEFAULT_CURRENCY;
}

/** 行程是否混用多種幣別；混幣時不可加總或結算。 */
export function isMixedCurrencyTrip(
  expenses: { currency?: CurrencyCode }[],
  tripCurrency: CurrencyCode,
): boolean {
  if (expenses.length === 0) return false;
  const codes = new Set(expenses.map((exp) => resolveExpenseCurrency(exp, tripCurrency)));
  return codes.size > 1;
}

/** 新增一筆 `incomingCurrency` 是否會使原本單幣行程變成混幣。 */
export function wouldCreateMixedCurrencyTrip(
  tripExpenses: { currency?: CurrencyCode }[],
  globalCurrency: CurrencyCode,
  incomingCurrency: CurrencyCode,
): boolean {
  if (tripExpenses.length === 0) return false;
  const tripCurrency = resolveTripCurrency(tripExpenses, globalCurrency);
  if (isMixedCurrencyTrip(tripExpenses, tripCurrency)) return false;
  const lastExpense = tripExpenses[tripExpenses.length - 1];
  if (lastExpense === undefined) return false;
  const establishedCurrency = resolveExpenseCurrency(lastExpense, tripCurrency);
  return incomingCurrency !== establishedCurrency;
}

/** 混幣風險時以 confirm 詢問；無風險或使用者確認則回傳 true。 */
export function confirmMixedCurrencyIfNeeded(
  tripExpenses: { currency?: CurrencyCode }[],
  globalCurrency: CurrencyCode,
  incomingCurrency: CurrencyCode,
  confirmMessage: string,
): boolean {
  if (!wouldCreateMixedCurrencyTrip(tripExpenses, globalCurrency, incomingCurrency)) {
    return true;
  }
  return window.confirm(confirmMessage);
}

/** 同幣別行程的成員餘額；僅在 `isMixedCurrencyTrip` 為 false 時有意義。 */
export function computeMemberBalances(
  expenses: {
    paidBy: string;
    totalAmount: number;
    perPersonAmounts: Record<string, number>;
  }[],
): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const exp of expenses) {
    balances[exp.paidBy] = (balances[exp.paidBy] ?? 0) + exp.totalAmount;
    for (const [memberId, amount] of Object.entries(exp.perPersonAmounts)) {
      balances[memberId] = (balances[memberId] ?? 0) - amount;
    }
  }
  return balances;
}

/**
 * 將 KRW 金額依匯率快照換算為 TWD 顯示字串（用於 KRW 記帳時的副標）。
 * rate 為 1 TWD = rate KRW（賣出價）；rate 無效時回傳 null 表示無法換算。
 */
export function formatKrwAsTwd(krwAmount: number, rate: number | null | undefined): string | null {
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) return null;
  return formatAmount(krwAmount / rate, 'TWD');
}
