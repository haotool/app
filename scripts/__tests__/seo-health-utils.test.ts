import { describe, expect, it } from 'vitest';
import { resolveSeoValidationFlags } from '../lib/seo-health-utils.mjs';

describe('resolveSeoValidationFlags', () => {
  it('預設啟用 sitemap hreflang 與真 404 檢查', () => {
    expect(resolveSeoValidationFlags({})).toEqual({
      expectSitemapHreflang: true,
      requireTrue404: true,
    });
  });

  it('HaoTool 單語站可關閉 sitemap hreflang', () => {
    expect(
      resolveSeoValidationFlags({
        seoValidation: { sitemapHreflang: false },
      }),
    ).toEqual({
      expectSitemapHreflang: false,
      requireTrue404: true,
    });
  });

  it('PaperTrade SPA 可關閉真 404 檢查', () => {
    expect(
      resolveSeoValidationFlags({
        seoValidation: { requireTrue404: false },
      }),
    ).toEqual({
      expectSitemapHreflang: true,
      requireTrue404: false,
    });
  });
});
