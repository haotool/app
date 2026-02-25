import { useState, useEffect, useRef } from 'react';
import type { ParkingRecord } from '@app/park-keeper/types';

export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const getBearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

const estimateMagneticDeclination = (_lat: number, lng: number) => lng / 10 - 5;

export function useNavigation(record: ParkingRecord) {
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState(0);
  const [animHeading, setAnimHeading] = useState(0);
  const prevHeadingRef = useRef(0);
  const virtualHeadingRef = useRef(0);
  const [deviceTilt, setDeviceTilt] = useState(0);
  const [distance, setDistance] = useState<number | null>(null);
  const [targetBearing, setTargetBearing] = useState(0);
  const [animTargetBearing, setAnimTargetBearing] = useState(0);
  const prevTargetRef = useRef(0);
  const virtualTargetRef = useRef(0);
  const [stepCount, setStepCount] = useState(0);
  const [isIndoor, setIsIndoor] = useState(false);
  const [magneticDeclination, setMagneticDeclination] = useState(0);
  const watchId = useRef<number | null>(null);
  const lastStepTime = useRef(0);

  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);

    if (navigator.geolocation) {
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const uLat = pos.coords.latitude;
          const uLng = pos.coords.longitude;
          const accuracy = pos.coords.accuracy;
          setUserLoc({ lat: uLat, lng: uLng });
          setMagneticDeclination(estimateMagneticDeclination(uLat, uLng));

          if (record.latitude && record.longitude) {
            const dist = getDistance(uLat, uLng, record.latitude, record.longitude);
            setDistance(dist);
            const bearing = getBearing(uLat, uLng, record.latitude, record.longitude);
            let diff = bearing - prevTargetRef.current;
            if (diff > 180) diff -= 360;
            else if (diff < -180) diff += 360;
            virtualTargetRef.current += diff;
            prevTargetRef.current = bearing;
            setTargetBearing(bearing);
            setAnimTargetBearing(virtualTargetRef.current);
            setIsIndoor(accuracy > 20);
            if (accuracy <= 20) setStepCount(0);
          }
        },
        undefined,
        { enableHighAccuracy: true },
      );
    }

    const handleOrientation = (e: DeviceOrientationEvent & { webkitCompassHeading?: number }) => {
      let h: number | null = null;
      if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;
      else if (e.alpha !== null) h = 360 - (e.alpha ?? 0);

      if (h !== null) {
        let diff = h - prevHeadingRef.current;
        if (diff > 180) diff -= 360;
        else if (diff < -180) diff += 360;
        virtualHeadingRef.current += diff;
        prevHeadingRef.current = h;
        setHeading(h);
        setAnimHeading(virtualHeadingRef.current);
      }
      if (e.beta) setDeviceTilt(Math.abs(e.beta));
    };

    const handleMotion = (e: DeviceMotionEvent) => {
      if (!isIndoor) return;
      const acc = e.accelerationIncludingGravity;
      if (acc) {
        const mag = Math.sqrt((acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2);
        const now = Date.now();
        if (mag > 11.5 && now - lastStepTime.current > 500) {
          setStepCount((prev) => prev + 1);
          lastStepTime.current = now;
          if (distance !== null) setDistance((d) => Math.max(0, (d ?? 0) - 0.7));
        }
      }
    };

    const requestPermission = (
      DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
    ).requestPermission;
    if (typeof requestPermission === 'function') {
      void requestPermission().then((res: string) => {
        if (res === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation as EventListener);
          window.addEventListener('devicemotion', handleMotion);
        }
      });
    } else {
      window.addEventListener('deviceorientation', handleOrientation as EventListener);
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      window.removeEventListener('deviceorientation', handleOrientation as EventListener);
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [record, isIndoor, distance]);

  const trueHeading = (heading + magneticDeclination + 360) % 360;
  const relativeRotation = (targetBearing - trueHeading + 360) % 360;
  const trueAnimHeading = animHeading + magneticDeclination;
  const isPhoneFlat = deviceTilt < 45;

  return {
    userLoc,
    heading,
    animHeading,
    trueAnimHeading,
    deviceTilt,
    distance,
    targetBearing,
    animTargetBearing,
    stepCount,
    isIndoor,
    magneticDeclination,
    relativeRotation,
    isPhoneFlat,
  };
}
