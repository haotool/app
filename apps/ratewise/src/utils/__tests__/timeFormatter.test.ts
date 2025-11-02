import { describe, it, expect } from 'vitest';
import { formatIsoTimestamp, formatGenericTimeString, formatDisplayTime } from '../timeFormatter';

describe('formatIsoTimestamp', () => {
  it('should format valid ISO timestamp correctly', () => {
    const result = formatIsoTimestamp('2025-10-31T03:30:00+08:00');
    // 時區可能不同，只檢查格式是否正確
    expect(result).toMatch(/\d{2}\/\d{2} \d{2}:\d{2}/);
  });

  it('should handle ISO timestamp without timezone', () => {
    const result = formatIsoTimestamp('2025-10-31T03:30:00');
    expect(result).toMatch(/10\/31 \d{2}:\d{2}/); // Time may vary based on local timezone
  });

  it('should return empty string for invalid ISO timestamp', () => {
    expect(formatIsoTimestamp('invalid-date')).toBe('');
    expect(formatIsoTimestamp('not-a-date')).toBe('');
    expect(formatIsoTimestamp('')).toBe('');
  });

  it('should pad single-digit month and day', () => {
    const result = formatIsoTimestamp('2025-01-05T08:30:00');
    expect(result).toMatch(/01\/05 \d{2}:\d{2}/);
  });
});

describe('formatGenericTimeString', () => {
  it('should format ISO string using formatIsoTimestamp', () => {
    const result = formatGenericTimeString('2025-10-31T03:30:00+08:00');
    // 時區可能不同，只檢查格式是否正確
    expect(result).toMatch(/\d{2}\/\d{2} \d{2}:\d{2}/);
  });

  it('should format Taiwan Bank format (YYYY-MM-DD HH:mm:ss)', () => {
    const result = formatGenericTimeString('2025-10-31 03:30:00');
    expect(result).toBe('10/31 03:30:00');
  });

  it('should handle date with slash separators', () => {
    const result = formatGenericTimeString('2025/10/31 03:30:00');
    expect(result).toBe('10/31 03:30:00');
  });

  it('should handle date only (no time)', () => {
    const result = formatGenericTimeString('2025-10-31');
    expect(result).toBe('10/31');
  });

  it('should pad single-digit month and day', () => {
    const result = formatGenericTimeString('2025-1-5 08:30');
    expect(result).toBe('01/05 08:30');
  });

  it('should handle time embedded in string', () => {
    const result = formatGenericTimeString('2025-10-31updated:03:30:00');
    expect(result).toBe('10/31 03:30:00');
  });

  it('should return original string if unparseable', () => {
    expect(formatGenericTimeString('completely invalid')).toBe('completely invalid');
  });

  it('should return empty string for empty input', () => {
    expect(formatGenericTimeString('')).toBe('');
    expect(formatGenericTimeString('   ')).toBe('');
  });
});

describe('formatDisplayTime', () => {
  it('should format both source and refresh times', () => {
    const result = formatDisplayTime('2025-10-31 03:30:00', '2025-10-31T03:35:00+08:00');
    expect(result).toContain('來源 10/31 03:30:00');
    expect(result).toMatch(/刷新 \d{2}\/\d{2} \d{2}:\d{2}/);
  });

  it('should handle ISO format in lastUpdate as "刷新"', () => {
    const result = formatDisplayTime('2025-10-31T03:30:00+08:00', null);
    expect(result).toMatch(/刷新 \d{2}\/\d{2} \d{2}:\d{2}/);
  });

  it('should handle Taiwan Bank format in lastUpdate as "來源"', () => {
    const result = formatDisplayTime('2025-10-31 03:30:00', null);
    expect(result).toBe('來源 10/31 03:30:00');
  });

  it('should not duplicate same refresh time', () => {
    const sameTime = '2025-10-31T03:30:00+08:00';
    const result = formatDisplayTime(sameTime, sameTime);
    expect(result).toMatch(/刷新 \d{2}\/\d{2} \d{2}:\d{2}/);
    // 不應該有重複的「刷新」
    expect(result.split('刷新').length - 1).toBe(1);
  });

  it('should handle only lastFetchedAt', () => {
    const result = formatDisplayTime(null, '2025-10-31T03:30:00+08:00');
    expect(result).toMatch(/刷新 \d{2}\/\d{2} \d{2}:\d{2}/);
  });

  it('should return empty string when both are null', () => {
    expect(formatDisplayTime(null, null)).toBe('');
  });

  it('should handle empty strings', () => {
    expect(formatDisplayTime('', '')).toBe('');
    expect(formatDisplayTime('   ', '   ')).toBe('');
  });

  it('should handle invalid timestamps gracefully', () => {
    // 無法解析的字串會保留原樣（有助於除錯）
    const result = formatDisplayTime('invalid-date', '2025-10-31T03:30:00+08:00');
    expect(result).toContain('來源 invalid-date');
    expect(result).toMatch(/刷新 \d{2}\/\d{2} \d{2}:\d{2}/);
  });

  it('should handle real-world scenario: Taiwan Bank + frontend refresh', () => {
    const result = formatDisplayTime('2025年10月31日 03時30分00秒', '2025-10-31T03:35:22+08:00');
    expect(result).toContain('來源 10/31');
    expect(result).toMatch(/刷新 \d{2}\/\d{2} \d{2}:\d{2}/);
  });
});
