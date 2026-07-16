/**
 * MiniMap 測試 — 地圖配置域（zoom 邊界、tile layer、NLSC 圖資）。
 * 自原千行 MiniMap.test.tsx 按功能拆分（issue #716），斷言原樣保留。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import MiniMap from '../MiniMap';
import type { ThemeConfig } from '@app/park-keeper/types';
import { mockTheme } from './miniMapTestKit';

vi.mock('motion/react', async () => (await import('./miniMapTestKit')).motionReactMock);
vi.mock('react-leaflet', async () => (await import('./miniMapTestKit')).reactLeafletMock);
vi.mock('leaflet', async () => (await import('./miniMapTestKit')).leafletMock);

describe('MiniMap - Zoom Level Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should configure minZoom to prevent excessive zoom out', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={false} />,
    );

    const mapContainer = container.querySelector('[data-testid="map-container"]');
    expect(mapContainer).toHaveAttribute('data-minzoom');
    expect(Number(mapContainer?.getAttribute('data-minzoom'))).toBeGreaterThanOrEqual(1);
  });

  it('should configure maxZoom to prevent excessive zoom in', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={false} />,
    );

    const mapContainer = container.querySelector('[data-testid="map-container"]');
    expect(mapContainer).toHaveAttribute('data-maxzoom');
    // NLSC supports maxZoom: 20 for highest precision
    expect(Number(mapContainer?.getAttribute('data-maxzoom'))).toBeLessThanOrEqual(20);
  });

  it('should set defaultZoom within min/max range', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={false} />,
    );

    const mapContainer = container.querySelector('[data-testid="map-container"]');
    const minZoom = Number(mapContainer?.getAttribute('data-minzoom'));
    const maxZoom = Number(mapContainer?.getAttribute('data-maxzoom'));
    const defaultZoom = Number(mapContainer?.getAttribute('data-zoom'));

    expect(defaultZoom).toBeGreaterThanOrEqual(minZoom);
    expect(defaultZoom).toBeLessThanOrEqual(maxZoom);
  });

  it('should use integer zoom steps to avoid raster tile blur artifacts', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={true} />,
    );

    const mapContainer = container.querySelector('[data-testid="map-container"]');
    expect(mapContainer).toHaveAttribute('data-zoomdelta');
    expect(Number(mapContainer?.getAttribute('data-zoomdelta'))).toBe(1);
    expect(Number(mapContainer?.getAttribute('data-zoomsnap'))).toBe(1);
  });
});

describe('MiniMap - Tile Layer Optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * REGRESSION TEST: Map tiles disappear after zooming in
   * Root cause: TileLayer was missing maxZoom property
   * Fix: Added maxZoom={20} to TileLayer component
   * Reference: Leaflet documentation - both maxZoom and maxNativeZoom required for proper tile loading
   */
  describe('Regression: Tile disappearing on zoom (Critical Bug Fix)', () => {
    it('should have TileLayer maxZoom set to prevent tile disappearing when user zooms beyond native tile level', () => {
      const { container } = render(
        <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={true} />,
      );

      const tileLayer = container.querySelector('[data-testid="tile-layer"]');

      // CRITICAL: TileLayer MUST have maxZoom to enable tile upscaling beyond maxNativeZoom
      // Without this, tiles disappear when user zooms past native tile level
      expect(tileLayer).toHaveAttribute('data-maxzoom', '20');
    });

    it('should have both maxZoom and maxNativeZoom configured on TileLayer for NLSC tiles', () => {
      const { container } = render(
        <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={false} />,
      );

      const tileLayer = container.querySelector('[data-testid="tile-layer"]');

      // Both properties are required per Leaflet documentation
      expect(tileLayer).toHaveAttribute('data-maxzoom', '20');
      expect(tileLayer).toHaveAttribute('data-maxnativezoom', '20');
    });

    it('should have both maxZoom and maxNativeZoom configured on TileLayer for CartoDB tiles (racing theme)', () => {
      const racingTheme: ThemeConfig = {
        ...mockTheme,
        id: 'racing',
      };

      const { container } = render(
        <MiniMap lat={25.033} lng={121.5654} theme={racingTheme} interactive={true} />,
      );

      const tileLayer = container.querySelector('[data-testid="tile-layer"]');

      // CartoDB supports native zoom 18, but allows upscaling to 20
      expect(tileLayer).toHaveAttribute('data-maxzoom', '20');
      expect(tileLayer).toHaveAttribute('data-maxnativezoom', '18');
    });

    it('should maintain MapContainer maxZoom equal to or greater than TileLayer maxZoom', () => {
      const { container } = render(
        <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={true} />,
      );

      const mapContainer = container.querySelector('[data-testid="map-container"]');
      const tileLayer = container.querySelector('[data-testid="tile-layer"]');

      const mapMaxZoom = Number(mapContainer?.getAttribute('data-maxzoom'));
      const tileMaxZoom = Number(tileLayer?.getAttribute('data-maxzoom'));

      // MapContainer maxZoom must be >= TileLayer maxZoom for proper zooming
      expect(mapMaxZoom).toBeGreaterThanOrEqual(tileMaxZoom);
    });
  });

  it('should defer tile refresh until zoom end for static previews', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={false} />,
    );

    const tileLayer = container.querySelector('[data-testid="tile-layer"]');
    expect(tileLayer).toHaveAttribute('data-updatewhenzooming', 'false');
  });

  it('should update tiles during zoom in interactive mode for smoother zooming', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={true} />,
    );

    const tileLayer = container.querySelector('[data-testid="tile-layer"]');
    expect(tileLayer).toHaveAttribute('data-updatewhenzooming', 'true');
    expect(tileLayer).toHaveAttribute('data-updatewhenidle', 'false');
  });

  it('should set keepBuffer for tile caching to improve performance', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={false} />,
    );

    const tileLayer = container.querySelector('[data-testid="tile-layer"]');
    expect(tileLayer).toHaveAttribute('data-keepbuffer');
    expect(Number(tileLayer?.getAttribute('data-keepbuffer'))).toBeGreaterThanOrEqual(2);
  });

  it('should configure maxNativeZoom to prevent tile loading errors', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={false} />,
    );

    const tileLayer = container.querySelector('[data-testid="tile-layer"]');
    expect(tileLayer).toHaveAttribute('data-maxnativezoom');
    // NLSC supports maxNativeZoom: 20, CartoDB: 18
    expect(Number(tileLayer?.getAttribute('data-maxnativezoom'))).toBe(20);
  });

  it('should use crossOrigin for tile loading security', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={false} />,
    );

    const tileLayer = container.querySelector('[data-testid="tile-layer"]');
    expect(tileLayer).toHaveAttribute('data-crossorigin', 'anonymous');
  });

  it('should disable tile wrapping to avoid duplicate world tiles when zoomed out', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={true} />,
    );

    const tileLayer = container.querySelector('[data-testid="tile-layer"]');
    expect(tileLayer).toHaveAttribute('data-nowrap', 'true');
  });
});

describe('MiniMap - Taiwan NLSC High-Precision Tile Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should use NLSC WMTS tile service for Taiwan maps', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={false} />,
    );

    const tileLayer = container.querySelector('[data-testid="tile-layer"]');
    const url = tileLayer?.getAttribute('data-url') ?? '';

    // Should use NLSC WMTS service
    expect(url).toContain('wmts.nlsc.gov.tw');
    expect(url).toContain('EMAP');
  });

  it('should configure maxNativeZoom: 20 for NLSC tile service (highest precision)', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={false} />,
    );

    const tileLayer = container.querySelector('[data-testid="tile-layer"]');

    // NLSC supports up to zoom level 20 (0.15m per pixel)
    expect(tileLayer).toHaveAttribute('data-maxnativezoom', '20');
  });

  it('should allow maxZoom: 20 for maximum precision viewing', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={true} />,
    );

    const mapContainer = container.querySelector('[data-testid="map-container"]');

    // User should be able to zoom to level 20
    expect(Number(mapContainer?.getAttribute('data-maxzoom'))).toBe(20);
  });

  it('should use GoogleMapsCompatible tile matrix for NLSC', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={false} />,
    );

    const tileLayer = container.querySelector('[data-testid="tile-layer"]');
    const url = tileLayer?.getAttribute('data-url') ?? '';

    // NLSC WMTS uses GoogleMapsCompatible tile matrix
    expect(url).toContain('GoogleMapsCompatible');
  });

  it('should fallback to CartoDB dark theme for racing mode', () => {
    const racingTheme: ThemeConfig = {
      ...mockTheme,
      id: 'racing',
    };

    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={racingTheme} interactive={false} />,
    );

    const tileLayer = container.querySelector('[data-testid="tile-layer"]');
    const url = tileLayer?.getAttribute('data-url') ?? '';

    // Racing theme should use CartoDB dark tiles (better performance at night)
    expect(url).toContain('cartocdn.com/dark_all');
  });
});
