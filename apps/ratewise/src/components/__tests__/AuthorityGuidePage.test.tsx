/**
 * AuthorityGuidePage Component Tests
 *
 * 測試範圍：
 * 1. FAQ 內容正確渲染為可見 HTML（content quality + AEO）
 * 2. SEOHelmet 接收 jsonLd 與 faqContent props（Article + FAQPage schema）
 * 3. 回歸：確保 FAQ schema 不遺漏
 *
 * 背景：[2026-03-25] 發現 AuthorityGuidePage 未將 jsonLd 與 faqContent 傳給 SEOHelmet，
 *       導致 sell-rate-vs-mid-rate、cash-vs-spot-rate、card-rate-guide 三個頁面
 *       缺少 Article 與 FAQPage JSON-LD，影響 Google Rich Results 與 AI 引用品質。
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthorityGuidePage } from '../AuthorityGuidePage';
import type { AuthorityGuideContent } from '../../config/seo-metadata';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MOCK_PAGE: AuthorityGuideContent = {
  title: '測試指南標題',
  description: '測試描述',
  pathname: '/test-guide',
  breadcrumb: [
    { name: 'RateWise 首頁', item: '/' },
    { name: '測試', item: '/test-guide/' },
  ],
  heading: '測試指南標題',
  intro: '測試簡介文字',
  highlights: ['重點一', '重點二'],
  sections: [
    {
      title: '章節一標題',
      paragraphs: ['段落一內容'],
    },
  ],
  ctaTitle: 'CTA 標題',
  ctaDescription: 'CTA 說明',
  faqContent: [
    {
      question: '測試問題一？',
      answer: '測試答案一。',
    },
    {
      question: '測試問題二？',
      answer: '測試答案二。',
    },
  ],
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: '測試標題',
    description: '測試描述',
    url: 'https://app.haotool.org/ratewise/test-guide/',
    datePublished: '2025-01-01',
    dateModified: new Date().toISOString(),
  },
};

const MOCK_PAGE_WITHOUT_FAQ: AuthorityGuideContent = {
  ...MOCK_PAGE,
  faqContent: undefined,
  jsonLd: undefined,
};

function renderPage(page: AuthorityGuideContent) {
  return render(
    <MemoryRouter>
      <AuthorityGuidePage page={page} />
    </MemoryRouter>,
  );
}

describe('AuthorityGuidePage', () => {
  describe('FAQ 內容渲染（可見 HTML，供搜尋引擎與用戶閱讀）', () => {
    it('should render FAQ section heading when faqContent is provided', () => {
      renderPage(MOCK_PAGE);
      // FAQ section should be visible in the HTML
      expect(screen.getByRole('heading', { name: /常見問題/i })).toBeInTheDocument();
    });

    it('should render all FAQ questions as visible text', () => {
      renderPage(MOCK_PAGE);
      expect(screen.getByText('測試問題一？')).toBeInTheDocument();
      expect(screen.getByText('測試問題二？')).toBeInTheDocument();
    });

    it('should render all FAQ answers as visible text', () => {
      renderPage(MOCK_PAGE);
      expect(screen.getByText('測試答案一。')).toBeInTheDocument();
      expect(screen.getByText('測試答案二。')).toBeInTheDocument();
    });

    it('should NOT render FAQ section when faqContent is undefined', () => {
      renderPage(MOCK_PAGE_WITHOUT_FAQ);
      expect(screen.queryByRole('heading', { name: /常見問題/i })).not.toBeInTheDocument();
    });
  });

  describe('SEOHelmet props（Article + FAQPage JSON-LD 生成）', () => {
    it('AuthorityGuidePage source code must pass jsonLd prop to SEOHelmet', () => {
      // 靜態分析：確認原始碼包含 jsonLd prop 傳遞
      const src = readFileSync(resolve(__dirname, '../AuthorityGuidePage.tsx'), 'utf-8');
      expect(src).toContain('jsonLd={page.jsonLd}');
    });

    it('AuthorityGuidePage source code must pass faqContent prop to SEOHelmet', () => {
      // 靜態分析：確認原始碼包含 faqContent prop 傳遞
      const src = readFileSync(resolve(__dirname, '../AuthorityGuidePage.tsx'), 'utf-8');
      expect(src).toContain('faqContent={page.faqContent}');
    });
  });

  describe('回歸：三個指南頁面必須提供 jsonLd 與 faqContent', () => {
    it('SELL_RATE_VS_MID_RATE_PAGE should have jsonLd defined', async () => {
      const { SELL_RATE_VS_MID_RATE_PAGE } = await import('../../config/seo-metadata');
      expect(SELL_RATE_VS_MID_RATE_PAGE.jsonLd).toBeDefined();
    });

    it('SELL_RATE_VS_MID_RATE_PAGE should have faqContent with at least 1 entry', async () => {
      const { SELL_RATE_VS_MID_RATE_PAGE } = await import('../../config/seo-metadata');
      expect(SELL_RATE_VS_MID_RATE_PAGE.faqContent).toBeDefined();
      expect(SELL_RATE_VS_MID_RATE_PAGE.faqContent!.length).toBeGreaterThanOrEqual(1);
    });

    it('CASH_VS_SPOT_RATE_PAGE should have jsonLd defined', async () => {
      const { CASH_VS_SPOT_RATE_PAGE } = await import('../../config/seo-metadata');
      expect(CASH_VS_SPOT_RATE_PAGE.jsonLd).toBeDefined();
    });

    it('CASH_VS_SPOT_RATE_PAGE should have faqContent with at least 1 entry', async () => {
      const { CASH_VS_SPOT_RATE_PAGE } = await import('../../config/seo-metadata');
      expect(CASH_VS_SPOT_RATE_PAGE.faqContent).toBeDefined();
      expect(CASH_VS_SPOT_RATE_PAGE.faqContent!.length).toBeGreaterThanOrEqual(1);
    });

    it('CARD_RATE_GUIDE_PAGE should have jsonLd defined', async () => {
      const { CARD_RATE_GUIDE_PAGE } = await import('../../config/seo-metadata');
      expect(CARD_RATE_GUIDE_PAGE.jsonLd).toBeDefined();
    });

    it('CARD_RATE_GUIDE_PAGE should have faqContent with at least 1 entry', async () => {
      const { CARD_RATE_GUIDE_PAGE } = await import('../../config/seo-metadata');
      expect(CARD_RATE_GUIDE_PAGE.faqContent).toBeDefined();
      expect(CARD_RATE_GUIDE_PAGE.faqContent!.length).toBeGreaterThanOrEqual(1);
    });
  });
});
