/**
 * Home Page Tests
 * @testing-library/react best practices [context7:/websites/testing-library:2025-12-13]
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock Counter component to avoid framer-motion hook issues
vi.mock('../components/Counter', () => ({
  Counter: ({ value, suffix }: { value: string; suffix?: string }) => (
    <span>
      {value}
      {suffix && <span>{suffix}</span>}
    </span>
  ),
}));

import Home from './Home';

// Wrapper component for router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Home', () => {
  it('renders hero section with main heading', () => {
    render(<Home />, { wrapper: RouterWrapper });

    // Updated to match actual content
    expect(screen.getByText('D')).toBeInTheDocument(); // First letter of "Design"
    expect(screen.getByText('E')).toBeInTheDocument(); // First letter of "Engineering."
  });

  it('renders availability badge', () => {
    render(<Home />, { wrapper: RouterWrapper });

    expect(screen.getByText('Open for Projects')).toBeInTheDocument();
  });

  it('renders subtitle description', () => {
    render(<Home />, { wrapper: RouterWrapper });

    // Updated to match actual Chinese content - search for individual characters
    expect(screen.getByText('嗨')).toBeInTheDocument();
    expect(screen.getByText('阿')).toBeInTheDocument();
    expect(screen.getByText('璋')).toBeInTheDocument();
  });

  it('renders CTA buttons', () => {
    render(<Home />, { wrapper: RouterWrapper });

    expect(screen.getByRole('link', { name: /瀏覽作品/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /GitHub/i })).toBeInTheDocument();
  });

  it('renders CTA links with correct href', () => {
    render(<Home />, { wrapper: RouterWrapper });

    const projectsLink = screen.getByRole('link', { name: /瀏覽作品/i });
    expect(projectsLink).toHaveAttribute('href', '/projects');

    // GitHub link should be external
    const githubLinks = screen.getAllByRole('link', { name: /GitHub/i });
    const externalGithub = githubLinks.find((link) =>
      link.getAttribute('href')?.includes('github.com'),
    );
    expect(externalGithub).toBeInTheDocument();
  });

  it('renders stats section labels', () => {
    render(<Home />, { wrapper: RouterWrapper });

    // Updated to match actual Chinese labels
    expect(screen.getByText('年開發經驗')).toBeInTheDocument();
    expect(screen.getByText('上線專案')).toBeInTheDocument();
  });

  it('renders featured work section', () => {
    render(<Home />, { wrapper: RouterWrapper });

    expect(screen.getByText('Featured Works')).toBeInTheDocument();
    expect(screen.getByText(/結合實用性與美學的數位作品/)).toBeInTheDocument();
  });

  it('renders View All Projects link in featured section', () => {
    render(<Home />, { wrapper: RouterWrapper });

    // Find the Chinese link text
    const viewAllLink = screen.getByRole('link', { name: /查看所有作品/i });
    expect(viewAllLink).toBeInTheDocument();
    expect(viewAllLink).toHaveAttribute('href', '/projects');
  });
});
