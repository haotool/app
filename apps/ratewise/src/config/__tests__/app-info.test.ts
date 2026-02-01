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

    it('should have copyright start year defined', () => {
      expect(APP_INFO.copyrightStartYear).toBe(2025);
    });
  });

  describe('getCopyrightYears', () => {
    it('should return year range with current year', () => {
      const years = getCopyrightYears();
      const currentYear = new Date().getFullYear();
      expect(years).toBe(`2025-${currentYear}`);
    });

    it('should return single year when start equals current year', () => {
      const currentYear = new Date().getFullYear();
      const originalStart = APP_INFO.copyrightStartYear;
      // @ts-expect-error -- 測試用暫時覆寫 readonly
      APP_INFO.copyrightStartYear = currentYear;
      expect(getCopyrightYears()).toBe(String(currentYear));
      // @ts-expect-error -- 還原
      APP_INFO.copyrightStartYear = originalStart;
    });
  });

  describe('getCopyrightNotice', () => {
    it('should return formatted copyright notice with current year', () => {
      const notice = getCopyrightNotice();
      const currentYear = new Date().getFullYear();
      expect(notice).toBe(`© 2025-${currentYear} RateWise`);
    });
  });
});
