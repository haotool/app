import { type ClosedTrade } from '../engine/types';

export interface PracticeStats {
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  totalFees: number;
  maxWin: number | null;
  maxLoss: number | null;
  profitFactor: number | null;
}

// 以平倉紀錄為單位彙總：部分平倉的每個切片與強平各算一筆。
export function computePracticeStats(history: ClosedTrade[]): PracticeStats {
  let wins = 0;
  let totalPnl = 0;
  let totalFees = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let maxWin: number | null = null;
  let maxLoss: number | null = null;

  for (const trade of history) {
    totalPnl += trade.realizedPnl;
    totalFees += trade.openFee + trade.fee;
    if (trade.realizedPnl > 0) {
      wins += 1;
      grossProfit += trade.realizedPnl;
      if (maxWin === null || trade.realizedPnl > maxWin) maxWin = trade.realizedPnl;
    } else if (trade.realizedPnl < 0) {
      grossLoss -= trade.realizedPnl;
      if (maxLoss === null || trade.realizedPnl < maxLoss) maxLoss = trade.realizedPnl;
    }
  }

  return {
    totalTrades: history.length,
    winRate: history.length === 0 ? 0 : wins / history.length,
    totalPnl,
    totalFees,
    maxWin,
    maxLoss,
    // 無虧損樣本時：有盈利為 Infinity（顯示 ∞），全為零則無法定義。
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : null,
  };
}
