/**
 * surnameData.ts 測試
 * 測試姓氏資料模組的工具函數
 */
import { describe, it, expect } from 'vitest';
import {
  SURNAME_DATA_FULL,
  SURNAME_STATS,
  getSurnameMap,
  getSurnameDetail,
  getSupportedSurnames,
} from './surnameData';

describe('surnameData', () => {
  describe('SURNAME_DATA_FULL', () => {
    it('should contain surname data', () => {
      expect(Object.keys(SURNAME_DATA_FULL).length).toBeGreaterThan(0);
    });

    it('should have correct structure for each surname', () => {
      // 使用 getSurnameDetail 來取得資料，避免直接索引訪問的型別問題
      const surnames = getSupportedSurnames();
      expect(surnames.length).toBeGreaterThan(0);
      const firstSurname = surnames[0]!;
      const data = getSurnameDetail(firstSurname);

      expect(data).toBeDefined();
      expect(data).not.toBeNull();
      expect(data).toHaveProperty('names');
      expect(data).toHaveProperty('count');
      expect(data).toHaveProperty('description');
      expect(data).toHaveProperty('sources');

      if (data) {
        expect(Array.isArray(data.names)).toBe(true);
        expect(typeof data.count).toBe('number');
        expect(typeof data.description).toBe('string');
        expect(Array.isArray(data.sources)).toBe(true);
      }
    });
  });

  describe('getSurnameMap', () => {
    it('should return a Record<string, string[]>', () => {
      const map = getSurnameMap();

      expect(typeof map).toBe('object');
      expect(map).not.toBeNull();
    });

    it('should have the same keys as SURNAME_DATA_FULL', () => {
      const map = getSurnameMap();
      const expectedKeys = Object.keys(SURNAME_DATA_FULL);

      expect(Object.keys(map)).toEqual(expectedKeys);
    });

    it('should map surnames to their names array', () => {
      const map = getSurnameMap();
      const surnames = getSupportedSurnames();
      expect(surnames.length).toBeGreaterThan(0);
      const firstSurname = surnames[0]!;
      const expectedData = getSurnameDetail(firstSurname);

      expect(expectedData).toBeDefined();
      if (expectedData) {
        expect(map[firstSurname]).toEqual(expectedData.names);
      }
    });

    it('should return arrays of strings for each surname', () => {
      const map = getSurnameMap();

      for (const [, names] of Object.entries(map)) {
        expect(Array.isArray(names)).toBe(true);
        names.forEach((name) => {
          expect(typeof name).toBe('string');
        });
      }
    });
  });

  describe('getSurnameDetail', () => {
    it('should return detail for existing surname', () => {
      const surnames = getSupportedSurnames();
      expect(surnames.length).toBeGreaterThan(0);
      const testSurname = surnames[0]!;

      const detail = getSurnameDetail(testSurname);

      expect(detail).not.toBeNull();
      expect(detail).toBeDefined();
    });

    it('should return null for non-existing surname', () => {
      const detail = getSurnameDetail('不存在的姓氏');

      expect(detail).toBeNull();
    });

    it('should return null for empty string', () => {
      const detail = getSurnameDetail('');

      expect(detail).toBeNull();
    });

    it('should return correct structure with all fields', () => {
      const surnames = getSupportedSurnames();
      expect(surnames.length).toBeGreaterThan(0);
      const testSurname = surnames[0]!;
      const detail = getSurnameDetail(testSurname);

      expect(detail).toHaveProperty('names');
      expect(detail).toHaveProperty('count');
      expect(detail).toHaveProperty('description');
      expect(detail).toHaveProperty('sources');
    });

    it('should handle multiple surnames correctly', () => {
      const surnames = getSupportedSurnames().slice(0, 5);

      surnames.forEach((surname) => {
        const detail = getSurnameDetail(surname);
        expect(detail).not.toBeNull();
        expect(detail?.names.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getSupportedSurnames', () => {
    it('should return an array of strings', () => {
      const surnames = getSupportedSurnames();

      expect(Array.isArray(surnames)).toBe(true);
      surnames.forEach((surname) => {
        expect(typeof surname).toBe('string');
      });
    });

    it('should return all keys from SURNAME_DATA_FULL', () => {
      const surnames = getSupportedSurnames();
      const expectedKeys = Object.keys(SURNAME_DATA_FULL);

      expect(surnames).toEqual(expectedKeys);
    });

    it('should return non-empty array', () => {
      const surnames = getSupportedSurnames();

      expect(surnames.length).toBeGreaterThan(0);
    });

    it('should not contain duplicates', () => {
      const surnames = getSupportedSurnames();
      const uniqueSurnames = [...new Set(surnames)];

      expect(surnames.length).toBe(uniqueSurnames.length);
    });
  });

  describe('SURNAME_STATS', () => {
    it('should have correct structure', () => {
      expect(SURNAME_STATS).toHaveProperty('totalSurnames');
      expect(SURNAME_STATS).toHaveProperty('totalMappings');
      expect(SURNAME_STATS).toHaveProperty('lastUpdated');
    });

    it('should have totalSurnames equal to SURNAME_DATA_FULL keys count', () => {
      expect(SURNAME_STATS.totalSurnames).toBe(Object.keys(SURNAME_DATA_FULL).length);
    });

    it('should have correct totalMappings', () => {
      const expectedMappings = Object.values(SURNAME_DATA_FULL).reduce(
        (sum, v) => sum + v.names.length,
        0,
      );

      expect(SURNAME_STATS.totalMappings).toBe(expectedMappings);
    });

    it('should have a valid date format for lastUpdated', () => {
      expect(SURNAME_STATS.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should have positive values for counts', () => {
      expect(SURNAME_STATS.totalSurnames).toBeGreaterThan(0);
      expect(SURNAME_STATS.totalMappings).toBeGreaterThan(0);
    });
  });
});
