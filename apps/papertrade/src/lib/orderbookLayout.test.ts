import { describe, expect, it } from 'vitest';
import { fitSideLevels } from './orderbookLayout';

describe('fitSideLevels', () => {
  it('caps at the max levels when height is plentiful', () => {
    expect(fitSideLevels(2000, 10)).toBe(10);
  });

  it('cuts levels to fit the available height', () => {
    // (412 - 70) / 2 / 32 = 5.34 → 單側 5 檔。
    expect(fitSideLevels(412, 10)).toBe(5);
    // (600 - 70) / 2 / 32 = 8.28 → 單側 8 檔。
    expect(fitSideLevels(600, 10)).toBe(8);
    // (710 - 70) / 2 / 32 = 10 → 受 max 10 限制。
    expect(fitSideLevels(710, 10)).toBe(10);
  });

  it('never drops below 3 levels per side', () => {
    expect(fitSideLevels(120, 10)).toBe(3);
    expect(fitSideLevels(0, 10)).toBe(3);
  });
});
