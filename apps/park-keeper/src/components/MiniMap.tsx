/**
 * MiniMap — Leaflet 地圖主元件（tile 來源、marker、圖例、recenter、照片 overlay 組裝）。
 * 子元件與共用邏輯拆於 miniMapShared / MiniMapController / MiniMapPhotoOverlay
 *（issue #733 可維護性；純搬移，行為零變更）。
 */
import { useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
// Leaflet CSS 隨 lazy chunk 載入，移出 index.html render-blocking 路徑（unpkg 第三方請求一併移除）。
import 'leaflet/dist/leaflet.css';
import type { ThemeConfig } from '@app/park-keeper/types';
import { CACHE_DAYS } from '@app/park-keeper/constants';
import { calculateTileSettings } from '@app/park-keeper/hooks/useMapPerformance';
import {
  DEFAULT_MAP_ZOOM,
  DEFAULT_MINI_MAP_TEXT,
  DEFAULT_TRACKED_VIEWPORT_INSETS,
  INTERACTIVE_MIN_ZOOM,
  STATIC_MIN_ZOOM,
  badgeColorsFromTheme,
  calculateMaxBounds,
  clampLatitude,
  createPremiumCarIcon,
  createUserIcon,
  normalizeLongitude,
  type MapViewportInsets,
  type MiniMapText,
} from './miniMapShared';
import { CarPositionReader, DraggableMarker, MapController } from './MiniMapController';
import DraggablePhotoOverlay from './MiniMapPhotoOverlay';

export type { MapViewportInsets, MiniMapText } from './miniMapShared';

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
  /** 位置圖例（目前位置/車輛位置）。背景層用法（NavOverlay）可關閉避免與 header 重疊。 */
  showLegend?: boolean;
  recenterLabel?: string;
  text?: Partial<MiniMapText>;
  onLocationSelect?: (lat: number, lng: number) => void;
  className?: string;
  mapKey?: string;
  cacheDurationDays?: number;
  photoData?: string;
  /** 照片錨可否拖曳（預設 true；導航頁常態為錨點、編輯模式才開啟）。 */
  photoDraggable?: boolean;
  onPhotoClick?: () => void;
  parkedHeading?: number;
  trackedViewportInsets?: Partial<MapViewportInsets>;
  photoOffset?: { x: number; y: number };
  onPhotoPositionChange?: (offset: { x: number; y: number }) => void;
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
  showLegend = true,
  recenterLabel = 'Recenter map',
  text,
  onLocationSelect,
  className = '',
  mapKey,
  cacheDurationDays = CACHE_DAYS.DEFAULT,
  photoData,
  photoDraggable = true,
  onPhotoClick,
  parkedHeading = 0,
  trackedViewportInsets,
  photoOffset,
  onPhotoPositionChange,
}: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [carPixelPos, setCarPixelPos] = useState<{ x: number; y: number } | null>(null);

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
  const showPositionLegend = showLegend && interactive && userPosition !== undefined;
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
        parkedHeading,
        badgeColorsFromTheme(theme),
      ),
    [theme, interactive, mapText.markerCarLabel, showPositionLabels, parkedHeading],
  );
  const userIcon = useMemo(
    () =>
      createUserIcon(
        heading,
        theme.colors.accent,
        showPositionLabels,
        mapText.markerUserLabel,
        badgeColorsFromTheme(theme),
      ),
    [heading, mapText.markerUserLabel, showPositionLabels, theme],
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
      ref={containerRef}
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
        {/* 車位↔使用者位置連線（主題色虛線；dash 流動動畫由 CSS 控制並尊重 reduced-motion）。 */}
        {userPosition && (
          <Polyline
            positions={[centerPosition, userPosition]}
            pathOptions={{
              color: theme.colors.primary,
              weight: 3,
              opacity: 0.55,
              dashArray: '6 8',
              lineCap: 'round',
              className: 'nav-route-line',
            }}
          />
        )}
        {photoData && (
          <CarPositionReader position={centerPosition} onPositionUpdate={setCarPixelPos} />
        )}
        {interactive && onLocationSelect ? (
          // 可拖曳 marker 屬鍵盤可聚焦元件（role=button），必須有 accessible name
          //（R6 axe aria-command-name）。
          <DraggableMarker
            position={centerPosition}
            onDragEnd={(newPos) => onLocationSelect(newPos.lat, newPos.lng)}
            icon={carIcon}
            title={mapText.markerCarLabel}
          />
        ) : (
          // 純資訊 marker 不進 tab order（interactive=false 不輸出 role/tabindex），
          // 語意由地圖容器 aria-label 承載。
          <Marker position={centerPosition} icon={carIcon} interactive={false} keyboard={false} />
        )}
        {userPosition && (
          <Marker
            position={userPosition}
            icon={userIcon}
            zIndexOffset={900}
            interactive={false}
            keyboard={false}
          />
        )}
      </MapContainer>
      {showPositionLegend && (
        <div className="absolute top-3 left-3 z-[430] pointer-events-none">
          <div
            className="rounded-2xl backdrop-blur-md border border-black/10 shadow-[0_4px_16px_rgba(0,0,0,0.12)] px-3 py-2 flex items-center gap-3"
            style={{ backgroundColor: `${theme.colors.surface}E6`, color: theme.colors.text }}
          >
            <div className="flex items-center gap-1.5">
              <span
                className="relative inline-flex h-2.5 w-2.5 rounded-full ring-2 ring-white shadow-sm"
                style={{ backgroundColor: theme.colors.accent }}
              />
              <span className="text-[10px] font-black tracking-tight whitespace-nowrap">
                {mapText.legendCurrentLabel}
              </span>
            </div>
            <div className="h-4 w-px bg-black/10" />
            <div className="flex items-center gap-1.5">
              <span
                className="inline-flex h-2.5 w-2.5 rounded-sm shadow-sm border border-white/70"
                style={{ backgroundColor: theme.colors.primary }}
              />
              <span className="text-[10px] font-black tracking-tight whitespace-nowrap">
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
      {photoData && (
        <DraggablePhotoOverlay
          src={photoData}
          onPhotoClick={onPhotoClick}
          containerRef={containerRef}
          carPixelPos={carPixelPos}
          initialOffset={photoOffset}
          onOffsetCommit={onPhotoPositionChange}
          draggable={photoDraggable}
        />
      )}
    </div>
  );
}
