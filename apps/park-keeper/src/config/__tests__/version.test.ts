import {
  APP_VERSION,
  BUILD_TIME,
  IS_DEV,
  getDisplayVersion,
  getFullVersion,
  getFormattedBuildTime,
  getVersionInfo,
} from '@app/park-keeper/config/version';

describe('version module', () => {
  describe('constants', () => {
    it('should be defined', () => {
      expect(APP_VERSION).toBeDefined();
      expect(typeof APP_VERSION).toBe('string');
      expect(APP_VERSION.length).toBeGreaterThan(0);
    });

    it('should expose valid build time', () => {
      expect(BUILD_TIME).toBeDefined();
      expect(typeof BUILD_TIME).toBe('string');
      const parsed = new Date(BUILD_TIME);
      expect(parsed.toString()).not.toBe('Invalid Date');
      expect(Number.isNaN(parsed.getTime())).toBe(false);
    });

    it('should expose dev flag as boolean', () => {
      expect(typeof IS_DEV).toBe('boolean');
    });
  });

  describe('getDisplayVersion', () => {
    it('should return version with v prefix', () => {
      expect(getDisplayVersion()).toMatch(/^v/);
    });

    it('should show semantic version core only', () => {
      const expectedCore = APP_VERSION.replace(/^v/, '').split('+')[0];
      expect(getDisplayVersion()).toBe(`v${expectedCore}`);
    });
  });

  describe('getFullVersion', () => {
    it('should preserve build metadata for diagnostics', () => {
      const result = getFullVersion();
      expect(result).toMatch(/^v/);
      expect(result).toContain(APP_VERSION.replace(/^v/, ''));
    });
  });

  describe('getFormattedBuildTime', () => {
    it('should return formatted date time', () => {
      const result = getFormattedBuildTime();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/);
    });
  });

  describe('getVersionInfo', () => {
    it('should return consistent version info payload', () => {
      const info = getVersionInfo();

      expect(info.version).toBe(APP_VERSION);
      expect(info.displayVersion).toBe(getDisplayVersion());
      expect(info.fullVersion).toBe(getFullVersion());
      expect(info.buildTime).toBe(BUILD_TIME);
      expect(info.formattedBuildTime).toBe(getFormattedBuildTime());
      expect(info.isDev).toBe(IS_DEV);
    });
  });
});
