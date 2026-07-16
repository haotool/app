/**
 * deviceOrientation service 單元測試
 * 涵蓋 issue #716 新增：精度讀取、校準判定、wrap-safe EMA 平滑。
 */
import {
  getCompassAccuracy,
  needsCompassCalibration,
  smoothHeading,
  applyHeadingFreeze,
  COMPASS_LOW_ACCURACY_THRESHOLD_DEG,
  HEADING_FREEZE_DEADBAND_DEG,
  type CompassOrientationEvent,
} from '../deviceOrientation';

describe('getCompassAccuracy', () => {
  it('回傳 iOS webkitCompassAccuracy 數值', () => {
    const event = { webkitCompassAccuracy: 10 } as CompassOrientationEvent;
    expect(getCompassAccuracy(event)).toBe(10);
  });

  it('負值（無估計）原樣回傳', () => {
    const event = { webkitCompassAccuracy: -1 } as CompassOrientationEvent;
    expect(getCompassAccuracy(event)).toBe(-1);
  });

  it('Android（無欄位）回傳 null', () => {
    const event = {} as CompassOrientationEvent;
    expect(getCompassAccuracy(event)).toBeNull();
  });
});

describe('needsCompassCalibration', () => {
  it('null（Android/無資料）不觸發校準', () => {
    expect(needsCompassCalibration(null)).toBe(false);
  });

  it('正常精度（10°）不觸發', () => {
    expect(needsCompassCalibration(10)).toBe(false);
  });

  it('閾值邊界不觸發、超過閾值觸發', () => {
    expect(needsCompassCalibration(COMPASS_LOW_ACCURACY_THRESHOLD_DEG)).toBe(false);
    expect(needsCompassCalibration(COMPASS_LOW_ACCURACY_THRESHOLD_DEG + 1)).toBe(true);
  });

  it('最差精度 45° 觸發', () => {
    expect(needsCompassCalibration(45)).toBe(true);
  });

  it('負值（裝置無估計）觸發', () => {
    expect(needsCompassCalibration(-1)).toBe(true);
  });
});

describe('smoothHeading', () => {
  it('朝目標值以 alpha 比例逼近', () => {
    expect(smoothHeading(0, 100, 0.25)).toBeCloseTo(25);
  });

  it('359↔0 wrap：走最短弧不繞遠路', () => {
    // 350 → 10：最短弧 +20，一步 alpha=0.5 → 350+10=360→0
    expect(smoothHeading(350, 10, 0.5)).toBeCloseTo(0);
    // 10 → 350：最短弧 -20，一步 alpha=0.5 → 10-10=0
    expect(smoothHeading(10, 350, 0.5)).toBeCloseTo(0);
  });

  it('回傳值恆在 [0, 360)', () => {
    const result = smoothHeading(5, 355, 0.5);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(360);
  });

  it('連續套用收斂到目標值', () => {
    let value = 0;
    for (let i = 0; i < 50; i++) value = smoothHeading(value, 90);
    expect(value).toBeCloseTo(90, 0);
  });

  it('凍結死區常數為正且小於 5°（顯示級死區）', () => {
    expect(HEADING_FREEZE_DEADBAND_DEG).toBeGreaterThan(0);
    expect(HEADING_FREEZE_DEADBAND_DEG).toBeLessThan(5);
  });
});

describe('applyHeadingFreeze', () => {
  it('首樣本（anchor=null）不凍結，錨點更新為平滑值', () => {
    expect(applyHeadingFreeze(null, 90)).toEqual({ frozen: false, anchor: 90 });
  });

  it('死區內噪聲凍結，錨點保持不動', () => {
    const result = applyHeadingFreeze(90, 90 + HEADING_FREEZE_DEADBAND_DEG - 0.1);
    expect(result.frozen).toBe(true);
    expect(result.anchor).toBe(90);
  });

  it('超過死區解凍，錨點更新為新平滑值', () => {
    const next = 90 + HEADING_FREEZE_DEADBAND_DEG + 0.5;
    expect(applyHeadingFreeze(90, next)).toEqual({ frozen: false, anchor: next });
  });

  it('359↔0 wrap：跨界小差凍結、跨界大差解凍', () => {
    expect(applyHeadingFreeze(359.5, 0.2).frozen).toBe(true);
    expect(applyHeadingFreeze(359.5, 5).frozen).toBe(false);
  });

  it('自訂死區生效', () => {
    expect(applyHeadingFreeze(90, 93, 5).frozen).toBe(true);
    expect(applyHeadingFreeze(90, 93, 2).frozen).toBe(false);
  });
});
