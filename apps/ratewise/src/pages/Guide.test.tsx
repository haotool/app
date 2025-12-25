/**
 * Guide Page BDD Tests
 * [BDD Approach: Red → Green → Refactor]
 * [Updated: 2025-12-03] 更新至 8 步驟完整教學
 *
 * Feature: 操作指南頁面 (HowTo Schema)
 * 依據: docs/dev/013_ai_search_optimization_spec.md
 * 依據: docs/dev/019_optional_features_spec.md
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import Guide from './Guide';

describe('Guide Page - HowTo Schema', () => {
  const renderGuide = () => {
    return render(
      <BrowserRouter>
        <HelmetProvider>
          <Guide />
        </HelmetProvider>
      </BrowserRouter>,
    );
  };

  describe('Basic Rendering', () => {
    it('renders main heading', () => {
      renderGuide();
      expect(
        screen.getByRole('heading', { level: 1, name: /如何使用 RateWise/i }),
      ).toBeInTheDocument();
    });

    it('renders introduction section', () => {
      renderGuide();
      // 檢查頁面包含介紹文字
      const introText = screen.queryAllByText(/完整 8 步驟教學/i);
      expect(introText.length).toBeGreaterThanOrEqual(1);
    });

    it('renders estimated time', () => {
      renderGuide();
      expect(screen.getByText(/預估完成時間：約 2 分鐘/i)).toBeInTheDocument();
    });
  });

  describe('HowTo Steps (8 Steps)', () => {
    it('renders step 1: 開啟 RateWise', () => {
      renderGuide();
      // 使用 getAllByText 因為快速導航和步驟內容都有
      expect(screen.getAllByText(/開啟 RateWise/i).length).toBeGreaterThanOrEqual(1);
    });

    it('renders step 2: 選擇換算模式', () => {
      renderGuide();
      expect(screen.getAllByText(/選擇換算模式/i).length).toBeGreaterThanOrEqual(1);
    });

    it('renders step 3: 選擇原始貨幣', () => {
      renderGuide();
      expect(screen.getAllByText(/選擇原始貨幣/i).length).toBeGreaterThanOrEqual(1);
    });

    it('renders step 4: 選擇目標貨幣', () => {
      renderGuide();
      expect(screen.getAllByText(/選擇目標貨幣/i).length).toBeGreaterThanOrEqual(1);
    });

    it('renders step 5: 輸入金額', () => {
      renderGuide();
      expect(screen.getAllByText(/輸入金額/i).length).toBeGreaterThanOrEqual(1);
    });

    it('renders step 6: 選擇匯率類型', () => {
      renderGuide();
      expect(screen.getAllByText(/選擇匯率類型/i).length).toBeGreaterThanOrEqual(1);
    });

    it('renders step 7: 查看歷史趨勢', () => {
      renderGuide();
      expect(screen.getAllByText(/查看歷史趨勢/i).length).toBeGreaterThanOrEqual(1);
    });

    it('renders step 8: 收藏常用貨幣', () => {
      renderGuide();
      expect(screen.getAllByText(/收藏常用貨幣/i).length).toBeGreaterThanOrEqual(1);
    });

    it('renders all 8 main steps', () => {
      renderGuide();
      const allHeadings = screen.getAllByRole('heading', { level: 2 });
      // 應該有至少 8 個 h2 標題（8 步驟 + 進階功能 + 提示與技巧 + 常見問題）
      expect(allHeadings.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Quick Navigation', () => {
    it('renders quick navigation section', () => {
      renderGuide();
      expect(screen.getByText(/快速導航/i)).toBeInTheDocument();
    });

    it('renders navigation links for all 8 steps', () => {
      renderGuide();
      // 檢查快速導航中有 8 個步驟連結
      const navLinks = screen.getAllByRole('link', { name: /^\d+\. / });
      expect(navLinks.length).toBe(8);
    });
  });

  describe('SEO Metadata', () => {
    it('sets correct page title', async () => {
      renderGuide();
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(document.title).toContain('使用指南');
      expect(document.title).toContain('RateWise');
    });

    it('sets correct canonical URL', async () => {
      renderGuide();
      await new Promise((resolve) => setTimeout(resolve, 100));
      const canonical = document.querySelector('link[rel="canonical"]');
      expect(canonical).toHaveAttribute('href', expect.stringContaining('/guide'));
    });
  });

  describe('HowTo Schema (JSON-LD)', () => {
    it('includes HowTo structured data', async () => {
      renderGuide();
      await new Promise((resolve) => setTimeout(resolve, 100));
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      const howToScript = scripts.find((script) => {
        try {
          const data = JSON.parse(script.textContent || '{}') as { '@type'?: string };
          return data['@type'] === 'HowTo';
        } catch {
          return false;
        }
      });
      expect(howToScript).toBeTruthy();
    });

    it('HowTo schema has correct structure with 8 steps', async () => {
      renderGuide();
      await new Promise((resolve) => setTimeout(resolve, 100));
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      const howToScript = scripts.find((script) => {
        try {
          const data = JSON.parse(script.textContent || '{}') as { '@type'?: string };
          return data['@type'] === 'HowTo';
        } catch {
          return false;
        }
      });

      if (howToScript) {
        const data = JSON.parse(howToScript.textContent || '{}') as Record<string, unknown>;
        expect(data).toMatchObject({
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: expect.stringContaining('如何使用 RateWise'),
          description: expect.any(String),
          totalTime: expect.stringMatching(/^PT\d+[SM]$/),
        });

        // 驗證有 step 屬性
        expect(data).toHaveProperty('step');

        // 驗證總共有 8 個步驟
        const steps = data['step'] as unknown[];
        expect(steps).toHaveLength(8);

        // 驗證第一個和最後一個步驟
        const firstStep = steps[0] as Record<string, unknown>;
        expect(firstStep['@type']).toBe('HowToStep');
        expect(firstStep['position']).toBe(1);
        expect(firstStep['name']).toContain('開啟 RateWise');

        const lastStep = steps[7] as Record<string, unknown>;
        expect(lastStep['@type']).toBe('HowToStep');
        expect(lastStep['position']).toBe(8);
        expect(lastStep['name']).toContain('收藏常用貨幣');
      }
    });
  });

  describe('Advanced Features Section', () => {
    it('renders advanced features section', () => {
      renderGuide();
      expect(screen.getByText(/進階功能/i)).toBeInTheDocument();
    });

    it('renders calculator feature', () => {
      renderGuide();
      expect(screen.getByText(/計算機功能/i)).toBeInTheDocument();
    });
  });

  describe('FAQ Section', () => {
    it('renders FAQ section', () => {
      renderGuide();
      // 使用 ❓ 常見問題 作為精確匹配
      const faqHeading = screen.getByRole('heading', { name: /❓ 常見問題/i });
      expect(faqHeading).toBeInTheDocument();
    });

    it('renders link to full FAQ page', () => {
      renderGuide();
      const faqLink = screen.getByRole('link', { name: /查看更多常見問題/i });
      expect(faqLink).toHaveAttribute('href', '/faq');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderGuide();
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBeGreaterThanOrEqual(8);
    });

    it('has navigation back to home', () => {
      renderGuide();
      const backLink = screen.getByRole('link', { name: /回到首頁/i });
      expect(backLink).toHaveAttribute('href', expect.stringContaining('/'));
    });

    it('has anchor links for each step', () => {
      renderGuide();
      // 檢查步驟有 id 屬性供錨點連結
      for (let i = 1; i <= 8; i++) {
        const stepElement = document.getElementById(`step-${i}`);
        expect(stepElement).toBeTruthy();
      }
    });
  });
});
