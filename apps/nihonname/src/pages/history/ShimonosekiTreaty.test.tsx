/**
 * ShimonosekiTreaty Page Test
 * [BDD: Green Light - Test Implementation]
 * [Created: 2025-12-04]
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ShimonosekiTreaty from './ShimonosekiTreaty';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <HelmetProvider>
      <MemoryRouter>{component}</MemoryRouter>
    </HelmetProvider>,
  );
};

describe('ShimonosekiTreaty Page - SEO FAQ', () => {
  describe('Basic Rendering', () => {
    it('renders main heading', () => {
      renderWithProviders(<ShimonosekiTreaty />);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('馬關條約歷史');
    });

    it('renders subtitle', () => {
      renderWithProviders(<ShimonosekiTreaty />);
      expect(screen.getByText('台灣割讓與日本殖民統治的開端')).toBeInTheDocument();
    });

    it('renders year badge', () => {
      renderWithProviders(<ShimonosekiTreaty />);
      expect(screen.getByText('1895年4月17日')).toBeInTheDocument();
    });
  });

  describe('Quick Stats Section', () => {
    it('renders 1895 year', () => {
      renderWithProviders(<ShimonosekiTreaty />);
      expect(screen.getByText('1895')).toBeInTheDocument();
    });

    it('renders 下關 location', () => {
      renderWithProviders(<ShimonosekiTreaty />);
      expect(screen.getByText('下關')).toBeInTheDocument();
    });

    it('renders 2億兩 reparation', () => {
      renderWithProviders(<ShimonosekiTreaty />);
      expect(screen.getByText('2億兩')).toBeInTheDocument();
    });

    it('renders 50年 colonial period', () => {
      renderWithProviders(<ShimonosekiTreaty />);
      expect(screen.getByText('50年')).toBeInTheDocument();
    });
  });

  describe('Myth Buster Section', () => {
    it('renders myth buster heading', () => {
      renderWithProviders(<ShimonosekiTreaty />);
      expect(screen.getByText(/破解迷思/)).toBeInTheDocument();
    });

    it('renders myth buster content about 馬關續約', () => {
      renderWithProviders(<ShimonosekiTreaty />);
      // Use getAllByText since the text appears in both myth buster section and FAQ
      const elements = screen.getAllByText(/馬關條約強制續約/);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('FAQ Section', () => {
    it('renders FAQ heading', () => {
      renderWithProviders(<ShimonosekiTreaty />);
      expect(screen.getByText('常見問題')).toBeInTheDocument();
    });

    it('renders first FAQ question', () => {
      renderWithProviders(<ShimonosekiTreaty />);
      expect(screen.getByText('什麼是馬關條約？')).toBeInTheDocument();
    });

    it('renders question about myth', () => {
      renderWithProviders(<ShimonosekiTreaty />);
      expect(screen.getByText('什麼是「馬關條約強制續約」或「馬關續約」？')).toBeInTheDocument();
    });
  });

  describe('Timeline Section', () => {
    it('renders timeline heading', () => {
      renderWithProviders(<ShimonosekiTreaty />);
      expect(screen.getByText('重要時間軸')).toBeInTheDocument();
    });

    it('renders 甲午戰爭 event', () => {
      renderWithProviders(<ShimonosekiTreaty />);
      expect(screen.getByText('甲午戰爭爆發')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('renders back to generator link', () => {
      renderWithProviders(<ShimonosekiTreaty />);
      expect(screen.getByText('返回生成器')).toBeInTheDocument();
    });

    it('renders CTA button', () => {
      renderWithProviders(<ShimonosekiTreaty />);
      expect(screen.getByText('體驗姓名變換所')).toBeInTheDocument();
    });

    it('renders related links section', () => {
      renderWithProviders(<ShimonosekiTreaty />);
      expect(screen.getByText('延伸閱讀')).toBeInTheDocument();
    });
  });

  describe('SEO & Accessibility', () => {
    it('renders with proper heading hierarchy', () => {
      renderWithProviders(<ShimonosekiTreaty />);
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      const h3s = screen.getAllByRole('heading', { level: 3 });

      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBeGreaterThan(0);
      expect(h3s.length).toBeGreaterThan(0);
    });
  });
});
