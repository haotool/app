import { LEVERAGE_MAX, LEVERAGE_MIN } from '../config/trading';

// 槓桿滑桿 log-scale 映射（ADR-R5-03）：slider 0–100 線性 → 1–1000 指數，低倍段解析度高。
const LN_RATIO = Math.log(LEVERAGE_MAX / LEVERAGE_MIN);

export function sliderToLeverage(t: number): number {
  const clamped = Math.min(100, Math.max(0, t));
  const leverage = Math.round(LEVERAGE_MIN * Math.exp(LN_RATIO * (clamped / 100)));
  return Math.min(LEVERAGE_MAX, Math.max(LEVERAGE_MIN, leverage));
}

export function leverageToSlider(leverage: number): number {
  const clamped = Math.min(LEVERAGE_MAX, Math.max(LEVERAGE_MIN, leverage));
  return (Math.log(clamped / LEVERAGE_MIN) / LN_RATIO) * 100;
}
