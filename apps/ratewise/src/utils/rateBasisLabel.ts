import type { CurrencyCode, RateMode } from '../features/ratewise/types';

/**
 * 計價基準語意 SSOT。
 *
 * 只揭露 RateTypeSelector 講不出來的事：
 * - `mid`：中間價非可成交報價，數字本身不代表任何一方向的成交價。
 * - `cross`：外幣兌外幣需經台幣中轉，買賣價差被吃兩次，畫面上無其他痕跡。
 * - `direct`：直接買或賣，方向已由 selector 的可見狀態表達，不重複標註。
 *
 * 設計原則：恆亮的標籤會退化為視覺壁紙；只在有話要說時出現才具訊號價值。
 */
export type RateBasisKind = 'mid' | 'cross' | 'direct';

/** i18n key 前綴；標籤文案集中於 locales 的 rateBasis 區塊。 */
export const RATE_BASIS_I18N_PREFIX = 'rateBasis' as const;

/** 取得對應的 i18n key；`direct` 不需標籤故回傳 null。 */
export function getRateBasisLabelKey(kind: RateBasisKind): `rateBasis.${RateBasisKind}` | null {
  return kind === 'direct' ? null : `${RATE_BASIS_I18N_PREFIX}.${kind}`;
}

/**
 * 判定當前換算採用的計價基準。
 *
 * 優先序 `mid` > `cross` > `direct`：中間價根本不可成交，
 * 此警示強於「跨了兩次價差」，兩者同時成立時以 mid 為準。
 */
export function getRateBasisKind(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  rateMode: RateMode,
): RateBasisKind {
  if (rateMode === 'mid') return 'mid';
  // 同幣別不構成換匯，無跨價差問題。
  if (fromCurrency === toCurrency) return 'direct';
  // 兩端皆非台幣時需經台幣中轉，買賣價差被吃兩次。
  if (fromCurrency !== 'TWD' && toCurrency !== 'TWD') return 'cross';
  return 'direct';
}

/** 該基準是否需要在 UI 顯示標籤。 */
export function shouldDiscloseRateBasis(kind: RateBasisKind): boolean {
  return kind !== 'direct';
}
