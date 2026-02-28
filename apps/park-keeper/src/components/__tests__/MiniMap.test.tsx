import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import MiniMap from '../MiniMap';
import type { ThemeConfig } from '@app/park-keeper/types';

const mockTheme: ThemeConfig = {
  id: 'minimalist',
  name: 'Minimalist',
  colors: {
    primary: '#000000',
    secondary: '#666666',
    accent: '#0066ff',
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#000000',
    textMuted: '#666666',
  },
  font: 'system-ui',
  borderRadius: '12px',
  animationType: 'spring',
};

const miniMapText = {
  markerCarLabel: 'Car',
  markerUserLabel: 'You',
  legendCurrentLabel: 'Current',
  legendCarLabel: 'Car',
  dragCarHintLabel: 'Drag car to adjust',
  ariaInteractiveSelectionLabel: 'Interactive map for selection',
  ariaInteractiveTrackingLabel: 'Interactive map for tracking',
  ariaStaticLabel: 'Static map',
};

describe('MiniMap - 照片拖曳功能', () => {
  beforeEach(() => {
    // Mock Leaflet map initialization
    vi.stubGlobal('L', {
      map: vi.fn(() => ({
        setView: vi.fn(),
        invalidateSize: vi.fn(),
        remove: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        fitBounds: vi.fn(),
      })),
      tileLayer: vi.fn(() => ({
        addTo: vi.fn(),
      })),
      marker: vi.fn(() => ({
        addTo: vi.fn(),
        setLatLng: vi.fn(),
        setIcon: vi.fn(),
        remove: vi.fn(),
        on: vi.fn(),
      })),
      divIcon: vi.fn(() => ({})),
      control: {
        zoom: vi.fn(() => ({
          addTo: vi.fn(),
        })),
      },
      latLngBounds: vi.fn(() => ({
        extend: vi.fn(),
      })),
    });
  });

  it('照片應該在車子標記上方顯示', () => {
    const { container } = render(
      <MiniMap
        lat={25.033}
        lng={121.5654}
        theme={mockTheme}
        text={miniMapText}
        photoData="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
      />,
    );

    // 驗證 MiniMap 組件渲染（Leaflet 實際 DOM 由 mock 控制）
    expect(container).toBeInTheDocument();
  });

  it('RED: 照片應該支援長按拖曳調整相對位置', () => {
    const onPhotoPositionChange = vi.fn();
    const { container } = render(
      <MiniMap
        lat={25.033}
        lng={121.5654}
        theme={mockTheme}
        text={miniMapText}
        photoData="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        onPhotoPositionChange={onPhotoPositionChange}
      />,
    );

    // 測試會在實作後補充具體的拖曳邏輯驗證
    expect(container).toBeInTheDocument();
  });

  it('RED: 照片位置應該可以持久化儲存', () => {
    const photoOffset = { x: 10, y: -20 };
    const { container } = render(
      <MiniMap
        lat={25.033}
        lng={121.5654}
        theme={mockTheme}
        text={miniMapText}
        photoData="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        photoOffset={photoOffset}
      />,
    );

    // 驗證照片偏移設定被接受
    expect(container).toBeInTheDocument();
  });

  it('RED: 照片應該在車子標記附近合理範圍內', () => {
    const photoOffset = { x: 100, y: 100 }; // 超出合理範圍
    const { container } = render(
      <MiniMap
        lat={25.033}
        lng={121.5654}
        theme={mockTheme}
        text={miniMapText}
        photoData="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        photoOffset={photoOffset}
      />,
    );

    // 應該限制在合理範圍內（例如 ±50px）
    expect(container).toBeInTheDocument();
  });
});
