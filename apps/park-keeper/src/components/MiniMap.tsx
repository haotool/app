import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { ThemeConfig } from '@app/park-keeper/types';
import { useMapPerformance, calculateTileSettings } from '@app/park-keeper/hooks/useMapPerformance';

interface MiniMapProps {
  lat: number;
  lng: number;
  userLat?: number;
  userLng?: number;
  heading?: number;
  theme: ThemeConfig;
  interactive?: boolean;
  allowZoom?: boolean;
  showZoomControl?: boolean;
  lockBounds?: boolean;
  autoFitTrackedPositions?: boolean;
  showRecenterButton?: boolean;
  recenterLabel?: string;
  text?: Partial<MiniMapText>;
  onLocationSelect?: (lat: number, lng: number) => void;
  className?: string;
  mapKey?: string;
  cacheDurationDays?: number;
  photoData?: string;
  onPhotoClick?: () => void;
  parkedHeading?: number;
  trackedViewportInsets?: Partial<MapViewportInsets>;
  photoOffset?: { x: number; y: number };
  onPhotoPositionChange?: (offset: { x: number; y: number }) => void;
}

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

const DEFAULT_MAP_ZOOM = 17;
const STATIC_MIN_ZOOM = 10;
const INTERACTIVE_MIN_ZOOM = 1;
const USER_FOLLOW_PAUSE_MS = 10_000;
const MOVEMENT_THRESHOLD_METERS = 6;
const MOVEMENT_CONTINUITY_WINDOW_MS = 15_000;
const PROGRAMMATIC_GESTURE_GUARD_MS = 800;
const DEFAULT_TRACKED_VIEWPORT_INSETS: MapViewportInsets = {
  top: 80,
  right: 80,
  bottom: 80,
  left: 80,
};
const DEFAULT_MINI_MAP_TEXT: MiniMapText = {
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
const clampLatitude = (lat: number): number => {
  return Math.max(-90, Math.min(90, lat));
};

/**
 * Normalize longitude to valid range [-180, 180]
 * @param lng - Input longitude
 * @returns Normalized longitude
 */
const normalizeLongitude = (lng: number): number => {
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
const calculateMaxBounds = (
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

const createMarkerLabelBadge = (label: string, backgroundColor: string) => {
  return `
    <div style="
      position:absolute;
      top:-18px;
      left:50%;
      transform:translateX(-50%);
      padding:3px 8px;
      border-radius:999px;
      background:${backgroundColor};
      color:#fff;
      border:1px solid rgba(255,255,255,0.24);
      box-shadow:0 2px 8px rgba(0,0,0,0.2);
      font:700 10px/1 system-ui,-apple-system,sans-serif;
      white-space:nowrap;
      letter-spacing:0.02em;
      pointer-events:none;
      z-index:20;
    ">${label}</div>`;
};

const createPremiumCarIcon = (
  color: string,
  isInteractive: boolean,
  showLabel: boolean,
  markerLabel: string,
  photoData?: string,
  rotationDegrees = 0,
  photoOffset = { x: 0, y: -80 },
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

  const label = showLabel ? createMarkerLabelBadge(markerLabel, '#0f172ad9') : '';

  // Photo thumbnail positioned relative to car marker (draggable)
  // Constrain offset to ±50px range for reasonable positioning
  const constrainedOffset = {
    x: Math.max(-50, Math.min(50, photoOffset.x)),
    y: Math.max(-130, Math.min(-30, photoOffset.y)),
  };

  const photoThumbnail = photoData
    ? `<img
        src="${photoData}"
        alt="Parking spot photo"
        style="
          position:absolute;
          top:${constrainedOffset.y}px;
          left:calc(50% + ${constrainedOffset.x}px);
          transform:translateX(-50%);
          width:60px;
          height:60px;
          object-fit:cover;
          border-radius:8px;
          border:2px solid white;
          box-shadow:0 4px 12px rgba(0,0,0,0.3);
          cursor:move;
          pointer-events:auto;
          z-index:30;
          transition:box-shadow 0.2s ease;
          touch-action:none;
        "
        class="parking-photo-thumbnail draggable-photo"
        data-draggable="true"
      />`
    : '';

  const svgString = `
    <div style="width:40px;height:${photoData ? '140px' : '60px'};position:relative;overflow:visible">
      ${photoThumbnail}
      ${label}
      <svg viewBox="0 0 40 60" width="40" height="60" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;position:absolute;${photoData ? 'bottom:0' : 'inset:0'}">
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
    iconSize: [40, photoData ? 140 : 60],
    iconAnchor: [20, photoData ? 140 : 30],
    popupAnchor: [0, photoData ? -140 : -30],
  });
};

const createUserIcon = (
  heading = 0,
  color = '#3b82f6',
  showLabel = false,
  markerLabel = DEFAULT_MINI_MAP_TEXT.markerUserLabel,
) =>
  L.divIcon({
    className: 'user-loc-marker',
    html: `
      <div style="width:24px;height:24px;position:relative;display:flex;align-items:center;justify-content:center;overflow:visible">
        ${showLabel ? createMarkerLabelBadge(markerLabel, '#2563ebeb') : ''}
        <div style="position:absolute;top:50%;left:50%;width:0;height:0;border-left:20px solid transparent;border-right:20px solid transparent;border-bottom:60px solid ${color}40;transform:translate(-50%,-50%) rotate(${heading}deg);transform-origin:center bottom;margin-top:-30px;pointer-events:none;z-index:0;opacity:0.5"></div>
        <div style="width:16px;height:16px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 5px rgba(0,0,0,0.3);z-index:10;position:relative"></div>
      </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

const fitMapToCarAndUser = (
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

const getDistanceInMeters = (start: [number, number], end: [number, number]) => {
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

function MapController({
  center,
  userLoc,
  interactive,
  zoomEnabled,
  autoFitTrackedPositions,
  recenterRequestId,
  cacheDurationDays = 7,
  trackedViewportInsets,
}: {
  center: [number, number];
  userLoc?: [number, number];
  interactive: boolean;
  zoomEnabled: boolean;
  autoFitTrackedPositions: boolean;
  recenterRequestId: number;
  cacheDurationDays?: number;
  trackedViewportInsets: MapViewportInsets;
}) {
  const map = useMap();
  const didInitRef = useRef(false);
  const lastViewportKeyRef = useRef<string>('');
  const lastTrackedUserLocRef = useRef<[number, number] | null>(null);
  const lastMeaningfulMovementAtRef = useRef(0);
  const autoFitPausedUntilRef = useRef(0);
  const gestureGuardUntilRef = useRef(0);

  // Apply performance optimization based on cache settings
  useMapPerformance({
    cacheDurationDays,
    interactive,
    zoomEnabled,
  });

  useEffect(() => {
    if (!interactive || typeof map.on !== 'function' || typeof map.off !== 'function') {
      return undefined;
    }

    const handleManualGesture = () => {
      if (Date.now() < gestureGuardUntilRef.current) {
        return;
      }

      autoFitPausedUntilRef.current = Date.now() + USER_FOLLOW_PAUSE_MS;
    };

    map.on('zoomstart', handleManualGesture);
    map.on('dragstart', handleManualGesture);

    return () => {
      map.off('zoomstart', handleManualGesture);
      map.off('dragstart', handleManualGesture);
    };
  }, [interactive, map]);

  useEffect(() => {
    const runProgrammaticViewportUpdate = (callback: () => void) => {
      gestureGuardUntilRef.current = Date.now() + PROGRAMMATIC_GESTURE_GUARD_MS;
      callback();
    };

    const fitTrackedBounds = (animate: boolean) => {
      if (!userLoc) return;

      runProgrammaticViewportUpdate(() => {
        fitMapToCarAndUser(map, center, userLoc, animate, trackedViewportInsets);
      });
    };

    const getMovementState = (nextUserLoc: [number, number]) => {
      const previousUserLoc = lastTrackedUserLocRef.current;
      lastTrackedUserLocRef.current = nextUserLoc;

      if (!previousUserLoc) {
        return 'initial';
      }

      const movementDistance = getDistanceInMeters(previousUserLoc, nextUserLoc);
      if (movementDistance < MOVEMENT_THRESHOLD_METERS) {
        return 'steady';
      }

      const now = Date.now();
      const isContinuousMovement =
        lastMeaningfulMovementAtRef.current > 0 &&
        now - lastMeaningfulMovementAtRef.current <= MOVEMENT_CONTINUITY_WINDOW_MS;

      lastMeaningfulMovementAtRef.current = now;
      return isContinuousMovement ? 'continuous' : 'fresh';
    };

    const centerKey = `${center[0].toFixed(6)},${center[1].toFixed(6)}`;
    const userKey = userLoc ? `${userLoc[0].toFixed(6)},${userLoc[1].toFixed(6)}` : 'none';
    const viewportKey = interactive
      ? autoFitTrackedPositions && userLoc
        ? `interactive-follow|${centerKey}|${userKey}`
        : `interactive|${centerKey}`
      : `static|${centerKey}|${userKey}`;

    if (lastViewportKeyRef.current === viewportKey) {
      return;
    }
    lastViewportKeyRef.current = viewportKey;

    if (!didInitRef.current) {
      didInitRef.current = true;

      if (userLoc && (!interactive || autoFitTrackedPositions)) {
        fitTrackedBounds(false);
      } else if (!interactive) {
        map.setView(center, DEFAULT_MAP_ZOOM, { animate: false });
      }

      return;
    }

    if (interactive && autoFitTrackedPositions && userLoc) {
      const movementState = getMovementState(userLoc);
      if (Date.now() < autoFitPausedUntilRef.current) {
        return;
      }

      if (movementState === 'continuous') {
        fitTrackedBounds(true);
      }
      return;
    }

    if (!interactive && userLoc) {
      fitTrackedBounds(false);
      return;
    }

    if (interactive) {
      runProgrammaticViewportUpdate(() => {
        map.panTo(center, { animate: true, duration: 0.35, easeLinearity: 0.25 });
      });
      return;
    }

    map.setView(center, DEFAULT_MAP_ZOOM, { animate: false });
  }, [autoFitTrackedPositions, center, userLoc, map, interactive, trackedViewportInsets]);

  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (recenterRequestId === 0) return;

    autoFitPausedUntilRef.current = 0;

    if (interactive && userLoc) {
      gestureGuardUntilRef.current = Date.now() + PROGRAMMATIC_GESTURE_GUARD_MS;
      fitMapToCarAndUser(map, center, userLoc, true, trackedViewportInsets);
      return;
    }

    if (interactive) {
      const currentZoom = typeof map.getZoom === 'function' ? map.getZoom() : DEFAULT_MAP_ZOOM;
      gestureGuardUntilRef.current = Date.now() + PROGRAMMATIC_GESTURE_GUARD_MS;
      map.flyTo(center, currentZoom, { animate: true, duration: 0.6, easeLinearity: 0.25 });
      return;
    }

    if (userLoc) {
      fitMapToCarAndUser(map, center, userLoc, true, trackedViewportInsets);
      return;
    }

    map.setView(center, DEFAULT_MAP_ZOOM, { animate: true });
  }, [center, interactive, map, recenterRequestId, trackedViewportInsets, userLoc]);

  useEffect(() => {
    if (interactive) {
      map.dragging.enable();
      if (zoomEnabled) {
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
        map.boxZoom.enable();
        map.keyboard.enable();
      } else {
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
      }
    } else {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
    }
  }, [map, interactive, zoomEnabled]);

  return null;
}

function PhotoClickableMarker({
  position,
  icon,
  onPhotoClick,
  zIndexOffset,
  onPhotoPositionChange,
}: {
  position: [number, number];
  icon: L.DivIcon;
  onPhotoClick?: () => void;
  zIndexOffset?: number;
  onPhotoPositionChange?: (offset: { x: number; y: number }) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  // Handle photo thumbnail clicks and drag via event delegation
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return undefined;
    let frameId: number | null = null;
    let markerElement: HTMLElement | null = null;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentOffsetX = 0;
    let currentOffsetY = -80; // Default offset
    let touchIdentifier: number | null = null;

    const handlePointerDown = (e: PointerEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('draggable-photo')) return;

      e.preventDefault();
      e.stopPropagation();
      isDragging = true;

      if ('touches' in e && e.touches[0]) {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        touchIdentifier = touch.identifier;
      } else if ('clientX' in e && 'clientY' in e) {
        startX = e.clientX;
        startY = e.clientY;
      }

      // Parse current position from style
      const computedStyle = window.getComputedStyle(target);
      const matrix = new DOMMatrixReadOnly(computedStyle.transform);
      currentOffsetX = matrix.m41;
      currentOffsetY = parseInt(target.style.top || '-80px', 10);
    };

    const handlePointerMove = (e: PointerEvent | TouchEvent) => {
      if (!isDragging) return;

      e.preventDefault();
      e.stopPropagation();

      let clientX: number, clientY: number;
      if ('touches' in e) {
        const touch = Array.from(e.touches).find((t) => t.identifier === touchIdentifier);
        if (!touch) return;
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const deltaX = clientX - startX;
      const deltaY = clientY - startY;

      const newOffsetX = Math.max(-50, Math.min(50, currentOffsetX + deltaX));
      const newOffsetY = Math.max(-130, Math.min(-30, currentOffsetY + deltaY));

      const photoElement = markerElement?.querySelector('.draggable-photo');
      if (photoElement instanceof HTMLElement) {
        photoElement.style.top = `${newOffsetY}px`;
        photoElement.style.left = `calc(50% + ${newOffsetX}px)`;
      }
    };

    const handlePointerUp = (e: PointerEvent | TouchEvent) => {
      if (!isDragging) return;

      e.preventDefault();
      e.stopPropagation();
      isDragging = false;
      touchIdentifier = null;

      const photoElement = markerElement?.querySelector('.draggable-photo');
      if (photoElement instanceof HTMLElement && onPhotoPositionChange) {
        const finalY = parseInt(photoElement.style.top ?? '-80px', 10);
        const leftValue = photoElement.style.left ?? '50%';
        const match = /calc\(50% \+ (-?\d+)px\)/.exec(leftValue);
        const finalX = match?.[1] ? parseInt(match[1], 10) : 0;

        onPhotoPositionChange({ x: finalX, y: finalY });
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('parking-photo-thumbnail') && !isDragging) {
        e.stopPropagation();
        onPhotoClick?.();
      }
    };

    const bindEventHandlers = () => {
      const element = marker.getElement();
      if (!element) {
        frameId = window.requestAnimationFrame(bindEventHandlers);
        return;
      }

      markerElement = element;
      markerElement.addEventListener('click', handleClick);
      markerElement.addEventListener('pointerdown', handlePointerDown as EventListener);
      markerElement.addEventListener('pointermove', handlePointerMove as EventListener);
      markerElement.addEventListener('pointerup', handlePointerUp as EventListener);
      markerElement.addEventListener('touchstart', handlePointerDown as EventListener, {
        passive: false,
      });
      markerElement.addEventListener('touchmove', handlePointerMove as EventListener, {
        passive: false,
      });
      markerElement.addEventListener('touchend', handlePointerUp as EventListener);
    };

    bindEventHandlers();

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      markerElement?.removeEventListener('click', handleClick);
      markerElement?.removeEventListener('pointerdown', handlePointerDown as EventListener);
      markerElement?.removeEventListener('pointermove', handlePointerMove as EventListener);
      markerElement?.removeEventListener('pointerup', handlePointerUp as EventListener);
      markerElement?.removeEventListener('touchstart', handlePointerDown as EventListener);
      markerElement?.removeEventListener('touchmove', handlePointerMove as EventListener);
      markerElement?.removeEventListener('touchend', handlePointerUp as EventListener);
    };
  }, [onPhotoClick, onPhotoPositionChange]);

  return <Marker position={position} ref={markerRef} icon={icon} zIndexOffset={zIndexOffset} />;
}

function DraggableMarker({
  position,
  onDragEnd,
  icon,
  onPhotoClick,
  onPhotoPositionChange,
}: {
  position: [number, number];
  onDragEnd: (pos: L.LatLng) => void;
  icon: L.DivIcon;
  onPhotoClick?: () => void;
  onPhotoPositionChange?: (offset: { x: number; y: number }) => void;
}) {
  const markerRef = useRef<L.Marker>(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) onDragEnd(marker.getLatLng());
      },
    }),
    [onDragEnd],
  );

  // Handle photo thumbnail clicks and drag via event delegation
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return undefined;
    let frameId: number | null = null;
    let markerElement: HTMLElement | null = null;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentOffsetX = 0;
    let currentOffsetY = -80; // Default offset
    let touchIdentifier: number | null = null;

    const handlePointerDown = (e: PointerEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('draggable-photo')) return;

      e.preventDefault();
      e.stopPropagation();
      isDragging = true;

      if ('touches' in e && e.touches[0]) {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        touchIdentifier = touch.identifier;
      } else if ('clientX' in e && 'clientY' in e) {
        startX = e.clientX;
        startY = e.clientY;
      }

      // Parse current position from style
      const computedStyle = window.getComputedStyle(target);
      const matrix = new DOMMatrixReadOnly(computedStyle.transform);
      currentOffsetX = matrix.m41;
      currentOffsetY = parseInt(target.style.top || '-80px', 10);
    };

    const handlePointerMove = (e: PointerEvent | TouchEvent) => {
      if (!isDragging) return;

      e.preventDefault();
      e.stopPropagation();

      let clientX: number, clientY: number;
      if ('touches' in e) {
        const touch = Array.from(e.touches).find((t) => t.identifier === touchIdentifier);
        if (!touch) return;
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const deltaX = clientX - startX;
      const deltaY = clientY - startY;

      const newOffsetX = Math.max(-50, Math.min(50, currentOffsetX + deltaX));
      const newOffsetY = Math.max(-130, Math.min(-30, currentOffsetY + deltaY));

      const photoElement = markerElement?.querySelector('.draggable-photo');
      if (photoElement instanceof HTMLElement) {
        photoElement.style.top = `${newOffsetY}px`;
        photoElement.style.left = `calc(50% + ${newOffsetX}px)`;
      }
    };

    const handlePointerUp = (e: PointerEvent | TouchEvent) => {
      if (!isDragging) return;

      e.preventDefault();
      e.stopPropagation();
      isDragging = false;
      touchIdentifier = null;

      const photoElement = markerElement?.querySelector('.draggable-photo');
      if (photoElement instanceof HTMLElement && onPhotoPositionChange) {
        const finalY = parseInt(photoElement.style.top ?? '-80px', 10);
        const leftValue = photoElement.style.left ?? '50%';
        const match = /calc\(50% \+ (-?\d+)px\)/.exec(leftValue);
        const finalX = match?.[1] ? parseInt(match[1], 10) : 0;

        onPhotoPositionChange({ x: finalX, y: finalY });
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('parking-photo-thumbnail') && !isDragging) {
        e.stopPropagation();
        onPhotoClick?.();
      }
    };

    const bindEventHandlers = () => {
      const element = marker.getElement();
      if (!element) {
        frameId = window.requestAnimationFrame(bindEventHandlers);
        return;
      }

      markerElement = element;
      markerElement.addEventListener('click', handleClick);
      markerElement.addEventListener('pointerdown', handlePointerDown as EventListener);
      markerElement.addEventListener('pointermove', handlePointerMove as EventListener);
      markerElement.addEventListener('pointerup', handlePointerUp as EventListener);
      markerElement.addEventListener('touchstart', handlePointerDown as EventListener, {
        passive: false,
      });
      markerElement.addEventListener('touchmove', handlePointerMove as EventListener, {
        passive: false,
      });
      markerElement.addEventListener('touchend', handlePointerUp as EventListener);
    };

    bindEventHandlers();

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      markerElement?.removeEventListener('click', handleClick);
      markerElement?.removeEventListener('pointerdown', handlePointerDown as EventListener);
      markerElement?.removeEventListener('pointermove', handlePointerMove as EventListener);
      markerElement?.removeEventListener('pointerup', handlePointerUp as EventListener);
      markerElement?.removeEventListener('touchstart', handlePointerDown as EventListener);
      markerElement?.removeEventListener('touchmove', handlePointerMove as EventListener);
      markerElement?.removeEventListener('touchend', handlePointerUp as EventListener);
    };
  }, [onPhotoClick, onPhotoPositionChange]);

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={icon}
      zIndexOffset={1000}
    />
  );
}

export default function MiniMap({
  lat,
  lng,
  userLat,
  userLng,
  heading = 0,
  theme,
  interactive = false,
  allowZoom = interactive,
  showZoomControl = false,
  lockBounds = !interactive,
  autoFitTrackedPositions = false,
  showRecenterButton = false,
  recenterLabel = 'Recenter map',
  text,
  onLocationSelect,
  className = '',
  mapKey,
  cacheDurationDays = 7,
  photoData,
  onPhotoClick,
  parkedHeading = 0,
  trackedViewportInsets,
  photoOffset = { x: 0, y: -80 },
  onPhotoPositionChange,
}: MiniMapProps) {
  // Validate and normalize coordinates
  const validLat = clampLatitude(lat);
  const validLng = normalizeLongitude(lng);
  const validUserLat = typeof userLat === 'number' ? clampLatitude(userLat) : undefined;
  const validUserLng = typeof userLng === 'number' ? normalizeLongitude(userLng) : undefined;

  // Calculate maxBounds to prevent excessive panning
  const maxBounds = useMemo(
    () => calculateMaxBounds(validLat, validLng, validUserLat, validUserLng),
    [validLat, validLng, validUserLat, validUserLng],
  );
  const centerPosition = useMemo<[number, number]>(
    () => [validLat, validLng],
    [validLat, validLng],
  );
  const userPosition = useMemo<[number, number] | undefined>(
    () =>
      validUserLat !== undefined && validUserLng !== undefined
        ? [validUserLat, validUserLng]
        : undefined,
    [validUserLat, validUserLng],
  );
  const mapMinZoom = interactive ? INTERACTIVE_MIN_ZOOM : STATIC_MIN_ZOOM;
  const zoomEnabled = interactive && allowZoom;
  const shouldLockBounds = lockBounds;
  const mapText = useMemo<MiniMapText>(() => ({ ...DEFAULT_MINI_MAP_TEXT, ...text }), [text]);
  const showPositionLabels = interactive && userPosition !== undefined;
  const showPositionLegend = interactive && userPosition !== undefined;
  const [recenterRequestId, setRecenterRequestId] = useState(0);
  const effectiveTrackedViewportInsets = useMemo<MapViewportInsets>(
    () => ({
      ...DEFAULT_TRACKED_VIEWPORT_INSETS,
      ...trackedViewportInsets,
    }),
    [trackedViewportInsets],
  );

  // Calculate tile performance settings based on cache configuration
  const tileSettings = useMemo(
    () =>
      calculateTileSettings({
        cacheDurationDays,
        interactive,
        zoomEnabled,
      }),
    [cacheDurationDays, interactive, zoomEnabled],
  );

  // Taiwan NLSC High-Precision Tile Service
  // Source: https://maps.nlsc.gov.tw/S09SOA/homePage.action
  // NLSC supports maxNativeZoom: 20 (0.15m per pixel precision)
  // Best Practice: Use NLSC for Taiwan, fallback to CartoDB for racing theme
  const tileUrl =
    theme.id === 'racing'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}';

  // Set maxNativeZoom based on tile service
  // NLSC supports zoom 20, CartoDB supports zoom 18
  const maxNativeZoom = theme.id === 'racing' ? 18 : 20;

  const carIcon = useMemo(
    () =>
      createPremiumCarIcon(
        theme.colors.primary,
        interactive,
        showPositionLabels,
        mapText.markerCarLabel,
        photoData,
        parkedHeading,
        photoOffset,
      ),
    [
      theme.colors.primary,
      interactive,
      mapText.markerCarLabel,
      showPositionLabels,
      photoData,
      parkedHeading,
      photoOffset,
    ],
  );
  const userIcon = useMemo(
    () =>
      createUserIcon(
        heading,
        interactive ? '#3b82f6' : theme.colors.accent,
        showPositionLabels,
        mapText.markerUserLabel,
      ),
    [heading, interactive, mapText.markerUserLabel, showPositionLabels, theme.colors.accent],
  );

  // ARIA label for accessibility
  const ariaLabel =
    interactive && userPosition
      ? mapText.ariaInteractiveTrackingLabel
      : interactive
        ? mapText.ariaInteractiveSelectionLabel
        : mapText.ariaStaticLabel;

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-gray-100 ${className}`}
      style={{ borderRadius: 'inherit', isolation: 'isolate' }}
      role="region"
      aria-label={ariaLabel}
      aria-live={interactive ? 'polite' : undefined}
    >
      <MapContainer
        key={
          mapKey ? `map-${mapKey}` : interactive ? 'interactive' : `static-${validLat}-${validLng}`
        }
        center={centerPosition}
        zoom={DEFAULT_MAP_ZOOM}
        minZoom={mapMinZoom}
        maxZoom={20}
        zoomDelta={1}
        zoomSnap={1}
        zoomAnimationThreshold={8}
        wheelDebounceTime={60}
        wheelPxPerZoomLevel={120}
        style={{ width: '100%', height: '100%', background: theme.colors.background }}
        zoomControl={interactive && zoomEnabled && showZoomControl}
        attributionControl={false}
        dragging={interactive}
        touchZoom={zoomEnabled}
        doubleClickZoom={zoomEnabled}
        scrollWheelZoom={zoomEnabled ? 'center' : false}
        boxZoom={zoomEnabled}
        keyboard={zoomEnabled}
        preferCanvas={true}
        trackResize={interactive}
        maxBounds={shouldLockBounds ? maxBounds : undefined}
        maxBoundsViscosity={shouldLockBounds ? 1 : 0}
        worldCopyJump={false}
        tapTolerance={interactive ? 15 : 0}
      >
        <TileLayer
          url={tileUrl}
          updateWhenZooming={tileSettings.updateWhenZooming}
          updateWhenIdle={tileSettings.updateWhenIdle}
          keepBuffer={tileSettings.keepBuffer}
          maxZoom={20}
          maxNativeZoom={maxNativeZoom}
          noWrap={true}
          crossOrigin="anonymous"
        />
        <MapController
          center={centerPosition}
          userLoc={userPosition}
          interactive={interactive}
          zoomEnabled={zoomEnabled}
          autoFitTrackedPositions={autoFitTrackedPositions}
          recenterRequestId={recenterRequestId}
          cacheDurationDays={cacheDurationDays}
          trackedViewportInsets={effectiveTrackedViewportInsets}
        />
        {interactive && onLocationSelect ? (
          <DraggableMarker
            position={centerPosition}
            onDragEnd={(newPos) => onLocationSelect(newPos.lat, newPos.lng)}
            icon={carIcon}
            onPhotoClick={onPhotoClick}
            onPhotoPositionChange={onPhotoPositionChange}
          />
        ) : (
          <PhotoClickableMarker
            position={centerPosition}
            icon={carIcon}
            onPhotoClick={onPhotoClick}
            onPhotoPositionChange={onPhotoPositionChange}
          />
        )}
        {userPosition && <Marker position={userPosition} icon={userIcon} zIndexOffset={900} />}
      </MapContainer>
      {showPositionLegend && (
        <div className="absolute top-3 left-3 z-[430] pointer-events-none">
          <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-black/10 shadow-[0_4px_16px_rgba(0,0,0,0.12)] px-3 py-2 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white shadow-sm" />
              <span className="text-[10px] font-black tracking-tight text-slate-700 whitespace-nowrap">
                {mapText.legendCurrentLabel}
              </span>
            </div>
            <div className="h-4 w-px bg-black/10" />
            <div className="flex items-center gap-1.5">
              <span
                className="inline-flex h-2.5 w-2.5 rounded-sm shadow-sm border border-white/70"
                style={{ backgroundColor: theme.colors.primary }}
              />
              <span className="text-[10px] font-black tracking-tight text-slate-700 whitespace-nowrap">
                {mapText.legendCarLabel}
              </span>
            </div>
          </div>
        </div>
      )}
      {interactive && onLocationSelect && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-sm border border-white/20 whitespace-nowrap">
            {mapText.dragCarHintLabel}
          </div>
        </div>
      )}
      {interactive && showRecenterButton && (
        <div className="absolute top-3 right-3 z-[450]">
          <button
            type="button"
            aria-label={recenterLabel}
            title={recenterLabel}
            onClick={() => setRecenterRequestId((prev) => prev + 1)}
            className="h-11 w-11 rounded-full bg-white/95 backdrop-blur-sm border border-black/10 shadow-[0_2px_10px_rgba(0,0,0,0.18)] flex items-center justify-center active:scale-95 transition-transform touch-manipulation"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="text-slate-700"
            >
              <path
                d="M12 3V6M12 18V21M3 12H6M18 12H21"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle cx="12" cy="12" r="6.25" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="12" cy="12" r="1.6" fill="currentColor" />
            </svg>
          </button>
        </div>
      )}
      {!interactive && (
        <div className="absolute inset-0 z-[400] pointer-events-auto cursor-pointer bg-transparent" />
      )}
    </div>
  );
}
