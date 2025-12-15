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

// Mock ThreeHero component to avoid loading Three.js in tests
vi.mock('../components/ThreeHero', () => ({
  default: () => <div data-testid="three-hero-mock">3D Hero Scene</div>,
}));

import Home from './Home';

// Wrapper component for router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Home', () => {
  it('renders hero section with main heading', () => {
    render(<Home />, { wrapper: RouterWrapper });

    // Check for main heading text - using getAllByText since letters are split
    const dLetters = screen.getAllByText('D');
    expect(dLetters.length).toBeGreaterThan(0);
    const eLetters = screen.getAllByText('E');
    expect(eLetters.length).toBeGreaterThan(0);
  });

  it('renders availability badge', () => {
    render(<Home />, { wrapper: RouterWrapper });

    expect(screen.getByText('Open for Commissions')).toBeInTheDocument();
  });

  it('renders subtitle description', () => {
    render(<Home />, { wrapper: RouterWrapper });

    // Check for HAOTOOL description text - using getAllByText for individual characters
    const leftQuotes = screen.getAllByText('「');
    expect(leftQuotes.length).toBeGreaterThan(0);

    const hLetters = screen.getAllByText('H');
    expect(hLetters.length).toBeGreaterThan(0);

    const aLetters = screen.getAllByText('A');
    expect(aLetters.length).toBeGreaterThan(0);
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

    // Check for Selected Works text - using regex for partial match
    expect(screen.getByText(/Selected Works/i)).toBeInTheDocument();

    // Check for Chinese description text
    expect(screen.getByText(/結合實用性與娛樂性/)).toBeInTheDocument();
  });

  it('renders View All Projects link in featured section', () => {
    render(<Home />, { wrapper: RouterWrapper });

    // Find the Chinese link text
    const viewAllLink = screen.getByRole('link', { name: /查看所有作品/i });
    expect(viewAllLink).toBeInTheDocument();
    expect(viewAllLink).toHaveAttribute('href', '/projects');
  });
});
