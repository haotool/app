import { describe, it, expect } from 'vitest';

// 便便記錄型態定義
interface PoopRecord {
  id: string;
  time: string; // ISO 8601 格式
  type: 1 | 2 | 3 | 4 | 5; // 1=偏硬, 2=理想, 3=稍軟, 4=糊狀, 5=水樣
}

// 工具函數：生成唯一 ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// 工具函數：創建新記錄
const createRecord = (type: 1 | 2 | 3 | 4 | 5, date: Date = new Date()): PoopRecord => {
  return {
    id: generateId(),
    time: date.toISOString(),
    type,
  };
};

// 工具函數：按日期分組記錄
const groupByDate = (records: PoopRecord[]): Record<string, PoopRecord[]> => {
  const grouped: Record<string, PoopRecord[]> = {};

  for (const record of records) {
    const date = new Date(record.time);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(record);
  }

  return grouped;
};

// 工具函數：計算每日統計
const calculateDailyStats = (records: PoopRecord[]) => {
  const typeCount: Record<number, number> = {};

  for (const record of records) {
    typeCount[record.type] = (typeCount[record.type] ?? 0) + 1;
  }

  return {
    total: records.length,
    typeCount,
    mostCommonType: Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0],
  };
};

describe('便便記錄功能', () => {
  describe('createRecord', () => {
    it('應該創建有效的記錄', () => {
      const record = createRecord(2);

      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('time');
      expect(record).toHaveProperty('type');
      expect(record.type).toBe(2);
      expect(typeof record.id).toBe('string');
      expect(record.id.length).toBeGreaterThan(0);
    });

    it('應該生成唯一 ID', () => {
      const record1 = createRecord(2);
      const record2 = createRecord(2);

      expect(record1.id).not.toBe(record2.id);
    });

    it('應該使用指定的日期', () => {
      const testDate = new Date('2025-11-01T14:30:00.000Z');
      const record = createRecord(3, testDate);

      expect(record.time).toBe(testDate.toISOString());
    });

    it('應該支援所有便便型態', () => {
      const types: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];

      for (const type of types) {
        const record = createRecord(type);
        expect(record.type).toBe(type);
      }
    });
  });

  describe('groupByDate', () => {
    it('應該按日期正確分組記錄', () => {
      const records: PoopRecord[] = [
        createRecord(2, new Date('2025-11-01T10:00:00.000Z')),
        createRecord(3, new Date('2025-11-01T14:00:00.000Z')),
        createRecord(2, new Date('2025-11-02T09:00:00.000Z')),
      ];

      const grouped = groupByDate(records);

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['2025-11-01']).toHaveLength(2);
      expect(grouped['2025-11-02']).toHaveLength(1);
    });

    it('應該處理空陣列', () => {
      const grouped = groupByDate([]);

      expect(Object.keys(grouped)).toHaveLength(0);
    });

    it('應該正確處理跨月份記錄', () => {
      const records: PoopRecord[] = [
        createRecord(2, new Date('2025-10-31T10:00:00.000Z')),
        createRecord(2, new Date('2025-11-01T10:00:00.000Z')),
      ];

      const grouped = groupByDate(records);

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['2025-10-31']).toBeDefined();
      expect(grouped['2025-11-01']).toBeDefined();
    });
  });

  describe('calculateDailyStats', () => {
    it('應該正確計算每日統計', () => {
      const records: PoopRecord[] = [
        createRecord(2, new Date('2025-11-01T10:00:00.000Z')),
        createRecord(2, new Date('2025-11-01T14:00:00.000Z')),
        createRecord(3, new Date('2025-11-01T18:00:00.000Z')),
      ];

      const stats = calculateDailyStats(records);

      expect(stats.total).toBe(3);
      expect(stats.typeCount[2]).toBe(2);
      expect(stats.typeCount[3]).toBe(1);
      expect(stats.mostCommonType).toBe('2');
    });

    it('應該處理只有一筆記錄的情況', () => {
      const records: PoopRecord[] = [createRecord(5)];

      const stats = calculateDailyStats(records);

      expect(stats.total).toBe(1);
      expect(stats.typeCount[5]).toBe(1);
      expect(stats.mostCommonType).toBe('5');
    });

    it('應該處理空陣列', () => {
      const stats = calculateDailyStats([]);

      expect(stats.total).toBe(0);
      expect(Object.keys(stats.typeCount)).toHaveLength(0);
      expect(stats.mostCommonType).toBeUndefined();
    });
  });
});
