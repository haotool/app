import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeolocationService } from './geolocation';

describe('GeolocationService - High Accuracy Positioning', () => {
  let mockGeolocation: Partial<Geolocation>;
  let originalGeolocation: Geolocation | undefined;

  beforeEach(() => {
    // Save original geolocation
    originalGeolocation = navigator.geolocation;

    // Create mock geolocation
    mockGeolocation = {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    };

    // Replace navigator.geolocation with mock
    Object.defineProperty(navigator, 'geolocation', {
      writable: true,
      configurable: true,
      value: mockGeolocation,
    });
  });

  afterEach(() => {
    // Restore original geolocation
    if (originalGeolocation) {
      Object.defineProperty(navigator, 'geolocation', {
        writable: true,
        configurable: true,
        value: originalGeolocation,
      });
    }
    vi.clearAllMocks();
  });

  describe('🔴 RED: enableHighAccuracy Configuration', () => {
    it('should request location with enableHighAccuracy: true for maximum precision', async () => {
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: 25.033,
          longitude: 121.5654,
          accuracy: 5, // meters
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({}),
        },
        timestamp: Date.now(),
        toJSON: () => ({}),
      };

      (mockGeolocation.getCurrentPosition as ReturnType<typeof vi.fn>)?.mockImplementation(
        (success) => {
          success(mockPosition);
        },
      );

      const position = await GeolocationService.getCurrentPosition();

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: true,
        }),
      );

      expect(position.latitude).toBe(25.033);
      expect(position.longitude).toBe(121.5654);
      expect(position.accuracy).toBe(5);
    });

    it('should use timeout: 10000ms to wait for GPS warm-up', async () => {
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: 25.033,
          longitude: 121.5654,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({}),
        },
        timestamp: Date.now(),
        toJSON: () => ({}),
      };

      (mockGeolocation.getCurrentPosition as ReturnType<typeof vi.fn>)?.mockImplementation(
        (success) => {
          success(mockPosition);
        },
      );

      await GeolocationService.getCurrentPosition();

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          timeout: 10000,
        }),
      );
    });

    it('should use maximumAge: 0 to prevent stale location cache for parking', async () => {
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: 25.033,
          longitude: 121.5654,
          accuracy: 8,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({}),
        },
        timestamp: Date.now(),
        toJSON: () => ({}),
      };

      (mockGeolocation.getCurrentPosition as ReturnType<typeof vi.fn>)?.mockImplementation(
        (success) => {
          success(mockPosition);
        },
      );

      await GeolocationService.getCurrentPosition();

      // For parking location, we need fresh position (not cached)
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          maximumAge: 0,
        }),
      );
    });
  });

  describe('🔴 RED: Coordinate Precision (6 decimal places = ~0.11m accuracy)', () => {
    it('should preserve 6 decimal places for latitude (0.11m precision)', async () => {
      const highPrecisionLat = 25.033964; // 6 decimal places
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: highPrecisionLat,
          longitude: 121.5654,
          accuracy: 5,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({}),
        },
        timestamp: Date.now(),
        toJSON: () => ({}),
      };

      (mockGeolocation.getCurrentPosition as ReturnType<typeof vi.fn>)?.mockImplementation(
        (success) => {
          success(mockPosition);
        },
      );

      const position = await GeolocationService.getCurrentPosition();

      // Verify 6 decimal places preserved
      expect(position.latitude.toString().split('.')[1]?.length).toBeGreaterThanOrEqual(6);
      expect(position.latitude).toBe(highPrecisionLat);
    });

    it('should preserve 6 decimal places for longitude (0.11m precision)', async () => {
      const highPrecisionLng = 121.565432; // 6 decimal places
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: 25.033,
          longitude: highPrecisionLng,
          accuracy: 5,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({}),
        },
        timestamp: Date.now(),
        toJSON: () => ({}),
      };

      (mockGeolocation.getCurrentPosition as ReturnType<typeof vi.fn>)?.mockImplementation(
        (success) => {
          success(mockPosition);
        },
      );

      const position = await GeolocationService.getCurrentPosition();

      // Verify 6 decimal places preserved
      expect(position.longitude.toString().split('.')[1]?.length).toBeGreaterThanOrEqual(6);
      expect(position.longitude).toBe(highPrecisionLng);
    });

    it('should round to 6 decimal places if GPS provides more precision', async () => {
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: 25.0339641234567, // 13 decimal places from GPS
          longitude: 121.5654321234567,
          accuracy: 3,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({}),
        },
        timestamp: Date.now(),
        toJSON: () => ({}),
      };

      (mockGeolocation.getCurrentPosition as ReturnType<typeof vi.fn>)?.mockImplementation(
        (success) => {
          success(mockPosition);
        },
      );

      const position = await GeolocationService.getCurrentPosition();

      // Should round to 6 decimal places
      expect(position.latitude).toBe(25.033964);
      expect(position.longitude).toBe(121.565432);
    });
  });

  describe('🔴 RED: Error Handling', () => {
    it('should handle PERMISSION_DENIED error gracefully', async () => {
      const mockError: GeolocationPositionError = {
        code: 1, // PERMISSION_DENIED
        message: 'User denied Geolocation',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      (mockGeolocation.getCurrentPosition as ReturnType<typeof vi.fn>)?.mockImplementation(
        (_success, error) => {
          error(mockError);
        },
      );

      await expect(GeolocationService.getCurrentPosition()).rejects.toThrow(
        '定位權限被拒絕，請在設定中允許定位',
      );
    });

    it('should handle POSITION_UNAVAILABLE error gracefully', async () => {
      const mockError: GeolocationPositionError = {
        code: 2, // POSITION_UNAVAILABLE
        message: 'Position unavailable',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      (mockGeolocation.getCurrentPosition as ReturnType<typeof vi.fn>)?.mockImplementation(
        (_success, error) => {
          error(mockError);
        },
      );

      await expect(GeolocationService.getCurrentPosition()).rejects.toThrow(
        '無法取得定位，請確認 GPS 已開啟',
      );
    });

    it('should handle TIMEOUT error gracefully', async () => {
      const mockError: GeolocationPositionError = {
        code: 3, // TIMEOUT
        message: 'Timeout',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      (mockGeolocation.getCurrentPosition as ReturnType<typeof vi.fn>)?.mockImplementation(
        (_success, error) => {
          error(mockError);
        },
      );

      await expect(GeolocationService.getCurrentPosition()).rejects.toThrow('定位逾時，請稍後再試');
    });

    it('should throw error if geolocation API is not supported', async () => {
      // Remove geolocation from navigator
      Object.defineProperty(navigator, 'geolocation', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      await expect(GeolocationService.getCurrentPosition()).rejects.toThrow(
        '您的瀏覽器不支援定位功能',
      );
    });
  });

  describe('🔴 RED: Accuracy Validation', () => {
    it('should return accuracy in meters from GPS', async () => {
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: 25.033,
          longitude: 121.5654,
          accuracy: 5.5, // meters
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({}),
        },
        timestamp: Date.now(),
        toJSON: () => ({}),
      };

      (mockGeolocation.getCurrentPosition as ReturnType<typeof vi.fn>)?.mockImplementation(
        (success) => {
          success(mockPosition);
        },
      );

      const position = await GeolocationService.getCurrentPosition();

      expect(position.accuracy).toBe(5.5);
      expect(position.accuracy).toBeLessThan(10); // Should be under 10m for high accuracy
    });

    it('should warn if accuracy is poor (>10 meters)', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: 25.033,
          longitude: 121.5654,
          accuracy: 50, // Poor accuracy
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({}),
        },
        timestamp: Date.now(),
        toJSON: () => ({}),
      };

      (mockGeolocation.getCurrentPosition as ReturnType<typeof vi.fn>)?.mockImplementation(
        (success) => {
          success(mockPosition);
        },
      );

      const position = await GeolocationService.getCurrentPosition();

      expect(position.accuracy).toBe(50);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('定位精度較低'));

      consoleSpy.mockRestore();
    });
  });
});
