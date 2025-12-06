/**
 * SEOHelmet component tests
 * @vitest-environment jsdom
 *
 * [fix:2025-12-06] 更新測試以反映 JSON-LD 移至 onPageRendered hook
 * - 移除 faq prop 測試 (JSON-LD 現在由 vite.config.ts 注入)
 * - 保留 meta tags 相關測試
 *
 * @see src/seo/jsonld.ts - JSON-LD 結構化數據配置
 * @see vite.config.ts - onPageRendered hook 實作
 */
import { describe, it, expect } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { TestMemoryRouter } from '../test/RouterWrapper';
import { HelmetProvider } from '../utils/helmet';
import { SEOHelmet } from './SEOHelmet';

// Mock HelmetProvider wrapper
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <HelmetProvider>
      <TestMemoryRouter>{ui}</TestMemoryRouter>
    </HelmetProvider>,
  );
};

describe('SEOHelmet', () => {
  it('should render with default props', () => {
    const { container } = renderWithProviders(<SEOHelmet />);
    expect(container).toBeDefined();
  });

  it('should render with custom title', async () => {
    renderWithProviders(<SEOHelmet title="Custom Title" />);
    // Helmet modifies document.head asynchronously
    await waitFor(() => {
      expect(document.title).toContain('Custom Title');
    });
  });

  it('should render with pathname', () => {
    renderWithProviders(<SEOHelmet pathname="/about" />);
    // Component should render without errors
    expect(true).toBe(true);
  });

  it('should render with custom description', async () => {
    const customDescription = 'This is a custom description for testing';
    renderWithProviders(<SEOHelmet description={customDescription} />);
    await waitFor(() => {
      const metaDescription = document.querySelector('meta[name="description"]');
      expect(metaDescription?.getAttribute('content')).toBe(customDescription);
    });
  });

  it('should render with custom keywords', async () => {
    const customKeywords = ['test', 'keywords', 'seo'];
    renderWithProviders(<SEOHelmet keywords={customKeywords} />);
    await waitFor(() => {
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      expect(metaKeywords?.getAttribute('content')).toBe('test, keywords, seo');
    });
  });

  it('should render with custom robots directive', async () => {
    const customRobots = 'noindex, nofollow';
    renderWithProviders(<SEOHelmet robots={customRobots} />);
    await waitFor(() => {
      const metaRobots = document.querySelector('meta[name="robots"]');
      expect(metaRobots?.getAttribute('content')).toBe(customRobots);
    });
  });
});
