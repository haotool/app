/**
 * runStartupCleanup 邊界與節流測試（issue #713 US-3）。
 * 只 fake Date（保留真實 timer），fake-indexeddb 內部非同步才能正常完成。
 */
import 'fake-indexeddb/auto';
import { dbService } from '@app/park-keeper/services/db';
import type { ParkingRecord } from '@app/park-keeper/types';

const DAY_MS = 86400000;
const PHOTO = 'data:image/jpeg;base64,xxx';

function makeRecord(overrides: Partial<ParkingRecord> = {}): ParkingRecord {
  return {
    id: `test-${Math.random()}`,
    plateNumber: 'ABC-1234',
    floor: 'B1',
    timestamp: Date.now(),
    hasPhoto: true,
    photoData: PHOTO,
    ...overrides,
  };
}

describe('dbService.runStartupCleanup', () => {
  // 每個測試往後跳一大段時間，繞過模組層 session 節流殘留狀態。
  let base = new Date('2026-07-16T00:00:00Z').getTime();

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    base += 1000 * DAY_MS;
    vi.setSystemTime(base);
    await dbService.clearAllData();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('第 N+1 天照片被清、第 N-1 天保留（紀錄本體不刪）', async () => {
    const days = 7;
    const now = Date.now();
    await dbService.saveRecord(makeRecord({ id: 'older', timestamp: now - (days + 1) * DAY_MS }));
    await dbService.saveRecord(makeRecord({ id: 'newer', timestamp: now - (days - 1) * DAY_MS }));

    const cleaned = await dbService.runStartupCleanup(days);
    expect(cleaned).toBe(1);

    const records = await dbService.getRecords();
    const older = records.find((r) => r.id === 'older');
    const newer = records.find((r) => r.id === 'newer');
    expect(older).toBeDefined();
    expect(older?.photoData).toBeUndefined();
    expect(older?.hasPhoto).toBe(false);
    expect(newer?.photoData).toBe(PHOTO);
    expect(newer?.hasPhoto).toBe(true);
  });

  it('恰好第 N 天的照片保留（嚴格小於 cutoff 才清除）', async () => {
    const days = 7;
    await dbService.saveRecord(makeRecord({ id: 'exact', timestamp: Date.now() - days * DAY_MS }));

    const cleaned = await dbService.runStartupCleanup(days);
    expect(cleaned).toBe(0);

    const records = await dbService.getRecords();
    expect(records[0]?.photoData).toBe(PHOTO);
  });

  it('同一 session 短時間內重複呼叫不重複執行清理', async () => {
    const days = 7;
    await dbService.saveRecord(
      makeRecord({ id: 'first', timestamp: Date.now() - (days + 1) * DAY_MS }),
    );
    expect(await dbService.runStartupCleanup(days)).toBe(1);

    await dbService.saveRecord(
      makeRecord({ id: 'second', timestamp: Date.now() - (days + 1) * DAY_MS }),
    );
    expect(await dbService.runStartupCleanup(days)).toBe(0);

    const second = (await dbService.getRecords()).find((r) => r.id === 'second');
    expect(second?.photoData).toBe(PHOTO);
  });

  it('超過節流間隔後可再次執行清理', async () => {
    const days = 7;
    expect(await dbService.runStartupCleanup(days)).toBe(0);

    await dbService.saveRecord(
      makeRecord({ id: 'later', timestamp: Date.now() - (days + 1) * DAY_MS }),
    );
    vi.setSystemTime(Date.now() + 6 * 60 * 1000);
    expect(await dbService.runStartupCleanup(days)).toBe(1);
  });
});
