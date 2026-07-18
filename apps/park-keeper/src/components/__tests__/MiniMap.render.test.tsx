/**
 * MiniMap 測試 — 渲染與無障礙域（ARIA、marker/legend 渲染、i18n 文案）。
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

describe('MiniMap - Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it('should describe both current and vehicle positions in ARIA label when user location is available', () => {
    const { container } = render(
      <MiniMap
        lat={25.033}
        lng={121.5654}
        userLat={25.043}
        userLng={121.5754}
        theme={mockTheme}
        interactive={true}
      />,
    );

    const parentDiv = container.querySelector('.relative.w-full.h-full');
    expect(parentDiv?.getAttribute('aria-label')).toContain('current location');
    expect(parentDiv?.getAttribute('aria-label')).toContain('vehicle');
  });

  it('should render recenter button when enabled on interactive map (Google Maps style)', () => {
    const { getByRole } = render(
      <MiniMap
        lat={25.033}
        lng={121.5654}
        theme={mockTheme}
        interactive={true}
        showRecenterButton={true}
        recenterLabel="Recenter to parking location"
      />,
    );

    expect(getByRole('button', { name: 'Recenter to parking location' })).toBeInTheDocument();
  });

  it('should not render recenter button by default', () => {
    const { queryByRole } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={true} />,
    );

    expect(queryByRole('button', { name: /recenter/i })).not.toBeInTheDocument();
  });
});

describe('MiniMap - Existing Functionality Preservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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
      <MiniMap lat={25.033} lng={121.5654} userLat={userLat} userLng={userLng} theme={mockTheme} />,
    );

    const markers = container.querySelectorAll('[data-testid="marker"]');
    const userMarker = Array.from(markers).find((m) => {
      const pos = JSON.parse(m.getAttribute('data-position') ?? '[]');
      return pos[0] === userLat && pos[1] === userLng;
    });

    expect(userMarker).toBeTruthy();
  });

  it('有使用者位置時渲染車位↔使用者主題色虛線連線（issue #752 兩點連線）', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} userLat={25.043} userLng={121.5754} theme={mockTheme} />,
    );

    const polyline = container.querySelector('[data-testid="polyline"]');
    expect(polyline).toBeTruthy();
    expect(JSON.parse(polyline?.getAttribute('data-positions') ?? '[]')).toEqual([
      [25.033, 121.5654],
      [25.043, 121.5754],
    ]);
    const pathOptions = JSON.parse(polyline?.getAttribute('data-pathoptions') ?? '{}');
    // 主題 token 色＋虛線＋動畫控制 class（reduced-motion 由 CSS media query 停用）。
    expect(pathOptions.color).toBe(mockTheme.colors.primary);
    expect(pathOptions.dashArray).toBe('6 8');
    expect(pathOptions.className).toBe('nav-route-line');
  });

  it('無使用者位置時不渲染連線', () => {
    const { container } = render(<MiniMap lat={25.033} lng={121.5654} theme={mockTheme} />);
    expect(container.querySelector('[data-testid="polyline"]')).toBeNull();
  });

  it('should render a clear legend for current location and car on interactive navigation map', () => {
    const { getByText } = render(
      <MiniMap
        lat={25.033}
        lng={121.5654}
        userLat={25.043}
        userLng={121.5754}
        theme={mockTheme}
        interactive={true}
      />,
    );

    expect(getByText('Current')).toBeInTheDocument();
    expect(getByText('Car')).toBeInTheDocument();
  });

  it('should support custom map copy for i18n labels', () => {
    const { getByText } = render(
      <MiniMap
        lat={25.033}
        lng={121.5654}
        userLat={25.043}
        userLng={121.5754}
        theme={mockTheme}
        interactive={true}
        text={{
          legendCurrentLabel: '目前位置',
          legendCarLabel: '車輛位置',
          markerUserLabel: '我',
          markerCarLabel: '車',
        }}
      />,
    );

    expect(getByText('目前位置')).toBeInTheDocument();
    expect(getByText('車輛位置')).toBeInTheDocument();
  });

  it('should not render location legend when user location is not available', () => {
    const { queryByText } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} interactive={true} />,
    );

    expect(queryByText('Current')).not.toBeInTheDocument();
    expect(queryByText('Car')).not.toBeInTheDocument();
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
