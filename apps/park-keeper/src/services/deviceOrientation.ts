export interface CompassOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

export const PHONE_FLAT_THRESHOLD_DEGREES = 45;

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
