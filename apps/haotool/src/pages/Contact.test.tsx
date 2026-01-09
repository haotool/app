/**
 * Contact Page Tests
 * @testing-library/react best practices [context7:/websites/testing-library:2025-12-13]
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestBrowserRouter } from '../test/RouterWrapper';
import Contact from './Contact';

// framer-motion is mocked globally in test/setup.ts

describe('Contact', () => {
  it('renders page badge', () => {
    render(<Contact />, { wrapper: TestBrowserRouter });

    expect(screen.getByText('Get in Touch')).toBeInTheDocument();
  });

  it('renders main heading', () => {
    render(<Contact />, { wrapper: TestBrowserRouter });

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText('聯繫')).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(<Contact />, { wrapper: TestBrowserRouter });

    expect(screen.getByText(/有問題或想法想討論/i)).toBeInTheDocument();
  });

  it('renders social link cards', () => {
    render(<Contact />, { wrapper: TestBrowserRouter });

    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Threads')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders GitHub link with correct href', () => {
    render(<Contact />, { wrapper: TestBrowserRouter });

    const githubLink = screen.getByRole('link', { name: /Open GitHub/i });
    expect(githubLink).toHaveAttribute('href', 'https://github.com/haotool/app');
  });

  it('renders Threads link with correct href', () => {
    render(<Contact />, { wrapper: TestBrowserRouter });

    const threadsLink = screen.getByRole('link', { name: /Open Threads/i });
    expect(threadsLink).toHaveAttribute('href', 'https://www.threads.net/@azlife_1224');
  });

  it('renders Email with copy button', () => {
    render(<Contact />, { wrapper: TestBrowserRouter });

    const copyButton = screen.getByRole('button', { name: /Copy Email/i });
    expect(copyButton).toBeInTheDocument();
  });

  it('renders footer note', () => {
    render(<Contact />, { wrapper: TestBrowserRouter });

    expect(screen.getByText(/通常會在 24 小時內回覆/i)).toBeInTheDocument();
  });
});
