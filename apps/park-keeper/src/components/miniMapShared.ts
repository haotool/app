/**
 * miniMapShared — MiniMap 共用型別、常數、幾何純函式與 marker 圖示工廠。
 * 自 MiniMap.tsx 純搬移拆出（issue #733 可維護性；行為零變更）。
 */
import L from 'leaflet';
import type { ThemeConfig } from '@app/park-keeper/types';

export interface MiniMapText {
  markerCarLabel: string;
  markerUserLabel: string;
  legendCurrentLabel: string;
  legendCarLabel: string;
  dragCarHintLabel: string;
  ariaInteractiveSelectionLabel: string;
  ariaInteractiveTrackingLabel: string;
  ariaStaticLabel: string;
}

export interface MapViewportInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const DEFAULT_MAP_ZOOM = 17;
export const STATIC_MIN_ZOOM = 10;
export const INTERACTIVE_MIN_ZOOM = 1;
export const USER_FOLLOW_PAUSE_MS = 10_000;
export const MOVEMENT_THRESHOLD_METERS = 6;
export const MOVEMENT_CONTINUITY_WINDOW_MS = 15_000;
export const PROGRAMMATIC_GESTURE_GUARD_MS = 800;
export const DEFAULT_TRACKED_VIEWPORT_INSETS: MapViewportInsets = {
  top: 80,
  right: 80,
  bottom: 80,
  left: 80,
};
export const DEFAULT_MINI_MAP_TEXT: MiniMapText = {
  markerCarLabel: 'Car',
  markerUserLabel: 'You',
  legendCurrentLabel: 'Current',
  legendCarLabel: 'Car',
  dragCarHintLabel: 'Drag car to adjust',
  ariaInteractiveSelectionLabel: 'Interactive map for parking location selection',
  ariaInteractiveTrackingLabel:
    'Interactive map showing current location and parked vehicle location',
  ariaStaticLabel: 'Static map showing parking location',
};

/**
 * Clamp latitude to valid range [-90, 90]
 * @param lat - Input latitude
 * @returns Clamped latitude
 */
export const clampLatitude = (lat: number): number => {
  return Math.max(-90, Math.min(90, lat));
};

/**
 * Normalize longitude to valid range [-180, 180]
 * @param lng - Input longitude
 * @returns Normalized longitude
 */
export const normalizeLongitude = (lng: number): number => {
  let normalized = lng % 360;
  if (normalized > 180) normalized -= 360;
  if (normalized < -180) normalized += 360;
  return normalized;
};

/**
 * Calculate maxBounds with padding for map boundaries
 * Best Practice: Prevent unnecessary tile loading and user confusion
 * @param centerLat - Center latitude
 * @param centerLng - Center longitude
 * @param userLat - Optional user latitude
 * @param userLng - Optional user longitude
 * @returns Bounds array [[minLat, minLng], [maxLat, maxLng]]
 */
export const calculateMaxBounds = (
  centerLat: number,
  centerLng: number,
  userLat?: number,
  userLng?: number,
): [[number, number], [number, number]] => {
  const padding = 0.05; // ~5.5 km at equator

  if (typeof userLat === 'number' && typeof userLng === 'number') {
    const minLat = Math.min(centerLat, userLat) - padding;
    const maxLat = Math.max(centerLat, userLat) + padding;
    const minLng = Math.min(centerLng, userLng) - padding;
    const maxLng = Math.max(centerLng, userLng) + padding;
    return [
      [clampLatitude(minLat), normalizeLongitude(minLng)],
      [clampLatitude(maxLat), normalizeLongitude(maxLng)],
    ];
  }

  return [
    [clampLatitude(centerLat - padding), normalizeLongitude(centerLng - padding)],
    [clampLatitude(centerLat + padding), normalizeLongitude(centerLng + padding)],
  ];
};

const createMarkerLabelBadge = (label: string, backgroundColor: string, textColor: string) => {
  return `
    <div style="
      position:absolute;
      top:-18px;
      left:50%;
      transform:translateX(-50%);
      padding:3px 8px;
      border-radius:999px;
      background:${backgroundColor};
      color:${textColor};
      border:1px solid rgba(255,255,255,0.24);
      box-shadow:0 2px 8px rgba(0,0,0,0.2);
      font:700 10px/1 system-ui,-apple-system,sans-serif;
      white-space:nowrap;
      letter-spacing:0.02em;
      pointer-events:none;
      z-index:20;
    ">${label}</div>`;
};

/** Marker 標籤徽章配色：surface 底＋text 字，跟隨主題（深色主題自動深底白字）。 */
export const badgeColorsFromTheme = (theme: ThemeConfig) => ({
  bg: `${theme.colors.surface}E6`,
  text: theme.colors.text,
});

export const createPremiumCarIcon = (
  color: string,
  isInteractive: boolean,
  showLabel: boolean,
  markerLabel: string,
  rotationDegrees: number,
  labelColors: { bg: string; text: string },
) => {
  const filterDef = isInteractive
    ? `<filter id="carGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>`
    : '';

  const pulse = isInteractive
    ? `<circle r="20" fill="${color}" opacity="0.2">
        <animate attributeName="r" values="20;28;20" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
      </circle>`
    : '';

  const label = showLabel
    ? createMarkerLabelBadge(markerLabel, labelColors.bg, labelColors.text)
    : '';

  const svgString = `
    <div style="width:40px;height:60px;position:relative;overflow:visible">
      ${label}
      <svg viewBox="0 0 40 60" width="40" height="60" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;position:absolute;inset:0">
        <defs>${filterDef}</defs>
        <g transform="translate(20,30) rotate(${rotationDegrees})">
          ${pulse}
          <rect x="-12" y="-24" width="24" height="48" rx="4" fill="${color}" stroke="${color}" stroke-width="0.5" stroke-opacity="0.8" ${isInteractive ? 'filter="url(#carGlow)"' : ''} />
          <path d="M-9-22L9-22L12-10L-12-10Z" fill="rgba(255,255,255,0.15)"/>
          <path d="M-7-10Q0-12 7-10L7-4Q0-6-7-4Z" fill="rgba(200,230,255,0.6)" stroke="rgba(255,255,255,0.5)" stroke-width="0.5"/>
          <rect x="-10" y="-4" width="20" height="20" rx="2" fill="rgba(0,0,0,0.1)"/>
          <rect x="-7" y="16" width="14" height="4" rx="1" fill="rgba(200,230,255,0.4)"/>
          <path d="M0-32L3-26L-3-26Z" fill="${color}" stroke="white" stroke-width="1" opacity="0.9"/>
        </g>
      </svg>
    </div>`;

  return L.divIcon({
    className: 'premium-car-marker',
    html: svgString,
    iconSize: [40, 60],
    iconAnchor: [20, 30],
    popupAnchor: [0, -30],
  });
};

export const createUserIcon = (
  heading: number,
  color: string,
  showLabel: boolean,
  markerLabel: string,
  labelColors: { bg: string; text: string },
) => {
  // 標籤放在光束上方，偏移需大於光束高度（~29px + margin）。
  const labelHtml = showLabel
    ? `<div style="
        position:absolute;
        top:-44px;
        left:50%;
        transform:translateX(-50%);
        padding:3px 8px;
        border-radius:999px;
        background:${labelColors.bg};
        color:${labelColors.text};
        border:1px solid rgba(255,255,255,0.24);
        box-shadow:0 2px 8px rgba(0,0,0,0.2);
        font:700 10px/1 system-ui,-apple-system,sans-serif;
        white-space:nowrap;
        letter-spacing:0.02em;
        pointer-events:none;
        z-index:20;
      ">${markerLabel}</div>`
    : '';

  // 光束錐形路徑（0°=正北朝上）：中心(60,60)，半角37.5°，長度52px。
  // 計算：L(28,19) = 60-52*sin37.5°, 60-52*cos37.5° ≈ (28,19)
  //       R(92,19) = 60+52*sin37.5°, 60-52*cos37.5° ≈ (92,19)
  // SVG 以 rotate(heading, 60, 60) 旋轉整個錐形，0°→北，90°→東。
  return L.divIcon({
    className: 'user-loc-marker',
    html: `
      <div style="width:24px;height:24px;position:relative;overflow:visible;pointer-events:none">
        ${labelHtml}
        <svg viewBox="0 0 120 120" width="120" height="120" xmlns="http://www.w3.org/2000/svg"
          style="position:absolute;top:12px;left:12px;transform:translate(-50%,-50%);overflow:visible;pointer-events:none">
          <defs>
            <radialGradient id="ubg" cx="60" cy="60" r="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stop-color="${color}" stop-opacity="0.52"/>
              <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <!-- 精度暈圈（裝飾，固定半徑）-->
          <circle cx="60" cy="60" r="28" fill="${color}" fill-opacity="0.10"/>
          <!-- 方向光束錐形，依 heading 旋轉 -->
          <g transform="rotate(${heading}, 60, 60)">
            <path d="M 60 60 L 28 19 A 52 52 0 0 1 92 19 Z" fill="url(#ubg)"/>
          </g>
          <!-- 陰影層（深度感）-->
          <circle cx="60" cy="61" r="9" fill="rgba(0,0,0,0.18)"/>
          <!-- 白色環框 -->
          <circle cx="60" cy="60" r="9" fill="white"/>
          <!-- 主色圓點 -->
          <circle cx="60" cy="60" r="7" fill="${color}"/>
        </svg>
      </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export const fitMapToCarAndUser = (
  map: L.Map,
  carPosition: [number, number],
  userPosition: [number, number],
  animate: boolean,
  viewportInsets: MapViewportInsets,
) => {
  const bounds = L.latLngBounds([carPosition, userPosition]);
  map.fitBounds(bounds, {
    paddingTopLeft: [viewportInsets.left, viewportInsets.top],
    paddingBottomRight: [viewportInsets.right, viewportInsets.bottom],
    animate,
    maxZoom: DEFAULT_MAP_ZOOM,
    duration: animate ? 0.35 : undefined,
    easeLinearity: 0.25,
  });
};

export const getDistanceInMeters = (start: [number, number], end: [number, number]) => {
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371e3;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const normalizedLat1 = toRadians(lat1);
  const normalizedLat2 = toRadians(lat2);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(normalizedLat1) * Math.cos(normalizedLat2) * Math.sin(deltaLng / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};
