/**
 * MiniMap 測試共用 kit（issue #716 千行測試檔拆分）。
 * 各測試檔以 `vi.mock('...', async () => (await import('./miniMapTestKit')).xxx)` 引用，
 * 保持 mock 行為單一來源；本檔非測試檔，不含任何 describe/it。
 */
import React from 'react';
import { vi } from 'vitest';
import type { ReactNode } from 'react';
import type { ThemeConfig } from '@app/park-keeper/types';

// 穩定物件參照：避免 latLngToContainerPoint 每次回傳新物件觸發無限 setState 迴圈。
export const mockCarPoint = { x: 150, y: 200 };

export const mockMapInstance = {
  flyTo: vi.fn(),
  flyToBounds: vi.fn(),
  fitBounds: vi.fn(),
  panTo: vi.fn(),
  setView: vi.fn(),
  getZoom: vi.fn(() => 17),
  invalidateSize: vi.fn(),
  // CarPositionReader 需要這兩個方法讀取車輛像素座標
  latLngToContainerPoint: vi.fn(() => mockCarPoint),
  on: vi.fn(),
  off: vi.fn(),
  dragging: { enable: vi.fn(), disable: vi.fn() },
  touchZoom: { enable: vi.fn(), disable: vi.fn() },
  doubleClickZoom: { enable: vi.fn(), disable: vi.fn() },
  scrollWheelZoom: { enable: vi.fn(), disable: vi.fn() },
  boxZoom: { enable: vi.fn(), disable: vi.fn() },
  keyboard: { enable: vi.fn(), disable: vi.fn() },
};

function serializeTestProp(value: unknown): string | undefined {
  if (value === undefined || typeof value === 'function') return undefined;
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return `${value}`;
  }
  if (typeof value === 'symbol') return value.description ?? 'symbol';
  return undefined;
}

const MOTION_STRIP_PROPS = [
  'initial',
  'animate',
  'exit',
  'transition',
  'drag',
  'dragMomentum',
  'dragElastic',
  'dragConstraints',
  'onDragStart',
  'onDrag',
  'onDragEnd',
  'onPointerDown',
  'whileTap',
  'whileHover',
];

/** 每次 useMotionValue 呼叫的紀錄（初始值＋set spy），供 photoOffset 斷言。 */
export const motionValueRecords: { initial: number; set: ReturnType<typeof vi.fn> }[] = [];

// motion/react mock：DraggablePhotoOverlay 渲染為純 div（無動畫引擎）。
export const motionReactMock = {
  useMotionValue: (initial: number) => {
    const set = vi.fn();
    motionValueRecords.push({ initial, set });
    return { get: () => initial, set };
  },
  motion: new Proxy(
    {},
    {
      get(_target, prop) {
        const tag = String(prop);
        const Component = ({
          children,
          ...props
        }: { children?: ReactNode } & Record<string, unknown>) => {
          const domProps = { ...props };
          MOTION_STRIP_PROPS.forEach((k) => delete domProps[k]);
          // Strip style motion values (x/y MotionValues aren't valid DOM style props)
          if (domProps['style'] && typeof domProps['style'] === 'object') {
            const style = { ...(domProps['style'] as Record<string, unknown>) };
            if (style['x'] && typeof style['x'] === 'object') delete style['x'];
            if (style['y'] && typeof style['y'] === 'object') delete style['y'];
            domProps['style'] = style;
          }
          return React.createElement(tag, domProps, children);
        };
        Component.displayName = `motion.${tag}`;
        return Component;
      },
    },
  ),
};

// react-leaflet mock：所有 props 轉為 data-* 屬性供斷言，不觸碰真實 DOM/Leaflet。
export const reactLeafletMock = {
  MapContainer: ({ children, ...props }: Record<string, unknown> & { children?: ReactNode }) => {
    const testProps: Record<string, string> = {};
    Object.keys(props).forEach((key) => {
      if (key === 'style' || key === 'key') return;
      const value = props[key];
      const serialized = serializeTestProp(value);
      if (serialized !== undefined) testProps[`data-${key.toLowerCase()}`] = serialized;
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
      const value = props[key];
      const serialized = serializeTestProp(value);
      if (serialized !== undefined) testProps[`data-${key.toLowerCase()}`] = serialized;
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
  Polyline: ({
    positions,
    pathOptions,
  }: {
    positions: [number, number][];
    pathOptions?: Record<string, unknown>;
  }) => (
    <div
      data-testid="polyline"
      data-positions={JSON.stringify(positions)}
      data-pathoptions={JSON.stringify(pathOptions ?? {})}
    />
  ),
  useMap: () => mockMapInstance,
};

// leaflet mock：divIcon 回傳可檢視物件。
export const leafletMock = {
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
};

export const mockTheme: ThemeConfig = {
  id: 'minimalist',
  name: 'Minimalist',
  colors: {
    primary: '#8b5cf6',
    onPrimary: '#ffffff',
    secondary: '#3b82f6',
    accent: '#10b981',
    background: '#ffffff',
    surface: '#f3f4f6',
    text: '#111827',
    textMuted: '#6b7280',
    danger: '#b91c1c',
  },
  font: 'Inter, sans-serif',
  borderRadius: '0.5rem',
  animationType: 'spring',
};
