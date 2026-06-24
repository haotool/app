import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { POPULAR_FROM_TWD_LINKS, POPULAR_TO_TWD_LINKS } from '../../config/popular-currency-links';
import { HomepageSEOSection } from '../HomepageSEOSection';

describe('HomepageSEOSection', () => {
  it('labels the section with its own heading instead of the app shell heading', () => {
    const { container } = render(
      <MemoryRouter>
        <HomepageSEOSection />
      </MemoryRouter>,
    );

    const section = container.querySelector('section');
    const heading = container.querySelector('#homepage-seo-section-heading');

    expect(section).toHaveAttribute('aria-labelledby', 'homepage-seo-section-heading');
    expect(heading).toHaveTextContent('即時匯率換算');
  });

  it('renders popular currency links from the shared SSOT', () => {
    render(
      <MemoryRouter>
        <HomepageSEOSection />
      </MemoryRouter>,
    );

    for (const link of [...POPULAR_TO_TWD_LINKS, ...POPULAR_FROM_TWD_LINKS]) {
      expect(screen.getByRole('link', { name: link.label })).toHaveAttribute('href', link.href);
    }
  });
});
