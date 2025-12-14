/**
 * SEO Paths Configuration - Unit Tests
 *
 * [BDD:2025-12-14] 測試 SEO 路徑工具函數
 * [P1:Technical Debt] 確保路徑處理邏輯正確性
 *
 * 測試案例：
 * 1. normalizePath - 路徑標準化（添加尾斜線）
 * 2. shouldPrerender - 檢查路徑是否應該預渲染
 * 3. getIncludedRoutes - 過濾需要預渲染的路徑
 * 4. SEO_PATHS - 驗證配置完整性
 */

import { describe, it, expect } from 'vitest';
import {
  normalizePath,
  shouldPrerender,
  getIncludedRoutes,
  isSEOPath,
  isCorePagePath,
  isCurrencyPagePath,
  SEO_PATHS,
  SEO_FILES,
  IMAGE_RESOURCES,
  SITE_CONFIG,
} from '../seo-paths';

describe('SEO Paths Configuration', () => {
  describe('normalizePath', () => {
    it('應該保持根路徑不變', () => {
      // Given: 根路徑 "/"
      const path = '/';

      // When: 標準化路徑
      const result = normalizePath(path);

      // Then: 應該返回 "/"
      expect(result).toBe('/');
    });

    it('應該為沒有尾斜線的路徑添加尾斜線', () => {
      // Given: 沒有尾斜線的路徑
      const path = '/faq';

      // When: 標準化路徑
      const result = normalizePath(path);

      // Then: 應該添加尾斜線
      expect(result).toBe('/faq/');
    });

    it('應該保持已有尾斜線的路徑不變', () => {
      // Given: 已有尾斜線的路徑
      const path = '/about/';

      // When: 標準化路徑
      const result = normalizePath(path);

      // Then: 應該保持不變
      expect(result).toBe('/about/');
    });

    it('應該移除多餘的尾斜線並只保留一個', () => {
      // Given: 有多個尾斜線的路徑
      const path = '/guide///';

      // When: 標準化路徑
      const result = normalizePath(path);

      // Then: 應該只保留一個尾斜線
      expect(result).toBe('/guide/');
    });

    it('應該處理幣別路徑', () => {
      // Given: 幣別路徑
      const paths = ['/usd-twd', '/eur-twd/', '/jpy-twd//'];

      // When: 標準化所有路徑
      const results = paths.map(normalizePath);

      // Then: 都應該有且僅有一個尾斜線
      expect(results).toEqual(['/usd-twd/', '/eur-twd/', '/jpy-twd/']);
    });

    it('應該處理空字串（邊界情況）', () => {
      // Given: 空字串
      const path = '';

      // When: 標準化路徑
      const result = normalizePath(path);

      // Then: 應該添加尾斜線
      expect(result).toBe('/');
    });

    it('應該處理只有斜線的字串', () => {
      // Given: 多個斜線
      const path = '///';

      // When: 標準化路徑
      const result = normalizePath(path);

      // Then: 移除後應該是根路徑
      expect(result).toBe('/');
    });
  });

  describe('shouldPrerender', () => {
    it('應該識別根路徑需要預渲染', () => {
      // Given: 根路徑
      const path = '/';

      // When: 檢查是否應該預渲染
      const result = shouldPrerender(path);

      // Then: 應該返回 true
      expect(result).toBe(true);
    });

    it('應該識別核心頁面需要預渲染', () => {
      // Given: 核心頁面路徑
      const corePaths = ['/faq', '/about', '/guide'];

      // When: 檢查所有核心頁面
      const results = corePaths.map(shouldPrerender);

      // Then: 都應該返回 true
      expect(results).toEqual([true, true, true]);
    });

    it('應該識別幣別頁面需要預渲染', () => {
      // Given: 幣別頁面路徑
      const currencyPaths = ['/usd-twd', '/eur-twd', '/jpy-twd', '/gbp-twd', '/cny-twd'];

      // When: 檢查所有幣別頁面
      const results = currencyPaths.map(shouldPrerender);

      // Then: 都應該返回 true
      expect(results).toEqual([true, true, true, true, true]);
    });

    it('應該識別不存在的路徑不需要預渲染', () => {
      // Given: 不存在的路徑
      const invalidPaths = ['/invalid', '/not-found', '/random-page'];

      // When: 檢查這些路徑
      const results = invalidPaths.map(shouldPrerender);

      // Then: 都應該返回 false
      expect(results).toEqual([false, false, false]);
    });

    it('應該正確處理有無尾斜線的路徑', () => {
      // Given: 相同路徑但格式不同
      const withSlash = '/faq/';
      const withoutSlash = '/faq';

      // When: 檢查兩個路徑
      const result1 = shouldPrerender(withSlash);
      const result2 = shouldPrerender(withoutSlash);

      // Then: 應該返回相同結果（都是 true）
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it('應該處理大小寫敏感的路徑', () => {
      // Given: 大小寫不同的路徑
      const lowercase = '/faq/';
      const uppercase = '/FAQ/';

      // When: 檢查兩個路徑
      const result1 = shouldPrerender(lowercase);
      const result2 = shouldPrerender(uppercase);

      // Then: 大寫應該返回 false（路徑區分大小寫）
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });

  describe('getIncludedRoutes', () => {
    it('應該過濾出所有有效的路徑', () => {
      // Given: 混合有效和無效路徑
      const paths = ['/', '/faq', '/invalid', '/about', '/not-found', '/usd-twd'];

      // When: 過濾需要預渲染的路徑
      const result = getIncludedRoutes(paths);

      // Then: 應該只包含有效路徑
      expect(result).toEqual(['/', '/faq', '/about', '/usd-twd']);
    });

    it('應該處理空陣列', () => {
      // Given: 空陣列
      const paths: string[] = [];

      // When: 過濾路徑
      const result = getIncludedRoutes(paths);

      // Then: 應該返回空陣列
      expect(result).toEqual([]);
    });

    it('應該處理全部無效的路徑', () => {
      // Given: 全部無效路徑
      const paths = ['/invalid1', '/invalid2', '/not-found'];

      // When: 過濾路徑
      const result = getIncludedRoutes(paths);

      // Then: 應該返回空陣列
      expect(result).toEqual([]);
    });

    it('應該處理全部有效的路徑', () => {
      // Given: 全部有效路徑
      const paths = ['/', '/faq', '/about', '/guide'];

      // When: 過濾路徑
      const result = getIncludedRoutes(paths);

      // Then: 應該返回所有路徑
      expect(result).toEqual(['/', '/faq', '/about', '/guide']);
    });

    it('應該正規化路徑後再比對', () => {
      // Given: 格式不一致的有效路徑
      const paths = ['/faq', '/about/', '/guide', '/usd-twd/'];

      // When: 過濾路徑
      const result = getIncludedRoutes(paths);

      // Then: 應該都被識別為有效（經過正規化）
      expect(result).toEqual(['/faq', '/about/', '/guide', '/usd-twd/']);
      expect(result.length).toBe(4);
    });

    it('應該保持原始路徑順序', () => {
      // Given: 有順序的路徑
      const paths = ['/usd-twd', '/faq', '/', '/about'];

      // When: 過濾路徑
      const result = getIncludedRoutes(paths);

      // Then: 應該保持相同順序
      expect(result).toEqual(['/usd-twd', '/faq', '/', '/about']);
    });
  });

  describe('SEO_PATHS 配置驗證', () => {
    it('應該包含 17 個路徑', () => {
      // Given: SEO_PATHS 配置

      // When: 檢查路徑數量
      const count = SEO_PATHS.length;

      // Then: 應該有 17 個路徑
      expect(count).toBe(17);
    });

    it('應該包含所有核心頁面', () => {
      // Given: 核心頁面列表
      const corePages = ['/', '/faq/', '/about/', '/guide/'] as const;

      // When: 檢查是否都在 SEO_PATHS 中
      const allIncluded = corePages.every((page) => SEO_PATHS.includes(page));

      // Then: 應該全部包含
      expect(allIncluded).toBe(true);
    });

    it('應該包含所有 13 個幣別頁面', () => {
      // Given: 幣別頁面列表
      const currencyPages = [
        '/aud-twd/',
        '/cad-twd/',
        '/chf-twd/',
        '/cny-twd/',
        '/eur-twd/',
        '/gbp-twd/',
        '/hkd-twd/',
        '/jpy-twd/',
        '/krw-twd/',
        '/nzd-twd/',
        '/sgd-twd/',
        '/thb-twd/',
        '/usd-twd/',
      ] as const;

      // When: 檢查是否都在 SEO_PATHS 中
      const allIncluded = currencyPages.every((page) => SEO_PATHS.includes(page));

      // Then: 應該全部包含
      expect(allIncluded).toBe(true);
      expect(currencyPages.length).toBe(13);
    });

    it('所有路徑都應該使用尾斜線格式（除了根路徑）', () => {
      // Given: SEO_PATHS 配置

      // When: 檢查所有非根路徑
      const nonRootPaths = SEO_PATHS.filter((path) => path !== '/');
      const allHaveTrailingSlash = nonRootPaths.every((path) => path.endsWith('/'));

      // Then: 都應該有尾斜線
      expect(allHaveTrailingSlash).toBe(true);
    });

    it('不應該有重複的路徑', () => {
      // Given: SEO_PATHS 配置

      // When: 檢查重複
      const uniquePaths = new Set(SEO_PATHS);

      // Then: Set 大小應該等於原陣列長度
      expect(uniquePaths.size).toBe(SEO_PATHS.length);
    });
  });

  describe('SEO_FILES 配置驗證', () => {
    it('應該包含 3 個 SEO 檔案', () => {
      // Given: SEO_FILES 配置

      // When: 檢查檔案數量
      const count = SEO_FILES.length;

      // Then: 應該有 3 個檔案
      expect(count).toBe(3);
    });

    it('應該包含必要的 SEO 檔案', () => {
      // Given: 必要檔案列表
      const requiredFiles = ['/sitemap.xml', '/robots.txt', '/llms.txt'] as const;

      // When: 檢查是否都在 SEO_FILES 中
      const allIncluded = requiredFiles.every((file) => SEO_FILES.includes(file));

      // Then: 應該全部包含
      expect(allIncluded).toBe(true);
    });
  });

  describe('IMAGE_RESOURCES 配置驗證', () => {
    it('應該包含 6 個圖片資源', () => {
      // Given: IMAGE_RESOURCES 配置

      // When: 檢查圖片數量
      const count = IMAGE_RESOURCES.length;

      // Then: 應該有 6 個圖片
      expect(count).toBe(6);
    });

    it('應該包含 OG 圖片', () => {
      // Given: IMAGE_RESOURCES 配置

      // When: 檢查 og-image.png
      const hasOGImage = IMAGE_RESOURCES.includes('/og-image.png');

      // Then: 應該包含
      expect(hasOGImage).toBe(true);
    });

    it('應該包含所有 PWA 圖標', () => {
      // Given: PWA 圖標列表
      const pwaIcons = [
        '/icons/ratewise-icon-192x192.png',
        '/icons/ratewise-icon-512x512.png',
        '/icons/ratewise-icon-maskable-512x512.png',
      ] as const;

      // When: 檢查是否都在 IMAGE_RESOURCES 中
      const allIncluded = pwaIcons.every((icon) => IMAGE_RESOURCES.includes(icon));

      // Then: 應該全部包含
      expect(allIncluded).toBe(true);
    });
  });

  describe('SITE_CONFIG 配置驗證', () => {
    it('應該包含正確的網站 URL', () => {
      // Given: SITE_CONFIG 配置

      // When: 檢查 URL
      const url = SITE_CONFIG.url;

      // Then: 應該是正確的 URL
      expect(url).toBe('https://app.haotool.org/ratewise/');
    });

    it('應該包含網站名稱', () => {
      // Given: SITE_CONFIG 配置

      // When: 檢查 name
      const name = SITE_CONFIG.name;

      // Then: 應該有名稱
      expect(name).toBeTruthy();
      expect(name.length).toBeGreaterThan(0);
    });

    it('應該包含網站標題', () => {
      // Given: SITE_CONFIG 配置

      // When: 檢查 title
      const title = SITE_CONFIG.title;

      // Then: 應該有標題
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });

    it('應該包含網站描述', () => {
      // Given: SITE_CONFIG 配置

      // When: 檢查 description
      const description = SITE_CONFIG.description;

      // Then: 應該有描述
      expect(description).toBeTruthy();
      expect(description.length).toBeGreaterThan(0);
    });
  });

  describe('isSEOPath（類型守衛）', () => {
    it('應該識別有效的 SEO 路徑', () => {
      // Given: 有效的 SEO 路徑
      const validPaths = ['/', '/faq/', '/about/', '/usd-twd/'];

      // When: 檢查每個路徑
      const results = validPaths.map(isSEOPath);

      // Then: 都應該返回 true
      expect(results).toEqual([true, true, true, true]);
    });

    it('應該拒絕無效的路徑', () => {
      // Given: 無效的路徑
      const invalidPaths = ['/invalid', '/not-found', '/random'];

      // When: 檢查每個路徑
      const results = invalidPaths.map(isSEOPath);

      // Then: 都應該返回 false
      expect(results).toEqual([false, false, false]);
    });

    it('應該區分大小寫', () => {
      // Given: 大小寫不同的路徑
      const lowercase = '/faq/';
      const uppercase = '/FAQ/';

      // When: 檢查兩個路徑
      const result1 = isSEOPath(lowercase);
      const result2 = isSEOPath(uppercase);

      // Then: 只有小寫是有效的
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    it('應該檢查完全匹配（包括尾斜線）', () => {
      // Given: 格式不同的路徑
      const withSlash = '/faq/';
      const withoutSlash = '/faq';

      // When: 檢查兩個路徑
      const result1 = isSEOPath(withSlash);
      const result2 = isSEOPath(withoutSlash);

      // Then: 只有帶尾斜線的是有效的（因為 SEO_PATHS 中是 '/faq/'）
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });

  describe('isCorePagePath（類型守衛）', () => {
    it('應該識別所有核心頁面', () => {
      // Given: 核心頁面路徑
      const corePaths = ['/', '/faq/', '/about/', '/guide/'];

      // When: 檢查每個路徑
      const results = corePaths.map(isCorePagePath);

      // Then: 都應該返回 true
      expect(results).toEqual([true, true, true, true]);
    });

    it('應該拒絕幣別頁面', () => {
      // Given: 幣別頁面路徑
      const currencyPaths = ['/usd-twd/', '/eur-twd/', '/jpy-twd/'];

      // When: 檢查每個路徑
      const results = currencyPaths.map(isCorePagePath);

      // Then: 都應該返回 false
      expect(results).toEqual([false, false, false]);
    });

    it('應該拒絕無效路徑', () => {
      // Given: 無效路徑
      const invalidPaths = ['/invalid', '/not-found'];

      // When: 檢查每個路徑
      const results = invalidPaths.map(isCorePagePath);

      // Then: 都應該返回 false
      expect(results).toEqual([false, false]);
    });
  });

  describe('isCurrencyPagePath（類型守衛）', () => {
    it('應該識別所有幣別頁面', () => {
      // Given: 幣別頁面路徑
      const currencyPaths = ['/usd-twd/', '/eur-twd/', '/jpy-twd/', '/gbp-twd/', '/cny-twd/'];

      // When: 檢查每個路徑
      const results = currencyPaths.map(isCurrencyPagePath);

      // Then: 都應該返回 true
      expect(results).toEqual([true, true, true, true, true]);
    });

    it('應該拒絕核心頁面', () => {
      // Given: 核心頁面路徑
      const corePaths = ['/', '/faq/', '/about/', '/guide/'];

      // When: 檢查每個路徑
      const results = corePaths.map(isCurrencyPagePath);

      // Then: 都應該返回 false
      expect(results).toEqual([false, false, false, false]);
    });

    it('應該拒絕無效路徑', () => {
      // Given: 無效路徑
      const invalidPaths = ['/invalid', '/not-found', '/random'];

      // When: 檢查每個路徑
      const results = invalidPaths.map(isCurrencyPagePath);

      // Then: 都應該返回 false
      expect(results).toEqual([false, false, false]);
    });

    it('應該只識別所有 13 個幣別頁面', () => {
      // Given: SEO_PATHS 中的所有路徑
      const currencyCount = SEO_PATHS.filter(isCurrencyPagePath).length;

      // Then: 應該有 13 個幣別頁面
      expect(currencyCount).toBe(13);
    });
  });
});
