import { THEMES, DEFAULT_SETTINGS, CACHE_DAYS, clampCacheDays } from '@app/park-keeper/constants';

const REQUIRED_THEME_KEYS = [
  'id',
  'name',
  'font',
  'borderRadius',
  'animationType',
  'colors',
] as const;

const REQUIRED_COLOR_KEYS = [
  'primary',
  'secondary',
  'accent',
  'background',
  'surface',
  'text',
  'textMuted',
] as const;

describe('constants', () => {
  describe('THEMES', () => {
    it('should have exactly 4 themes: racing, cute, minimalist, literary', () => {
      expect(Object.keys(THEMES)).toHaveLength(4);
      expect(THEMES).toHaveProperty('racing');
      expect(THEMES).toHaveProperty('cute');
      expect(THEMES).toHaveProperty('minimalist');
      expect(THEMES).toHaveProperty('literary');
    });

    it('each theme should have all required color properties', () => {
      for (const theme of Object.values(THEMES)) {
        expect(theme.colors).toBeDefined();
        for (const key of REQUIRED_COLOR_KEYS) {
          expect(theme.colors).toHaveProperty(key);
          expect(typeof theme.colors[key]).toBe('string');
          expect(theme.colors[key].length).toBeGreaterThan(0);
        }
      }
    });

    it('each theme should have id, name, font, borderRadius, animationType', () => {
      for (const theme of Object.values(THEMES)) {
        for (const key of REQUIRED_THEME_KEYS) {
          if (key === 'colors') continue;
          expect(theme).toHaveProperty(key);
          expect(theme[key as keyof typeof theme]).toBeDefined();
        }
      }
    });
  });

  describe('DEFAULT_SETTINGS', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_SETTINGS.theme).toBe('minimalist');
      expect(DEFAULT_SETTINGS.language).toBe('zh-TW');
      expect(DEFAULT_SETTINGS.cacheDurationDays).toBe(CACHE_DAYS.DEFAULT);
      expect(DEFAULT_SETTINGS.notificationsEnabled).toBe(true);
    });
  });

  describe('CACHE_DAYS', () => {
    it('should pin the retention SSOT contract values', () => {
      expect(CACHE_DAYS).toEqual({ MIN: 1, MAX: 30, DEFAULT: 7 });
    });

    it('clampCacheDays should clamp and round into [MIN, MAX]', () => {
      expect(clampCacheDays(0)).toBe(CACHE_DAYS.MIN);
      expect(clampCacheDays(-5)).toBe(CACHE_DAYS.MIN);
      expect(clampCacheDays(31)).toBe(CACHE_DAYS.MAX);
      expect(clampCacheDays(999)).toBe(CACHE_DAYS.MAX);
      expect(clampCacheDays(7.4)).toBe(7);
      expect(clampCacheDays(7.6)).toBe(8);
      expect(clampCacheDays(15)).toBe(15);
    });
  });
});
