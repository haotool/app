import { describe, it, expect } from 'vitest';

// 智慧日期解析函數
const parseSmartDate = (input: string): Date | null => {
  const now = new Date();

  // 格式 1: MM/DD HH:MM 或 M/D H:M
  const dateTimeMatch = /^(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{1,2})$/.exec(input);
  if (dateTimeMatch) {
    const [, month, day, hour, minute] = dateTimeMatch;
    const h = Number(hour);
    const m = Number(minute);
    // 驗證時間範圍
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    const date = new Date(now.getFullYear(), Number(month) - 1, Number(day), h, m);
    if (!isNaN(date.getTime())) return date;
  }

  // 格式 2: HH.半 或 H.半 (HH:30)
  const halfHourMatch = /^(\d{1,2})\.半$/.exec(input);
  if (halfHourMatch) {
    const [, hour] = halfHourMatch;
    const h = Number(hour);
    if (h < 0 || h > 23) return null;
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, 30);
    if (!isNaN(date.getTime())) return date;
  }

  // 格式 3: HH:MM 或 H:M
  const timeOnlyMatch = /^(\d{1,2}):(\d{1,2})$/.exec(input);
  if (timeOnlyMatch) {
    const [, hour, minute] = timeOnlyMatch;
    const h = Number(hour);
    const m = Number(minute);
    // 驗證時間範圍
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    if (!isNaN(date.getTime())) return date;
  }

  return null;
};

describe('智慧日期解析', () => {
  describe('parseSmartDate', () => {
    it('應該正確解析 MM/DD HH:MM 格式', () => {
      const result = parseSmartDate('11/02 14:30');

      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(10); // 11月 = 索引10
      expect(result?.getDate()).toBe(2);
      expect(result?.getHours()).toBe(14);
      expect(result?.getMinutes()).toBe(30);
    });

    it('應該正確解析單數字日期 M/D H:M 格式', () => {
      const result = parseSmartDate('1/5 9:30');

      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(0); // 1月 = 索引0
      expect(result?.getDate()).toBe(5);
      expect(result?.getHours()).toBe(9);
      expect(result?.getMinutes()).toBe(30);
    });

    it('應該正確解析 HH.半 格式（表示 HH:30）', () => {
      const result = parseSmartDate('15.半');

      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(15);
      expect(result?.getMinutes()).toBe(30);
    });

    it('應該正確解析單數字 H.半 格式', () => {
      const result = parseSmartDate('7.半');

      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(7);
      expect(result?.getMinutes()).toBe(30);
    });

    it('應該正確解析 HH:MM 時間格式（使用當天日期）', () => {
      const result = parseSmartDate('08:45');
      const today = new Date();

      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(today.getFullYear());
      expect(result?.getMonth()).toBe(today.getMonth());
      expect(result?.getDate()).toBe(today.getDate());
      expect(result?.getHours()).toBe(8);
      expect(result?.getMinutes()).toBe(45);
    });

    it('應該對無效格式返回 null', () => {
      expect(parseSmartDate('invalid')).toBeNull();
      expect(parseSmartDate('25:99')).toBeNull();
      expect(parseSmartDate('')).toBeNull();
    });

    it('應該對邊界值正確處理', () => {
      // 0點0分
      const midnight = parseSmartDate('0:0');
      expect(midnight?.getHours()).toBe(0);
      expect(midnight?.getMinutes()).toBe(0);

      // 23點59分
      const beforeMidnight = parseSmartDate('23:59');
      expect(beforeMidnight?.getHours()).toBe(23);
      expect(beforeMidnight?.getMinutes()).toBe(59);
    });
  });
});
