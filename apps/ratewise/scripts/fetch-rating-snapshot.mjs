/**
 * fetch-rating-snapshot.mjs
 *
 * 於 prebuild 階段向 Cloudflare KV Rating API 拉取最新評分快照，
 * 並寫入 src/config/generated/rating-snapshot.ts。
 *
 * 環境變數：
 *   RATING_API_URL — Worker 端點（e.g. https://app.haotool.org/ratewise/api/ratings）
 *                    若未設定則跳過（使用 placeholder），不阻斷 build。
 *
 * 執行時機：由 package.json prebuild 鏈觸發。
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, '../src/config/generated/rating-snapshot.ts');
const PLACEHOLDER_SNAPSHOT_AT = '1970-01-01T00:00:00.000Z';

const PLACEHOLDER = {
  ratingValue: null,
  ratingCount: 0,
  // placeholder 必須固定，否則每次無 API 的本機 build 都會污染工作樹。
  snapshotAt: PLACEHOLDER_SNAPSHOT_AT,
};

function buildFileContent(snapshot) {
  const { ratingValue, ratingCount, snapshotAt } = snapshot;
  const ratingValueLiteral =
    ratingValue === null ? 'null as number | null' : `${ratingValue} as number | null`;

  return `/**
 * 由 scripts/fetch-rating-snapshot.mjs 生成，請勿手動編輯。
 *
 * 包含最近一次 prebuild 時從 Cloudflare KV 拉取的評分快照。
 * ratingCount < 10 時 seo-metadata.ts 不輸出 aggregateRating（避免樣本過少）。
 */

export const RATING_SNAPSHOT = {
  /** 平均評分（1-5），null 代表無資料。 */
  ratingValue: ${ratingValueLiteral},
  /** 評分人數。 */
  ratingCount: ${ratingCount},
  /** 快照時間（ISO 8601）。 */
  snapshotAt: '${snapshotAt}',
} as const;
`;
}

async function fetchSnapshot(apiUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(apiUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();

    return {
      ratingValue: typeof json.ratingValue === 'number' ? json.ratingValue : null,
      ratingCount: typeof json.ratingCount === 'number' ? json.ratingCount : 0,
      snapshotAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const apiUrl = process.env.RATING_API_URL;

  if (!apiUrl) {
    console.log('[fetch-rating-snapshot] RATING_API_URL 未設定，使用 placeholder。');
    writeFileSync(OUTPUT_PATH, buildFileContent(PLACEHOLDER), 'utf-8');
    return;
  }

  try {
    console.log(`[fetch-rating-snapshot] 拉取評分快照：${apiUrl}`);
    const snapshot = await fetchSnapshot(apiUrl);
    writeFileSync(OUTPUT_PATH, buildFileContent(snapshot), 'utf-8');
    console.log(
      `[fetch-rating-snapshot] 完成：ratingValue=${snapshot.ratingValue ?? 'null'}, ratingCount=${snapshot.ratingCount}`,
    );
  } catch (err) {
    console.warn(`[fetch-rating-snapshot] 拉取失敗（${err.message}），使用 placeholder。`);
    writeFileSync(OUTPUT_PATH, buildFileContent(PLACEHOLDER), 'utf-8');
  }
}

main();
