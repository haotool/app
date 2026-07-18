import { describe, it, expect } from 'vitest';
import { formatSmartTime } from '../formatSmartTime';

describe('formatSmartTime', () => {
  const now = Date.now();

  it('<1 分鐘回傳 justNowLabel', () => {
    expect(formatSmartTime(now - 10_000, 'zh-TW', '剛剛')).toBe('剛剛');
  });

  it('依經過時間回傳分鐘/小時/天級相對時間（zh-TW）', () => {
    expect(formatSmartTime(now - 5 * 60_000, 'zh-TW', '剛剛')).toBe('5 分鐘前');
    expect(formatSmartTime(now - 3 * 3_600_000, 'zh-TW', '剛剛')).toBe('3 小時前');
    expect(formatSmartTime(now - 2 * 86_400_000, 'zh-TW', '剛剛')).toBe('2 天前');
  });

  it('i18n 三語相容：en', () => {
    expect(formatSmartTime(now - 5 * 60_000, 'en', 'Just now')).toBe('5 minutes ago');
    expect(formatSmartTime(now - 3 * 3_600_000, 'en', 'Just now')).toBe('3 hours ago');
  });

  it('i18n 三語相容：ja', () => {
    expect(formatSmartTime(now - 5 * 60_000, 'ja', 'たった今')).toBe('5 分前');
    expect(formatSmartTime(now - 3 * 3_600_000, 'ja', 'たった今')).toBe('3 時間前');
  });
});
