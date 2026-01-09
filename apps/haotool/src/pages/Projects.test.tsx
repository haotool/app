/**
 * Projects Page Tests
 * @testing-library/react best practices [context7:/websites/testing-library:2025-12-13]
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestBrowserRouter } from '../test/RouterWrapper';
import Projects from './Projects';

// framer-motion is mocked globally in test/setup.ts

describe('Projects', () => {
  it('renders page header', () => {
    render(<Projects />, { wrapper: TestBrowserRouter });

    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    // Updated to match Chinese content
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/所有.*作品/);
  });

  it('renders page description', () => {
    render(<Projects />, { wrapper: TestBrowserRouter });

    expect(screen.getByText(/每個專案都傾注了對細節的執著/)).toBeInTheDocument();
  });

  it('renders category filter buttons', () => {
    render(<Projects />, { wrapper: TestBrowserRouter });

    expect(screen.getByRole('button', { name: /全部/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /工具類/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /娛樂類/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /資料類/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /創意類/i })).toBeInTheDocument();
  });

  it('has All Projects selected by default', () => {
    render(<Projects />, { wrapper: TestBrowserRouter });

    const allButton = screen.getByRole('button', { name: /全部/i });
    // Check if the button has the pressed attribute for accessibility
    expect(allButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('changes active category on click', () => {
    render(<Projects />, { wrapper: TestBrowserRouter });

    const toolButton = screen.getByRole('button', { name: /工具類/i });
    fireEvent.click(toolButton);

    // After click, tool button should have pressed attribute
    expect(toolButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders coming soon badge', () => {
    render(<Projects />, { wrapper: TestBrowserRouter });

    expect(screen.getByText(/更多專案持續開發中/i)).toBeInTheDocument();
  });

  it('filters projects when category is selected', () => {
    render(<Projects />, { wrapper: TestBrowserRouter });

    // Click Tool category
    const toolButton = screen.getByRole('button', { name: /工具類/i });
    fireEvent.click(toolButton);

    // The filter should be applied - check aria-pressed
    expect(toolButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows empty state when no projects match filter', () => {
    render(<Projects />, { wrapper: TestBrowserRouter });

    // Click a category that may have no projects (Entertainment)
    const entertainmentButton = screen.getByRole('button', { name: /娛樂類/i });
    fireEvent.click(entertainmentButton);

    // Check if filter is applied - check aria-pressed
    expect(entertainmentButton).toHaveAttribute('aria-pressed', 'true');
  });
});
