import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { ThemeConfig } from '@app/park-keeper/types';

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
  showRecenterButton?: boolean;
  recenterLabel?: string;
  onLocationSelect?: (lat: number, lng: number) => void;
  className?: string;
  mapKey?: string;
}

const DEFAULT_MAP_ZOOM = 17;
const STATIC_MIN_ZOOM = 10;
const INTERACTIVE_MIN_ZOOM = 1;

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

const createPremiumCarIcon = (color: string, isInteractive: boolean) => {
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

  const svgString = `
  <svg viewBox="0 0 40 60" width="40" height="60" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
    <defs>${filterDef}</defs>
    <g transform="translate(20,30)">
      ${pulse}
      <rect x="-12" y="-24" width="24" height="48" rx="4" fill="${color}" stroke="${color}" stroke-width="0.5" stroke-opacity="0.8" ${isInteractive ? 'filter="url(#carGlow)"' : ''} />
      <path d="M-9-22L9-22L12-10L-12-10Z" fill="rgba(255,255,255,0.15)"/>
      <path d="M-7-10Q0-12 7-10L7-4Q0-6-7-4Z" fill="rgba(200,230,255,0.6)" stroke="rgba(255,255,255,0.5)" stroke-width="0.5"/>
      <rect x="-10" y="-4" width="20" height="20" rx="2" fill="rgba(0,0,0,0.1)"/>
      <rect x="-7" y="16" width="14" height="4" rx="1" fill="rgba(200,230,255,0.4)"/>
      <path d="M0-32L3-26L-3-26Z" fill="${color}" stroke="white" stroke-width="1" opacity="0.9"/>
    </g>
  </svg>`;

  return L.divIcon({
    className: 'premium-car-marker',
    html: svgString,
    iconSize: [40, 60],
    iconAnchor: [20, 30],
    popupAnchor: [0, -30],
  });
};

const createUserIcon = (heading = 0, color = '#3b82f6') =>
  L.divIcon({
    className: 'user-loc-marker',
    html: `
      <div style="width:24px;height:24px;position:relative;display:flex;align-items:center;justify-content:center">
        <div style="position:absolute;top:50%;left:50%;width:0;height:0;border-left:20px solid transparent;border-right:20px solid transparent;border-bottom:60px solid ${color}40;transform:translate(-50%,-50%) rotate(${heading}deg);transform-origin:center bottom;margin-top:-30px;pointer-events:none;z-index:0;opacity:0.5"></div>
        <div style="width:16px;height:16px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 5px rgba(0,0,0,0.3);z-index:10;position:relative"></div>
      </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

function MapController({
  center,
  userLoc,
  interactive,
  zoomEnabled,
  recenterRequestId,
}: {
  center: [number, number];
  userLoc?: [number, number];
  interactive: boolean;
  zoomEnabled: boolean;
  recenterRequestId: number;
}) {
  const map = useMap();
  const didInitRef = useRef(false);
  const lastViewportKeyRef = useRef<string>('');

  useEffect(() => {
    const centerKey = `${center[0].toFixed(6)},${center[1].toFixed(6)}`;
    const userKey = userLoc ? `${userLoc[0].toFixed(6)},${userLoc[1].toFixed(6)}` : 'none';
    const viewportKey = interactive ? `interactive|${centerKey}` : `static|${centerKey}|${userKey}`;

    if (lastViewportKeyRef.current === viewportKey) {
      return;
    }
    lastViewportKeyRef.current = viewportKey;

    if (!didInitRef.current) {
      didInitRef.current = true;

      if (!interactive && userLoc) {
        const bounds = L.latLngBounds([center, userLoc]);
        map.fitBounds(bounds, { padding: [80, 80], animate: false });
      } else if (!interactive) {
        map.setView(center, DEFAULT_MAP_ZOOM, { animate: false });
      }

      return;
    }

    if (!interactive && userLoc) {
      const bounds = L.latLngBounds([center, userLoc]);
      map.fitBounds(bounds, { padding: [80, 80], animate: false });
      return;
    }

    if (interactive) {
      map.panTo(center, { animate: true, duration: 0.35, easeLinearity: 0.25 });
      return;
    }

    map.setView(center, DEFAULT_MAP_ZOOM, { animate: false });
  }, [center, userLoc, map, interactive]);

  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (recenterRequestId === 0) return;

    if (interactive) {
      const currentZoom = typeof map.getZoom === 'function' ? map.getZoom() : DEFAULT_MAP_ZOOM;
      map.flyTo(center, currentZoom, { animate: true, duration: 0.6, easeLinearity: 0.25 });
      return;
    }

    if (userLoc) {
      const bounds = L.latLngBounds([center, userLoc]);
      map.fitBounds(bounds, { padding: [80, 80], animate: true });
      return;
    }

    map.setView(center, DEFAULT_MAP_ZOOM, { animate: true });
  }, [center, interactive, map, recenterRequestId, userLoc]);

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

function DraggableMarker({
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
  showRecenterButton = false,
  recenterLabel = 'Recenter map',
  onLocationSelect,
  className = '',
  mapKey,
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
  const [recenterRequestId, setRecenterRequestId] = useState(0);

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
    () => createPremiumCarIcon(theme.colors.primary, interactive),
    [theme.colors.primary, interactive],
  );
  const userIcon = useMemo(
    () => createUserIcon(heading, interactive ? '#3b82f6' : theme.colors.accent),
    [heading, interactive, theme.colors.accent],
  );

  // ARIA label for accessibility
  const ariaLabel = interactive
    ? 'Interactive map for parking location selection'
    : 'Static map showing parking location';

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
          updateWhenZooming={zoomEnabled}
          updateWhenIdle={!interactive || !zoomEnabled}
          keepBuffer={zoomEnabled ? 4 : 2}
          maxNativeZoom={maxNativeZoom}
          noWrap={true}
          crossOrigin="anonymous"
        />
        <MapController
          center={centerPosition}
          userLoc={userPosition}
          interactive={interactive}
          zoomEnabled={zoomEnabled}
          recenterRequestId={recenterRequestId}
        />
        {interactive && onLocationSelect ? (
          <DraggableMarker
            position={centerPosition}
            onDragEnd={(newPos) => onLocationSelect(newPos.lat, newPos.lng)}
            icon={carIcon}
          />
        ) : (
          <Marker position={centerPosition} icon={carIcon} />
        )}
        {userPosition && <Marker position={userPosition} icon={userIcon} zIndexOffset={900} />}
      </MapContainer>
      {interactive && onLocationSelect && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-sm border border-white/20 whitespace-nowrap">
            Drag car to adjust
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
