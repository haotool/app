import { describe, expect, it } from 'vitest';
import { filterSymbolsByQuery } from './symbolSearch';
import { SYMBOLS } from '../config/market';

describe('filterSymbolsByQuery', () => {
  it('returns the full source list for an empty query', () => {
    expect(filterSymbolsByQuery('')).toEqual([...SYMBOLS]);
    expect(filterSymbolsByQuery('   ')).toEqual([...SYMBOLS]);
  });

  it('matches by symbol, base and full name case-insensitively', () => {
    expect(filterSymbolsByQuery('btcusdt')).toEqual(['BTCUSDT']);
    expect(filterSymbolsByQuery('sol')).toEqual(['SOLUSDT']);
    expect(filterSymbolsByQuery('dogecoin')).toEqual(['DOGEUSDT']);
  });

  it('filters within a custom source list', () => {
    expect(filterSymbolsByQuery('', ['ETHUSDT', 'BTCUSDT'])).toEqual(['ETHUSDT', 'BTCUSDT']);
    expect(filterSymbolsByQuery('eth', ['ETHUSDT', 'BTCUSDT'])).toEqual(['ETHUSDT']);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterSymbolsByQuery('zzz')).toEqual([]);
  });
});
