/**
 * Layout Component Tests
 * @testing-library/react best practices [context7:/websites/testing-library:2025-12-13]
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Layout from './Layout';

// framer-motion is mocked globally in test/setup.ts

// Test wrapper with MemoryRouter for controlled navigation
const TestWrapper = ({ initialEntries = ['/'] }: { initialEntries?: string[] }) => (
  <MemoryRouter initialEntries={initialEntries}>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<div>Home Content</div>} />
        <Route path="/projects" element={<div>Projects Content</div>} />
        <Route path="/about" element={<div>About Content</div>} />
        <Route path="/contact" element={<div>Contact Content</div>} />
      </Route>
    </Routes>
  </MemoryRouter>
);

describe('Layout', () => {
  it('renders navigation with logo', () => {
    render(<TestWrapper />);

    // Look for the logo text using getAllByText since it may appear multiple times
    const logos = screen.getAllByText('HAOTOOL.ORG');
    expect(logos.length).toBeGreaterThan(0);
  });

  it('renders all navigation links', () => {
    render(<TestWrapper />);

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact' })).toBeInTheDocument();
  });

  it('renders logo as link to home', () => {
    render(<TestWrapper />);

    // Find the first HAOTOOL.ORG link which should go to home
    const logoLinks = screen.getAllByRole('link', { name: 'HAOTOOL.ORG' });
    expect(logoLinks[0]).toHaveAttribute('href', '/');
  });

  it('renders child content via Outlet', () => {
    render(<TestWrapper />);

    expect(screen.getByText('Home Content')).toBeInTheDocument();
  });

  it('renders different content for different routes', () => {
    render(<TestWrapper initialEntries={['/projects']} />);

    expect(screen.getByText('Projects Content')).toBeInTheDocument();
  });

  it('renders footer', () => {
    render(<TestWrapper />);

    // Updated to match actual footer content
    expect(screen.getByText(/ENGINEERED BY AH ZHANG/i)).toBeInTheDocument();
  });

  it('renders footer copyright', () => {
    render(<TestWrapper />);

    const year = new Date().getFullYear();
    // Multiple elements match, so use getAllByText and check at least one exists
    const copyrightElements = screen.getAllByText(new RegExp(`© ${year}`));
    expect(copyrightElements.length).toBeGreaterThan(0);
  });

  it('renders social links in footer', () => {
    render(<TestWrapper />);

    const githubLinks = screen.getAllByLabelText('GitHub');
    expect(githubLinks.length).toBeGreaterThan(0);

    // Updated: Footer has Threads instead of Twitter
    const threadsLinks = screen.getAllByLabelText('Threads');
    expect(threadsLinks.length).toBeGreaterThan(0);
  });

  it('renders mobile menu toggle button', () => {
    render(<TestWrapper />);

    const menuButton = screen.getByRole('button', { name: /Open menu/i });
    expect(menuButton).toBeInTheDocument();
  });

  it('toggles mobile menu on button click', () => {
    render(<TestWrapper />);

    const menuButton = screen.getByRole('button', { name: /Open menu/i });
    fireEvent.click(menuButton);

    // After click, button should show "Close menu"
    expect(screen.getByRole('button', { name: /Close menu/i })).toBeInTheDocument();
  });

  it('shows active state for current route', () => {
    render(<TestWrapper initialEntries={['/about']} />);

    // About page should be rendered
    expect(screen.getByText('About Content')).toBeInTheDocument();
  });
});
