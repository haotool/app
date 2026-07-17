/**
 * 車號顯示 SSOT（issue #733）：儲存層以 'N/A' 佔位未填車號，
 * 所有寫入與渲染點統一引用此模組，禁止散落手刻 sentinel 比較。
 */

/** 未填車號 sentinel（儲存層佔位值）。 */
export const PLATE_UNSET_SENTINEL = 'N/A';

/** 車號是否未填。 */
export function isPlateUnset(plateNumber: string): boolean {
  return plateNumber === PLATE_UNSET_SENTINEL;
}

/** 車號顯示標籤：未填時回傳在地化待填文案，已填回傳原車號。 */
export function formatPlateLabel(plateNumber: string, plateUnsetLabel: string): string {
  return isPlateUnset(plateNumber) ? plateUnsetLabel : plateNumber;
}
