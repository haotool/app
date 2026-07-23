import { describe, expect, it } from 'vitest';
import { STAR_SIPHON, shieldAfterAbsorb, siphonStreamStrength } from './starSiphon';

describe('STAR_SIPHON 常數（§5 W3 設計卡）', () => {
  it('吸流窗 0.8s（≥600ms 可讀性紅線）；護盾上限 2 層；回傷 4', () => {
    expect(STAR_SIPHON.windowMs).toBe(800);
    expect(STAR_SIPHON.windowMs).toBeGreaterThanOrEqual(600);
    expect(STAR_SIPHON.shieldCap).toBe(2);
    expect(STAR_SIPHON.backfireDamage).toBe(4);
  });
});

describe('siphonStreamStrength（吸流包絡）', () => {
  it('窗外為 0；窗中段滿強度；進出各 20% 窗長線性淡入淡出', () => {
    expect(siphonStreamStrength(-1, 800)).toBe(0);
    expect(siphonStreamStrength(800, 800)).toBe(0);
    expect(siphonStreamStrength(400, 800)).toBe(1);
    // 淡入半程：80ms / 160ms = 0.5。
    expect(siphonStreamStrength(80, 800)).toBeCloseTo(0.5);
    // 淡出半程：剩 80ms / 160ms = 0.5。
    expect(siphonStreamStrength(720, 800)).toBeCloseTo(0.5);
  });
});

describe('shieldAfterAbsorb（護盾層夾限）', () => {
  it('0→1→2 遞增；達上限後不再增加', () => {
    expect(shieldAfterAbsorb(0)).toBe(1);
    expect(shieldAfterAbsorb(1)).toBe(2);
    expect(shieldAfterAbsorb(2)).toBe(2);
  });
});
