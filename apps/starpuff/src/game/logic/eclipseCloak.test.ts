import { describe, expect, it } from 'vitest';
import { ECLIPSE_CLOAK, cloakActive, cloakAlpha } from './eclipseCloak';

const DURATION = 1200;

describe('cloakActive（斗篷窗）', () => {
  it('0 ≤ elapsed < duration 為隱形期', () => {
    expect(cloakActive(0, DURATION)).toBe(true);
    expect(cloakActive(DURATION - 1, DURATION)).toBe(true);
    expect(cloakActive(DURATION, DURATION)).toBe(false);
    expect(cloakActive(-1, DURATION)).toBe(false);
  });
});

describe('cloakAlpha（§5：隱形僅月牙軌跡可見；吸入顯形）', () => {
  it('穩態隱形近全隱、吸入顯形輪廓半可見', () => {
    const mid = DURATION / 2;
    expect(cloakAlpha(mid, DURATION, false)).toBeCloseTo(ECLIPSE_CLOAK.hiddenAlpha, 5);
    expect(cloakAlpha(mid, DURATION, true)).toBeCloseTo(ECLIPSE_CLOAK.revealedAlpha, 5);
  });

  it('入場/出場 fade：起訖點 alpha 連續回復 1（無跳變）', () => {
    expect(cloakAlpha(0, DURATION, false)).toBe(1);
    expect(cloakAlpha(DURATION, DURATION, false)).toBe(1);
    const half = cloakAlpha(ECLIPSE_CLOAK.fadeMs / 2, DURATION, false);
    expect(half).toBeGreaterThan(ECLIPSE_CLOAK.hiddenAlpha);
    expect(half).toBeLessThan(1);
  });

  it('顯形 alpha 恆高於隱形 alpha（吸入反制有感）', () => {
    for (const t of [100, 300, 600, 900, 1100]) {
      expect(cloakAlpha(t, DURATION, true)).toBeGreaterThan(cloakAlpha(t, DURATION, false));
    }
  });
});
