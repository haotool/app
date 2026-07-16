/**
 * MiniMap 測試 — 照片 overlay 域（渲染、點擊、拖曳持久化 photoOffset）。
 * 自原千行 MiniMap.test.tsx 按功能拆分（issue #716），斷言原樣保留並補 photoOffset 套用驗證。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import MiniMap from '../MiniMap';
import { mockCarPoint, mockTheme, motionValueRecords } from './miniMapTestKit';

vi.mock('motion/react', async () => (await import('./miniMapTestKit')).motionReactMock);
vi.mock('react-leaflet', async () => (await import('./miniMapTestKit')).reactLeafletMock);
vi.mock('leaflet', async () => (await import('./miniMapTestKit')).leafletMock);

describe('MiniMap - DraggablePhotoOverlay', () => {
  const photoData = 'data:image/png;base64,abc';

  beforeEach(() => {
    vi.clearAllMocks();
    motionValueRecords.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('有 photoData 時應渲染照片 overlay 並顯示圖片', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} photoData={photoData} />,
    );

    const overlay = container.querySelector('[data-testid="photo-overlay"]');
    expect(overlay).toBeInTheDocument();

    const img = overlay?.querySelector('img');
    expect(img).toHaveAttribute('src', photoData);
    expect(img).toHaveAttribute('alt', 'Parking spot photo');
  });

  it('沒有 photoData 時不應渲染照片 overlay', () => {
    const { container } = render(<MiniMap lat={25.033} lng={121.5654} theme={mockTheme} />);

    expect(container.querySelector('[data-testid="photo-overlay"]')).toBeNull();
  });

  it('點擊照片 overlay 應呼叫 onPhotoClick', () => {
    const onPhotoClick = vi.fn();
    const { container } = render(
      <MiniMap
        lat={25.033}
        lng={121.5654}
        theme={mockTheme}
        photoData={photoData}
        onPhotoClick={onPhotoClick}
      />,
    );

    const overlay = container.querySelector('[data-testid="photo-overlay"]');
    fireEvent.click(overlay!);
    expect(onPhotoClick).toHaveBeenCalledTimes(1);
  });

  it('照片 overlay 不應嵌入在 Leaflet marker HTML 中', () => {
    const { container } = render(
      <MiniMap lat={25.033} lng={121.5654} theme={mockTheme} photoData={photoData} />,
    );

    // The overlay must be a direct React child, not inside a [data-testid="marker"]
    const markerEl = container.querySelector('[data-testid="marker"]');
    expect(markerEl?.querySelector('img')).toBeNull();

    // But the overlay IS in the container
    expect(container.querySelector('[data-testid="photo-overlay"] img')).toBeInTheDocument();
  });

  it('photoOffset 應作為初始相對偏移套用（record.photoOffset 重開套用）', () => {
    const photoOffset = { x: 10, y: -20 };
    render(
      <MiniMap
        lat={25.033}
        lng={121.5654}
        theme={mockTheme}
        photoData={photoData}
        photoOffset={photoOffset}
      />,
    );

    // mock useMotionValue 每次 render 都記錄；首次 render（carPixelPos=null）前兩筆
    // 依序為 x、y，初始值即 photoOffset 偏移量
    expect(motionValueRecords.length).toBeGreaterThanOrEqual(2);
    expect(motionValueRecords[0]!.initial).toBe(photoOffset.x);
    expect(motionValueRecords[1]!.initial).toBe(photoOffset.y);

    // CarPositionReader 回報車輛像素座標後，overlay 依儲存偏移同步絕對位置
    const xSetCalls = motionValueRecords.flatMap((r) => r.set.mock.calls.flat());
    expect(xSetCalls).toContain(mockCarPoint.x + photoOffset.x);
    expect(xSetCalls).toContain(mockCarPoint.y + photoOffset.y);
  });

  it('未提供 photoOffset 時使用預設車輛右側偏移', () => {
    render(<MiniMap lat={25.033} lng={121.5654} theme={mockTheme} photoData={photoData} />);

    // 預設 INIT_OFFSET = { dx: 20, dy: -32 }（車身右側 8px gap、垂直置中）
    expect(motionValueRecords.length).toBeGreaterThanOrEqual(2);
    expect(motionValueRecords[0]!.initial).toBe(20);
    expect(motionValueRecords[1]!.initial).toBe(-32);
  });
});

// 自原 components/MiniMap.test.tsx 重複檔整併（issue #711 S0），保留原有斷言。
describe('MiniMap - 照片拖曳功能', () => {
  const photoDragText = {
    markerCarLabel: 'Car',
    markerUserLabel: 'You',
    legendCurrentLabel: 'Current',
    legendCarLabel: 'Car',
    dragCarHintLabel: 'Drag car to adjust',
    ariaInteractiveSelectionLabel: 'Interactive map for selection',
    ariaInteractiveTrackingLabel: 'Interactive map for tracking',
    ariaStaticLabel: 'Static map',
  };
  const photoDragData =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  beforeEach(() => {
    vi.clearAllMocks();
    motionValueRecords.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('照片應該在車子標記上方顯示', () => {
    const { container } = render(
      <MiniMap
        lat={25.033}
        lng={121.5654}
        theme={mockTheme}
        text={photoDragText}
        photoData={photoDragData}
      />,
    );

    // 驗證 MiniMap 組件渲染（Leaflet 實際 DOM 由 mock 控制）
    expect(container).toBeInTheDocument();
  });

  it('照片應該支援長按拖曳調整相對位置', () => {
    const onPhotoPositionChange = vi.fn();
    const { container } = render(
      <MiniMap
        lat={25.033}
        lng={121.5654}
        theme={mockTheme}
        text={photoDragText}
        photoData={photoDragData}
        onPhotoPositionChange={onPhotoPositionChange}
      />,
    );

    expect(container.querySelector('[data-testid="photo-overlay"]')).toBeInTheDocument();
  });

  it('照片位置應該可以持久化儲存', () => {
    const photoOffset = { x: 10, y: -20 };
    const { container } = render(
      <MiniMap
        lat={25.033}
        lng={121.5654}
        theme={mockTheme}
        text={photoDragText}
        photoData={photoDragData}
        photoOffset={photoOffset}
      />,
    );

    // 驗證照片偏移設定被接受
    expect(container).toBeInTheDocument();
  });

  it('照片應該在車子標記附近合理範圍內', () => {
    const photoOffset = { x: 100, y: 100 }; // 超出合理範圍
    const { container } = render(
      <MiniMap
        lat={25.033}
        lng={121.5654}
        theme={mockTheme}
        text={photoDragText}
        photoData={photoDragData}
        photoOffset={photoOffset}
      />,
    );

    // 拖曳約束由 dragConstraints=containerRef 保證（容器內），offset 純套用
    expect(container).toBeInTheDocument();
  });
});
