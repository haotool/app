import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMapPerformance } from '../useMapPerformance';
import L from 'leaflet';

// Mock react-leaflet with factory function
vi.mock('react-leaflet', () => ({
  useMap: vi.fn(),
}));

// Mock Leaflet with factory function
vi.mock('leaflet', () => ({
  default: {
    TileLayer: vi.fn(),
  },
  TileLayer: vi.fn(),
}));

describe('useMapPerformance', () => {
  let mockMap: {
    invalidateSize: ReturnType<typeof vi.fn>;
    eachLayer: ReturnType<typeof vi.fn>;
  };
  let mockTileLayer: {
    _tiles: Record<string, unknown>;
    redraw: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Setup mock map
    mockTileLayer = {
      _tiles: {},
      redraw: vi.fn(),
    };

    mockMap = {
      invalidateSize: vi.fn(),
      eachLayer: vi.fn((callback) => {
        callback(mockTileLayer);
      }),
    };

    const { useMap } = await import('react-leaflet');
    (useMap as ReturnType<typeof vi.fn>).mockReturnValue(mockMap);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('應該計算正確的 keepBuffer 值（基於快取天數）', () => {
    // Short cache (1-3 days)
    const { result: result1 } = renderHook(() =>
      useMapPerformance({
        cacheDurationDays: 1,
        interactive: true,
        zoomEnabled: true,
      }),
    );
    expect(result1.current.keepBuffer).toBe(2);

    // Medium cache (4-7 days)
    const { result: result2 } = renderHook(() =>
      useMapPerformance({
        cacheDurationDays: 7,
        interactive: true,
        zoomEnabled: true,
      }),
    );
    expect(result2.current.keepBuffer).toBe(4);

    // Long cache (8+ days)
    const { result: result3 } = renderHook(() =>
      useMapPerformance({
        cacheDurationDays: 30,
        interactive: true,
        zoomEnabled: true,
      }),
    );
    expect(result3.current.keepBuffer).toBe(6);
  });

  it('應該對靜態地圖使用最小 buffer', () => {
    const { result } = renderHook(() =>
      useMapPerformance({
        cacheDurationDays: 30,
        interactive: false,
        zoomEnabled: false,
      }),
    );
    expect(result.current.keepBuffer).toBe(2);
  });

  it('應該計算正確的 maxTilesCacheSize', () => {
    const { result: result1 } = renderHook(() =>
      useMapPerformance({
        cacheDurationDays: 1,
        interactive: true,
        zoomEnabled: true,
      }),
    );
    expect(result1.current.maxTilesCacheSize).toBe(150); // 100 + 1*50

    const { result: result7 } = renderHook(() =>
      useMapPerformance({
        cacheDurationDays: 7,
        interactive: true,
        zoomEnabled: true,
      }),
    );
    expect(result7.current.maxTilesCacheSize).toBe(450); // 100 + 7*50
  });

  it('應該在超過快取限制時清理 tiles', () => {
    // Setup: 500 tiles in cache, limit is 150
    const largeTileCache: Record<string, unknown> = {};
    for (let i = 0; i < 500; i++) {
      largeTileCache[`tile-${i}`] = {};
    }
    mockTileLayer._tiles = largeTileCache;

    // Check if mockTileLayer is instance of L.TileLayer
    Object.setPrototypeOf(mockTileLayer, L.TileLayer.prototype);

    renderHook(() =>
      useMapPerformance({
        cacheDurationDays: 1,
        interactive: true,
        zoomEnabled: true,
      }),
    );

    // Fast-forward 5 minutes
    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(mockTileLayer.redraw).toHaveBeenCalled();
  });

  it('應該在快取限制內時不清理 tiles', () => {
    // Setup: 100 tiles in cache, limit is 150
    const smallTileCache: Record<string, unknown> = {};
    for (let i = 0; i < 100; i++) {
      smallTileCache[`tile-${i}`] = {};
    }
    mockTileLayer._tiles = smallTileCache;

    Object.setPrototypeOf(mockTileLayer, L.TileLayer.prototype);

    renderHook(() =>
      useMapPerformance({
        cacheDurationDays: 1,
        interactive: true,
        zoomEnabled: true,
      }),
    );

    // Fast-forward 5 minutes
    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(mockTileLayer.redraw).not.toHaveBeenCalled();
  });

  it('應該在 mount 時 invalidate 地圖尺寸', () => {
    renderHook(() =>
      useMapPerformance({
        cacheDurationDays: 7,
        interactive: true,
        zoomEnabled: true,
      }),
    );

    // Fast-forward 100ms
    vi.advanceTimersByTime(100);

    expect(mockMap.invalidateSize).toHaveBeenCalled();
  });

  it('應該在 unmount 時清除 cleanup interval', () => {
    const { unmount } = renderHook(() =>
      useMapPerformance({
        cacheDurationDays: 7,
        interactive: true,
        zoomEnabled: true,
      }),
    );

    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it('應該根據 zoom 狀態設定 update 策略', () => {
    // With zoom enabled
    const { result: result1 } = renderHook(() =>
      useMapPerformance({
        cacheDurationDays: 7,
        interactive: true,
        zoomEnabled: true,
      }),
    );
    expect(result1.current.updateWhenZooming).toBe(true);
    expect(result1.current.updateWhenIdle).toBe(false);

    // With zoom disabled
    const { result: result2 } = renderHook(() =>
      useMapPerformance({
        cacheDurationDays: 7,
        interactive: true,
        zoomEnabled: false,
      }),
    );
    expect(result2.current.updateWhenZooming).toBe(false);
    expect(result2.current.updateWhenIdle).toBe(true);
  });
});
