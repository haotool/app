import type { ConverterMode } from '../types';

/**
 * 判斷冷啟動是否應還原至多幣別頁。
 * Epic 4（E4-T4）：冷啟動一律停留 single，禁止自動 redirect /multi。
 */
export function shouldRestoreToMulti(_params: {
  hydrated: boolean;
  hasDeepLink: boolean;
  lastConverterView: ConverterMode;
}): boolean {
  return false;
}

/** 保留 API 供 RememberedHomeRoute 呼叫；E4-T4 後為 no-op。 */
export function markRestoreAttempted(): void {
  return;
}

/** 僅供單元測試重置；E4-T4 後為 no-op。 */
export function __resetColdStartRestoreForTests(): void {
  return;
}
