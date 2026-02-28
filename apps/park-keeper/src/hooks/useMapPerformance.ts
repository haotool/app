/**
 * useMapPerformance Hook - Leaflet 地圖效能與快取管理
 *
 * 功能特色：
 * - Tile 快取策略對齊 cacheDurationDays 設定
 * - 記憶體管理與 tile 清理機制
 * - 重複快取累積防護
 * - keepBuffer 動態計算（基於快取設定）
 */
import { useEffect, useMemo, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export interface MapPerformanceConfig {
  cacheDurationDays: number;
  interactive: boolean;
  zoomEnabled: boolean;
}

export interface TilePerformanceSettings {
  keepBuffer: number;
  updateWhenIdle: boolean;
  updateWhenZooming: boolean;
  maxTilesCacheSize: number;
}

/**
 * Calculate optimal tile performance settings based on cache duration
 *
 * Strategy:
 * - Shorter cache (1-3 days): Minimal buffer (2), aggressive cleanup
 * - Medium cache (4-7 days): Moderate buffer (4), balanced cleanup
 * - Longer cache (8+ days): Generous buffer (6), relaxed cleanup
 */
export const calculateTileSettings = (config: MapPerformanceConfig): TilePerformanceSettings => {
  const { cacheDurationDays, interactive, zoomEnabled } = config;

  // Base buffer size on cache duration
  let keepBuffer = 2;
  if (cacheDurationDays >= 8) {
    keepBuffer = 6;
  } else if (cacheDurationDays >= 4) {
    keepBuffer = 4;
  }

  // Static maps use minimal buffer
  if (!interactive) {
    keepBuffer = Math.min(2, keepBuffer);
  }

  // Calculate max tiles cache size (aligned with cache duration)
  // Formula: base (100) + (cacheDurationDays * 50) tiles
  // Rationale: 1 day = 150 tiles max, 7 days = 450 tiles max, 30 days = 1600 tiles max
  const maxTilesCacheSize = 100 + cacheDurationDays * 50;

  return {
    keepBuffer,
    updateWhenIdle: !interactive || !zoomEnabled,
    updateWhenZooming: zoomEnabled,
    maxTilesCacheSize,
  };
};

/**
 * Hook for optimizing Leaflet map performance with cache-aware tile management
 */
export function useMapPerformance(config: MapPerformanceConfig) {
  const map = useMap();
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const settings = useMemo(() => calculateTileSettings(config), [config]);

  // Tile cache cleanup mechanism
  useEffect(() => {
    // Cleanup interval: Every 5 minutes
    const CLEANUP_INTERVAL = 5 * 60 * 1000;

    cleanupIntervalRef.current = setInterval(() => {
      // Access Leaflet's internal tile layer
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          const tileLayer = layer as L.TileLayer & {
            _tiles?: Record<string, unknown>;
            _tilesToLoad?: number;
          };

          // Get tile cache size
          const currentTiles = tileLayer._tiles ? Object.keys(tileLayer._tiles).length : 0;

          // If cache exceeds limit, redraw map (forces tile cleanup)
          if (currentTiles > settings.maxTilesCacheSize) {
            tileLayer.redraw();
          }
        }
      });
    }, CLEANUP_INTERVAL);

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, [map, settings.maxTilesCacheSize]);

  // Invalidate map size on mount (prevents tile loading issues)
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => clearTimeout(timer);
  }, [map]);

  return settings;
}
