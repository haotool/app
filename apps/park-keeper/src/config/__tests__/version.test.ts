import {
  APP_VERSION,
  BUILD_TIME,
  getDisplayVersion,
  getFullVersion,
} from '@app/park-keeper/config/version';

describe('version module', () => {
  describe('APP_VERSION', () => {
    it('should be defined', () => {
      expect(APP_VERSION).toBeDefined();
      expect(typeof APP_VERSION).toBe('string');
      expect(APP_VERSION.length).toBeGreaterThan(0);
    });
  });

  describe('BUILD_TIME', () => {
    it('should be valid ISO string', () => {
      expect(BUILD_TIME).toBeDefined();
      expect(typeof BUILD_TIME).toBe('string');
      const parsed = new Date(BUILD_TIME);
      expect(parsed.toString()).not.toBe('Invalid Date');
      expect(Number.isNaN(parsed.getTime())).toBe(false);
    });
  });

  describe('getDisplayVersion', () => {
    it('should prefix "v" when missing', () => {
      expect(getDisplayVersion()).toMatch(/^v/);
      if (!APP_VERSION.startsWith('v')) {
        expect(getDisplayVersion()).toBe(`v${APP_VERSION}`);
      }
    });

    it('should not double prefix when version already starts with v', () => {
      const result = getDisplayVersion();
      expect(result).not.toMatch(/^vv/);
      expect(result.startsWith('v')).toBe(true);
    });
  });

  describe('getFullVersion', () => {
    it('should include version and date', () => {
      const result = getFullVersion();
      expect(result).toContain(getDisplayVersion());
      expect(result).toMatch(/\(\d{4}\/\d{1,2}\/\d{1,2}\)/);
    });
  });
});
