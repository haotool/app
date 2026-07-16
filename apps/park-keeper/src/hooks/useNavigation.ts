import { useState, useEffect, useRef, useCallback } from 'react';
import type { ParkingRecord } from '@app/park-keeper/types';
import {
  getCompassHeading,
  getCompassAccuracy,
  getDeviceTilt,
  isPhoneFlatFromTilt,
  needsCompassCalibration,
  smoothHeading,
  HEADING_FREEZE_DEADBAND_DEG,
} from '@app/park-keeper/services/deviceOrientation';

// ---------------------------------------------------------------------------
// Compass permission（iOS 13+ requestPermission 需使用者手勢）
// ---------------------------------------------------------------------------

/**
 * 羅盤感測器權限狀態：
 * - granted：可掛 listener（Android/桌面無 requestPermission 函式時視為 granted）
 * - prompt：iOS 需使用者手勢觸發授權，UI 應顯示「啟用羅盤」按鈕卡
 * - denied：被拒（含非手勢環境呼叫被 reject），UI 顯示開啟設定引導與重試
 */
export type CompassPermissionState = 'granted' | 'prompt' | 'denied';

interface PermissionRequester {
  requestPermission?: () => Promise<string>;
}

function getOrientationPermissionRequester(): (() => Promise<string>) | null {
  if (typeof DeviceOrientationEvent === 'undefined') return null;
  const requestPermission = (DeviceOrientationEvent as unknown as PermissionRequester)
    .requestPermission;
  return typeof requestPermission === 'function' ? requestPermission : null;
}

function getMotionPermissionRequester(): (() => Promise<string>) | null {
  if (typeof DeviceMotionEvent === 'undefined') return null;
  const requestPermission = (DeviceMotionEvent as unknown as PermissionRequester).requestPermission;
  return typeof requestPermission === 'function' ? requestPermission : null;
}

// ---------------------------------------------------------------------------
// Direction utilities
// ---------------------------------------------------------------------------

export type DirectionKey = 'straight' | 'slight_right' | 'turn_right' | 'turn_left' | 'slight_left';
export type DirectionIconType = 'straight' | 'slight-right' | 'right' | 'left' | 'slight-left';

export interface DirectionInfo {
  key: DirectionKey;
  i18nKey: string;
  iconType: DirectionIconType;
}

/**
 * 將相對旋轉角度（0–360°）對應為 5 段方向資訊。
 * 邊界：直走 ±25°、稍右/稍左 25°–70°、右轉/左轉 70°–180°。
 */
export function getDirectionInfo(relativeRotation: number): DirectionInfo {
  const r = ((relativeRotation % 360) + 360) % 360;
  const t = DIRECTION_THRESHOLDS;
  if (r <= t.straight || r >= 360 - t.straight)
    return { key: 'straight', i18nKey: 'nav.straight', iconType: 'straight' };
  if (r <= t.slightRight)
    return { key: 'slight_right', i18nKey: 'nav.slight_right', iconType: 'slight-right' };
  if (r <= t.turnRight) return { key: 'turn_right', i18nKey: 'nav.turn_right', iconType: 'right' };
  if (r <= t.turnLeft) return { key: 'turn_left', i18nKey: 'nav.turn_left', iconType: 'left' };
  return { key: 'slight_left', i18nKey: 'nav.slight_left', iconType: 'slight-left' };
}

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

/**
 * IGRF-13 simplified model for Taiwan/East-Asia region.
 * For global precision, use a full WMM/IGRF lookup table.
 */
export const estimateMagneticDeclination = (lat: number, lng: number) => {
  const baseDec = -4.5;
  const latCorr = (lat - 25) * 0.15;
  const lngCorr = (lng - 121) * 0.12;
  return baseDec + latCorr + lngCorr;
};

// ---------------------------------------------------------------------------
// 導航閾值常數（SSOT：所有閾值在此定義並 export，外部可直接引用不重複硬編碼）
// ---------------------------------------------------------------------------

/** 步伐偵測加速度閾值（m/s²）。 */
export const STEP_THRESHOLD_MS2 = 11.5;
/** 步伐防抖間隔（ms）。 */
export const STEP_DEBOUNCE_MS = 400;
/** 室內模式 GPS 精度閾值（公尺；超過即判定為室內）。 */
export const INDOOR_ACCURACY_THRESHOLD_M = 20;
/** 每步距離估算（公尺）。 */
export const STEP_DISTANCE_M = 0.7;
/** 抵達判定閾值（公尺）。 */
export const ARRIVAL_THRESHOLD_M = 8;
/** 離開抵達狀態閾值（公尺；大於 ARRIVAL_THRESHOLD_M 形成遲滯）。 */
export const DEPARTURE_THRESHOLD_M = 15;
/** Geolocation watchPosition 逾時（ms）。 */
export const GEO_TIMEOUT_MS = 15000;
/** 方向分段邊界（度）。直走 ±straight°、稍轉 straight–slightRight°、轉彎 slightRight–turnRight/turnLeft°。 */
export const DIRECTION_THRESHOLDS = {
  straight: 25,
  slightRight: 70,
  turnRight: 180,
  turnLeft: 290,
} as const;

const HEADING_SMOOTHING_ALPHA = 0.25;

export function useNavigation(record: ParkingRecord) {
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState(0);
  const [animHeading, setAnimHeading] = useState(0);
  const prevHeadingRef = useRef(0);
  const virtualHeadingRef = useRef(0);
  const smoothedHeadingRef = useRef(0);
  // 靜止凍結錨點：顯示值與平滑值偏差低於死區時不更新，消除感測噪聲微震。
  const frozenHeadingRef = useRef<number | null>(null);
  const [deviceTilt, setDeviceTilt] = useState(0);
  const [isPhoneFlat, setIsPhoneFlat] = useState(false);
  const isPhoneFlatRef = useRef(false);
  const [distance, setDistance] = useState<number | null>(null);
  const distanceRef = useRef<number | null>(null);
  const [targetBearing, setTargetBearing] = useState(0);
  const [animTargetBearing, setAnimTargetBearing] = useState(0);
  const prevTargetRef = useRef(0);
  const virtualTargetRef = useRef(0);
  const [stepCount, setStepCount] = useState(0);
  const [isIndoor, setIsIndoor] = useState(false);
  const isIndoorRef = useRef(false);
  const [arrivedState, setArrivedState] = useState(false);
  const [magneticDeclination, setMagneticDeclination] = useState(0);
  // iOS 無手勢呼叫 requestPermission 必被拒；初始為 prompt，由 UI 手勢觸發授權。
  const [permissionState, setPermissionState] = useState<CompassPermissionState>(() =>
    getOrientationPermissionRequester() ? 'prompt' : 'granted',
  );
  const [compassAccuracy, setCompassAccuracy] = useState<number | null>(null);
  const watchId = useRef<number | null>(null);
  const lastStepTime = useRef(0);

  const handleMotion = useCallback((e: DeviceMotionEvent) => {
    if (!isIndoorRef.current) return;
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;
    const mag = Math.sqrt((acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2);
    const now = Date.now();
    if (mag > STEP_THRESHOLD_MS2 && now - lastStepTime.current > STEP_DEBOUNCE_MS) {
      setStepCount((prev) => prev + 1);
      lastStepTime.current = now;
      if (distanceRef.current !== null) {
        setDistance((d) => Math.max(0, (d ?? 0) - STEP_DISTANCE_M));
      }
    }
  }, []);

  // GPS 追蹤：與感測器權限無關，進入導航即開始。
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

          if (record.latitude != null && record.longitude != null) {
            const dist = getDistance(uLat, uLng, record.latitude, record.longitude);
            setDistance(dist);
            distanceRef.current = dist;
            setArrivedState((prev) =>
              prev ? dist <= DEPARTURE_THRESHOLD_M : dist < ARRIVAL_THRESHOLD_M,
            );
            const bearing = getBearing(uLat, uLng, record.latitude, record.longitude);
            let diff = bearing - prevTargetRef.current;
            if (diff > 180) diff -= 360;
            else if (diff < -180) diff += 360;
            virtualTargetRef.current += diff;
            prevTargetRef.current = bearing;
            setTargetBearing(bearing);
            setAnimTargetBearing(virtualTargetRef.current);

            const indoor = accuracy > INDOOR_ACCURACY_THRESHOLD_M;
            setIsIndoor(indoor);
            isIndoorRef.current = indoor;
            if (!indoor) setStepCount(0);
          }
        },
        undefined,
        { enableHighAccuracy: true, maximumAge: 0, timeout: GEO_TIMEOUT_MS },
      );
    }

    return () => {
      if (watchId.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [record]);

  // 感測器 listener：僅在 granted 後掛載（iOS 授權前事件不觸發，Android 直接 granted）。
  useEffect(() => {
    if (permissionState !== 'granted') return undefined;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const h = getCompassHeading(e);
      const tilt = getDeviceTilt(e);
      setCompassAccuracy(getCompassAccuracy(e));

      if (h !== null) {
        const smoothed = smoothHeading(smoothedHeadingRef.current, h, HEADING_SMOOTHING_ALPHA);
        smoothedHeadingRef.current = smoothed;

        // 靜止凍結：平滑值與顯示錨點的最短弧差低於死區時，不更新顯示值。
        const anchor = frozenHeadingRef.current;
        let frozen = false;
        if (anchor !== null) {
          let anchorDiff = smoothed - anchor;
          if (anchorDiff > 180) anchorDiff -= 360;
          else if (anchorDiff < -180) anchorDiff += 360;
          frozen = Math.abs(anchorDiff) < HEADING_FREEZE_DEADBAND_DEG;
        }
        if (!frozen) {
          frozenHeadingRef.current = smoothed;

          let diff = smoothed - prevHeadingRef.current;
          if (diff > 180) diff -= 360;
          else if (diff < -180) diff += 360;
          virtualHeadingRef.current += diff;
          prevHeadingRef.current = smoothed;
          setHeading(smoothed);
          setAnimHeading(virtualHeadingRef.current);
        }
      }
      if (tilt !== null) {
        setDeviceTilt(tilt);
        const flat = isPhoneFlatFromTilt(tilt, isPhoneFlatRef.current);
        if (flat !== isPhoneFlatRef.current) {
          isPhoneFlatRef.current = flat;
          setIsPhoneFlat(flat);
        }
      }
    };

    window.addEventListener('deviceorientation', handleOrientation as EventListener);
    window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener);
    window.addEventListener('devicemotion', handleMotion);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation as EventListener);
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener);
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [permissionState, handleMotion]);

  // 必須在使用者手勢（tap handler）同步呼叫堆疊內執行，否則 iOS 直接 reject。
  const requestCompassPermission = useCallback(async () => {
    const requestOrientation = getOrientationPermissionRequester();
    if (!requestOrientation) {
      setPermissionState('granted');
      return;
    }
    try {
      const res = await requestOrientation();
      if (res === 'granted') {
        // DeviceMotion（步數計數）為 iOS 獨立權限；失敗靜默降級，不阻斷羅盤。
        const requestMotion = getMotionPermissionRequester();
        if (requestMotion) await requestMotion().catch(() => undefined);
        setPermissionState('granted');
      } else {
        setPermissionState('denied');
      }
    } catch {
      // NotAllowedError（非手勢呼叫）或使用者拒絕 → 顯示引導卡。
      setPermissionState('denied');
    }
  }, []);

  const trueHeading = (heading + magneticDeclination + 360) % 360;
  const relativeRotation = (targetBearing - trueHeading + 360) % 360;
  const trueAnimHeading = animHeading + magneticDeclination;
  const hasValidLocation = userLoc !== null;
  const needsCalibration = needsCompassCalibration(compassAccuracy);

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
    arrivedState,
    hasValidLocation,
    permissionState,
    requestCompassPermission,
    compassAccuracy,
    needsCalibration,
  };
}
