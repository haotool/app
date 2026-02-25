import 'fake-indexeddb/auto';
import { dbService } from '@app/park-keeper/services/db';
import { DEFAULT_SETTINGS } from '@app/park-keeper/constants';
import type { ParkingRecord, LanguageType } from '@app/park-keeper/types';

function makeRecord(overrides: Partial<ParkingRecord> = {}): ParkingRecord {
  return {
    id: `test-${Date.now()}-${Math.random()}`,
    plateNumber: 'ABC-1234',
    floor: 'B1',
    timestamp: Date.now(),
    hasPhoto: false,
    ...overrides,
  };
}

describe('dbService', () => {
  beforeEach(async () => {
    await dbService.clearAllData();
  });

  describe('saveRecord / getRecords', () => {
    it('should save and retrieve a record', async () => {
      const record = makeRecord();
      await dbService.saveRecord(record);
      const records = await dbService.getRecords();
      expect(records).toHaveLength(1);
      expect(records[0]!.plateNumber).toBe('ABC-1234');
    });

    it('should return records sorted by timestamp descending', async () => {
      const old = makeRecord({ id: 'old', timestamp: 1000 });
      const recent = makeRecord({ id: 'recent', timestamp: 2000 });
      await dbService.saveRecord(old);
      await dbService.saveRecord(recent);

      const records = await dbService.getRecords();
      expect(records[0]!.id).toBe('recent');
      expect(records[1]!.id).toBe('old');
    });

    it('should update an existing record by id', async () => {
      const record = makeRecord({ id: 'update-test', plateNumber: 'OLD' });
      await dbService.saveRecord(record);
      await dbService.saveRecord({ ...record, plateNumber: 'NEW' });

      const records = await dbService.getRecords();
      expect(records).toHaveLength(1);
      expect(records[0]!.plateNumber).toBe('NEW');
    });
  });

  describe('deleteRecord', () => {
    it('should delete a record by id', async () => {
      const record = makeRecord({ id: 'del-test' });
      await dbService.saveRecord(record);
      await dbService.deleteRecord('del-test');

      const records = await dbService.getRecords();
      expect(records).toHaveLength(0);
    });
  });

  describe('getSettings / saveSettings', () => {
    it('should return default settings when none saved', async () => {
      const settings = await dbService.getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should save and retrieve settings', async () => {
      const custom = {
        ...DEFAULT_SETTINGS,
        theme: 'racing' as const,
        language: 'en' as LanguageType,
      };
      await dbService.saveSettings(custom);
      const loaded = await dbService.getSettings();
      expect(loaded.theme).toBe('racing');
      expect(loaded.language).toBe('en');
    });
  });

  describe('cleanupCache', () => {
    it('should strip photoData from records older than cutoff', async () => {
      const oldRecord = makeRecord({
        id: 'old-photo',
        timestamp: Date.now() - 10 * 86400000,
        hasPhoto: true,
        photoData: 'data:image/jpeg;base64,...',
      });
      await dbService.saveRecord(oldRecord);

      const cleaned = await dbService.cleanupCache(7);
      expect(cleaned).toBe(1);

      const records = await dbService.getRecords();
      expect(records[0]!.photoData).toBeUndefined();
      expect(records[0]!.hasPhoto).toBe(false);
    });

    it('should not affect recent records', async () => {
      const recent = makeRecord({
        id: 'recent-photo',
        timestamp: Date.now(),
        hasPhoto: true,
        photoData: 'data:image/jpeg;base64,...',
      });
      await dbService.saveRecord(recent);

      const cleaned = await dbService.cleanupCache(7);
      expect(cleaned).toBe(0);

      const records = await dbService.getRecords();
      expect(records[0]!.photoData).toBe('data:image/jpeg;base64,...');
    });
  });

  describe('clearAllData', () => {
    it('should remove all records', async () => {
      await dbService.saveRecord(makeRecord({ id: 'a' }));
      await dbService.saveRecord(makeRecord({ id: 'b' }));
      await dbService.clearAllData();

      const records = await dbService.getRecords();
      expect(records).toHaveLength(0);
    });
  });

  describe('exportData', () => {
    it('should export as JSON', async () => {
      await dbService.saveRecord(makeRecord({ id: 'export-json', plateNumber: 'XYZ-9999' }));
      const json = await dbService.exportData('json');
      const parsed = JSON.parse(json) as ParkingRecord[];
      expect(parsed).toHaveLength(1);
      expect(parsed[0]!.plateNumber).toBe('XYZ-9999');
    });

    it('should export as CSV with headers', async () => {
      await dbService.saveRecord(
        makeRecord({ id: 'export-csv', plateNumber: 'CSV-0001', floor: '3F' }),
      );
      const csv = await dbService.exportData('csv');
      const lines = csv.split('\n');
      expect(lines[0]).toBe('Date,Plate,Floor,Notes,HasPhoto');
      expect(lines[1]).toContain('"CSV-0001"');
      expect(lines[1]).toContain('"3F"');
    });

    it('should handle CSV with special characters in notes', async () => {
      await dbService.saveRecord(makeRecord({ id: 'csv-special', notes: 'has "quotes" inside' }));
      const csv = await dbService.exportData('csv');
      expect(csv).toContain('has ""quotes"" inside');
    });
  });
});
