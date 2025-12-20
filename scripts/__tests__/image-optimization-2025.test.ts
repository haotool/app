/**
 * 圖片優化 2025 標準測試
 *
 * 測試目標：
 * 1. 所有主要圖片都有 AVIF 版本
 * 2. 所有主要圖片都有 WebP Fallback
 * 3. 檔案大小符合 2025 標準
 *
 * 依據：
 * - [AI Bud WP](https://aibudwp.com/image-optimization-in-2025-webp-avif-srcset-and-preload/)
 * - [SearchX SEO](https://searchxpro.com/2025-guide-to-image-resizing-for-seo/)
 */

import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'fs';
import { resolve } from 'path';

const PUBLIC_DIR = resolve(__dirname, '../../apps/ratewise/public');

// 2025 圖片大小標準
const MAX_SIZES = {
  'logo.avif': 50 * 1024,        // 50 KB
  'logo.webp': 70 * 1024,        // 70 KB
  'logo.png': 100 * 1024,        // 100 KB
  'og-image.avif': 100 * 1024,   // 100 KB
  'og-image.webp': 150 * 1024,   // 150 KB
  'og-image.png': 200 * 1024,    // 200 KB
};

function getFileSize(filename: string): number {
  const path = resolve(PUBLIC_DIR, filename);
  if (!existsSync(path)) {
    throw new Error(`File not found: ${filename}`);
  }
  return statSync(path).size;
}

function formatSize(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

describe('Image Optimization 2025 Standards', () => {
  describe('Modern Format Support', () => {
    it('should have AVIF version of logo', () => {
      const path = resolve(PUBLIC_DIR, 'logo.avif');
      expect(existsSync(path), 'logo.avif should exist').toBe(true);
    });

    it('should have WebP version of logo', () => {
      const path = resolve(PUBLIC_DIR, 'logo.webp');
      expect(existsSync(path), 'logo.webp should exist').toBe(true);
    });

    it('should have AVIF version of og-image', () => {
      const path = resolve(PUBLIC_DIR, 'og-image.avif');
      expect(existsSync(path), 'og-image.avif should exist').toBe(true);
    });

    it('should have WebP version of og-image', () => {
      const path = resolve(PUBLIC_DIR, 'og-image.webp');
      expect(existsSync(path), 'og-image.webp should exist').toBe(true);
    });
  });

  describe('File Size Limits - AVIF', () => {
    it('logo.avif should be < 50 KB', () => {
      const size = getFileSize('logo.avif');
      const maxSize = MAX_SIZES['logo.avif'];

      expect(
        size,
        `logo.avif is ${formatSize(size)}, should be < ${formatSize(maxSize)}`
      ).toBeLessThan(maxSize);
    });

    it('og-image.avif should be < 100 KB', () => {
      const size = getFileSize('og-image.avif');
      const maxSize = MAX_SIZES['og-image.avif'];

      expect(
        size,
        `og-image.avif is ${formatSize(size)}, should be < ${formatSize(maxSize)}`
      ).toBeLessThan(maxSize);
    });
  });

  describe('File Size Limits - WebP Fallback', () => {
    it('logo.webp should be < 70 KB', () => {
      const size = getFileSize('logo.webp');
      const maxSize = MAX_SIZES['logo.webp'];

      expect(
        size,
        `logo.webp is ${formatSize(size)}, should be < ${formatSize(maxSize)}`
      ).toBeLessThan(maxSize);
    });

    it('og-image.webp should be < 150 KB', () => {
      const size = getFileSize('og-image.webp');
      const maxSize = MAX_SIZES['og-image.webp'];

      expect(
        size,
        `og-image.webp is ${formatSize(size)}, should be < ${formatSize(maxSize)}`
      ).toBeLessThan(maxSize);
    });
  });

  describe('File Size Limits - PNG Fallback', () => {
    it('logo.png should be < 100 KB', () => {
      const size = getFileSize('logo.png');
      const maxSize = MAX_SIZES['logo.png'];

      expect(
        size,
        `logo.png is ${formatSize(size)}, should be < ${formatSize(maxSize)}`
      ).toBeLessThan(maxSize);
    });

    it('og-image.png should be < 200 KB', () => {
      const size = getFileSize('og-image.png');
      const maxSize = MAX_SIZES['og-image.png'];

      expect(
        size,
        `og-image.png is ${formatSize(size)}, should be < ${formatSize(maxSize)}`
      ).toBeLessThan(maxSize);
    });
  });

  describe('Total Size Reduction', () => {
    it('should reduce total image size by at least 70%', () => {
      // 原始大小（估計）
      const originalLogoSize = 1.4 * 1024 * 1024; // 1.4 MB
      const originalOgSize = 663 * 1024; // 663 KB
      const originalTotal = originalLogoSize + originalOgSize;

      // 優化後大小
      const optimizedTotal =
        getFileSize('logo.avif') +
        getFileSize('logo.webp') +
        getFileSize('logo.png') +
        getFileSize('og-image.avif') +
        getFileSize('og-image.webp') +
        getFileSize('og-image.png');

      const reduction = ((originalTotal - optimizedTotal) / originalTotal) * 100;

      expect(
        reduction,
        `Total size reduction is ${reduction.toFixed(1)}%, should be >= 70%`
      ).toBeGreaterThanOrEqual(70);
    });
  });
});
