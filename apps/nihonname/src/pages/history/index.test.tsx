/**
 * History Index Page Test
 * [BDD: Green Light - Test Implementation]
 * [Created: 2025-12-04]
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestMemoryRouter } from '../../test/RouterWrapper';
import { HelmetProvider } from '../../utils/helmet';
import HistoryIndex from './index';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <HelmetProvider>
      <TestMemoryRouter>{component}</TestMemoryRouter>
    </HelmetProvider>,
  );
};

describe('History Index Page - SEO Landing', () => {
  describe('Basic Rendering', () => {
    it('renders main heading', () => {
      renderWithProviders(<HistoryIndex />);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('台灣日治時期歷史專區');
    });

    it('renders HISTORY badge', () => {
      renderWithProviders(<HistoryIndex />);
      expect(screen.getByText('HISTORY')).toBeInTheDocument();
    });
  });

  describe('Timeline Section', () => {
    it('renders timeline heading', () => {
      renderWithProviders(<HistoryIndex />);
      expect(screen.getByText('歷史時間軸')).toBeInTheDocument();
    });

    it('renders 1895 event', () => {
      renderWithProviders(<HistoryIndex />);
      expect(screen.getByText('馬關條約簽訂，台灣割讓日本')).toBeInTheDocument();
    });

    it('renders 1937 event', () => {
      renderWithProviders(<HistoryIndex />);
      expect(screen.getByText('皇民化運動開始')).toBeInTheDocument();
    });

    it('renders 1951 event', () => {
      renderWithProviders(<HistoryIndex />);
      expect(screen.getByText('舊金山和約簽訂')).toBeInTheDocument();
    });
  });

  describe('Article Cards Section', () => {
    it('renders article section heading', () => {
      renderWithProviders(<HistoryIndex />);
      expect(screen.getByText('專題文章')).toBeInTheDocument();
    });

    it('renders 皇民化運動 article card', () => {
      renderWithProviders(<HistoryIndex />);
      // Use getAllByText since the text appears in timeline and article card
      const elements = screen.getAllByText('皇民化運動');
      expect(elements.length).toBeGreaterThan(0);
    });

    it('renders 馬關條約 article card', () => {
      renderWithProviders(<HistoryIndex />);
      // Use getAllByText since the text appears in timeline and article card
      const elements = screen.getAllByText('馬關條約');
      expect(elements.length).toBeGreaterThan(0);
    });

    it('renders 舊金山和約 article card', () => {
      renderWithProviders(<HistoryIndex />);
      // Use getAllByText since the text appears in timeline and article card
      const elements = screen.getAllByText('舊金山和約');
      expect(elements.length).toBeGreaterThan(0);
    });

    it('renders article descriptions', () => {
      renderWithProviders(<HistoryIndex />);
      expect(screen.getByText(/深入了解日本殖民時期的同化政策/)).toBeInTheDocument();
    });
  });

  describe('External Resources Section', () => {
    it('renders external resources heading', () => {
      renderWithProviders(<HistoryIndex />);
      expect(screen.getByText('外部資源')).toBeInTheDocument();
    });

    it('renders 國史館台灣文獻館 link', () => {
      renderWithProviders(<HistoryIndex />);
      expect(screen.getByText('國史館台灣文獻館')).toBeInTheDocument();
    });

    it('renders 巴哈姆特 link', () => {
      renderWithProviders(<HistoryIndex />);
      expect(screen.getByText(/巴哈姆特/)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('renders back to generator link', () => {
      renderWithProviders(<HistoryIndex />);
      expect(screen.getByText('返回生成器')).toBeInTheDocument();
    });

    it('renders CTA button', () => {
      renderWithProviders(<HistoryIndex />);
      expect(screen.getByText('體驗姓名變換所')).toBeInTheDocument();
    });
  });

  describe('SEO & Accessibility', () => {
    it('renders with proper heading hierarchy', () => {
      renderWithProviders(<HistoryIndex />);
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });

      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBeGreaterThan(0);
    });

    it('renders article link cards', () => {
      renderWithProviders(<HistoryIndex />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(5); // Multiple navigation and article links
    });
  });
});
