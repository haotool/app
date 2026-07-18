// 中線錨定訂單簿的高度預算：檔位列 44px 觸控、表頭與中間價列為固定開銷估值。
export const BOOK_ROW_PX = 44;
export const BOOK_OVERHEAD_PX = 70;
export const MIN_SIDE_LEVELS = 3;

// 依可用高度裁單側檔數：最少各 3 檔（不足時由容器內部捲動吸收）。
export function fitSideLevels(height: number, maxLevels: number): number {
  const fit = Math.floor((height - BOOK_OVERHEAD_PX) / 2 / BOOK_ROW_PX);
  return Math.min(maxLevels, Math.max(MIN_SIDE_LEVELS, fit));
}
