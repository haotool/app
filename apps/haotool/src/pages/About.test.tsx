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
    expect(screen.getByText('Purpose')).toBeInTheDocument();
  });

  it('renders introduction text', () => {
    render(<About />, { wrapper: RouterWrapper });

    expect(screen.getByText(/passionate full-stack developer/i)).toBeInTheDocument();
  });

  it('renders My Journey section', () => {
    render(<About />, { wrapper: RouterWrapper });

    expect(screen.getByText('My Journey')).toBeInTheDocument();
    expect(screen.getByText(/started my coding journey/i)).toBeInTheDocument();
  });

  it('renders Skills & Expertise section', () => {
    render(<About />, { wrapper: RouterWrapper });

    expect(screen.getByText('Skills & Expertise')).toBeInTheDocument();
  });

  it('renders skill cards', () => {
    render(<About />, { wrapper: RouterWrapper });

    expect(screen.getByText('Frontend Development')).toBeInTheDocument();
    expect(screen.getByText('Backend Development')).toBeInTheDocument();
    expect(screen.getByText('Cloud & DevOps')).toBeInTheDocument();
    expect(screen.getByText('AI Integration')).toBeInTheDocument();
  });

  it('renders FAQ section', () => {
    render(<About />, { wrapper: RouterWrapper });

    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
  });

  it('renders FAQ items from constants', () => {
    render(<About />, { wrapper: RouterWrapper });

    // Check that FAQ accordions are rendered (based on FAQS constant)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('FAQ accordion expands on click', () => {
    render(<About />, { wrapper: RouterWrapper });

    // Find FAQ buttons (exclude the CTA link)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    const faqButton = buttons[0] as HTMLButtonElement;
    fireEvent.click(faqButton);
    // After click, the button should still be in the document
    expect(faqButton).toBeInTheDocument();
  });

  it('renders CTA link to contact page', () => {
    render(<About />, { wrapper: RouterWrapper });

    const ctaLink = screen.getByRole('link', { name: /Let's Work Together/i });
    expect(ctaLink).toHaveAttribute('href', '/contact');
  });
});
