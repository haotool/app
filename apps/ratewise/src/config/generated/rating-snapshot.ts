/**
 * 由 scripts/fetch-rating-snapshot.mjs 生成，請勿手動編輯。
 *
 * 包含最近一次 prebuild 時從 Cloudflare KV 拉取的評分快照。
 * ratingCount < 10 時 seo-metadata.ts 不輸出 aggregateRating（避免樣本過少）。
 */

export const RATING_SNAPSHOT = {
  /** 平均評分（1-5），null 代表無資料。 */
  ratingValue: null as number | null,
  /** 評分人數。 */
  ratingCount: 0,
  /** 快照時間（ISO 8601）。 */
  snapshotAt: '2026-03-25T19:09:13.580Z',
} as const;
