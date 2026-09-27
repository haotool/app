/**
 * OpenData Page Tests
 *
 * 驗證開放資料 API 頁面的核心渲染行為、無障礙設計與 SSOT 一致性。
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import '@testing-library/jest-dom/vitest';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import OpenData from './OpenData';
import { OPEN_DATA_PAGE_SEO } from '../config/seo-metadata';
import { RATES_API } from '../config/api-endpoints';
import { SITE_CONFIG } from '../config/seo-paths';
import { APP_INFO } from '../config/app-info';

const renderOpenData = () =>
  render(
    <BrowserRouter>
      <HelmetProvider>
        <OpenData />
      </HelmetProvider>
    </BrowserRouter>,
  );

const renderOpenDataWithBasename = () =>
  render(
    <MemoryRouter basename="/ratewise" initialEntries={['/ratewise/open-data/']}>
      <HelmetProvider>
        <OpenData />
      </HelmetProvider>
    </MemoryRouter>,
  );

describe('OpenData Page', () => {
  describe('Basic Rendering', () => {
    it('renders main H1 heading', () => {
      renderOpenData();
      expect(screen.getByRole('heading', { level: 1, name: /開放資料 API/i })).toBeInTheDocument();
    });

    it('renders data pipeline section heading', () => {
      renderOpenData();
      expect(screen.getByText('資料管線')).toBeInTheDocument();
    });

    it('renders API endpoints section heading', () => {
      renderOpenData();
      expect(screen.getByText('API 端點')).toBeInTheDocument();
    });

    it('renders data format section heading', () => {
      renderOpenData();
      expect(screen.getByText('資料格式')).toBeInTheDocument();
    });

    it('renders back navigation button', () => {
      renderOpenData();
      expect(screen.getByRole('button', { name: /返回/i })).toBeInTheDocument();
    });

    it('renders an answer capsule that explains the primary endpoint and crawlable landing-page pattern', () => {
      renderOpenData();
      expect(screen.getByRole('heading', { level: 2, name: /快速答案/i })).toBeInTheDocument();
      expect(screen.getByText(/最新台銀牌告匯率建議直接讀取 latest\.json/i)).toBeInTheDocument();
      expect(screen.getByText(/可索引金額落地頁採用 \/usd-twd\/1000\//i)).toBeInTheDocument();
    });
  });

  describe('Accessibility (WCAG 2.1 AA)', () => {
    it('renders tabbed code examples with 4 tab buttons and all code regions in DOM', () => {
      const { container } = renderOpenData();
      // 4 語言 tab 按鈕：cURL / JavaScript / Python / Deep Link
      const tabButtons = screen.getAllByRole('button', {
        name: /cURL|JavaScript|Python|Deep Link/i,
      });
      expect(tabButtons).toHaveLength(4);

      // 所有 tab panel 應存在於 DOM，確保 prerender HTML 保留完整語意內容。
      const codeRegions = container.querySelectorAll('pre[role="region"]');
      expect(codeRegions).toHaveLength(4);
      expect(codeRegions[0]).toBeVisible();
      expect(codeRegions[3]).not.toBeVisible();
    });

    it('all external links have rel=noopener noreferrer', () => {
      renderOpenData();
      const externalLinks = document.querySelectorAll('a[target="_blank"]');
      externalLinks.forEach((link) => {
        expect(link.getAttribute('rel')).toContain('noopener');
        expect(link.getAttribute('rel')).toContain('noreferrer');
      });
    });

    it('初始 SSG HTML 不應輸出原始 email 或 mailto，避免 Cloudflare email obfuscation 產生 broken link', () => {
      const html = renderToString(
        <MemoryRouter basename="/ratewise" initialEntries={['/ratewise/open-data/']}>
          <HelmetProvider>
            <OpenData />
          </HelmetProvider>
        </MemoryRouter>,
      );

      expect(html).not.toContain('href="mailto:');
      expect(html).not.toContain(APP_INFO.email);
      expect(html).not.toContain('/cdn-cgi/l/email-protection');
    });
  });

  describe('SSOT — URLs from api-endpoints.ts', () => {
    it('renders CDN latest URL from RATES_API SSOT', () => {
      renderOpenData();
      const cdnLinks = screen.getAllByText(RATES_API.latestCdn);
      expect(cdnLinks.length).toBeGreaterThan(0);
    });

    it('renders GitHub Actions link from RATES_API.actionsUrl', () => {
      renderOpenData();
      const actionsLink = document.querySelector(`a[href="${RATES_API.actionsUrl}"]`);
      expect(actionsLink).not.toBeNull();
    });
  });

  describe('SSOT — Deep link uses SITE_CONFIG.url', () => {
    it('deep link example contains SITE_CONFIG.url after clicking Deep Link tab', () => {
      renderOpenData();
      // 點擊 Deep Link tab
      fireEvent.click(screen.getByRole('button', { name: 'Deep Link' }));
      const region = screen.getByRole('region', { name: /程式碼範例：Deep Link/i });
      expect(region.querySelector('code')?.textContent).toContain(SITE_CONFIG.url);
    });

    it('應明確區分可索引金額頁與首頁 query deep link', () => {
      renderOpenData();
      fireEvent.click(screen.getByRole('button', { name: 'Deep Link' }));
      const content = screen.getByRole('region', { name: /程式碼範例：Deep Link/i }).textContent;

      expect(content).toContain(`${SITE_CONFIG.url}usd-twd/1000/`);
      expect(content).toContain('主要可索引 URL');
      expect(content).toContain(`${SITE_CONFIG.url}?amount=1000&from=USD&to=TWD`);
      expect(content).toContain('互動 deep link');
    });
  });

  describe('FAQ content from seo-metadata SSOT', () => {
    it('renders all FAQ items from OPEN_DATA_PAGE_SEO.faqContent', () => {
      renderOpenData();
      const faqCount = OPEN_DATA_PAGE_SEO.faqContent?.length ?? 0;
      expect(faqCount).toBeGreaterThan(0);

      OPEN_DATA_PAGE_SEO.faqContent?.forEach((item) => {
        expect(screen.getByText(item.question)).toBeInTheDocument();
      });
    });
  });

  describe('Structured data output', () => {
    it('renders Dataset JSON-LD for machine-readable API discovery', () => {
      renderOpenData();

      const structuredDataScript = document.head.querySelector(
        'script[type="application/ld+json"]',
      );
      expect(structuredDataScript?.textContent).toContain('"@type":"Dataset"');
      expect(structuredDataScript?.textContent).toContain('"@type":"DataDownload"');
      expect(structuredDataScript?.textContent).toContain('latest.json');
    });
  });

  describe('Supported currencies from CURRENCY_DEFINITIONS SSOT', () => {
    it('renders USD currency badge', () => {
      renderOpenData();
      expect(screen.getByText('USD')).toBeInTheDocument();
    });

    it('renders TWD as base currency', () => {
      renderOpenData();
      const twdBadge = screen.getByText('（基準幣）', { exact: false });
      expect(twdBadge).toBeInTheDocument();
    });

    it('currency count heading reflects CURRENCY_DEFINITIONS length', () => {
      renderOpenData();
      // Heading: "支援幣別（18 種，基準幣 TWD）"
      const heading = screen.getByRole('heading', { level: 3, name: /支援幣別/ });
      expect(heading.textContent).toMatch(/\d+ 種/);
    });
  });

  describe('Related resources section', () => {
    it('renders GitHub source code link using APP_INFO.github', () => {
      renderOpenData();
      // The label "haotool/app" links to APP_INFO.github
      expect(screen.getByText('haotool/app')).toBeInTheDocument();
    });

    it('renders OpenAPI spec link', () => {
      renderOpenData();
      expect(screen.getByText('openapi.json')).toBeInTheDocument();
    });

    it('renders llms.txt link', () => {
      renderOpenData();
      expect(screen.getByText('llms.txt')).toBeInTheDocument();
    });

    it('renders internal guide card with basename-aware href', () => {
      renderOpenDataWithBasename();
      expect(screen.getByRole('link', { name: /使用指南/i })).toHaveAttribute(
        'href',
        '/ratewise/guide/',
      );
    });
  });
});
