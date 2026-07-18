import {
  THEMES,
  DEFAULT_SETTINGS,
  CACHE_DAYS,
  clampCacheDays,
  CUTE_WORDMARK_GRADIENT,
} from '@app/park-keeper/constants';

// WCAG 2.x 相對亮度／對比比率（無第三方依賴，issue #753 主題對比 AA 迴歸測試）。
function toLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function relativeLuminance(hex: string): number {
  const r = toLinear(parseInt(hex.slice(1, 3), 16));
  const g = toLinear(parseInt(hex.slice(3, 5), 16));
  const b = toLinear(parseInt(hex.slice(5, 7), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  return (Math.max(lA, lB) + 0.05) / (Math.min(lA, lB) + 0.05);
}

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
      // notificationsEnabled 死設定已移除（issue #725 P2，S3 註記技術債）。
      expect(DEFAULT_SETTINGS).not.toHaveProperty('notificationsEnabled');
    });
  });

  describe('主題對比 AA 迴歸（issue #753）', () => {
    it('racing textMuted 對其背景色對比須 ≥4.5:1（底部導覽列 inactive tab）', () => {
      const { textMuted, background } = THEMES['racing']!.colors;
      expect(contrastRatio(textMuted, background)).toBeGreaterThanOrEqual(4.5);
    });

    it('CUTE_WORDMARK_GRADIENT 三色對 cute 背景色對比須 ≥4.5:1（首屏 wordmark）', () => {
      const { background } = THEMES['cute']!.colors;
      for (const stop of CUTE_WORDMARK_GRADIENT) {
        expect(contrastRatio(stop, background)).toBeGreaterThanOrEqual(4.5);
      }
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
