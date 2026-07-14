import { SYMBOLS } from '../config/market';
import { marketWs } from './marketWs';
import { parseTickerMessage } from './ticker';
import { useMarketStore } from '../stores/marketStore';

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
    }),
  );

  return () => {
    stops.forEach((stop) => stop());
    stopStatus();
  };
}
