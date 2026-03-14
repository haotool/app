import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeviceOrientation } from '../useDeviceOrientation';

describe('useDeviceOrientation', () => {
  beforeEach(() => {
    // Mock DeviceOrientationEvent support
    vi.stubGlobal('DeviceOrientationEvent', class DeviceOrientationEvent extends Event {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('應該返回初始狀態（null heading）', () => {
    const { result } = renderHook(() => useDeviceOrientation());

    expect(result.current.heading).toBeNull();
    expect(result.current.tilt).toBeNull();
    expect(result.current.isPhoneFlat).toBe(false);
    expect(result.current.isSupported).toBe(true);
  });

  it('應該在 DeviceOrientationEvent 觸發時更新 heading（absolute:true）', () => {
    const { result } = renderHook(() => useDeviceOrientation());

    act(() => {
      const event = new Event('deviceorientation') as DeviceOrientationEvent;
      Object.defineProperty(event, 'alpha', { value: 90, writable: false });
      Object.defineProperty(event, 'absolute', { value: true, writable: false });
      Object.defineProperty(event, 'webkitCompassHeading', { value: undefined, writable: false });
      window.dispatchEvent(event);
    });

    expect(result.current.heading).toBe(270);
  });

  it('absolute:false の deviceorientation は heading を更新しない（Android 任意基準）', () => {
    const { result } = renderHook(() => useDeviceOrientation());

    act(() => {
      const event = new Event('deviceorientation') as DeviceOrientationEvent;
      Object.defineProperty(event, 'alpha', { value: 90, writable: false });
      Object.defineProperty(event, 'absolute', { value: false, writable: false });
      Object.defineProperty(event, 'webkitCompassHeading', { value: undefined, writable: false });
      window.dispatchEvent(event);
    });

    // absolute でない alpha は磁北基準でないので heading は null のまま
    expect(result.current.heading).toBeNull();
  });

  it('deviceorientationabsolute イベントでも heading が更新される', () => {
    const { result } = renderHook(() => useDeviceOrientation());

    act(() => {
      const event = new Event('deviceorientationabsolute') as DeviceOrientationEvent;
      Object.defineProperty(event, 'alpha', { value: 90, writable: false });
      Object.defineProperty(event, 'absolute', { value: true, writable: false });
      Object.defineProperty(event, 'webkitCompassHeading', { value: undefined, writable: false });
      window.dispatchEvent(event);
    });

    expect(result.current.heading).toBe(270);
  });

  it('應該優先使用 webkitCompassHeading（iOS）', () => {
    const { result } = renderHook(() => useDeviceOrientation());

    act(() => {
      const event = new Event('deviceorientation') as DeviceOrientationEvent;
      Object.defineProperty(event, 'alpha', { value: 90, writable: false });
      Object.defineProperty(event, 'webkitCompassHeading', { value: 45, writable: false });
      window.dispatchEvent(event);
    });

    // webkitCompassHeading 優先
    expect(result.current.heading).toBe(45);
  });

  it('應該將 alpha 轉換為正北方向（0-360）— absolute:true', () => {
    const { result } = renderHook(() => useDeviceOrientation());

    act(() => {
      const event = new Event('deviceorientation') as DeviceOrientationEvent;
      // alpha: 0 = 正北, 90 = 正東, 180 = 正南, 270 = 正西
      Object.defineProperty(event, 'alpha', { value: 180, writable: false });
      Object.defineProperty(event, 'absolute', { value: true, writable: false });
      Object.defineProperty(event, 'webkitCompassHeading', { value: undefined, writable: false });
      window.dispatchEvent(event);
    });

    expect(result.current.heading).toBe(180);
  });

  it('應該同步回傳 tilt 與平放狀態', () => {
    const { result } = renderHook(() => useDeviceOrientation());

    act(() => {
      const event = new Event('deviceorientation') as DeviceOrientationEvent;
      Object.defineProperty(event, 'alpha', { value: 180, writable: false });
      Object.defineProperty(event, 'beta', { value: 20, writable: false });
      window.dispatchEvent(event);
    });

    expect(result.current.tilt).toBe(20);
    expect(result.current.isPhoneFlat).toBe(true);
  });

  it('應該在 unmount 時移除事件監聽器（含 deviceorientationabsolute）', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useDeviceOrientation());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('deviceorientation', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'deviceorientationabsolute',
      expect.any(Function),
    );
    removeEventListenerSpy.mockRestore();
  });

  it('應該處理權限請求（iOS 13+）', async () => {
    // Mock DeviceOrientationEvent.requestPermission
    const mockRequestPermission = vi.fn().mockResolvedValue('granted');
    vi.stubGlobal('DeviceOrientationEvent', {
      requestPermission: mockRequestPermission,
    });

    const { result } = renderHook(() => useDeviceOrientation());

    await act(async () => {
      if (result.current.requestPermission) {
        await result.current.requestPermission();
      }
    });

    expect(mockRequestPermission).toHaveBeenCalled();
  });

  it('面板未開啟時不應綁定方向感測事件', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    const { result } = renderHook(() => useDeviceOrientation({ enabled: false }));

    expect(result.current.heading).toBeNull();
    expect(result.current.requestPermission).toBeUndefined();
    expect(addEventListenerSpy).not.toHaveBeenCalledWith('deviceorientation', expect.any(Function));
  });
});
