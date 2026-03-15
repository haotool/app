import { describe, it, expect } from 'vitest';
import {
  ARRIVAL_THRESHOLD_M,
  DEPARTURE_THRESHOLD_M,
  GEO_TIMEOUT_MS,
  STEP_THRESHOLD_MS2,
  STEP_DEBOUNCE_MS,
  INDOOR_ACCURACY_THRESHOLD_M,
  STEP_DISTANCE_M,
  DIRECTION_THRESHOLDS,
  getDirectionInfo,
} from '../useNavigation';

// ---------------------------------------------------------------------------
// 導航常數 SSOT — 確保所有閾值由單一來源匯出，測試可引用而非硬編碼
// ---------------------------------------------------------------------------

describe('導航常數（SSOT export）', () => {
  it('ARRIVAL_THRESHOLD_M 是正數（公尺）', () => expect(ARRIVAL_THRESHOLD_M).toBeGreaterThan(0));
  it('DEPARTURE_THRESHOLD_M > ARRIVAL_THRESHOLD_M（遲滯效果）', () =>
    expect(DEPARTURE_THRESHOLD_M).toBeGreaterThan(ARRIVAL_THRESHOLD_M));
  it('GEO_TIMEOUT_MS 是合理的逾時（5000–30000ms）', () => {
    expect(GEO_TIMEOUT_MS).toBeGreaterThanOrEqual(5000);
    expect(GEO_TIMEOUT_MS).toBeLessThanOrEqual(30000);
  });
  it('STEP_THRESHOLD_MS2 是正數加速度閾值', () => expect(STEP_THRESHOLD_MS2).toBeGreaterThan(0));
  it('STEP_DEBOUNCE_MS 是正數', () => expect(STEP_DEBOUNCE_MS).toBeGreaterThan(0));
  it('INDOOR_ACCURACY_THRESHOLD_M 是正數', () =>
    expect(INDOOR_ACCURACY_THRESHOLD_M).toBeGreaterThan(0));
  it('STEP_DISTANCE_M 是正數且小於 2 公尺', () => {
    expect(STEP_DISTANCE_M).toBeGreaterThan(0);
    expect(STEP_DISTANCE_M).toBeLessThan(2);
  });
});

describe('DIRECTION_THRESHOLDS（SSOT export）', () => {
  it('straight 邊界為正值', () => expect(DIRECTION_THRESHOLDS.straight).toBeGreaterThan(0));
  it('slightRight > straight', () =>
    expect(DIRECTION_THRESHOLDS.slightRight).toBeGreaterThan(DIRECTION_THRESHOLDS.straight));
  it('turnRight > slightRight', () =>
    expect(DIRECTION_THRESHOLDS.turnRight).toBeGreaterThan(DIRECTION_THRESHOLDS.slightRight));
  it('turnLeft > turnRight', () =>
    expect(DIRECTION_THRESHOLDS.turnLeft).toBeGreaterThan(DIRECTION_THRESHOLDS.turnRight));
  it('所有邊界都小於 360', () => {
    Object.values(DIRECTION_THRESHOLDS).forEach((v) => expect(v).toBeLessThan(360));
  });

  it('getDirectionInfo 在 straight 邊界內回傳 straight', () => {
    expect(getDirectionInfo(0).key).toBe('straight');
    expect(getDirectionInfo(DIRECTION_THRESHOLDS.straight).key).toBe('straight');
    expect(getDirectionInfo(360 - DIRECTION_THRESHOLDS.straight).key).toBe('straight');
  });
  it('getDirectionInfo 在 slightRight 邊界回傳 slight_right', () => {
    expect(getDirectionInfo(DIRECTION_THRESHOLDS.straight + 1).key).toBe('slight_right');
    expect(getDirectionInfo(DIRECTION_THRESHOLDS.slightRight).key).toBe('slight_right');
  });
  it('getDirectionInfo 在 turnRight 邊界回傳 turn_right', () => {
    expect(getDirectionInfo(DIRECTION_THRESHOLDS.slightRight + 1).key).toBe('turn_right');
    expect(getDirectionInfo(DIRECTION_THRESHOLDS.turnRight).key).toBe('turn_right');
  });
  it('getDirectionInfo 在 turnLeft 邊界回傳 turn_left', () => {
    expect(getDirectionInfo(DIRECTION_THRESHOLDS.turnRight + 1).key).toBe('turn_left');
    expect(getDirectionInfo(DIRECTION_THRESHOLDS.turnLeft).key).toBe('turn_left');
  });
  it('getDirectionInfo 在 turnLeft 之後回傳 slight_left', () => {
    expect(getDirectionInfo(DIRECTION_THRESHOLDS.turnLeft + 1).key).toBe('slight_left');
  });
});
