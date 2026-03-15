/**
 * useDeviceOrientation Hook - 手機方向感測器
 *
 * 功能：
 * - 偵測手機指向方向（0-360 度，0=正北）
 * - 支援 iOS (webkitCompassHeading) 與 Android (alpha)
 * - 權限請求支援（iOS 13+）
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getCompassHeading,
  getDeviceTilt,
  isPhoneFlatFromTilt,
  type CompassOrientationEvent,
} from '@app/park-keeper/services/deviceOrientation';

export interface DeviceOrientationState {
  heading: number | null; // 0-360 度，0=正北，90=正東，180=正南，270=正西
  tilt: number | null;
  isPhoneFlat: boolean;
  isSupported: boolean;
  requestPermission?: () => Promise<void>;
}

export interface UseDeviceOrientationOptions {
  enabled?: boolean;
}

/**
 * Device orientation hook that tracks compass heading
 *
 * @returns {DeviceOrientationState} Compass heading and support status
 *
 * @example
 * ```tsx
 * const { heading, isSupported, requestPermission } = useDeviceOrientation();
 *
 * if (!isSupported) {
 *   return <div>方向感測器不支援</div>;
 * }
 *
 * if (requestPermission) {
 *   // iOS 13+ requires permission
 *   await requestPermission();
 * }
 *
 * return <div>目前朝向：{heading}°</div>;
 * ```
 */
export function useDeviceOrientation(
  options: UseDeviceOrientationOptions = {},
): DeviceOrientationState {
  const { enabled = true } = options;
  const [heading, setHeading] = useState<number | null>(null);
  const [tilt, setTilt] = useState<number | null>(null);
  const [isPhoneFlat, setIsPhoneFlat] = useState(false);
  const isPhoneFlatRef = useRef(false);
  const [isSupported] = useState(
    () => typeof window !== 'undefined' && 'DeviceOrientationEvent' in window,
  );

  // Request permission (iOS 13+)
  const requestPermission = useCallback(async () => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
        .requestPermission === 'function'
    ) {
      const permission = await (
        DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }
      ).requestPermission();
      if (permission !== 'granted') {
        throw new Error('Device orientation permission denied');
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled || !isSupported) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const compassHeading = getCompassHeading(event as CompassOrientationEvent);
      const deviceTilt = getDeviceTilt(event as CompassOrientationEvent);

      if (compassHeading !== null && compassHeading !== undefined) {
        setHeading(compassHeading);
      }

      if (deviceTilt !== null) {
        setTilt(deviceTilt);
        const flat = isPhoneFlatFromTilt(deviceTilt, isPhoneFlatRef.current);
        if (flat !== isPhoneFlatRef.current) {
          isPhoneFlatRef.current = flat;
          setIsPhoneFlat(flat);
        }
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('deviceorientationabsolute', handleOrientation);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
    };
  }, [enabled, isSupported]);

  return {
    heading,
    tilt,
    isPhoneFlat,
    isSupported,
    requestPermission:
      enabled &&
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
        .requestPermission === 'function'
        ? requestPermission
        : undefined,
  };
}
