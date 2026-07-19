import { describe, expect, it } from 'vitest';
import { SYMBOL_META } from '../config/market';
import { getCoinIcon } from './coinIcon';

describe('getCoinIcon', () => {
  // 測試環境小型 SVG 會內聯為 data URL，僅斷言可用性與映射互異，不綁定 URL 形態。
  it('returns a usable url for a known base asset', () => {
    const url = getCoinIcon('BTC');
    expect(url).toBeTypeOf('string');
    expect(url).not.toBe('');
  });

  it('is case-insensitive on the base asset', () => {
    expect(getCoinIcon('btc')).toBe(getCoinIcon('BTC'));
  });

  it('returns null for an unknown base asset', () => {
    expect(getCoinIcon('NOPE')).toBeNull();
  });

  it('covers every supported symbol with a distinct icon', () => {
    const urls = Object.values(SYMBOL_META).map((meta) => {
      const url = getCoinIcon(meta.base);
      expect(url, `missing icon for ${meta.base}`).not.toBeNull();
      return url;
    });
    expect(new Set(urls).size).toBe(urls.length);
  });
});
