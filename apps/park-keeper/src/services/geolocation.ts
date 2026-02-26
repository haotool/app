/**
 * GeolocationService - High Accuracy Positioning for Parking Location
 *
 * Best Practices based on Web search findings:
 * 1. enableHighAccuracy: true - Uses GPS for maximum precision (~5-10m)
 * 2. timeout: 10000ms - Wait for GPS warm-up period
 * 3. maximumAge: 0 - Always get fresh position (critical for parking)
 * 4. Preserve 6 decimal places - Achieves ~0.11m precision at equator
 *
 * Sources:
 * - MDN Geolocation API: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
 * - HTML5 Geolocation Best Practices: https://www.andreafiori.net/software-development/posts/html5-geolocation-api-complete-guide-with-examples-and-best-practices
 */

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number; // meters
  timestamp: number;
}

/**
 * Round coordinate to 6 decimal places
 * 6 decimal places = ~0.11m precision at equator
 * @param coord - Raw coordinate from GPS
 * @returns Coordinate rounded to 6 decimal places
 */
const roundToSixDecimals = (coord: number): number => {
  return Math.round(coord * 1000000) / 1000000;
};

export class GeolocationService {
  /**
   * Get current position with maximum accuracy
   * Best Practice: enableHighAccuracy: true + timeout: 10000 + maximumAge: 0
   */
  static async getCurrentPosition(): Promise<GeolocationPosition> {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      throw new Error('您的瀏覽器不支援定位功能');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          // Warn if accuracy is poor (>10 meters)
          if (accuracy > 10) {
            console.warn(`定位精度較低: ${accuracy.toFixed(1)}m，建議移至開闊空間`);
          }

          resolve({
            // Round to 6 decimal places (0.11m precision)
            latitude: roundToSixDecimals(latitude),
            longitude: roundToSixDecimals(longitude),
            accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          // Handle geolocation errors with user-friendly messages
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('定位權限被拒絕，請在設定中允許定位'));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error('無法取得定位，請確認 GPS 已開啟'));
              break;
            case error.TIMEOUT:
              reject(new Error('定位逾時，請稍後再試'));
              break;
            default:
              reject(new Error(`定位錯誤: ${error.message}`));
          }
        },
        {
          // Best Practice Settings for Parking Location
          enableHighAccuracy: true, // Use GPS for maximum precision
          timeout: 10000, // Wait 10s for GPS warm-up
          maximumAge: 0, // Always get fresh position (critical for parking)
        },
      );
    });
  }

  /**
   * Watch position for continuous tracking (future use)
   * Not needed for current parking use case, but included for completeness
   */
  static watchPosition(
    onSuccess: (position: GeolocationPosition) => void,
    onError: (error: Error) => void,
  ): number {
    if (!navigator.geolocation) {
      onError(new Error('您的瀏覽器不支援定位功能'));
      return -1;
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        onSuccess({
          latitude: roundToSixDecimals(latitude),
          longitude: roundToSixDecimals(longitude),
          accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            onError(new Error('定位權限被拒絕，請在設定中允許定位'));
            break;
          case error.POSITION_UNAVAILABLE:
            onError(new Error('無法取得定位，請確認 GPS 已開啟'));
            break;
          case error.TIMEOUT:
            onError(new Error('定位逾時，請稍後再試'));
            break;
          default:
            onError(new Error(`定位錯誤: ${error.message}`));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000, // For watchPosition, allow 30s cache to reduce battery drain
      },
    );
  }

  /**
   * Clear watch position
   */
  static clearWatch(watchId: number): void {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }
}
