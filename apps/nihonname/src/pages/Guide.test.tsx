/**
 * Guide Page BDD Tests
 * [BDD Approach: Red → Green → Refactor]
 * [Created: 2025-12-04] 8 步驟完整教學
 *
 * Feature: 操作指南頁面 (HowTo Schema)
 * 依據: docs/dev/019_optional_features_spec.md
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
        screen.getByRole('heading', { level: 1, name: /如何使用日本名字產生器/i }),
      ).toBeInTheDocument();
    });

    it('renders introduction section', () => {
      renderGuide();
      const introText = screen.queryAllByText(/完整 8 步驟教學/i);
      expect(introText.length).toBeGreaterThanOrEqual(1);
    });

    it('renders estimated time', () => {
      renderGuide();
      expect(screen.getByText(/預估完成時間：約 2 分鐘/i)).toBeInTheDocument();
    });
  });

  describe('HowTo Steps (8 Steps)', () => {
    it('renders all 8 steps', () => {
      renderGuide();
      // 檢查所有 8 個步驟標題
      expect(screen.getByText('開啟日本名字產生器')).toBeInTheDocument();
      expect(screen.getByText('輸入你的中文姓氏')).toBeInTheDocument();
      expect(screen.getByText('查看日文姓氏結果')).toBeInTheDocument();
      expect(screen.getByText('產生諧音梗名字')).toBeInTheDocument();
      expect(screen.getByText('查看羅馬拼音')).toBeInTheDocument();
      expect(screen.getByText('了解諧音含義')).toBeInTheDocument();
      expect(screen.getByText('使用截圖模式')).toBeInTheDocument();
      expect(screen.getByText('自訂諧音梗名字')).toBeInTheDocument();
    });

    it('renders step numbers 1-8', () => {
      renderGuide();
      for (let i = 1; i <= 8; i++) {
        expect(screen.getByText(String(i))).toBeInTheDocument();
      }
    });

    it('renders step descriptions', () => {
      renderGuide();
      // Use more specific text from step descriptions to avoid duplicate matches
      expect(
        screen.getByText(/在瀏覽器中開啟日本名字產生器.*或將其加入手機主畫面/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/在「你的姓」欄位輸入你的中文姓氏/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('renders back to home link', () => {
      renderGuide();
      const backLink = screen.getByRole('link', { name: /回到首頁/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/');
    });

    it('renders quick navigation section', () => {
      renderGuide();
      expect(screen.getByRole('heading', { level: 2, name: /快速導航/i })).toBeInTheDocument();
    });

    it('renders CTA button', () => {
      renderGuide();
      const ctaButton = screen.getByRole('link', { name: /開始產生日本名字/i });
      expect(ctaButton).toBeInTheDocument();
      expect(ctaButton).toHaveAttribute('href', '/');
    });
  });

  describe('FAQ Section', () => {
    it('renders FAQ heading', () => {
      renderGuide();
      expect(screen.getByRole('heading', { level: 2, name: /常見問題/i })).toBeInTheDocument();
    });

    it('renders FAQ questions', () => {
      renderGuide();
      expect(screen.getByText(/為什麼我的姓氏找不到對應的日文姓氏/i)).toBeInTheDocument();
      expect(screen.getByText(/諧音梗名字是怎麼產生的/i)).toBeInTheDocument();
      expect(screen.getByText(/自訂的諧音梗名字會保存在哪裡/i)).toBeInTheDocument();
      expect(screen.getByText(/可以用這個名字當作正式的日本名字嗎/i)).toBeInTheDocument();
    });
  });

  describe('SEO & Accessibility', () => {
    it('renders with proper heading hierarchy', () => {
      renderGuide();
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      const h3s = screen.getAllByRole('heading', { level: 3 });

      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBeGreaterThanOrEqual(2); // 快速導航 + 常見問題
      expect(h3s.length).toBe(8); // 8 個步驟標題
    });

    it('renders step anchors for quick navigation', () => {
      renderGuide();
      for (let i = 1; i <= 8; i++) {
        const anchor = document.getElementById(`step-${i}`);
        expect(anchor).toBeInTheDocument();
      }
    });
  });
});
