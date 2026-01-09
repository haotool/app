/**
 * Home Page Tests
 * @testing-library/react best practices [context7:/websites/testing-library:2025-12-13]
 * [update:2025-12-16] - Updated to match new Home.tsx structure aligned with .example
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestBrowserRouter } from '../test/RouterWrapper';

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

// Mock MobileMenu component
vi.mock('../components/MobileMenu', () => ({
  default: () => null,
}));

// Mock TextReveal component to preserve character splitting for tests
vi.mock('../components/TextReveal', () => ({
  TextReveal: ({ text, className }: { text: string; className?: string }) => (
    <span className={className}>
      {text.split('').map((char, i) => (
        <span key={i}>{char}</span>
      ))}
    </span>
  ),
}));

// Mock SectionBackground component to avoid Three.js in tests
vi.mock('../components/SectionBackground', () => ({
  default: () => null,
}));

// Mock Toast component
vi.mock('../components/Toast', () => ({
  Toast: () => null,
}));

import Home from './Home';

describe('Home', () => {
  it('renders hero section with main heading', () => {
    render(<Home />, { wrapper: TestBrowserRouter });

    // Check for main heading text - "Design" uses TextReveal (split letters)
    const dLetters = screen.getAllByText('D');
    expect(dLetters.length).toBeGreaterThan(0);

    // "Engineering." is rendered as a single motion.span
    expect(screen.getByText('Engineering.')).toBeInTheDocument();
  });

  it('renders availability badge', () => {
    render(<Home />, { wrapper: TestBrowserRouter });

    expect(screen.getByText('Open for Commissions')).toBeInTheDocument();
  });

  it('renders subtitle description', () => {
    render(<Home />, { wrapper: TestBrowserRouter });

    // Check for haotool description text - using getAllByText for individual characters
    const leftQuotes = screen.getAllByText('「');
    expect(leftQuotes.length).toBeGreaterThan(0);

    const haotoolMentions = screen.getAllByText(/haotool/i);
    expect(haotoolMentions.length).toBeGreaterThan(0);
  });

  it('renders CTA buttons', () => {
    render(<Home />, { wrapper: TestBrowserRouter });

    // New structure uses anchor tags with href="#projects" instead of Link to="/projects"
    expect(screen.getByText('瀏覽作品')).toBeInTheDocument();

    // GitHub links - there are multiple (hero CTA + contact section + footer)
    const githubLinks = screen.getAllByRole('link', { name: /GitHub/i });
    expect(githubLinks.length).toBeGreaterThan(0);
  });

  it('renders CTA links with correct href', () => {
    render(<Home />, { wrapper: TestBrowserRouter });

    // The "瀏覽作品" button links to #projects section (not /projects page)
    const projectsLinks = screen.getAllByRole('link', { name: /瀏覽作品/i });
    expect(projectsLinks.length).toBeGreaterThan(0);
    expect(projectsLinks[0]).toHaveAttribute('href', '#projects');

    // GitHub link should be external
    const githubLinks = screen.getAllByRole('link', { name: /GitHub/i });
    const externalGithub = githubLinks.find((link) =>
      link.getAttribute('href')?.includes('github.com'),
    );
    expect(externalGithub).toBeInTheDocument();
  });

  it('renders stats section labels', () => {
    render(<Home />, { wrapper: TestBrowserRouter });

    // Updated to match actual Chinese labels
    expect(screen.getByText('年開發經驗')).toBeInTheDocument();
    expect(screen.getByText('上線專案')).toBeInTheDocument();
  });

  it('renders featured work section', () => {
    render(<Home />, { wrapper: TestBrowserRouter });

    // Check for Selected Works text - using regex for partial match
    expect(screen.getByText(/Selected Works/i)).toBeInTheDocument();

    // Check for Chinese description text
    expect(screen.getByText(/結合實用性與娛樂性/)).toBeInTheDocument();
  });

  it('renders View All Projects link in featured section', () => {
    render(<Home />, { wrapper: TestBrowserRouter });

    // Find the Chinese link text - now links to #projects section
    const viewAllLinks = screen.getAllByRole('link', { name: /查看所有作品/i });
    expect(viewAllLinks.length).toBeGreaterThan(0);
    expect(viewAllLinks[0]).toHaveAttribute('href', '#projects');
  });
});
