import { SYMBOLS } from '../config/market';
import { marketWs } from './marketWs';
import { parseTickerMessage } from './ticker';
import { useMarketStore } from '../stores/marketStore';
import { useTradeStore } from '../stores/tradeStore';
import { isPprSymbol, PPR_ENABLED } from '../features/ppr/config';
import { startPprFeed } from '../features/ppr/feed';

export function startMarketFeed(): () => void {
  const { setTicker, patchTicker, setWsStatus } = useMarketStore.getState();

  const stopStatus = marketWs.onStatus(setWsStatus);

  // ppr 來源 symbol 不進真實 Bybit 訂閱清單：由本地合成 feed 供數（單點路由匯流點）。
  const stops = SYMBOLS.filter((symbol) => !isPprSymbol(symbol)).map((symbol) =>
    marketWs.subscribe(`tickers.${symbol}`, (message) => {
      const update = parseTickerMessage(message);
      if (update === null) return;
      if (update.kind === 'snapshot') {
        setTicker(update.ticker);
      } else {
        patchTicker(update.symbol, update.patch);
      }
      const ticker = useMarketStore.getState().tickers[symbol];
      if (ticker !== undefined) {
        useTradeStore.getState().applyTick(symbol, ticker.markPrice, Date.now());
      }
    }),
  );

  const stopPpr = PPR_ENABLED ? startPprFeed() : null;

  return () => {
    stops.forEach((stop) => stop());
    stopStatus();
    stopPpr?.();
  };
}
