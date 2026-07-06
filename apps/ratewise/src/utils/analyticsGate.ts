import { APP_INFO } from '../config/app-info';

// 正式站 hostname 由 APP_INFO.siteUrl（SSOT）導出，禁止另行硬編網域。
// 匯出供 e2e spec 做 gate-aware 判斷，維持單一來源。
export const PRODUCTION_HOSTNAME = new URL(APP_INFO.siteUrl).hostname;

/**
 * 依當前 hostname 決定是否放行 GA4 measurement ID。
 * 僅正式站 host 回傳原 ID；staging / preview / localhost 一律回空字串，
 * 使 initGA 提早返回，避免 QA 流量污染正式 GA4 資料。
 */
export function resolveGaMeasurementId(hostname: string, measurementId: string): string {
  return hostname === PRODUCTION_HOSTNAME ? measurementId : '';
}
