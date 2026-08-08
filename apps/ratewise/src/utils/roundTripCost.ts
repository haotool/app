/**
 * 來回換匯成本計算。
 *
 * 「換出去再換回來」會被銀行賺兩次價差：以賣出價買外幣、以買入價換回台幣。
 * 損失率僅由買賣價差決定，與換匯金額無關（手續費另計，不在此模組範圍）。
 *
 * 推導：持 X 台幣 → 外幣 X/sell → 換回台幣 X*buy/sell
 *       損失 = X * (sell - buy) / sell
 */

/** 來回損失嚴重度分級門檻（%）；依 17 幣別實測分布訂定。 */
export const ROUND_TRIP_SEVERITY_THRESHOLDS = {
  /** 低於此值為 low */
  medium: 5,
  /** 達到此值為 high */
  high: 15,
} as const;

export type RoundTripSeverity = 'low' | 'medium' | 'high';

export interface RoundTripCost {
  /** 來回損失率（%），已四捨五入至小數兩位 */
  lossPct: number;
  /** 買賣價差（以台幣計價，每 1 單位外幣） */
  spread: number;
  /** 嚴重度分級 */
  severity: RoundTripSeverity;
}

/** 依損失率分級；門檻採 [low, medium) / [medium, high) / [high, ∞)。 */
export function classifyRoundTripSeverity(lossPct: number): RoundTripSeverity {
  if (lossPct >= ROUND_TRIP_SEVERITY_THRESHOLDS.high) return 'high';
  if (lossPct >= ROUND_TRIP_SEVERITY_THRESHOLDS.medium) return 'medium';
  return 'low';
}

/**
 * 計算單一牌告類型（現金或即期）的來回成本。
 *
 * **報價單位限定 `TWD_PER_FOREIGN`**（每 1 單位外幣 = N 台幣，台銀牌告的形式）。
 * 換錢所報價為 `KRW_PER_TWD`（每 1 台幣 = N 韓元），該單位下 buy 反而高於 sell
 * （例如明洞 sell 46.0 / buy 46.7），語意與此函式的參數相反，
 * 故會落入下方守衛回傳 null——這是刻意的單位保護，不是資料異常。
 * 換錢所若要計算來回成本，需另行依 `api-semantics-v2` 的 quoteUnit 換算後再呼叫。
 *
 * @param sell 賣出價（客戶買外幣所適用），單位 TWD_PER_FOREIGN
 * @param buy 買入價（客戶換回台幣所適用），單位 TWD_PER_FOREIGN
 * @returns 缺任一報價、非有限數、sell <= 0，或 buy > sell（單位不符）時回傳 null
 */
export function computeRoundTripCost(
  sell: number | null | undefined,
  buy: number | null | undefined,
): RoundTripCost | null {
  if (sell == null || buy == null) return null;
  if (!Number.isFinite(sell) || !Number.isFinite(buy)) return null;
  // sell <= 0 無法作為分母；在 TWD_PER_FOREIGN 單位下 buy 不應高於 sell，
  // 若成立代表傳入了反向報價單位（如換錢所的 KRW_PER_TWD），拒絕計算以免給出錯誤數字。
  if (sell <= 0 || buy <= 0 || buy > sell) return null;

  const spread = sell - buy;
  return {
    lossPct: Number(((spread / sell) * 100).toFixed(2)),
    spread: Number(spread.toFixed(6)),
    severity: classifyRoundTripSeverity((spread / sell) * 100),
  };
}

/**
 * 自台銀自身中間價反推現金買入價。
 *
 * `seo-rate-examples` 產出 `bankMid = (cashBuy + cashSell) / 2`，未直接保留 `cashBuy`，
 * 故買入價需由此還原：`cashBuy = 2 * bankMid - cashSell`。此為代數還原而非估計，
 * 不引入誤差。`bankMid` 為 null 代表該幣別無現金買入報價。
 */
export function deriveCashBuy(
  bankMid: number | null | undefined,
  cashSell: number | null | undefined,
): number | null {
  if (bankMid == null || cashSell == null) return null;
  if (!Number.isFinite(bankMid) || !Number.isFinite(cashSell)) return null;
  const buy = 2 * bankMid - cashSell;
  return buy > 0 ? Number(buy.toFixed(8)) : null;
}

/**
 * 換出再換回的台幣損失金額。
 *
 * @param twdAmount 起始台幣金額
 * @param cost 來回成本
 * @returns 損失台幣金額（四捨五入至整數）；金額非有限數或為負時回傳 null
 */
export function computeRoundTripLossTwd(
  twdAmount: number,
  cost: RoundTripCost | null,
): number | null {
  if (cost == null) return null;
  if (!Number.isFinite(twdAmount) || twdAmount < 0) return null;
  return Math.round((twdAmount * cost.lossPct) / 100);
}
