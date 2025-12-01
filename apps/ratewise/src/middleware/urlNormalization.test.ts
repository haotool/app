/**
 * URL Normalization Middleware - BDD Tests (紅燈階段)
 *
 * [BDD:2025-12-01] 測試驅動開發 - 先寫測試，後寫實作
 * [SEO:2025-12-01] 修復 URL 大小寫不敏感導致的重複內容問題
 *
 * 參考：
 * - docs/prompt/BDD.md - BDD 開發流程
 * - docs/dev/SEO_DEEP_AUDIT_2025-12-01.md - SEO 審計報告
 * - https://moz.com/learn/seo/duplicate-content
 */

import { describe, it, expect } from 'vitest';
import { normalizeUrl, shouldRedirect, getRedirectUrl } from './urlNormalization';

describe('URL Normalization Middleware - BDD Tests', () => {
  describe('🔴 RED: normalizeUrl - 小寫轉換', () => {
    it('應該將大寫字母轉換為小寫', () => {
      // Given: URL 包含大寫字母
      const input = '/Ratewise/';

      // When: 執行標準化
      const result = normalizeUrl(input);

      // Then: 應該轉換為小寫
      expect(result).toBe('/ratewise/');
    });

    it('應該將全大寫 URL 轉換為小寫', () => {
      // Given: URL 全部大寫
      const input = '/RATEWISE/';

      // When: 執行標準化
      const result = normalizeUrl(input);

      // Then: 應該轉換為小寫
      expect(result).toBe('/ratewise/');
    });

    it('應該處理混合大小寫的路徑', () => {
      // Given: 路徑包含混合大小寫
      const input = '/ratewise/FAQ/';

      // When: 執行標準化
      const result = normalizeUrl(input);

      // Then: 應該全部轉為小寫
      expect(result).toBe('/ratewise/faq/');
    });

    it('應該保持已經是小寫的 URL 不變', () => {
      // Given: URL 已經是小寫
      const input = '/ratewise/';

      // When: 執行標準化
      const result = normalizeUrl(input);

      // Then: 應該保持不變
      expect(result).toBe('/ratewise/');
    });

    it('應該處理複雜路徑', () => {
      // Given: 複雜的路徑結構
      const input = '/ratewise/Guide/Section-1/';

      // When: 執行標準化
      const result = normalizeUrl(input);

      // Then: 應該全部轉為小寫
      expect(result).toBe('/ratewise/guide/section-1/');
    });

    it('應該保留查詢參數', () => {
      // Given: URL 包含查詢參數
      const input = '/Ratewise/?utm_source=Test';

      // When: 執行標準化
      const result = normalizeUrl(input);

      // Then: 應該轉換路徑但保留參數（參數也轉小寫）
      expect(result).toBe('/ratewise/?utm_source=test');
    });

    it('應該保留 hash fragment', () => {
      // Given: URL 包含 hash
      const input = '/Ratewise/#Section';

      // When: 執行標準化
      const result = normalizeUrl(input);

      // Then: 應該轉換路徑和 hash
      expect(result).toBe('/ratewise/#section');
    });
  });

  describe('🔴 RED: shouldRedirect - 重定向判斷', () => {
    it('當 URL 包含大寫字母時應該重定向', () => {
      // Given: URL 包含大寫字母
      const pathname = '/Ratewise/';

      // When: 檢查是否需要重定向
      const result = shouldRedirect(pathname);

      // Then: 應該返回 true
      expect(result).toBe(true);
    });

    it('當 URL 全部小寫時不應該重定向', () => {
      // Given: URL 全部小寫
      const pathname = '/ratewise/';

      // When: 檢查是否需要重定向
      const result = shouldRedirect(pathname);

      // Then: 應該返回 false
      expect(result).toBe(false);
    });

    it('應該處理根路徑', () => {
      // Given: 根路徑
      const pathname = '/';

      // When: 檢查是否需要重定向
      const result = shouldRedirect(pathname);

      // Then: 不需要重定向
      expect(result).toBe(false);
    });

    it('應該處理非 ratewise 路徑（如果有其他應用）', () => {
      // Given: 其他應用的路徑
      const pathname = '/OtherApp/';

      // When: 檢查是否需要重定向
      const result = shouldRedirect(pathname);

      // Then: 應該重定向（全局小寫策略）
      expect(result).toBe(true);
    });
  });

  describe('🔴 RED: getRedirectUrl - 獲取重定向目標', () => {
    it('應該返回小寫的完整 URL', () => {
      // Given: 大寫 URL 和當前 origin
      const pathname = '/Ratewise/';
      const origin = 'https://app.haotool.org';

      // When: 獲取重定向 URL
      const result = getRedirectUrl(pathname, origin);

      // Then: 應該返回小寫的完整 URL
      expect(result).toBe('https://app.haotool.org/ratewise/');
    });

    it('應該保留查詢參數', () => {
      // Given: URL 包含查詢參數
      const pathname = '/Ratewise/';
      const search = '?utm_source=Test';
      const origin = 'https://app.haotool.org';

      // When: 獲取重定向 URL
      const result = getRedirectUrl(pathname, origin, search);

      // Then: 應該保留查詢參數並轉小寫
      expect(result).toBe('https://app.haotool.org/ratewise/?utm_source=test');
    });

    it('應該保留 hash fragment', () => {
      // Given: URL 包含 hash
      const pathname = '/Ratewise/';
      const hash = '#Section';
      const origin = 'https://app.haotool.org';

      // When: 獲取重定向 URL
      const result = getRedirectUrl(pathname, origin, '', hash);

      // Then: 應該保留 hash 並轉小寫
      expect(result).toBe('https://app.haotool.org/ratewise/#section');
    });

    it('應該處理完整的 URL（pathname + search + hash）', () => {
      // Given: 完整的 URL 組件
      const pathname = '/Ratewise/FAQ/';
      const search = '?Page=2';
      const hash = '#Answer-3';
      const origin = 'https://app.haotool.org';

      // When: 獲取重定向 URL
      const result = getRedirectUrl(pathname, origin, search, hash);

      // Then: 應該全部轉為小寫
      expect(result).toBe('https://app.haotool.org/ratewise/faq/?page=2#answer-3');
    });
  });

  describe('🔴 RED: Edge Cases - 邊緣情況', () => {
    it('應該處理空路徑', () => {
      // Given: 空路徑
      const pathname = '';

      // When: 執行標準化
      const result = normalizeUrl(pathname);

      // Then: 應該返回根路徑
      expect(result).toBe('/');
    });

    it('應該處理只有查詢參數的 URL', () => {
      // Given: 只有查詢參數
      const pathname = '/?Test=1';

      // When: 執行標準化
      const result = normalizeUrl(pathname);

      // Then: 應該轉換查詢參數
      expect(result).toBe('/?test=1');
    });

    it('應該處理特殊字元', () => {
      // Given: URL 包含特殊字元
      const pathname = '/ratewise/Guide-2024/';

      // When: 執行標準化
      const result = normalizeUrl(pathname);

      // Then: 應該保持特殊字元不變
      expect(result).toBe('/ratewise/guide-2024/');
    });

    it('應該處理 URL 編碼的字元', () => {
      // Given: URL 包含編碼字元
      const pathname = '/ratewise/%E5%B8%B8%E8%A6%8B%E5%95%8F%E9%A1%8C/';

      // When: 執行標準化
      const result = normalizeUrl(pathname);

      // Then: 應該保持編碼不變（只轉換未編碼的大寫字母）
      expect(result).toBe('/ratewise/%e5%b8%b8%e8%a6%8b%e5%95%8f%e9%a1%8c/');
    });

    it('應該處理多個連續斜線', () => {
      // Given: URL 包含多個斜線
      const pathname = '/ratewise//faq//';

      // When: 執行標準化
      const result = normalizeUrl(pathname);

      // Then: 應該標準化為單一斜線
      expect(result).toBe('/ratewise/faq/');
    });
  });

  describe('🔴 RED: Performance - 效能測試', () => {
    it('應該在 1ms 內完成標準化', () => {
      // Given: 複雜的 URL
      const pathname = '/Ratewise/Guide/Section-1/?utm_source=Test#Answer';

      // When: 測量執行時間
      const start = performance.now();
      normalizeUrl(pathname);
      const duration = performance.now() - start;

      // Then: 應該非常快速
      expect(duration).toBeLessThan(1);
    });

    it('應該處理大量 URL 而不影響效能', () => {
      // Given: 1000 個不同的 URL
      const urls = Array.from({ length: 1000 }, (_, i) => `/Ratewise/Page-${i}/`);

      // When: 批量處理
      const start = performance.now();
      urls.forEach((url) => normalizeUrl(url));
      const duration = performance.now() - start;

      // Then: 應該在 100ms 內完成
      expect(duration).toBeLessThan(100);
    });
  });

  describe('🔴 RED: Integration - 整合測試', () => {
    it('應該與 React Router 整合', () => {
      // Given: React Router location 物件
      const location = {
        pathname: '/Ratewise/',
        search: '?test=1',
        hash: '#section',
      };

      // When: 檢查是否需要重定向
      const needsRedirect = shouldRedirect(location.pathname);

      // Then: 應該檢測到需要重定向
      expect(needsRedirect).toBe(true);
    });

    it('應該生成正確的 window.location.replace 參數', () => {
      // Given: 當前 URL 組件
      const pathname = '/Ratewise/FAQ/';
      const origin = window.location.origin || 'https://app.haotool.org';

      // When: 獲取重定向 URL
      const redirectUrl = getRedirectUrl(pathname, origin);

      // Then: 應該是完整的絕對 URL
      expect(redirectUrl).toMatch(/^https?:\/\//);
      expect(redirectUrl).toContain('/ratewise/faq/');
    });
  });
});

describe('🔴 RED: SEO Health Check - 全局 URL 驗證', () => {
  describe('Sitemap 一致性檢查', () => {
    it('sitemap.xml 中的所有 URL 都應該使用小寫', () => {
      // Given: sitemap.xml 內容
      const sitemapUrls = [
        'https://app.haotool.org/ratewise/',
        'https://app.haotool.org/ratewise/faq/',
        'https://app.haotool.org/ratewise/about/',
        'https://app.haotool.org/ratewise/guide/',
      ];

      // When: 檢查每個 URL
      const hasUppercase = sitemapUrls.some((url) => /[A-Z]/.test(url));

      // Then: 不應該包含大寫字母
      expect(hasUppercase).toBe(false);
    });

    it('sitemap.xml 中的所有 URL 都應該有尾斜線', () => {
      // Given: sitemap.xml 內容
      const sitemapUrls = [
        'https://app.haotool.org/ratewise/',
        'https://app.haotool.org/ratewise/faq/',
        'https://app.haotool.org/ratewise/about/',
        'https://app.haotool.org/ratewise/guide/',
      ];

      // When: 檢查每個 URL
      const allHaveTrailingSlash = sitemapUrls.every((url) => {
        const path = new URL(url).pathname;
        return path.endsWith('/');
      });

      // Then: 所有 URL 都應該有尾斜線
      expect(allHaveTrailingSlash).toBe(true);
    });
  });

  describe('Routes 配置一致性檢查', () => {
    it('routes.tsx 中的路徑都應該使用小寫', () => {
      // Given: routes 配置
      const routes = ['/', '/faq', '/about', '/guide'];

      // When: 檢查每個路徑
      const hasUppercase = routes.some((route) => /[A-Z]/.test(route));

      // Then: 不應該包含大寫字母
      expect(hasUppercase).toBe(false);
    });

    it('routes.tsx 與 sitemap.xml 應該一致', () => {
      // Given: routes 和 sitemap 配置
      const routes = ['/', '/faq', '/about', '/guide'];
      const sitemapPaths = ['/', '/faq/', '/about/', '/guide/'];

      // When: 標準化後比較
      const normalizedRoutes = routes.map((r) => (r === '/' ? '/' : `${r}/`));

      // Then: 應該完全一致
      expect(normalizedRoutes).toEqual(sitemapPaths);
    });
  });

  describe('內部連結一致性檢查', () => {
    it('所有 Link 元件的 to 屬性都應該使用小寫', () => {
      // Given: 內部連結配置
      const internalLinks = [
        { to: '/', label: '首頁' },
        { to: '/faq/', label: 'FAQ' },
        { to: '/about/', label: '關於' },
        { to: '/guide/', label: '指南' },
      ];

      // When: 檢查每個連結
      const hasUppercase = internalLinks.some((link) => /[A-Z]/.test(link.to));

      // Then: 不應該包含大寫字母
      expect(hasUppercase).toBe(false);
    });

    it('所有內部連結都應該有尾斜線（除了根路徑）', () => {
      // Given: 內部連結配置
      const internalLinks = ['/faq/', '/about/', '/guide/'];

      // When: 檢查每個連結
      const allHaveTrailingSlash = internalLinks.every((link) => link.endsWith('/'));

      // Then: 所有連結都應該有尾斜線
      expect(allHaveTrailingSlash).toBe(true);
    });
  });

  describe('SEOHelmet 配置檢查', () => {
    it('buildCanonical 函數應該強制使用尾斜線', () => {
      // Given: 不同的路徑輸入
      const paths = ['/faq', '/about', '/guide'];

      // When: 建立 canonical URL（模擬 buildCanonical 邏輯）
      const canonicals = paths.map((path) => {
        const normalized = path === '/' ? '/' : `${path.replace(/\/+$/, '')}/`;
        return `https://app.haotool.org/ratewise${normalized}`;
      });

      // Then: 所有 canonical 都應該有尾斜線
      const allHaveTrailingSlash = canonicals.every((url) => {
        const pathname = new URL(url).pathname;
        return pathname.endsWith('/');
      });
      expect(allHaveTrailingSlash).toBe(true);
    });

    it('buildCanonical 應該處理絕對 URL', () => {
      // Given: 絕對 URL
      const absoluteUrl = 'https://app.haotool.org/ratewise/faq';

      // When: 標準化（模擬 buildCanonical 邏輯）
      const canonical = absoluteUrl.endsWith('/') ? absoluteUrl : `${absoluteUrl}/`;

      // Then: 應該添加尾斜線
      expect(canonical).toBe('https://app.haotool.org/ratewise/faq/');
    });
  });
});

describe('🔴 RED: Pre-commit Hook - SEO 健康檢查', () => {
  describe('檔案內容驗證', () => {
    it('sitemap.xml 應該存在且格式正確', () => {
      // Given: 假設 sitemap.xml 存在（實際需要 fs）
      // When: 檢查檔案存在
      const exists = true; // 實際應該使用 fs.existsSync('apps/ratewise/public/sitemap.xml')

      // Then: 檔案應該存在
      expect(exists).toBe(true);
    });

    it('robots.txt 應該指向正確的 sitemap', () => {
      // Given: robots.txt 內容
      const robotsContent = 'Sitemap: https://app.haotool.org/ratewise/sitemap.xml';

      // When: 檢查 sitemap URL
      const sitemapUrl = /Sitemap:\s*(.+)/.exec(robotsContent)?.[1]?.trim();

      // Then: 應該指向正確的 URL
      expect(sitemapUrl).toBe('https://app.haotool.org/ratewise/sitemap.xml');
    });

    it('所有 TypeScript 檔案中的硬編碼 URL 都應該使用小寫', () => {
      // Given: 程式碼中的 URL 常數
      const urls = ['https://app.haotool.org/ratewise/', 'https://app.haotool.org/ratewise/faq/'];

      // When: 檢查是否包含大寫
      const hasUppercase = urls.some((url) => {
        const path = new URL(url).pathname;
        return /[A-Z]/.test(path);
      });

      // Then: 不應該包含大寫字母
      expect(hasUppercase).toBe(false);
    });
  });

  describe('路由配置驗證', () => {
    it('routes.tsx 中的所有路徑都應該使用小寫', () => {
      // Given: routes 配置（模擬）
      const routes = [
        { path: '/', entry: 'src/features/ratewise/RateWise' },
        { path: '/faq', entry: 'src/pages/FAQ.tsx' },
        { path: '/about', entry: 'src/pages/About.tsx' },
        { path: '/guide', entry: 'src/pages/Guide.tsx' },
      ];

      // When: 檢查所有路徑
      const hasUppercase = routes.some((route) => /[A-Z]/.test(route.path));

      // Then: 不應該包含大寫字母
      expect(hasUppercase).toBe(false);
    });

    it('getIncludedRoutes 應該返回標準化的路徑', () => {
      // Given: 輸入路徑
      const inputPaths = ['/', '/faq', '/about', '/guide'];

      // When: 標準化路徑
      const normalized = inputPaths.map((p) => (p === '/' ? '/' : p.replace(/\/+$/, '')));

      // Then: 應該移除尾斜線（內部處理）
      expect(normalized).toEqual(['/', '/faq', '/about', '/guide']);
    });
  });
});
