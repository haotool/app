/**
 * SanFranciscoTreaty Page Test
 * [BDD: Green Light - Test Implementation]
 * [Created: 2025-12-04]
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from '../../utils/helmet';
import SanFranciscoTreaty from './SanFranciscoTreaty';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <HelmetProvider>
      <MemoryRouter>{component}</MemoryRouter>
    </HelmetProvider>,
  );
};

describe('SanFranciscoTreaty Page - SEO FAQ', () => {
  describe('Basic Rendering', () => {
    it('renders main heading', () => {
      renderWithProviders(<SanFranciscoTreaty />);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('舊金山和約歷史');
    });

    it('renders subtitle', () => {
      renderWithProviders(<SanFranciscoTreaty />);
      expect(screen.getByText('台灣地位與日本放棄主權的法律依據')).toBeInTheDocument();
    });

    it('renders year badge', () => {
      renderWithProviders(<SanFranciscoTreaty />);
      expect(screen.getByText('1951年9月8日')).toBeInTheDocument();
    });
  });

  describe('Quick Stats Section', () => {
    it('renders 1951 year', () => {
      renderWithProviders(<SanFranciscoTreaty />);
      expect(screen.getByText('1951')).toBeInTheDocument();
    });

    it('renders 舊金山 location', () => {
      renderWithProviders(<SanFranciscoTreaty />);
      expect(screen.getByText('舊金山')).toBeInTheDocument();
    });

    it('renders 48國 signatories', () => {
      renderWithProviders(<SanFranciscoTreaty />);
      expect(screen.getByText('48國')).toBeInTheDocument();
    });

    it('renders 第2條 article', () => {
      renderWithProviders(<SanFranciscoTreaty />);
      expect(screen.getByText('第2條')).toBeInTheDocument();
    });
  });

  describe('Key Point Section', () => {
    it('renders treaty article 2 quote', () => {
      renderWithProviders(<SanFranciscoTreaty />);
      expect(screen.getByText(/Japan renounces all right/)).toBeInTheDocument();
    });

    it('renders Chinese translation', () => {
      renderWithProviders(<SanFranciscoTreaty />);
      // Use getAllByText since the text appears in both key point section and FAQ
      const elements = screen.getAllByText(/日本放棄對台灣及澎湖列島的一切權利/);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('FAQ Section', () => {
    it('renders FAQ heading', () => {
      renderWithProviders(<SanFranciscoTreaty />);
      expect(screen.getByText('常見問題')).toBeInTheDocument();
    });

    it('renders first FAQ question', () => {
      renderWithProviders(<SanFranciscoTreaty />);
      expect(screen.getByText('什麼是舊金山和約？')).toBeInTheDocument();
    });

    it('renders question about Taiwan status', () => {
      renderWithProviders(<SanFranciscoTreaty />);
      expect(screen.getByText('什麼是「台灣地位未定論」？')).toBeInTheDocument();
    });

    it('renders question about ROC not signing', () => {
      renderWithProviders(<SanFranciscoTreaty />);
      expect(screen.getByText('為什麼中華民國沒有簽署舊金山和約？')).toBeInTheDocument();
    });
  });

  describe('Timeline Section', () => {
    it('renders timeline heading', () => {
      renderWithProviders(<SanFranciscoTreaty />);
      expect(screen.getByText('相關時間軸')).toBeInTheDocument();
    });

    it('renders 日本投降 event', () => {
      renderWithProviders(<SanFranciscoTreaty />);
      expect(screen.getByText('日本投降')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('renders back to generator link', () => {
      renderWithProviders(<SanFranciscoTreaty />);
      expect(screen.getByText('返回生成器')).toBeInTheDocument();
    });

    it('renders CTA button', () => {
      renderWithProviders(<SanFranciscoTreaty />);
      expect(screen.getByText('體驗姓名變換所')).toBeInTheDocument();
    });

    it('renders related links section', () => {
      renderWithProviders(<SanFranciscoTreaty />);
      expect(screen.getByText('延伸閱讀')).toBeInTheDocument();
    });
  });

  describe('SEO & Accessibility', () => {
    it('renders with proper heading hierarchy', () => {
      renderWithProviders(<SanFranciscoTreaty />);
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      const h3s = screen.getAllByRole('heading', { level: 3 });

      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBeGreaterThan(0);
      expect(h3s.length).toBeGreaterThan(0);
    });
  });
});
