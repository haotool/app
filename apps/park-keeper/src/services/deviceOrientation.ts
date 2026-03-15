export interface CompassOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

/**
 * 手機「非平放」進入閾值（beta 角度）。
 * beta = 0° → 完全平放（螢幕朝上），beta = 90° → 完全直立。
 * 手機從平放狀態往上抬，超過此角度才切換為「非平放」並觸發警告。
 * 設為 75°：使用者走路自然持機（~50–70°）不觸發，幾乎完全豎立才提示。
 */
export const PHONE_FLAT_THRESHOLD_DEGREES = 75;

/**
 * 手機「平放」恢復閾值（遲滯，Hysteresis）。
 * 手機從非平放狀態往下放，低於此角度才恢復「平放」狀態，避免邊界抖動。
 * 必須小於 PHONE_FLAT_THRESHOLD_DEGREES 才能形成有效遲滯帶（55° < 75°）。
 */
export const PHONE_FLAT_HYSTERESIS_DEGREES = 55;

export function getCompassHeading(event: CompassOrientationEvent): number | null {
  if (typeof event.webkitCompassHeading === 'number') {
    return event.webkitCompassHeading;
  }

  if (typeof event.alpha === 'number' && event.absolute === true) {
    return (360 - event.alpha + 360) % 360;
  }

  return null;
}

export function getDeviceTilt(event: CompassOrientationEvent): number | null {
  if (typeof event.beta === 'number') {
    return Math.abs(event.beta);
  }

  return null;
}

/**
 * 依 beta 仰角與前一狀態判斷手機是否處於「平放」。
 * 加入遲滯（Hysteresis）避免在閾值邊界反覆切換：
 *   - 平放 → 非平放：tilt >= PHONE_FLAT_THRESHOLD_DEGREES（75°）
 *   - 非平放 → 平放：tilt <  PHONE_FLAT_HYSTERESIS_DEGREES（55°）
 * tilt=null（未取得感測器資料）時保守回傳 false（非平放，顯示警告）。
 */
export function isPhoneFlatFromTilt(tilt: number | null, prevFlat: boolean): boolean {
  if (tilt === null) return false;
  const threshold = prevFlat ? PHONE_FLAT_THRESHOLD_DEGREES : PHONE_FLAT_HYSTERESIS_DEGREES;
  return tilt < threshold;
}
