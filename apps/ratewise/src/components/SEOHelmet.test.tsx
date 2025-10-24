import { render, cleanup, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { afterEach, describe, expect, it } from 'vitest';
import { SEOHelmet } from './SEOHelmet';

const renderWithHelmet = (props: Partial<Parameters<typeof SEOHelmet>[0]> = {}) =>
  render(
    <HelmetProvider>
      <SEOHelmet {...props} />
    </HelmetProvider>,
  );

describe('SEOHelmet', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders default canonical URL and keywords', async () => {
    renderWithHelmet();

    await waitFor(() => {
      const canonical = document.head.querySelector('link[rel="canonical"]');
      expect(canonical?.getAttribute('href')).toBe('https://app.haotool.org/ratewise/');
    });

    const keywordMeta = document.head.querySelector('meta[name="keywords"]');
    expect(keywordMeta?.getAttribute('content')).toContain('匯率換算');

    const ogLocale = document.head.querySelector('meta[property="og:locale"]');
    expect(ogLocale?.getAttribute('content')).toBe('zh_TW');

    const jsonLdScripts = Array.from(
      document.head.querySelectorAll('script[type="application/ld+json"]'),
    ).map((node) => JSON.parse(node.textContent ?? '{}') as Record<string, unknown>);

    expect(jsonLdScripts.some((schema) => schema['@type'] === 'WebApplication')).toBe(true);
    expect(jsonLdScripts.some((schema) => schema['@type'] === 'Organization')).toBe(true);
    expect(jsonLdScripts.some((schema) => schema['@type'] === 'WebSite')).toBe(true);
  });

  it('supports custom pathname, alternates, FAQ and JSON-LD data', async () => {
    renderWithHelmet({
      pathname: '/faq',
      locale: 'en-US',
      keywords: ['exchange rates', 'currency', 'calculator'],
      alternates: [
        { hrefLang: 'x-default', href: 'https://app.haotool.org/ratewise/' },
        { hrefLang: 'en-US', href: 'https://app.haotool.org/ratewise/en-us' },
      ],
      updatedTime: '2025-10-18T03:00:00.000Z',
      faq: [
        {
          question: 'How do I convert currency?',
          answer: 'Enter the amount and choose currencies to convert automatically.',
        },
      ],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://app.haotool.org/ratewise/',
          },
        ],
      },
    });

    await waitFor(() => {
      const canonical = document.head.querySelector('link[rel="canonical"]');
      expect(canonical?.getAttribute('href')).toBe('https://app.haotool.org/ratewise/faq');
    });

    const alternate = document.head.querySelector('link[rel="alternate"][hreflang="en-US"]');
    expect(alternate?.getAttribute('href')).toBe('https://app.haotool.org/ratewise/en-us');

    const updated = document.head.querySelector('meta[property="og:updated_time"]');
    expect(updated?.getAttribute('content')).toBe('2025-10-18T03:00:00.000Z');

    const locale = document.head.querySelector('meta[property="og:locale"]');
    expect(locale?.getAttribute('content')).toBe('en_US');

    const jsonLdScripts = Array.from(
      document.head.querySelectorAll('script[type="application/ld+json"]'),
    ).map((node) => JSON.parse(node.textContent ?? '{}') as Record<string, unknown>);
    const hasFaqSchema = jsonLdScripts.some((schema) => schema['@type'] === 'FAQPage');
    const hasBreadcrumb = jsonLdScripts.some((schema) => schema['@type'] === 'BreadcrumbList');

    expect(hasFaqSchema).toBe(true);
    expect(hasBreadcrumb).toBe(true);
  });
});
