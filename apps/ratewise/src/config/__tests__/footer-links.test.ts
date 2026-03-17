/**
 * Footer Links SSOT 測試
 *
 * 驗證頁腳連結結構符合 CalOPPA/GDPR/CCPA 合規要求，
 * 以及所有核心頁面連結均正確配置。
 */

import { describe, it, expect } from 'vitest';
import { FOOTER_SECTIONS, POPULAR_RATE_LINKS } from '../footer-links';

describe('footer-links', () => {
  describe('FOOTER_SECTIONS structure', () => {
    it('should have exactly 4 sections', () => {
      expect(FOOTER_SECTIONS).toHaveLength(4);
    });

    it('should have correct section titles', () => {
      const titles = FOOTER_SECTIONS.map((s) => s.title);
      expect(titles).toContain('核心頁面');
      expect(titles).toContain('熱門匯率');
      expect(titles).toContain('亞洲貨幣');
      expect(titles).toContain('歐美貨幣');
    });
  });

  describe('核心頁面 section', () => {
    const coreSection = FOOTER_SECTIONS[0]!;

    it('should be the first section titled 核心頁面', () => {
      expect(coreSection.title).toBe('核心頁面');
    });

    it('should contain 首頁 link', () => {
      const hrefs = coreSection.links.map((l) => l.href);
      expect(hrefs).toContain('/');
    });

    it('should contain 隱私政策 link for CalOPPA/GDPR/CCPA compliance', () => {
      const privacyLink = coreSection.links.find((l) => l.href === '/privacy/');
      expect(privacyLink).toBeDefined();
      expect(privacyLink?.label).toBe('隱私政策');
    });

    it('should contain 開放資料 API link', () => {
      const openDataLink = coreSection.links.find((l) => l.href === '/open-data/');
      expect(openDataLink).toBeDefined();
    });

    it('should contain all required core page links', () => {
      const hrefs = coreSection.links.map((l) => l.href);
      expect(hrefs).toContain('/faq/');
      expect(hrefs).toContain('/about/');
      expect(hrefs).toContain('/guide/');
      expect(hrefs).toContain('/open-data/');
      expect(hrefs).toContain('/privacy/');
    });

    it('all links should have non-empty label and href', () => {
      coreSection.links.forEach((link) => {
        expect(link.label).toBeTruthy();
        expect(link.href).toBeTruthy();
        expect(link.href).toMatch(/^\//);
      });
    });
  });

  describe('POPULAR_RATE_LINKS', () => {
    it('should contain 6 popular currency links', () => {
      expect(POPULAR_RATE_LINKS).toHaveLength(6);
    });

    it('should include USD, JPY, EUR as top currencies', () => {
      const hrefs = POPULAR_RATE_LINKS.map((l) => l.href);
      expect(hrefs).toContain('/usd-twd/');
      expect(hrefs).toContain('/jpy-twd/');
      expect(hrefs).toContain('/eur-twd/');
    });
  });

  describe('all section links', () => {
    it('should have valid href format (starts with /)', () => {
      FOOTER_SECTIONS.forEach((section) => {
        section.links.forEach((link) => {
          expect(link.href).toMatch(/^\//);
        });
      });
    });

    it('should have no duplicate hrefs within any single section', () => {
      FOOTER_SECTIONS.forEach((section) => {
        const hrefs = section.links.map((l) => l.href);
        const unique = new Set(hrefs);
        expect(unique.size).toBe(hrefs.length);
      });
    });

    it('should have no duplicate hrefs across all sections (no cross-section spam)', () => {
      const allHrefs = FOOTER_SECTIONS.flatMap((s) => s.links.map((l) => l.href));
      const unique = new Set(allHrefs);
      expect(unique.size).toBe(allHrefs.length);
    });
  });
});
