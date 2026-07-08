/**
 * 匯率資料新鮮度措辭 - Single Source of Truth（issue #627）
 *
 * 排程事實：update-latest-rates.yml cron 每 5 分鐘檢查一次台銀牌告；
 * 實際新鮮度依資料來源與 CDN 快取而定，文案禁止「每 5 分鐘自動同步」硬承諾。
 * 本檔零依賴：TypeScript 與 Node .mjs scripts 皆可直接 import。
 */

/** 更新頻率誠實措辭（軟化版）：全站中文文案唯一來源。 */
export const UPDATE_FREQUENCY_PHRASE = '約每 5 分鐘檢查更新';

/** 新鮮度免責補充：與更新頻率措辭搭配使用。 */
export const UPDATE_FREQUENCY_DISCLAIMER = '實際新鮮度依資料來源與 CDN 快取而定';
