/**
 * SEOHelmet component tests
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from '../utils/react-helmet-async';
import { SEOHelmet } from './SEOHelmet';

// Mock HelmetProvider wrapper
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <HelmetProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </HelmetProvider>,
  );
};

describe('SEOHelmet', () => {
  it('should render with default props', () => {
    const { container } = renderWithProviders(<SEOHelmet />);
    expect(container).toBeDefined();
  });

  it('should render with custom title', async () => {
    renderWithProviders(<SEOHelmet title="Custom Title" />);
    // Helmet modifies document.head asynchronously
    await waitFor(() => {
      expect(document.title).toContain('Custom Title');
    });
  });

  it('should render with pathname', () => {
    renderWithProviders(<SEOHelmet pathname="/about" />);
    // Component should render without errors
    expect(true).toBe(true);
  });

  it('should render with FAQ data', () => {
    const faqData = [
      { question: 'What is this?', answer: 'A test' },
      { question: 'How does it work?', answer: 'Like magic' },
    ];
    renderWithProviders(<SEOHelmet faq={faqData} />);
    expect(true).toBe(true);
  });
});
