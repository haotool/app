import type { AppSettings, ParkingRecord, StorageService } from '@app/park-keeper/types';
import { DEFAULT_SETTINGS } from '@app/park-keeper/constants';

const DB_NAME = 'ParkKeeperDB';
const DB_VERSION = 1;
const STORES = {
  RECORDS: 'records',
  SETTINGS: 'settings',
};

// Low-level IDB wrapper with error handling
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error ?? new Error('DB error'));
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORES.RECORDS)) {
        db.createObjectStore(STORES.RECORDS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
    };
  });
};

export const dbService: StorageService = {
  async saveRecord(record: ParkingRecord): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORES.RECORDS, 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = tx.objectStore(STORES.RECORDS).put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error ?? new Error('DB error'));
      });
    } catch (error) {
      console.error('Save Record Error:', error);
      throw new Error('Failed to save record.');
    }
  },

  async updateRecord(id: string, updates: Partial<ParkingRecord>): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORES.RECORDS, 'readwrite');
      const store = tx.objectStore(STORES.RECORDS);

      // Get existing record
      const getRequest = store.get(id);
      const existingRecord = await new Promise<ParkingRecord>((resolve, reject) => {
        getRequest.onsuccess = () => resolve(getRequest.result as ParkingRecord);
        getRequest.onerror = () => reject(getRequest.error ?? new Error('Record not found'));
      });

      if (!existingRecord) {
        throw new Error('Record not found');
      }

      // Merge updates
      const updatedRecord: ParkingRecord = {
        ...existingRecord,
        ...updates,
        id, // Ensure ID doesn't change
      };

      // Save updated record
      await new Promise<void>((resolve, reject) => {
        const putRequest = store.put(updatedRecord);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error ?? new Error('DB error'));
      });
    } catch (error) {
      console.error('Update Record Error:', error);
      throw new Error('Failed to update record.');
    }
  },

  async getRecords(): Promise<ParkingRecord[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.RECORDS, 'readonly');
        const store = tx.objectStore(STORES.RECORDS);
        const request = store.getAll();
        request.onsuccess = () => {
          const records = (request.result as ParkingRecord[]) ?? [];
          // Sort by timestamp descending
          resolve(records.sort((a, b) => b.timestamp - a.timestamp));
        };
        request.onerror = () => reject(request.error ?? new Error('DB error'));
      });
    } catch (error) {
      console.error('Get Records Error:', error);
      return [];
    }
  },

  async deleteRecord(id: string): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORES.RECORDS, 'readwrite');
    tx.objectStore(STORES.RECORDS).delete(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('DB error'));
    });
  },

  async getSettings(): Promise<AppSettings> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORES.SETTINGS, 'readonly');
        const request = tx.objectStore(STORES.SETTINGS).get('appSettings');
        request.onsuccess = () =>
          resolve(
            (request.result as { value: AppSettings } | undefined)?.value ?? DEFAULT_SETTINGS,
          );
        request.onerror = () => resolve(DEFAULT_SETTINGS);
      });
    } catch (error) {
      console.warn('Settings load failed, using defaults', error);
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORES.SETTINGS, 'readwrite');
    tx.objectStore(STORES.SETTINGS).put({ key: 'appSettings', value: settings });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('DB error'));
    });
  },

  async cleanupCache(daysToKeep: number): Promise<number> {
    const records = await this.getRecords();
    const now = Date.now();
    const msInDay = 86400000;
    const cutoff = now - daysToKeep * msInDay;
    let cleanedCount = 0;

    const db = await openDB();
    const tx = db.transaction(STORES.RECORDS, 'readwrite');
    const store = tx.objectStore(STORES.RECORDS);

    for (const record of records) {
      if (record.timestamp < cutoff && record.photoData) {
        // We keep the record but remove the heavy image data to save space
        const updatedRecord = { ...record, photoData: undefined, hasPhoto: false };
        store.put(updatedRecord);
        cleanedCount++;
      }
    }

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(cleanedCount);
    });
  },

  async clearAllData(): Promise<void> {
    const db = await openDB();
    const tx = db.transaction([STORES.RECORDS], 'readwrite');
    tx.objectStore(STORES.RECORDS).clear();
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('DB error'));
    });
  },

  async exportData(format: 'json' | 'csv'): Promise<string> {
    const records = await this.getRecords();

    if (format === 'json') {
      return JSON.stringify(records, null, 2);
    } else {
      // CSV Format
      const headers = ['Date', 'Plate', 'Floor', 'Notes', 'HasPhoto'];
      const rows = records.map((r) => [
        new Date(r.timestamp).toISOString(),
        `"${r.plateNumber}"`,
        `"${r.floor}"`,
        `"${(r.notes ?? '').replace(/"/g, '""')}"`,
        r.hasPhoto ? 'Yes' : 'No',
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }
  },
};
