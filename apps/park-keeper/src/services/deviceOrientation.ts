export interface CompassOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

/**
 * 手機「平放」判定閾值（beta 角度）。
 * beta = 0° → 完全平放（螢幕朝上），beta = 90° → 完全直立。
 * 設為 80°：只有手機幾乎完全豎立（方向感測器無法可靠判向）時才觸發警告，
 * 避免使用者自然持機走路（~50–70°）時被過度干擾。
 */
export const PHONE_FLAT_THRESHOLD_DEGREES = 80;

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

export function isPhoneFlatFromTilt(tilt: number | null): boolean {
  return tilt !== null && tilt < PHONE_FLAT_THRESHOLD_DEGREES;
}
