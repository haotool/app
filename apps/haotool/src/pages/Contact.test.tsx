/**
 * Contact Page Tests
 * @testing-library/react best practices [context7:/websites/testing-library:2025-12-13]
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Contact from './Contact';

// framer-motion is mocked globally in test/setup.ts

// Wrapper component for router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Contact', () => {
  it('renders page badge', () => {
    render(<Contact />, { wrapper: RouterWrapper });

    expect(screen.getByText('Get in Touch')).toBeInTheDocument();
  });

  it('renders main heading', () => {
    render(<Contact />, { wrapper: RouterWrapper });

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Amazing')).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(<Contact />, { wrapper: RouterWrapper });

    expect(screen.getByText(/Whether you have a project in mind/i)).toBeInTheDocument();
  });

  it('renders social link cards', () => {
    render(<Contact />, { wrapper: RouterWrapper });

    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Twitter')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders GitHub link with correct href', () => {
    render(<Contact />, { wrapper: RouterWrapper });

    const githubLink = screen.getByRole('link', { name: /GitHub/i });
    expect(githubLink).toHaveAttribute('href', 'https://github.com/haotool');
  });

  it('renders Twitter link with correct href', () => {
    render(<Contact />, { wrapper: RouterWrapper });

    const twitterLink = screen.getByRole('link', { name: /Twitter/i });
    expect(twitterLink).toHaveAttribute('href', 'https://twitter.com/haotool');
  });

  it('renders LinkedIn link with correct href', () => {
    render(<Contact />, { wrapper: RouterWrapper });

    const linkedinLink = screen.getByRole('link', { name: /LinkedIn/i });
    expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/in/haotool');
  });

  it('renders Email link with correct href', () => {
    render(<Contact />, { wrapper: RouterWrapper });

    const emailLinks = screen.getAllByRole('link', {
      name: /Email|hello@haotool.org|Send me an email/i,
    });
    const mailtoLink = emailLinks.find((link) => link.getAttribute('href')?.includes('mailto'));
    expect(mailtoLink).toHaveAttribute('href', 'mailto:hello@haotool.org');
  });

  it('renders CTA section', () => {
    render(<Contact />, { wrapper: RouterWrapper });

    expect(screen.getByText('Ready to start a project?')).toBeInTheDocument();
    expect(screen.getByText(/Send me an email/i)).toBeInTheDocument();
  });
});
