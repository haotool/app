import { describe, expect, it } from 'vitest';
import { fitSideLevels } from './orderbookLayout';

describe('fitSideLevels', () => {
  it('caps at the max levels when height is plentiful', () => {
    expect(fitSideLevels(2000, 6)).toBe(6);
  });

  it('cuts levels to fit the available height', () => {
    // (400 - 70) / 2 / 44 = 3.75 → 單側 3 檔。
    expect(fitSideLevels(400, 6)).toBe(3);
    // (600 - 70) / 2 / 44 = 6.02 → 受 max 6 限制。
    expect(fitSideLevels(600, 8)).toBe(6);
  });

  it('never drops below 3 levels per side', () => {
    expect(fitSideLevels(120, 6)).toBe(3);
    expect(fitSideLevels(0, 6)).toBe(3);
  });
});
