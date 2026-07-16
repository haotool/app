/**
 * MiniMapController — Leaflet map 控制子元件（viewport 追蹤、手勢守衛、互動開關）
 * 與 marker 輔助元件（DraggableMarker、CarPositionReader）。
 * 自 MiniMap.tsx 純搬移拆出（issue #733 可維護性；行為零變更）。
 */
import { useEffect, useMemo, useRef } from 'react';
import { Marker, useMap } from 'react-leaflet';
import type L from 'leaflet';
import { CACHE_DAYS } from '@app/park-keeper/constants';
import { useMapPerformance } from '@app/park-keeper/hooks/useMapPerformance';
import {
  DEFAULT_MAP_ZOOM,
  MOVEMENT_CONTINUITY_WINDOW_MS,
  MOVEMENT_THRESHOLD_METERS,
  PROGRAMMATIC_GESTURE_GUARD_MS,
  USER_FOLLOW_PAUSE_MS,
  fitMapToCarAndUser,
  getDistanceInMeters,
  type MapViewportInsets,
} from './miniMapShared';

export function MapController({
  center,
  userLoc,
  interactive,
  zoomEnabled,
  autoFitTrackedPositions,
  recenterRequestId,
  cacheDurationDays = CACHE_DAYS.DEFAULT,
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

export function DraggableMarker({
  position,
  onDragEnd,
  icon,
}: {
  position: [number, number];
  onDragEnd: (pos: L.LatLng) => void;
  icon: L.DivIcon;
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

/**
 * 從 Leaflet map 讀取車輛標記的像素座標，回傳給父層以定位照片 overlay。
 * 監聽 move/zoom 事件，確保地圖平移縮放後座標同步。
 */
export function CarPositionReader({
  position,
  onPositionUpdate,
}: {
  position: [number, number];
  onPositionUpdate: (point: { x: number; y: number }) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const update = () => {
      const pt = map.latLngToContainerPoint(position);
      onPositionUpdate({ x: pt.x, y: pt.y });
    };
    update();
    map.on('move zoom viewreset', update);
    return () => {
      map.off('move zoom viewreset', update);
    };
  }, [map, position, onPositionUpdate]);

  return null;
}
