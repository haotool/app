export interface CompassOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
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

/**
 * 讀取 iOS webkitCompassAccuracy（heading 誤差度數）。
 * 正值 = ±誤差度數（典型 ~10，最差 45）；負值 = 裝置無精度估計。
 * Android 無此欄位 → 回傳 null（不觸發校準引導）。
 */
export function getCompassAccuracy(event: CompassOrientationEvent): number | null {
  return typeof event.webkitCompassAccuracy === 'number' ? event.webkitCompassAccuracy : null;
}

/**
 * 低精度判定閾值（度）。超過此誤差（或負值無估計）視為需要 8 字校準。
 * iOS 最差精度為 45°，正常約 10°；取 30° 為引導觸發點。
 */
export const COMPASS_LOW_ACCURACY_THRESHOLD_DEG = 30;

/** 依 webkitCompassAccuracy 判定是否需要顯示校準引導。null（Android/無資料）不觸發。 */
export function needsCompassCalibration(accuracy: number | null): boolean {
  if (accuracy === null) return false;
  return accuracy < 0 || accuracy > COMPASS_LOW_ACCURACY_THRESHOLD_DEG;
}

/**
 * Heading 顯示凍結死區（度）。
 * 靜止時感測器噪聲（±1° 級）不更新顯示值，避免羅盤微震；
 * 與凍結錨點的累積偏移超過死區即解凍，緩慢旋轉不會永久卡死。
 */
export const HEADING_FREEZE_DEADBAND_DEG = 1.2;

/**
 * Heading 指數平滑（wrap-safe EMA）。
 * 最短弧差處理 359°↔0° 邊界；alpha 越低越平滑、延遲越大（建議 0.2–0.35）。
 */
export function smoothHeading(prev: number, raw: number, alpha = 0.25): number {
  let diff = raw - prev;
  if (diff > 180) diff -= 360;
  else if (diff < -180) diff += 360;
  return (((prev + alpha * diff) % 360) + 360) % 360;
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
