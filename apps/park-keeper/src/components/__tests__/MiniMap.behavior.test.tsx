/**
 * MiniMap 測試 — 行為與計算域（效能選項、邊界計算、錯誤處理、座標精度）。
 * 自原千行 MiniMap.test.tsx 按功能拆分（issue #716），斷言原樣保留。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import MiniMap from '../MiniMap';
import { mockMapInstance, mockTheme } from './miniMapTestKit';

vi.mock('motion/react', async () => (await import('./miniMapTestKit')).motionReactMock);
vi.mock('react-leaflet', async () => (await import('./miniMapTestKit')).reactLeafletMock);
vi.mock('leaflet', async () => (await import('./miniMapTestKit')).leafletMock);

describe('MiniMap - Performance Optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should enable preferCanvas for better mobile performance', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={false} />,
    );

    const mapContainer = container.querySelector('[data-testid="map-container"]');
    expect(mapContainer).toHaveAttribute('data-prefercanvas', 'true');
  });

  it('should set maxBounds to prevent unnecessary tile loading', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={false} />,
    );

    const mapContainer = container.querySelector('[data-testid="map-container"]');
    expect(mapContainer).toHaveAttribute('data-maxbounds');

    const maxBounds = JSON.parse(mapContainer?.getAttribute('data-maxbounds') ?? '[]');
    expect(maxBounds).toHaveLength(2); // [[lat1, lng1], [lat2, lng2]]
    expect(Array.isArray(maxBounds[0])).toBe(true);
    expect(Array.isArray(maxBounds[1])).toBe(true);
  });

  it('should disable worldCopyJump to prevent duplicate markers', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={false} />,
    );

    const mapContainer = container.querySelector('[data-testid="map-container"]');
    expect(mapContainer).toHaveAttribute('data-worldcopyjump', 'false');
  });

  it('should enable tap detection for mobile responsiveness', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={true} />,
    );

    const mapContainer = container.querySelector('[data-testid="map-container"]');
    expect(mapContainer).toHaveAttribute('data-taptolerance');
    expect(Number(mapContainer?.getAttribute('data-taptolerance'))).toBeGreaterThan(0);
  });

  it('should not clamp interactive map with maxBounds (free zoom and pan)', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={true} />,
    );

    const mapContainer = container.querySelector('[data-testid="map-container"]');
    expect(mapContainer).not.toHaveAttribute('data-maxbounds');
    expect(mapContainer).toHaveAttribute('data-zoomcontrol', 'false');
    expect(Number(mapContainer?.getAttribute('data-minzoom'))).toBeLessThanOrEqual(3);
  });

  it('should continuously auto-fit user and car on interactive map when tracking mode is enabled', () => {
    render(
      <MiniMap
        lat={25.033}
        lng={121.5654}
        userLat={25.043}
        userLng={121.5754}
        theme={mockTheme}
        interactive={true}
        autoFitTrackedPositions={true}
      />,
    );

    expect(mockMapInstance.fitBounds).toHaveBeenCalled();
    expect(mockMapInstance.fitBounds).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ animate: false, maxZoom: 17 }),
    );
  });

  it('should not auto-fit tracked positions by default on interactive map', () => {
    render(
      <MiniMap
        lat={25.033}
        lng={121.5654}
        userLat={25.043}
        userLng={121.5754}
        theme={mockTheme}
        interactive={true}
      />,
    );

    expect(mockMapInstance.fitBounds).not.toHaveBeenCalled();
  });

  it('should allow gesture zoom on interactive maps without zoom buttons (compass page UX)', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={true} />,
    );

    const mapContainer = container.querySelector('[data-testid="map-container"]');
    expect(mapContainer).toHaveAttribute('data-touchzoom', 'true');
    expect(mapContainer).toHaveAttribute('data-scrollwheelzoom', 'center');
    expect(mapContainer).toHaveAttribute('data-doubleclickzoom', 'true');
    expect(mapContainer).toHaveAttribute('data-zoomcontrol', 'false');
  });

  it('should support explicit zoom control buttons when requested', () => {
    const { container } = render(
      <MiniMap
        lat={25.033}
        lng={121.5654}
        theme={mockTheme}
        interactive={true}
        showZoomControl={true}
      />,
    );

    const mapContainer = container.querySelector('[data-testid="map-container"]');
    expect(mapContainer).toHaveAttribute('data-zoomcontrol', 'true');
  });

  it('should disable zoom on small interactive picker maps while keeping drag interactions', () => {
    const { container } = render(
      <MiniMap
        lat={25.033}
        lng={121.5654}
        theme={mockTheme}
        interactive={true}
        allowZoom={false}
        lockBounds={true}
      />,
    );

    const mapContainer = container.querySelector('[data-testid="map-container"]');
    expect(mapContainer).toHaveAttribute('data-dragging', 'true');
    expect(mapContainer).toHaveAttribute('data-touchzoom', 'false');
    expect(mapContainer).toHaveAttribute('data-doubleclickzoom', 'false');
    expect(mapContainer).toHaveAttribute('data-scrollwheelzoom', 'false');
    expect(mapContainer).toHaveAttribute('data-zoomcontrol', 'false');
    expect(mapContainer).toHaveAttribute('data-maxbounds');
  });
});

describe('MiniMap - Bounds Calculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should calculate appropriate maxBounds based on center and reasonable padding', () => {
    const lat = 25.033;
    const lng = 121.5654;
    const { container } = render(
      <MiniMap lat={lat} lng={lng} theme={mockTheme} interactive={false} />,
    );

    const mapContainer = container.querySelector('[data-testid="map-container"]');
    const maxBounds = JSON.parse(mapContainer?.getAttribute('data-maxbounds') ?? '[]');

    // Bounds should be centered around lat/lng with ~0.1 degree padding
    const [[minLat, minLng], [maxLat, maxLng]] = maxBounds;

    expect(minLat).toBeLessThan(lat);
    expect(maxLat).toBeGreaterThan(lat);
    expect(minLng).toBeLessThan(lng);
    expect(maxLng).toBeGreaterThan(lng);

    // Bounds should be reasonable (not too large)
    expect(maxLat - minLat).toBeLessThan(0.5);
    expect(maxLng - minLng).toBeLessThan(0.5);
  });

  it('should expand maxBounds when user location is provided', () => {
    const carLat = 25.033;
    const carLng = 121.5654;
    const userLat = 25.043; // ~1.1 km north
    const userLng = 121.5754;

    const { container } = render(
      <MiniMap
        lat={carLat}
        lng={carLng}
        userLat={userLat}
        userLng={userLng}
        theme={mockTheme}
        interactive={false}
      />,
    );

    const mapContainer = container.querySelector('[data-testid="map-container"]');
    const maxBounds = JSON.parse(mapContainer?.getAttribute('data-maxbounds') ?? '[]');

    const [[minLat, minLng], [maxLat, maxLng]] = maxBounds;

    // Bounds should include both car and user positions
    expect(minLat).toBeLessThanOrEqual(Math.min(carLat, userLat));
    expect(maxLat).toBeGreaterThanOrEqual(Math.max(carLat, userLat));
    expect(minLng).toBeLessThanOrEqual(Math.min(carLng, userLng));
    expect(maxLng).toBeGreaterThanOrEqual(Math.max(carLng, userLng));
  });
});

describe('MiniMap - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle invalid coordinates gracefully', () => {
    const invalidLat = 999; // Invalid latitude
    const invalidLng = -999;

    expect(() => {
      render(<MiniMap lat={invalidLat} lng={invalidLng} theme={mockTheme} />);
    }).not.toThrow();
  });

  it('should clamp latitude to valid range [-90, 90]', () => {
    const { container } = render(
      <MiniMap lat={100} lng={121.5654} theme={mockTheme} interactive={false} />,
    );

    const mapContainer = container.querySelector('[data-testid="map-container"]');
    const center = JSON.parse(mapContainer?.getAttribute('data-center') ?? '[]');

    expect(center[0]).toBeGreaterThanOrEqual(-90);
    expect(center[0]).toBeLessThanOrEqual(90);
  });

  it('should normalize longitude to valid range [-180, 180]', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={500} theme={mockTheme} interactive={false} />,
    );

    const mapContainer = container.querySelector('[data-testid="map-container"]');
    const center = JSON.parse(mapContainer?.getAttribute('data-center') ?? '[]');

    expect(center[1]).toBeGreaterThanOrEqual(-180);
    expect(center[1]).toBeLessThanOrEqual(180);
  });
});

describe('MiniMap - Coordinate Precision Storage (6 decimal places)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should preserve 6 decimal places for latitude when rendering', () => {
    const highPrecisionLat = 25.033964; // 6 decimal places = ~0.11m accuracy
    const { container } = render(
      <MiniMap lat={highPrecisionLat} lng={121.5654} theme={mockTheme} />,
    );

    const mapContainer = container.querySelector('[data-testid="map-container"]');
    const center = JSON.parse(mapContainer?.getAttribute('data-center') ?? '[]');

    expect(center[0]).toBe(highPrecisionLat);
    // Verify precision is maintained (not rounded to fewer decimals)
    expect(center[0].toString()).toContain('033964');
  });

  it('should preserve 6 decimal places for longitude when rendering', () => {
    const highPrecisionLng = 121.565432; // 6 decimal places
    const { container } = render(<MiniMap lat={25.033} lng={highPrecisionLng} theme={mockTheme} />);

    const mapContainer = container.querySelector('[data-testid="map-container"]');
    const center = JSON.parse(mapContainer?.getAttribute('data-center') ?? '[]');

    expect(center[1]).toBe(highPrecisionLng);
    expect(center[1].toString()).toContain('565432');
  });

  it('should handle marker positioning with high precision coordinates', () => {
    const lat = 25.033964;
    const lng = 121.565432;
    const { container } = render(<MiniMap lat={lat} lng={lng} theme={mockTheme} />);

    const markers = container.querySelectorAll('[data-testid="marker"]');
    const carMarker = Array.from(markers).find((m) => {
      const pos = JSON.parse(m.getAttribute('data-position') ?? '[]');
      return pos[0] === lat && pos[1] === lng;
    });

    expect(carMarker).toBeTruthy();
    const position = JSON.parse(carMarker?.getAttribute('data-position') ?? '[]');

    // Verify marker position maintains precision
    expect(position[0]).toBe(lat);
    expect(position[1]).toBe(lng);
  });
});
