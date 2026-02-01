/**
 * App Info SSOT Test Suite
 *
 * 測試應用程式基本資訊 SSOT 模組
 */

import { describe, it, expect } from 'vitest';
import { APP_INFO, getCopyrightYears, getCopyrightNotice } from '../app-info';

describe('app-info', () => {
  describe('APP_INFO constants', () => {
    it('should have name defined', () => {
      expect(APP_INFO.name).toBe('RateWise');
    });

    it('should have author defined', () => {
      expect(APP_INFO.author).toBe('HaoTool');
    });

    it('should have valid email format', () => {
      expect(APP_INFO.email).toMatch(/^[\w.-]+@[\w.-]+\.\w+$/);
    });

    it('should have valid GitHub URL', () => {
      expect(APP_INFO.github).toMatch(/^https:\/\/github\.com\//);
    });

    it('should have license defined', () => {
      expect(APP_INFO.license).toBe('GPL-3.0');
    });

    it('should have copyright years defined', () => {
      expect(APP_INFO.copyrightStartYear).toBe(2025);
      expect(APP_INFO.copyrightEndYear).toBe(2026);
    });
  });

  describe('getCopyrightYears', () => {
    it('should return formatted year range', () => {
      const years = getCopyrightYears();
      expect(years).toBe('2025-2026');
    });
  });

  describe('getCopyrightNotice', () => {
    it('should return formatted copyright notice', () => {
      const notice = getCopyrightNotice();
      expect(notice).toBe('© 2025-2026 RateWise');
    });
  });
});
