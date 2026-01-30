/**
 * Version Configuration Test Suite
 *
 * 測試版本管理 SSOT 模組
 */

import { describe, it, expect } from 'vitest';
import {
  APP_VERSION,
  BUILD_TIME,
  IS_DEV,
  getDisplayVersion,
  getFullVersion,
  getFormattedBuildTime,
  getVersionInfo,
} from '../version';

describe('version', () => {
  describe('constants', () => {
    it('should have APP_VERSION defined', () => {
      expect(APP_VERSION).toBeDefined();
      expect(typeof APP_VERSION).toBe('string');
    });

    it('should have BUILD_TIME defined', () => {
      expect(BUILD_TIME).toBeDefined();
      expect(typeof BUILD_TIME).toBe('string');
    });

    it('should have IS_DEV as boolean', () => {
      expect(typeof IS_DEV).toBe('boolean');
    });
  });

  describe('getDisplayVersion', () => {
    it('should return version with v prefix', () => {
      const display = getDisplayVersion();
      expect(display).toMatch(/^v\d+\.\d+\.\d+/);
    });

    it('should strip build suffix from version', () => {
      const display = getDisplayVersion();
      expect(display).not.toContain('+build');
      expect(display).not.toContain('+sha');
    });
  });

  describe('getFullVersion', () => {
    it('should return full version with v prefix', () => {
      const full = getFullVersion();
      expect(full).toMatch(/^v/);
      expect(full).toContain(APP_VERSION);
    });
  });

  describe('getFormattedBuildTime', () => {
    it('should return formatted date time string', () => {
      const formatted = getFormattedBuildTime();
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
      // 格式: YYYY/MM/DD HH:mm
      expect(formatted).toMatch(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/);
    });
  });

  describe('getVersionInfo', () => {
    it('should return complete version info object', () => {
      const info = getVersionInfo();

      expect(info).toHaveProperty('version');
      expect(info).toHaveProperty('displayVersion');
      expect(info).toHaveProperty('fullVersion');
      expect(info).toHaveProperty('buildTime');
      expect(info).toHaveProperty('formattedBuildTime');
      expect(info).toHaveProperty('isDev');
    });

    it('should have consistent version values', () => {
      const info = getVersionInfo();

      expect(info.version).toBe(APP_VERSION);
      expect(info.buildTime).toBe(BUILD_TIME);
      expect(info.isDev).toBe(IS_DEV);
    });
  });
});
