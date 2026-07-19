import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyInstrumentsTickSizes, refreshLiveTickSizes } from './instruments';
import { resetLiveTickSizes, tickSizeFor } from '../lib/priceScale';

// 官方回應結構節錄（bybit-exchange.github.io/docs/v5/market/instrument）。
function officialPayload() {
  return {
    retCode: 0,
    retMsg: 'OK',
    result: {
      category: 'linear',
      list: [
        {
          symbol: 'BTCUSDT',
          priceFilter: { minPrice: '0.10', maxPrice: '1999999.80', tickSize: '0.10' },
        },
        { symbol: 'XRPUSDT', priceFilter: { tickSize: '0.0001' } },
        { symbol: 'UNKNOWNUSDT', priceFilter: { tickSize: '0.001' } },
      ],
      nextPageCursor: '',
    },
  };
}

afterEach(() => {
  resetLiveTickSizes();
});

describe('applyInstrumentsTickSizes', () => {
  it('applies tick sizes for known symbols only', () => {
    applyInstrumentsTickSizes(officialPayload());
    expect(tickSizeFor('BTCUSDT')).toBe(0.1);
    expect(tickSizeFor('XRPUSDT')).toBe(0.0001);
  });

  it('tolerates malformed payloads and missing fields', () => {
    applyInstrumentsTickSizes(null);
    applyInstrumentsTickSizes({ result: {} });
    applyInstrumentsTickSizes({
      result: { list: [{ symbol: 'BTCUSDT' }, { symbol: 'ETHUSDT', priceFilter: {} }] },
    });
    applyInstrumentsTickSizes({
      result: { list: [{ symbol: 'BTCUSDT', priceFilter: { tickSize: 'not-a-number' } }] },
    });
    expect(tickSizeFor('BTCUSDT')).toBe(0.1);
    expect(tickSizeFor('ETHUSDT')).toBe(0.01);
  });
});

describe('refreshLiveTickSizes', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('fetches instruments info and applies live tick sizes', async () => {
    fetchMock.mockResolvedValue({ json: () => Promise.resolve(officialPayload()) });
    refreshLiveTickSizes();
    await vi.waitFor(() => {
      expect(tickSizeFor('XRPUSDT')).toBe(0.0001);
    });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      '/v5/market/instruments-info?category=linear',
    );
  });

  it('stays silent on network failure and keeps the static fallback', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    expect(() => refreshLiveTickSizes()).not.toThrow();
    await Promise.resolve();
    expect(tickSizeFor('BTCUSDT')).toBe(0.1);
  });
});
