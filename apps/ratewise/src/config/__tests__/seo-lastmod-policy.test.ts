import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTENT_LASTMOD_POLICY, RATE_PAGE_LASTMOD_POLICY } from '../seo-lastmod-policy';
import { SEO_RATE_EXAMPLES_DATE } from '../generated/seo-rate-examples';
// @ts-expect-error 直接驗證 root sitemap script 的 fallback 行為。
import { getFallbackLastModDate } from '../../../../../scripts/generate-sitemap-2025.mjs';

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, '../../../../..');
const rateSourcePath = resolve(repoRoot, RATE_PAGE_LASTMOD_POLICY.source);
const sourceContent = readFileSync(rateSourcePath, 'utf-8');
const rateTimestampMatch = /匯率時間：(\d{4})\/(\d{2})\/(\d{2})/.exec(sourceContent);
const expectedRateFallbackDate = rateTimestampMatch
  ? `${rateTimestampMatch[1]}-${rateTimestampMatch[2]}-${rateTimestampMatch[3]}`
  : SEO_RATE_EXAMPLES_DATE;

describe('seo lastmod policy', () => {
  it('應為 /seo-tech/ 定義公開揭露頁的 content lastmod policy', () => {
    expect(CONTENT_LASTMOD_POLICY['/seo-tech/']).toBeDefined();
    expect(CONTENT_LASTMOD_POLICY['/seo-tech/'].contentFiles).toContain(
      'apps/ratewise/src/pages/SeoTech.tsx',
    );
  });

  it('幣別頁與金額頁應透過 rate policy 共享可見匯率內容來源', () => {
    expect(RATE_PAGE_LASTMOD_POLICY.source).toBe(
      'apps/ratewise/src/config/generated/seo-rate-examples.ts',
    );
    expect(RATE_PAGE_LASTMOD_POLICY.appliesTo).toEqual(['currency', 'amount']);
  });

  it('公開揭露頁 fallback date 應固定在 policy 中，避免退回 current time', () => {
    expect(CONTENT_LASTMOD_POLICY['/seo-tech/'].fallbackDate).toBe('2026-04-26');
  });

  it('authority guide 類內容頁在 shallow checkout 也應有穩定 fallback date', () => {
    expect(CONTENT_LASTMOD_POLICY['/sell-rate-vs-mid-rate/'].fallbackDate).toBe('2026-04-20');
    expect(CONTENT_LASTMOD_POLICY['/cash-vs-spot-rate/'].fallbackDate).toBe('2026-04-20');
    expect(CONTENT_LASTMOD_POLICY['/card-rate-guide/'].fallbackDate).toBe('2026-04-20');
  });

  it('幣別頁與金額頁 fallback 應採用可驗證的匯率內容日期', () => {
    expect(getFallbackLastModDate('/usd-twd/')?.toISOString().slice(0, 10)).toBe(
      expectedRateFallbackDate,
    );
    expect(getFallbackLastModDate('/usd-twd/100/')?.toISOString().slice(0, 10)).toBe(
      expectedRateFallbackDate,
    );
  });
});
