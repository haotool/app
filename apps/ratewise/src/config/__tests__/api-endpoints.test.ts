/**
 * API 端點 SSOT 測試
 *
 * 驗證所有 CDN/GitHub API 端點從 SSOT 模組正確導出，
 * 且與 APP_INFO 中的 GitHub 倉庫資訊保持一致。
 */

import { describe, it, expect } from 'vitest';
import { RATES_API, CDN_DATA_BASE, RAW_DATA_BASE } from '../api-endpoints';
import { APP_INFO } from '../app-info';

describe('api-endpoints', () => {
  describe('CDN_DATA_BASE', () => {
    it('should reference the haotool/app data branch via jsDelivr', () => {
      expect(CDN_DATA_BASE).toContain('cdn.jsdelivr.net');
      expect(CDN_DATA_BASE).toContain('haotool/app@data');
    });

    it('should derive from APP_INFO.github repository path', () => {
      const repoPath = APP_INFO.github.replace('https://github.com/', '');
      expect(CDN_DATA_BASE).toContain(repoPath);
    });
  });

  describe('RAW_DATA_BASE', () => {
    it('should reference the haotool/app data branch via GitHub Raw', () => {
      expect(RAW_DATA_BASE).toContain('raw.githubusercontent.com');
      expect(RAW_DATA_BASE).toContain('haotool/app');
      expect(RAW_DATA_BASE).toContain('/data');
    });
  });

  describe('RATES_API.latestCdn', () => {
    it('should be a valid jsDelivr URL pointing to latest.json', () => {
      expect(RATES_API.latestCdn).toMatch(/^https:\/\/cdn\.jsdelivr\.net/);
      expect(RATES_API.latestCdn).toContain('/public/rates/latest.json');
    });

    it('should be consistent with CDN_DATA_BASE', () => {
      expect(RATES_API.latestCdn.startsWith(CDN_DATA_BASE)).toBe(true);
    });
  });

  describe('RATES_API.latestRaw', () => {
    it('should be a valid GitHub Raw URL pointing to latest.json', () => {
      expect(RATES_API.latestRaw).toMatch(/^https:\/\/raw\.githubusercontent\.com/);
      expect(RATES_API.latestRaw).toContain('/public/rates/latest.json');
    });

    it('should be consistent with RAW_DATA_BASE', () => {
      expect(RATES_API.latestRaw.startsWith(RAW_DATA_BASE)).toBe(true);
    });
  });

  describe('RATES_API history endpoints', () => {
    it('historyCdnExample should contain example date and history path', () => {
      expect(RATES_API.historyCdnExample).toContain('/public/rates/history/');
      expect(RATES_API.historyCdnExample).toContain('2026-03-19.json');
    });

    it('historyRawExample should contain example date and history path', () => {
      expect(RATES_API.historyRawExample).toContain('/public/rates/history/');
      expect(RATES_API.historyRawExample).toContain('2026-03-19.json');
    });

    it('CDN and Raw history examples should use the same date', () => {
      const cdnDate = /history\/([\d-]+)\.json/.exec(RATES_API.historyCdnExample)?.[1];
      const rawDate = /history\/([\d-]+)\.json/.exec(RATES_API.historyRawExample)?.[1];
      expect(cdnDate).toBe(rawDate);
    });
  });

  describe('RATES_API.actionsUrl', () => {
    it('should point to APP_INFO.github actions page', () => {
      expect(RATES_API.actionsUrl).toBe(`${APP_INFO.github}/actions`);
    });
  });

  describe('SSOT consistency', () => {
    it('latestCdn and historyCdnExample should share the same CDN base', () => {
      expect(RATES_API.latestCdn.startsWith(CDN_DATA_BASE)).toBe(true);
      expect(RATES_API.historyCdnExample.startsWith(CDN_DATA_BASE)).toBe(true);
    });

    it('latestRaw and historyRawExample should share the same Raw base', () => {
      expect(RATES_API.latestRaw.startsWith(RAW_DATA_BASE)).toBe(true);
      expect(RATES_API.historyRawExample.startsWith(RAW_DATA_BASE)).toBe(true);
    });
  });
});
