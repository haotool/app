/**
 * FAQ Page Tests
 * [Created: 2025-12-05]
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestMemoryRouter } from '../test/RouterWrapper';
import { HelmetProvider } from '../utils/helmet';
import FAQ from './FAQ';

// Mock SEOHelmet
vi.mock('../components/SEOHelmet', () => ({
  SEOHelmet: ({ title }: { title: string }) => <title>{title}</title>,
}));

const renderFAQ = () => {
  return render(
    <HelmetProvider>
      <TestMemoryRouter>
        <FAQ />
      </TestMemoryRouter>
    </HelmetProvider>,
  );
};

describe('FAQ Page', () => {
  it('should render the page title', () => {
    renderFAQ();
    expect(screen.getByRole('heading', { level: 1, name: '常見問題' })).toBeInTheDocument();
  });

  it('should render all FAQ categories', () => {
    renderFAQ();
    // 使用 getAllByText 因為類別名稱在導航和區塊標題中都出現
    expect(screen.getAllByText('歷史背景').length).toBeGreaterThan(0);
    expect(screen.getAllByText('使用方法').length).toBeGreaterThan(0);
    expect(screen.getAllByText('資料來源').length).toBeGreaterThan(0);
  });

  it('should render quick navigation links', () => {
    renderFAQ();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    // 使用 getAllByRole 因為有多個相同名稱的連結
    expect(screen.getAllByRole('link', { name: /歷史背景/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /使用方法/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /資料來源/i }).length).toBeGreaterThan(0);
  });

  it('should render FAQ questions', () => {
    renderFAQ();
    expect(screen.getByText('什麼是皇民化運動？')).toBeInTheDocument();
    expect(screen.getByText('改姓是強制的嗎？')).toBeInTheDocument();
    expect(screen.getByText('如何使用日本名字產生器？')).toBeInTheDocument();
    expect(screen.getByText('資料來源是什麼？')).toBeInTheDocument();
  });

  it('should render back link to home', () => {
    renderFAQ();
    const backLink = screen.getByRole('link', { name: /返回生成器/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/');
  });

  it('should render related links section', () => {
    renderFAQ();
    expect(screen.getByText('相關頁面')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /使用指南/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /關於本站/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /歷史專區/i })).toBeInTheDocument();
  });

  it('should render CTA button', () => {
    renderFAQ();
    const ctaButton = screen.getByRole('link', { name: /開始產生日本名字/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveAttribute('href', '/');
  });

  it('should render footer with copyright', () => {
    renderFAQ();
    expect(screen.getByText(/本系統僅供歷史教育與娛樂用途/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(new Date().getFullYear().toString()))).toBeInTheDocument();
  });

  it('should have correct number of FAQ items', () => {
    renderFAQ();
    // 歷史背景: 4, 使用方法: 5, 資料來源: 5, 隱私與技術: 3 = 17 total
    const details = screen.getAllByRole('group');
    expect(details.length).toBe(17);
  });
});
