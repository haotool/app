import { renderHook, act } from '@testing-library/react';
import { getDistance, getBearing, useNavigation } from '@app/park-keeper/hooks/useNavigation';
import type { ParkingRecord } from '@app/park-keeper/types';

describe('useNavigation - getDistance', () => {
  it('should return 0 for same points', () => {
    const lat = 25.033;
    const lon = 121.565;
    expect(getDistance(lat, lon, lat, lon)).toBe(0);
  });

  it('should return correct distance for Taipei to Kaohsiung (~300km)', () => {
    const taipei = { lat: 25.033, lon: 121.565 };
    const kaohsiung = { lat: 22.6273, lon: 120.3014 };
    const distance = getDistance(taipei.lat, taipei.lon, kaohsiung.lat, kaohsiung.lon);
    expect(distance).toBeGreaterThan(250_000);
    expect(distance).toBeLessThan(350_000);
  });
});

describe('useNavigation - getBearing', () => {
  const delta = 5;

  it('should return 0 for due north', () => {
    const bearing = getBearing(0, 0, 1, 0);
    expect(bearing).toBeLessThanOrEqual(delta);
    expect(bearing).toBeGreaterThanOrEqual(0);
  });

  it('should return ~90 for due east', () => {
    const bearing = getBearing(0, 0, 0, 1);
    expect(bearing).toBeGreaterThan(85);
    expect(bearing).toBeLessThan(95);
  });

  it('should return ~180 for due south', () => {
    const bearing = getBearing(0, 0, -1, 0);
    expect(bearing).toBeGreaterThan(175);
    expect(bearing).toBeLessThan(185);
  });

  it('should handle wrap-around correctly', () => {
    const bearing = getBearing(25, 121, 25, 121);
    expect(bearing).toBe(0);

    const bearingNorth = getBearing(45, 0, 46, 0);
    expect(bearingNorth).toBeLessThan(10);

    const bearingEast = getBearing(45, 0, 45, 1);
    expect(bearingEast).toBeGreaterThan(85);
    expect(bearingEast).toBeLessThan(95);
  });
});

describe('useNavigation hook', () => {
  const mockRecord: ParkingRecord = {
    id: 'test-nav',
    plateNumber: 'NAV-001',
    floor: 'B1',
    timestamp: Date.now(),
    hasPhoto: false,
    latitude: 25.033,
    longitude: 121.565,
  };

  let watchCallbacks: {
    success?: (pos: GeolocationPosition) => void;
    error?: (err: GeolocationPositionError) => void;
  };
  let orientationHandler: ((e: Event) => void) | null = null;
  let motionHandler: ((e: Event) => void) | null = null;

  beforeEach(() => {
    watchCallbacks = {};
    orientationHandler = null;
    motionHandler = null;

    vi.stubGlobal('navigator', {
      ...navigator,
      vibrate: vi.fn(),
      geolocation: {
        watchPosition: vi.fn((success: (pos: GeolocationPosition) => void, _error: unknown) => {
          watchCallbacks.success = success;
          return 42;
        }),
        clearWatch: vi.fn(),
      },
    });

    const origAddListener = window.addEventListener.bind(window);
    vi.spyOn(window, 'addEventListener').mockImplementation(
      (type: string, handler: EventListenerOrEventListenerObject) => {
        if (type === 'deviceorientation') orientationHandler = handler as (e: Event) => void;
        else if (type === 'devicemotion') motionHandler = handler as (e: Event) => void;
        else origAddListener(type, handler);
      },
    );
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useNavigation(mockRecord));
    expect(result.current.userLoc).toBeNull();
    expect(result.current.heading).toBe(0);
    expect(result.current.distance).toBeNull();
    expect(result.current.stepCount).toBe(0);
    expect(result.current.isIndoor).toBe(false);
  });

  it('should update distance and location on geolocation success', () => {
    const { result } = renderHook(() => useNavigation(mockRecord));

    act(() => {
      watchCallbacks.success?.({
        coords: {
          latitude: 25.035,
          longitude: 121.567,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as unknown as GeolocationPosition);
    });

    expect(result.current.userLoc).toEqual({ lat: 25.035, lng: 121.567 });
    expect(result.current.distance).toBeGreaterThan(0);
    expect(result.current.isIndoor).toBe(false);
  });

  it('should detect indoor mode with low accuracy', () => {
    const { result } = renderHook(() => useNavigation(mockRecord));

    act(() => {
      watchCallbacks.success?.({
        coords: {
          latitude: 25.035,
          longitude: 121.567,
          accuracy: 50,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as unknown as GeolocationPosition);
    });

    expect(result.current.isIndoor).toBe(true);
  });

  it('should update heading on device orientation', () => {
    const { result } = renderHook(() => useNavigation(mockRecord));

    act(() => {
      orientationHandler?.({
        alpha: 90,
        beta: 30,
        gamma: 0,
        absolute: false,
      } as unknown as Event);
    });

    expect(result.current.heading).toBe(270);
    expect(result.current.deviceTilt).toBe(30);
  });

  it('should compute isPhoneFlat correctly', () => {
    const { result } = renderHook(() => useNavigation(mockRecord));

    act(() => {
      orientationHandler?.({
        alpha: 0,
        beta: 20,
        gamma: 0,
        absolute: false,
      } as unknown as Event);
    });

    expect(result.current.isPhoneFlat).toBe(true);

    act(() => {
      orientationHandler?.({
        alpha: 0,
        beta: 60,
        gamma: 0,
        absolute: false,
      } as unknown as Event);
    });

    expect(result.current.isPhoneFlat).toBe(false);
  });

  it('should cleanup listeners on unmount', () => {
    const { unmount } = renderHook(() => useNavigation(mockRecord));
    unmount();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(navigator.geolocation.clearWatch).toHaveBeenCalledWith(42);
    expect(window.removeEventListener).toHaveBeenCalled();
  });

  it('should handle webkitCompassHeading', () => {
    const { result } = renderHook(() => useNavigation(mockRecord));

    act(() => {
      orientationHandler?.({
        webkitCompassHeading: 45,
        alpha: null,
        beta: 10,
        gamma: 0,
        absolute: false,
      } as unknown as Event);
    });

    expect(result.current.heading).toBe(45);
  });

  it('should count steps in indoor mode via devicemotion', () => {
    const { result } = renderHook(() => useNavigation(mockRecord));

    act(() => {
      watchCallbacks.success?.({
        coords: {
          latitude: 25.035,
          longitude: 121.567,
          accuracy: 50,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as unknown as GeolocationPosition);
    });

    expect(result.current.isIndoor).toBe(true);

    act(() => {
      motionHandler?.({
        accelerationIncludingGravity: { x: 0, y: 0, z: 15 },
      } as unknown as Event);
    });

    expect(result.current.stepCount).toBe(1);
  });

  it('should handle record without coordinates', () => {
    const noCoords: ParkingRecord = {
      id: 'no-coord',
      plateNumber: 'NC-001',
      floor: 'B1',
      timestamp: Date.now(),
      hasPhoto: false,
    };
    const { result } = renderHook(() => useNavigation(noCoords));

    act(() => {
      watchCallbacks.success?.({
        coords: {
          latitude: 25.035,
          longitude: 121.567,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as unknown as GeolocationPosition);
    });

    expect(result.current.distance).toBeNull();
  });

  it('should handle alpha null in orientation event', () => {
    const { result } = renderHook(() => useNavigation(mockRecord));

    act(() => {
      orientationHandler?.({
        alpha: null,
        beta: null,
        gamma: null,
        absolute: false,
      } as unknown as Event);
    });

    expect(result.current.heading).toBe(0);
  });
});
