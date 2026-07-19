import { beforeEach, describe, expect, it } from 'vitest';
import { useMarketStore } from './marketStore';
import { type Ticker } from '../services/ticker';

const btcTicker: Ticker = {
  symbol: 'BTCUSDT',
  lastPrice: 64486.1,
  markPrice: 64486.1,
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
    expect(useMarketStore.getState().tickers.BTCUSDT).toEqual({
      ...btcTicker,
      direction: null,
      revision: 1,
      markRevision: 1,
    });
  });

  it('merges delta patches into existing ticker', () => {
    useMarketStore.getState().setTicker(btcTicker);
    useMarketStore.getState().patchTicker('BTCUSDT', { lastPrice: 64500, volume24h: 81000 });

    const ticker = useMarketStore.getState().tickers.BTCUSDT;
    expect(ticker?.lastPrice).toBe(64500);
    expect(ticker?.volume24h).toBe(81000);
    expect(ticker?.highPrice24h).toBe(65000);
  });

  it('tracks tick direction and revision on price changes', () => {
    const { setTicker, patchTicker } = useMarketStore.getState();
    setTicker(btcTicker);
    patchTicker('BTCUSDT', { lastPrice: 64500 });
    expect(useMarketStore.getState().tickers.BTCUSDT?.direction).toBe('up');
    expect(useMarketStore.getState().tickers.BTCUSDT?.revision).toBe(2);

    patchTicker('BTCUSDT', { lastPrice: 64400 });
    expect(useMarketStore.getState().tickers.BTCUSDT?.direction).toBe('down');
    expect(useMarketStore.getState().tickers.BTCUSDT?.revision).toBe(3);

    patchTicker('BTCUSDT', { volume24h: 90000 });
    expect(useMarketStore.getState().tickers.BTCUSDT?.direction).toBe('down');
    expect(useMarketStore.getState().tickers.BTCUSDT?.revision).toBe(3);
  });

  it('bumps markRevision only when markPrice changes (R6-4)', () => {
    const { setTicker, patchTicker } = useMarketStore.getState();
    setTicker(btcTicker);
    expect(useMarketStore.getState().tickers.BTCUSDT?.markRevision).toBe(1);

    // 僅 lastPrice 變化：markRevision 與 markPrice 不動、revision 照常遞增。
    patchTicker('BTCUSDT', { lastPrice: 64500 });
    const afterLast = useMarketStore.getState().tickers.BTCUSDT;
    expect(afterLast?.markRevision).toBe(1);
    expect(afterLast?.markPrice).toBe(btcTicker.markPrice);
    expect(afterLast?.revision).toBe(2);

    // markPrice 真變化：markRevision 遞增、revision 不動。
    patchTicker('BTCUSDT', { markPrice: 64510 });
    const afterMark = useMarketStore.getState().tickers.BTCUSDT;
    expect(afterMark?.markRevision).toBe(2);
    expect(afterMark?.revision).toBe(2);

    // markPrice 未變的 patch：markRevision 不遞增。
    patchTicker('BTCUSDT', { volume24h: 90000 });
    expect(useMarketStore.getState().tickers.BTCUSDT?.markRevision).toBe(2);
  });

  it('bumps markRevision when a snapshot carries a new markPrice', () => {
    const { setTicker } = useMarketStore.getState();
    setTicker(btcTicker);
    setTicker({ ...btcTicker, markPrice: 64490 });
    expect(useMarketStore.getState().tickers.BTCUSDT?.markRevision).toBe(2);

    // 同值快照：不遞增。
    setTicker({ ...btcTicker, markPrice: 64490 });
    expect(useMarketStore.getState().tickers.BTCUSDT?.markRevision).toBe(2);
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
