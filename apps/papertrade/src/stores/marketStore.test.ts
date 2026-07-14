import { beforeEach, describe, expect, it } from 'vitest';
import { useMarketStore } from './marketStore';
import { type Ticker } from '../services/ticker';

const btcTicker: Ticker = {
  symbol: 'BTCUSDT',
  lastPrice: 64486.1,
  price24hPcnt: 0.038264,
  highPrice24h: 65000,
  lowPrice24h: 61848,
  turnover24h: 5122660654,
  volume24h: 80648.719,
};

describe('useMarketStore', () => {
  beforeEach(() => {
    useMarketStore.setState({ tickers: {}, wsStatus: 'idle' });
  });

  it('stores a full ticker snapshot', () => {
    useMarketStore.getState().setTicker(btcTicker);
    expect(useMarketStore.getState().tickers.BTCUSDT).toEqual(btcTicker);
  });

  it('merges delta patches into existing ticker', () => {
    useMarketStore.getState().setTicker(btcTicker);
    useMarketStore.getState().patchTicker('BTCUSDT', { lastPrice: 64500, volume24h: 81000 });

    const ticker = useMarketStore.getState().tickers.BTCUSDT;
    expect(ticker?.lastPrice).toBe(64500);
    expect(ticker?.volume24h).toBe(81000);
    expect(ticker?.highPrice24h).toBe(65000);
  });

  it('ignores patches for symbols without a snapshot', () => {
    useMarketStore.getState().patchTicker('ETHUSDT', { lastPrice: 3000 });
    expect(useMarketStore.getState().tickers.ETHUSDT).toBeUndefined();
  });

  it('tracks websocket status', () => {
    useMarketStore.getState().setWsStatus('reconnecting');
    expect(useMarketStore.getState().wsStatus).toBe('reconnecting');
  });
});
