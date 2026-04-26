export const CONTENT_LASTMOD_POLICY = {
  '/': {
    type: 'homepage',
    contentFiles: [
      'apps/ratewise/src/features/ratewise/RateWise.tsx',
      'apps/ratewise/src/components/HomepageSEOSection.tsx',
      'apps/ratewise/src/config/seo-metadata.ts',
    ],
    fallbackDate: '2026-04-26',
  },
  '/faq/': {
    type: 'editorial',
    contentFiles: ['apps/ratewise/src/pages/FAQ.tsx', 'apps/ratewise/src/config/seo-metadata.ts'],
    fallbackDate: '2026-04-23',
  },
  '/about/': {
    type: 'trust',
    contentFiles: ['apps/ratewise/src/pages/About.tsx', 'apps/ratewise/src/config/seo-metadata.ts'],
    fallbackDate: '2026-04-23',
  },
  '/guide/': {
    type: 'editorial',
    contentFiles: ['apps/ratewise/src/pages/Guide.tsx', 'apps/ratewise/src/config/seo-metadata.ts'],
    fallbackDate: '2026-04-23',
  },
  '/open-data/': {
    type: 'developer-doc',
    contentFiles: [
      'apps/ratewise/src/pages/OpenData.tsx',
      'apps/ratewise/src/config/api-endpoints.ts',
      'apps/ratewise/src/config/seo-metadata.ts',
    ],
    fallbackDate: '2026-04-23',
  },
  '/seo-tech/': {
    type: 'public-disclosure',
    contentFiles: [
      'apps/ratewise/src/pages/SeoTech.tsx',
      'apps/ratewise/src/config/seo-schema-registry.ts',
      'apps/ratewise/src/config/seo-build-pipeline.ts',
    ],
    fallbackDate: '2026-04-26',
  },
} as const;

export const RATE_PAGE_LASTMOD_POLICY = {
  source: 'apps/ratewise/src/config/generated/seo-rate-examples.ts',
  appliesTo: ['currency', 'amount'] as const,
  reason: 'visible rate example + ExchangeRateSpecification schema',
} as const;
