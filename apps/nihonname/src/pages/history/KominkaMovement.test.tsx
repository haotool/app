/**
 * KominkaMovement Page Test
 * [BDD: Green Light - Test Implementation]
 * [Created: 2025-12-04]
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestMemoryRouter } from '../../test/RouterWrapper';
import { HelmetProvider } from '../../utils/helmet';
import KominkaMovement from './KominkaMovement';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <HelmetProvider>
      <TestMemoryRouter>{component}</TestMemoryRouter>
    </HelmetProvider>,
  );
};

describe('KominkaMovement Page - SEO FAQ', () => {
  describe('Basic Rendering', () => {
    it('renders main heading', () => {
      renderWithProviders(<KominkaMovement />);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('皇民化運動歷史');
    });

    it('renders subtitle', () => {
      renderWithProviders(<KominkaMovement />);
      expect(screen.getByText('台灣改姓名運動完整解析')).toBeInTheDocument();
    });

    it('renders year badge', () => {
      renderWithProviders(<KominkaMovement />);
      expect(screen.getByText('1937-1945')).toBeInTheDocument();
    });
  });

  describe('Quick Stats Section', () => {
    it('renders 8年 duration', () => {
      renderWithProviders(<KominkaMovement />);
      expect(screen.getByText('8年')).toBeInTheDocument();
    });

    it('renders 7.6% adoption rate', () => {
      renderWithProviders(<KominkaMovement />);
      expect(screen.getByText('7.6%')).toBeInTheDocument();
    });

    it('renders 17萬 households', () => {
      renderWithProviders(<KominkaMovement />);
      expect(screen.getByText('17萬')).toBeInTheDocument();
    });

    it('renders 3種 principles', () => {
      renderWithProviders(<KominkaMovement />);
      expect(screen.getByText('3種')).toBeInTheDocument();
    });
  });

  describe('FAQ Section', () => {
    it('renders FAQ heading', () => {
      renderWithProviders(<KominkaMovement />);
      expect(screen.getByText('常見問題')).toBeInTheDocument();
    });

    it('renders first FAQ question', () => {
      renderWithProviders(<KominkaMovement />);
      expect(screen.getByText('什麼是皇民化運動？')).toBeInTheDocument();
    });

    it('renders question about forced name change', () => {
      renderWithProviders(<KominkaMovement />);
      expect(screen.getByText('改姓名（改日本姓）是強制的嗎？')).toBeInTheDocument();
    });

    it('renders question about name change principles', () => {
      renderWithProviders(<KominkaMovement />);
      expect(screen.getByText('改姓的原則是什麼？')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('renders back to generator link', () => {
      renderWithProviders(<KominkaMovement />);
      expect(screen.getByText('返回生成器')).toBeInTheDocument();
    });

    it('renders CTA button', () => {
      renderWithProviders(<KominkaMovement />);
      expect(screen.getByText('體驗姓名變換所')).toBeInTheDocument();
    });

    it('renders related links section', () => {
      renderWithProviders(<KominkaMovement />);
      expect(screen.getByText('延伸閱讀')).toBeInTheDocument();
    });
  });

  describe('SEO & Accessibility', () => {
    it('renders with proper heading hierarchy', () => {
      renderWithProviders(<KominkaMovement />);
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      const h3s = screen.getAllByRole('heading', { level: 3 });

      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBeGreaterThan(0);
      expect(h3s.length).toBeGreaterThan(0);
    });

    it('renders article elements for FAQ items', () => {
      renderWithProviders(<KominkaMovement />);
      const articles = screen.getAllByRole('article');
      expect(articles.length).toBeGreaterThan(0);
    });
  });
});
