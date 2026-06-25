/**
 * Production Lighthouse 漂移比較邏輯（可單元測試）。
 * 相對退化與絕對波動需同時超過門檻才判定 exceed。
 */

export const DRIFT_ABSOLUTE_TOLERANCE = {
  performanceScore: 1,
  lcpMs: 500,
  // Lighthouse lab INP 在 good 區間（<200ms）內常見 20–30ms 波動。
  inpMs: 30,
  cls: 0.01,
};

function safeRound(value, digits = 2) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}

export function compareDirection(
  current,
  baseline,
  direction,
  absoluteTolerance = 0,
  driftPercent = 5,
) {
  if (
    baseline === null ||
    baseline === 0 ||
    !Number.isFinite(current) ||
    !Number.isFinite(baseline)
  ) {
    return { changed: 0, absoluteChanged: 0, exceed: false };
  }

  if (direction === 'higherBetter') {
    const degradePercent = ((baseline - current) / baseline) * 100;
    const absoluteChanged = baseline - current;
    return {
      changed: safeRound(degradePercent, 2),
      absoluteChanged: safeRound(absoluteChanged, 2),
      exceed: degradePercent > driftPercent && absoluteChanged > absoluteTolerance,
    };
  }

  const worsenPercent = ((current - baseline) / baseline) * 100;
  const absoluteChanged = current - baseline;
  return {
    changed: safeRound(worsenPercent, 2),
    absoluteChanged: safeRound(absoluteChanged, 2),
    exceed: worsenPercent > driftPercent && absoluteChanged > absoluteTolerance,
  };
}

export function isHardThresholdBreached(value, { direction, threshold }) {
  if (!Number.isFinite(value)) {
    return false;
  }
  if (direction === 'higherBetter') {
    return value < threshold;
  }
  return value > threshold;
}
