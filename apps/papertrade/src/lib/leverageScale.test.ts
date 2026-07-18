import { describe, expect, it } from 'vitest';
import { LEVERAGE_MAX, LEVERAGE_MIN, LEVERAGE_PRESETS } from '../config/trading';
import { leverageToSlider, sliderToLeverage } from './leverageScale';

describe('sliderToLeverage', () => {
  it('maps the endpoints to the leverage bounds', () => {
    expect(sliderToLeverage(0)).toBe(LEVERAGE_MIN);
    expect(sliderToLeverage(100)).toBe(LEVERAGE_MAX);
  });

  it('maps the midpoint to the geometric mean scale', () => {
    // 1000^(50/100) ≈ 31.6 → round 32。
    expect(sliderToLeverage(50)).toBe(32);
  });

  it('clamps out-of-range slider values', () => {
    expect(sliderToLeverage(-10)).toBe(LEVERAGE_MIN);
    expect(sliderToLeverage(140)).toBe(LEVERAGE_MAX);
  });

  it('is monotonically non-decreasing across the slider range', () => {
    let previous = sliderToLeverage(0);
    for (let t = 1; t <= 100; t += 1) {
      const current = sliderToLeverage(t);
      expect(current).toBeGreaterThanOrEqual(previous);
      previous = current;
    }
  });
});

describe('leverageToSlider', () => {
  it('maps the leverage bounds back to the endpoints', () => {
    expect(leverageToSlider(LEVERAGE_MIN)).toBe(0);
    expect(leverageToSlider(LEVERAGE_MAX)).toBe(100);
  });

  it('clamps out-of-range leverage values', () => {
    expect(leverageToSlider(0)).toBe(0);
    expect(leverageToSlider(2000)).toBe(100);
  });

  it('round-trips every preset exactly', () => {
    for (const preset of LEVERAGE_PRESETS) {
      expect(sliderToLeverage(leverageToSlider(preset))).toBe(preset);
    }
  });

  it('round-trips every integer leverage produced by the slider', () => {
    for (let t = 0; t <= 100; t += 1) {
      const leverage = sliderToLeverage(t);
      expect(sliderToLeverage(leverageToSlider(leverage))).toBe(leverage);
    }
  });
});
