import { SYMBOLS } from '../config/market';
import { marketWs } from './marketWs';
import { parseTickerMessage } from './ticker';
import { useMarketStore } from '../stores/marketStore';
import { useTradeStore } from '../stores/tradeStore';

export function startMarketFeed(): () => void {
  const { setTicker, patchTicker, setWsStatus } = useMarketStore.getState();

  const stopStatus = marketWs.onStatus(setWsStatus);

  const stops = SYMBOLS.map((symbol) =>
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

  return () => {
    stops.forEach((stop) => stop());
    stopStatus();
  };
}
