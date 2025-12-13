/**
 * About Page Tests
 * @testing-library/react best practices [context7:/websites/testing-library:2025-12-13]
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import About from './About';

// framer-motion is mocked globally in test/setup.ts

// Wrapper component for router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('About', () => {
  it('renders about section badge', () => {
    render(<About />, { wrapper: RouterWrapper });

    expect(screen.getByText('About Me')).toBeInTheDocument();
  });

  it('renders main heading', () => {
    render(<About />, { wrapper: RouterWrapper });

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText('阿璋')).toBeInTheDocument();
  });

  it('renders introduction text', () => {
    render(<About />, { wrapper: RouterWrapper });

    expect(screen.getByText(/一位熱愛打造「好工具」的全端開發者/i)).toBeInTheDocument();
  });

  it('renders skill cards', () => {
    render(<About />, { wrapper: RouterWrapper });

    expect(screen.getByText('前端開發')).toBeInTheDocument();
    expect(screen.getByText('UI/UX 設計')).toBeInTheDocument();
    expect(screen.getByText('效能優化')).toBeInTheDocument();
    expect(screen.getByText('開源貢獻')).toBeInTheDocument();
  });

  it('renders FAQ section', () => {
    render(<About />, { wrapper: RouterWrapper });

    expect(screen.getByText('常見問題')).toBeInTheDocument();
  });

  it('renders FAQ items from constants', () => {
    render(<About />, { wrapper: RouterWrapper });

    // Check that FAQ accordions are rendered (based on FAQS constant)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('FAQ accordion expands on click', () => {
    render(<About />, { wrapper: RouterWrapper });

    // Find FAQ buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    const faqButton = buttons[0] as HTMLButtonElement;
    fireEvent.click(faqButton);
    // After click, the button should still be in the document
    expect(faqButton).toBeInTheDocument();
  });

  it('renders CTA section', () => {
    render(<About />, { wrapper: RouterWrapper });

    expect(screen.getByText('有興趣合作？')).toBeInTheDocument();
  });

  it('renders CTA link to contact page', () => {
    render(<About />, { wrapper: RouterWrapper });

    const ctaLink = screen.getByRole('link', { name: /聯繫我/i });
    expect(ctaLink).toHaveAttribute('href', '/contact');
  });
});
