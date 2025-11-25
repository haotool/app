/**
 * Guide Page BDD Tests
 * [BDD Approach: Red → Green → Refactor]
 *
 * Feature: 操作指南頁面 (HowTo Schema)
 * 依據: docs/dev/AI_SEARCH_OPTIMIZATION_SPEC.md Line 452-482
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
      // 檢查頁面包含介紹文字 (可能在多個地方出現，如 SEO meta 和頁面內容)
      const introText = screen.queryAllByText(/快速學會使用.*進行.*匯率換算/i);
      expect(introText.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('HowTo Steps', () => {
    it('renders step 1: 選擇原始貨幣', () => {
      renderGuide();
      expect(screen.getByText(/選擇原始貨幣/i)).toBeInTheDocument();
      expect(screen.getByText(/在「從」欄位選擇您要兌換的貨幣/i)).toBeInTheDocument();
    });

    it('renders step 2: 選擇目標貨幣', () => {
      renderGuide();
      expect(screen.getByText(/選擇目標貨幣/i)).toBeInTheDocument();
      expect(screen.getByText(/在「到」欄位選擇您要兌換成的貨幣/i)).toBeInTheDocument();
    });

    it('renders step 3: 輸入金額', () => {
      renderGuide();
      expect(screen.getAllByText(/輸入金額/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/系統會自動計算並顯示目標貨幣金額/i)).toBeInTheDocument();
    });

    it('renders all 3 main steps in order', () => {
      renderGuide();
      const allHeadings = screen.getAllByRole('heading', { level: 2 });
      // 前 3 個 h2 應該是主要步驟
      expect(allHeadings.length).toBeGreaterThanOrEqual(3);
      expect(allHeadings[0]).toHaveTextContent(/選擇原始貨幣/i);
      expect(allHeadings[1]).toHaveTextContent(/選擇目標貨幣/i);
      expect(allHeadings[2]).toHaveTextContent(/輸入金額/i);
    });
  });

  describe('SEO Metadata', () => {
    it('sets correct page title', async () => {
      renderGuide();
      // react-helmet-async 會更新 document.title
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

    it('HowTo schema has correct structure', async () => {
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
          totalTime: expect.stringMatching(/^PT\d+[SM]$/), // ISO 8601 duration
          step: expect.arrayContaining([
            expect.objectContaining({
              '@type': 'HowToStep',
              position: 1,
              name: expect.stringContaining('選擇原始貨幣'),
              text: expect.any(String),
            }),
            expect.objectContaining({
              '@type': 'HowToStep',
              position: 2,
              name: expect.stringContaining('選擇目標貨幣'),
              text: expect.any(String),
            }),
            expect.objectContaining({
              '@type': 'HowToStep',
              position: 3,
              name: expect.stringContaining('輸入金額'),
              text: expect.any(String),
            }),
          ]),
        });
      }
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderGuide();
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBeGreaterThanOrEqual(3);
    });

    it('has navigation back to home', () => {
      renderGuide();
      const backLink = screen.getByRole('link', { name: /回到首頁/i });
      expect(backLink).toHaveAttribute('href', expect.stringContaining('/'));
    });
  });
});
