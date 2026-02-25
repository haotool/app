import { useEffect, useMemo, useRef } from 'react';
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
  onLocationSelect?: (lat: number, lng: number) => void;
  className?: string;
  mapKey?: string;
}

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
}: {
  center: [number, number];
  userLoc?: [number, number];
  interactive: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!interactive && userLoc) {
      const bounds = L.latLngBounds([center, userLoc]);
      map.flyToBounds(bounds, { padding: [80, 80], animate: true, duration: 1.5 });
    } else {
      map.flyTo(center, 17, { animate: true, duration: 1.5, easeLinearity: 0.25 });
    }
    const timer = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(timer);
  }, [center, userLoc, map, interactive]);

  useEffect(() => {
    if (interactive) {
      map.dragging.enable();
      map.touchZoom.enable();
    } else {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
    }
  }, [map, interactive]);

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
  onLocationSelect,
  className = '',
  mapKey,
}: MiniMapProps) {
  const tileUrl =
    theme.id === 'racing'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}';

  const carIcon = useMemo(
    () => createPremiumCarIcon(theme.colors.primary, interactive),
    [theme.colors.primary, interactive],
  );
  const userIcon = useMemo(
    () => createUserIcon(heading, interactive ? '#3b82f6' : theme.colors.accent),
    [heading, interactive, theme.colors.accent],
  );

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-gray-100 ${className}`}
      style={{ borderRadius: 'inherit', isolation: 'isolate' }}
    >
      <MapContainer
        key={mapKey ? `map-${mapKey}` : interactive ? 'interactive' : `static-${lat}-${lng}`}
        center={[lat, lng]}
        zoom={17}
        style={{ width: '100%', height: '100%', background: theme.colors.background }}
        zoomControl={false}
        attributionControl={false}
        dragging={interactive}
      >
        <TileLayer url={tileUrl} />
        <MapController
          center={[lat, lng]}
          userLoc={userLat && userLng ? [userLat, userLng] : undefined}
          interactive={interactive}
        />
        {interactive && onLocationSelect ? (
          <DraggableMarker
            position={[lat, lng]}
            onDragEnd={(newPos) => onLocationSelect(newPos.lat, newPos.lng)}
            icon={carIcon}
          />
        ) : (
          <Marker position={[lat, lng]} icon={carIcon} />
        )}
        {typeof userLat === 'number' && typeof userLng === 'number' && (
          <Marker position={[userLat, userLng]} icon={userIcon} zIndexOffset={900} />
        )}
      </MapContainer>
      {interactive && onLocationSelect && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-sm border border-white/20 whitespace-nowrap">
            Drag car to adjust
          </div>
        </div>
      )}
      {!interactive && (
        <div className="absolute inset-0 z-[400] pointer-events-auto cursor-pointer bg-transparent" />
      )}
    </div>
  );
}
