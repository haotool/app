import { type MarketSymbol } from '../config/market';
import { LEVERAGE_MAX, LEVERAGE_MIN, MAINTENANCE_MARGIN_RATE } from '../config/trading';
import { type Account, type Position, type Side } from './types';

export type MarkMap = Partial<Record<MarketSymbol, number>>;

export function roundUsdt(value: number): number {
  return Math.round(value * 1e8) / 1e8;
}

export function notionalValue(qty: number, price: number): number {
  return qty * price;
}

export function requiredMargin(notional: number, leverage: number): number {
  return notional / leverage;
}

export function orderFee(notional: number, feeRate: number): number {
  return notional * feeRate;
}

export function unrealizedPnl(side: Side, entryPrice: number, markPrice: number, qty: number) {
  return side === 'long' ? (markPrice - entryPrice) * qty : (entryPrice - markPrice) * qty;
}

export function roePercent(pnl: number, margin: number): number {
  if (margin <= 0) return 0;
  return (pnl / margin) * 100;
}

// 有效 MMR 上限係數（ADR-R5-03）：以「初始保證金率之半」為收斂上限。
const MMR_INITIAL_MARGIN_FRACTION = 0.5;

// 有效維持保證金率（ADR-R5-03）：高槓桿下固定 0.5% MMR 會高於初始保證金率導致開倉即強平，
// 以「初始保證金率之半」為上限收斂，強平價與保證金檢查一律經此單點取得。
export function effectiveMaintenanceMarginRate(leverage: number): number {
  return Math.min(MAINTENANCE_MARGIN_RATE, MMR_INITIAL_MARGIN_FRACTION / leverage);
}

export function liquidationPrice(side: Side, entryPrice: number, leverage: number): number {
  const mmr = effectiveMaintenanceMarginRate(leverage);
  return side === 'long'
    ? entryPrice * (1 - 1 / leverage + mmr)
    : entryPrice * (1 + 1 / leverage - mmr);
}

// —— R6-2 全倉（cross）聚合帳務（ADR-R6-02，公式對齊 Bybit UTA 簡化版）——
// 缺 mark 的持倉一律不計入，與 getAccountMetrics 既有口徑一致。

// 全部 cross 持倉的未實現損益總和（全額計入，不夾 min(0,·)）。
export function crossUnrealizedPnl(positions: Position[], marks: MarkMap): number {
  return positions.reduce((sum, position) => {
    if (position.marginMode !== 'cross') return sum;
    const mark = marks[position.symbol];
    if (mark === undefined) return sum;
    return sum + unrealizedPnl(position.side, position.entryPrice, mark, position.qty);
  }, 0);
}

// 顯示用可用資金：錢包現金（已扣 IM 與凍結）加計 cross 未實現損益。
// 任一 cross 持倉缺 mark 時取最保守值：已知虧損照扣、盈利與未知一律不計
// （min 併入裸現金下界）——行情殘缺瞬態不得虛高可用，且不得反而抹掉已知浮虧。
export function crossAvailableBalance(account: Account, marks: MarkMap): number {
  const hasUnmarkedCross = account.positions.some(
    (position) => position.marginMode === 'cross' && marks[position.symbol] === undefined,
  );
  const upnl = crossUnrealizedPnl(account.positions, marks);
  if (hasUnmarkedCross) return account.balance + Math.min(0, upnl);
  return account.balance + upnl;
}

// 聚合強平判定用保證金餘額：現金 + cross 持倉 IM + cross 未實現損益。
export function crossMarginBalance(account: Account, marks: MarkMap): number {
  const crossMargin = account.positions.reduce(
    (sum, position) => (position.marginMode === 'cross' ? sum + position.margin : sum),
    0,
  );
  return account.balance + crossMargin + crossUnrealizedPnl(account.positions, marks);
}

// 全部 cross 持倉的維持保證金總和（qty × mark × 有效 MMR）。
export function crossMaintenanceMargin(positions: Position[], marks: MarkMap): number {
  return positions.reduce((sum, position) => {
    if (position.marginMode !== 'cross') return sum;
    const mark = marks[position.symbol];
    if (mark === undefined) return sum;
    return sum + position.qty * mark * effectiveMaintenanceMarginRate(position.leverage);
  }, 0);
}

// cross 單倉估算強平價（僅 UI 顯示；真實觸發為聚合 MM 檢查）。
// 與觸發條件同構的線性解：crossMarginBalance + qty×(liq−mark)×dir = crossMM（聚合，
// 非僅本倉——漏扣其他 cross 倉 MM 會使估算系統性偏遠）。mark 為錨：buffer 已含
// 本倉未實現損益，entry 錨會把利潤雙重計入。假設其他倉靜態、MM 凍結於現時 mark。
// buffer 覆蓋全倉損失（結果非正）時回 null，UI 顯示 --。
export function estimatedCrossLiquidationPrice(
  position: Position,
  account: Account,
  marks: MarkMap,
): number | null {
  if (position.marginMode !== 'cross') return null;
  const mark = marks[position.symbol];
  if (mark === undefined || position.qty <= 0) return null;
  const buffer =
    crossMarginBalance(account, marks) - crossMaintenanceMargin(account.positions, marks);
  const estimate =
    position.side === 'long' ? mark - buffer / position.qty : mark + buffer / position.qty;
  return estimate > 0 ? estimate : null;
}

// SL 死區判定（issue 781）：停損價劣於強平價時，強平必先觸發，該停損形同虛設。
export function isSlBeyondLiquidation(
  side: Side,
  entryPrice: number,
  leverage: number,
  slPrice: number,
): boolean {
  const liq = liquidationPrice(side, entryPrice, leverage);
  return side === 'long' ? slPrice < liq : slPrice > liq;
}

export function averageEntryPrice(
  qtyA: number,
  priceA: number,
  qtyB: number,
  priceB: number,
): number {
  return (qtyA * priceA + qtyB * priceB) / (qtyA + qtyB);
}

export function isValidLeverage(leverage: number): boolean {
  return Number.isFinite(leverage) && leverage >= LEVERAGE_MIN && leverage <= LEVERAGE_MAX;
}

// 合併倉位的衍生槓桿因 margin 捨入可能微幅越界，夾回合法域以維持 persist schema 恆成立。
export function clampLeverage(leverage: number): number {
  return Math.min(LEVERAGE_MAX, Math.max(LEVERAGE_MIN, leverage));
}
