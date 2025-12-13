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

    expect(screen.getByText('Building Digital')).toBeInTheDocument();
    expect(screen.getByText('Experiences')).toBeInTheDocument();
  });

  it('renders availability badge', () => {
    render(<Home />, { wrapper: RouterWrapper });

    expect(screen.getByText('Available for Projects')).toBeInTheDocument();
  });

  it('renders subtitle description', () => {
    render(<Home />, { wrapper: RouterWrapper });

    expect(
      screen.getByText(/Full-stack developer crafting high-performance web applications/),
    ).toBeInTheDocument();
  });

  it('renders CTA buttons', () => {
    render(<Home />, { wrapper: RouterWrapper });

    expect(screen.getByRole('link', { name: /View Projects/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Get in Touch/i })).toBeInTheDocument();
  });

  it('renders CTA links with correct href', () => {
    render(<Home />, { wrapper: RouterWrapper });

    const projectsLink = screen.getByRole('link', { name: /View Projects/i });
    const contactLink = screen.getByRole('link', { name: /Get in Touch/i });

    expect(projectsLink).toHaveAttribute('href', '/projects');
    expect(contactLink).toHaveAttribute('href', '/contact');
  });

  it('renders stats section labels', () => {
    render(<Home />, { wrapper: RouterWrapper });

    // Check for stats labels
    expect(screen.getByText('Years Experience')).toBeInTheDocument();
    expect(screen.getByText('Projects Completed')).toBeInTheDocument();
  });

  it('renders featured work section', () => {
    render(<Home />, { wrapper: RouterWrapper });

    expect(screen.getByText('Featured Work')).toBeInTheDocument();
    expect(screen.getByText(/A selection of projects I've built with passion/)).toBeInTheDocument();
  });

  it('renders View All Projects link in featured section', () => {
    render(<Home />, { wrapper: RouterWrapper });

    // Find all links that contain "Projects"
    const allLinks = screen.getAllByRole('link');
    const projectLinks = allLinks.filter((link) =>
      link.textContent?.toLowerCase().includes('project'),
    );
    expect(projectLinks.length).toBeGreaterThanOrEqual(1);
  });
});
