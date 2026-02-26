import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import MiniMap from './MiniMap';
import type { ThemeConfig } from '@app/park-keeper/types';

import type { ReactNode } from 'react';

// Mock react-leaflet to avoid DOM dependencies in tests
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, ...props }: Record<string, unknown> & { children?: ReactNode }) => {
    // Convert all props to data attributes for testing
    const testProps: Record<string, string> = {};
    Object.keys(props).forEach((key) => {
      if (key === 'style' || key === 'key') return; // Skip non-serializable props
      const value = props[key];
      if (typeof value === 'object' && value !== null) {
        testProps[`data-${key.toLowerCase()}`] = JSON.stringify(value);
      } else {
        testProps[`data-${key.toLowerCase()}`] = String(value);
      }
    });

    return (
      <div data-testid="map-container" {...testProps}>
        {children}
      </div>
    );
  },
  TileLayer: (props: Record<string, unknown>) => {
    const testProps: Record<string, string> = {};
    Object.keys(props).forEach((key) => {
      if (key === 'style') return;
      testProps[`data-${key.toLowerCase()}`] = String(props[key]);
    });
    return <div data-testid="tile-layer" {...testProps} />;
  },
  Marker: ({
    position,
    draggable,
    zIndexOffset,
  }: {
    position: [number, number];
    draggable?: boolean;
    zIndexOffset?: number;
  }) => (
    <div
      data-testid="marker"
      data-position={JSON.stringify(position)}
      data-draggable={String(draggable)}
      data-zindex={String(zIndexOffset)}
    />
  ),
  useMap: () => ({
    flyTo: vi.fn(),
    flyToBounds: vi.fn(),
    invalidateSize: vi.fn(),
    dragging: { enable: vi.fn(), disable: vi.fn() },
    touchZoom: { enable: vi.fn(), disable: vi.fn() },
    doubleClickZoom: { disable: vi.fn() },
    scrollWheelZoom: { disable: vi.fn() },
    boxZoom: { disable: vi.fn() },
    keyboard: { disable: vi.fn() },
  }),
}));

vi.mock('leaflet', () => ({
  default: {
    divIcon: ({
      html,
      iconSize,
      iconAnchor,
    }: {
      html: string;
      iconSize: [number, number];
      iconAnchor: [number, number];
    }) => ({
      html,
      iconSize,
      iconAnchor,
      type: 'divIcon',
    }),
    latLngBounds: vi.fn((coords: unknown) => coords),
  },
}));

const mockTheme: ThemeConfig = {
  id: 'minimalist',
  name: 'Minimalist',
  colors: {
    primary: '#8b5cf6',
    secondary: '#3b82f6',
    accent: '#10b981',
    background: '#ffffff',
    surface: '#f3f4f6',
    text: '#111827',
    textMuted: '#6b7280',
  },
  font: 'Inter, sans-serif',
  borderRadius: '0.5rem',
  animationType: 'spring',
};

describe('MiniMap Component - Leaflet Best Practices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('🔴 RED: Zoom Level Configuration (Best Practice #1)', () => {
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
      expect(Number(mapContainer?.getAttribute('data-maxzoom'))).toBeLessThanOrEqual(19);
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

    it('should use finer zoom control with zoomDelta for precision', () => {
      const { container } = render(
        <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={true} />,
      );

      const mapContainer = container.querySelector('[data-testid="map-container"]');
      expect(mapContainer).toHaveAttribute('data-zoomdelta');
      expect(Number(mapContainer?.getAttribute('data-zoomdelta'))).toBe(0.5);
    });
  });

  describe('🔴 RED: Performance Optimization (Best Practice #2)', () => {
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
  });

  describe('🔴 RED: Tile Layer Optimization (Best Practice #3)', () => {
    it('should configure tile layer with updateWhenZooming for smoother transitions', () => {
      const { container } = render(
        <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={false} />,
      );

      const tileLayer = container.querySelector('[data-testid="tile-layer"]');
      expect(tileLayer).toHaveAttribute('data-updatewhenzooming', 'false');
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
      expect(Number(tileLayer?.getAttribute('data-maxnativezoom'))).toBe(18);
    });

    it('should use crossOrigin for tile loading security', () => {
      const { container } = render(
        <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={false} />,
      );

      const tileLayer = container.querySelector('[data-testid="tile-layer"]');
      expect(tileLayer).toHaveAttribute('data-crossorigin', 'anonymous');
    });
  });

  describe('🔴 RED: Bounds Calculation (Best Practice #4)', () => {
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

  describe('🔴 RED: Error Handling (Best Practice #5)', () => {
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

  describe('🔴 RED: Accessibility (Best Practice #6)', () => {
    it('should include ARIA role for map container', () => {
      const { container } = render(
        <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={false} />,
      );

      const parentDiv = container.querySelector('.relative.w-full.h-full');
      expect(parentDiv).toHaveAttribute('role', 'region');
    });

    it('should include ARIA label describing map content', () => {
      const { container } = render(
        <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={false} />,
      );

      const parentDiv = container.querySelector('.relative.w-full.h-full');
      expect(parentDiv).toHaveAttribute('aria-label');
      const label = parentDiv?.getAttribute('aria-label') ?? '';
      expect(label).toContain('map');
    });

    it('should indicate interactive state in ARIA attributes', () => {
      const { container } = render(
        <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={true} />,
      );

      const parentDiv = container.querySelector('.relative.w-full.h-full');
      expect(parentDiv).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('🔴 RED: Existing Functionality Preservation', () => {
    it('should render car marker at correct position', () => {
      const lat = 25.033;
      const lng = 121.5654;
      const { container } = render(<MiniMap lat={lat} lng={lng} theme={mockTheme} />);

      const markers = container.querySelectorAll('[data-testid="marker"]');
      const carMarker = Array.from(markers).find((m) => {
        const pos = JSON.parse(m.getAttribute('data-position') ?? '[]');
        return pos[0] === lat && pos[1] === lng;
      });

      expect(carMarker).toBeTruthy();
    });

    it('should render user marker when user location provided', () => {
      const userLat = 25.043;
      const userLng = 121.5754;
      const { container } = render(
        <MiniMap
          lat={25.033}
          lng={121.5654}
          userLat={userLat}
          userLng={userLng}
          theme={mockTheme}
        />,
      );

      const markers = container.querySelectorAll('[data-testid="marker"]');
      const userMarker = Array.from(markers).find((m) => {
        const pos = JSON.parse(m.getAttribute('data-position') ?? '[]');
        return pos[0] === userLat && pos[1] === userLng;
      });

      expect(userMarker).toBeTruthy();
    });

    it('should enable dragging in interactive mode', () => {
      const { container } = render(
        <MiniMap
          lat={25.033}
          lng={121.5654}
          theme={mockTheme}
          interactive={true}
          onLocationSelect={vi.fn()}
        />,
      );

      const markers = container.querySelectorAll('[data-testid="marker"]');
      const draggableMarker = Array.from(markers).find(
        (m) => m.getAttribute('data-draggable') === 'true',
      );

      expect(draggableMarker).toBeTruthy();
    });

    it('should use racing theme tile server when racing theme active', () => {
      const racingTheme: ThemeConfig = {
        ...mockTheme,
        id: 'racing',
      };

      const { container } = render(<MiniMap lat={25.033} lng={121.5654} theme={racingTheme} />);

      const tileLayer = container.querySelector('[data-testid="tile-layer"]');
      const url = tileLayer?.getAttribute('data-url') ?? '';

      expect(url).toContain('cartocdn.com/dark_all');
    });
  });
});
