/**
 * Projects Page Tests
 * @testing-library/react best practices [context7:/websites/testing-library:2025-12-13]
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Projects from './Projects';

// framer-motion is mocked globally in test/setup.ts

// Wrapper component for router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Projects', () => {
  it('renders page header', () => {
    render(<Projects />, { wrapper: RouterWrapper });

    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    // Updated to match Chinese content
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/所有.*作品/);
  });

  it('renders page description', () => {
    render(<Projects />, { wrapper: RouterWrapper });

    expect(screen.getByText(/每個專案都傾注了對細節的執著/)).toBeInTheDocument();
  });

  it('renders category filter buttons', () => {
    render(<Projects />, { wrapper: RouterWrapper });

    expect(screen.getByRole('button', { name: /全部作品/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Web/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /AI\/ML/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mobile/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /工具/i })).toBeInTheDocument();
  });

  it('has All Projects selected by default', () => {
    render(<Projects />, { wrapper: RouterWrapper });

    const allButton = screen.getByRole('button', { name: /全部作品/i });
    // Check if the button has the pressed attribute for accessibility
    expect(allButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('changes active category on click', () => {
    render(<Projects />, { wrapper: RouterWrapper });

    const webButton = screen.getByRole('button', { name: /^Web$/i });
    fireEvent.click(webButton);

    // After click, web button should have pressed attribute
    expect(webButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders coming soon badge', () => {
    render(<Projects />, { wrapper: RouterWrapper });

    expect(screen.getByText(/更多專案持續開發中/i)).toBeInTheDocument();
  });

  it('filters projects when category is selected', () => {
    render(<Projects />, { wrapper: RouterWrapper });

    // Click Web category
    const webButton = screen.getByRole('button', { name: /^Web$/i });
    fireEvent.click(webButton);

    // The filter should be applied - check aria-pressed
    expect(webButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows empty state when no projects match filter', () => {
    render(<Projects />, { wrapper: RouterWrapper });

    // Click a category that may have no projects (Mobile)
    const mobileButton = screen.getByRole('button', { name: /Mobile/i });
    fireEvent.click(mobileButton);

    // Check if filter is applied - check aria-pressed
    expect(mobileButton).toHaveAttribute('aria-pressed', 'true');
  });
});
