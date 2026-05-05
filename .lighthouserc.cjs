const { APP_CONFIG } = require('./apps/ratewise/app.config.mjs');

const LOCAL_BASE_URL = 'http://localhost:4173';

function toLocalCanonicalUrl(path) {
  return `${LOCAL_BASE_URL}${path}`;
}

module.exports = {
  ci: {
    collect: {
      url: APP_CONFIG.lighthouseSmokePaths.map(toLocalCanonicalUrl),
      startServerCommand:
        "VITE_LHCI_OFFLINE=true VITE_RATEWISE_BASE_PATH='/' pnpm --filter @app/ratewise preview -- --port 4173 --strictPort --clearScreen false",
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 120000,
      numberOfRuns: 5,
      settings: {
        preset: 'desktop',
        onlyCategories: ['performance', 'seo', 'accessibility', 'best-practices'],
        skipAudits: ['bf-cache'],
        chromeFlags: '--no-sandbox --headless=new',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:seo': ['error', { minScore: 0.98, aggregationMethod: 'median-run' }],
        'categories:accessibility': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:best-practices': ['warn', { minScore: 0.95, aggregationMethod: 'median-run' }],

        'largest-contentful-paint': [
          'error',
          { maxNumericValue: 2500, aggregationMethod: 'median' },
        ],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1, aggregationMethod: 'median' }],
        'total-blocking-time': ['warn', { maxNumericValue: 300, aggregationMethod: 'median' }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1800, aggregationMethod: 'median' }],
        'speed-index': ['warn', { maxNumericValue: 3400, aggregationMethod: 'median' }],

        'resource-summary:script:size': [
          'warn',
          { maxNumericValue: 470000, aggregationMethod: 'median' },
        ],
        'resource-summary:stylesheet:size': [
          'warn',
          { maxNumericValue: 100000, aggregationMethod: 'median' },
        ],
        'resource-summary:total:size': [
          'warn',
          { maxNumericValue: 900000, aggregationMethod: 'median' },
        ],

        'meta-description': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'link-text': 'warn',
        'crawlable-anchors': 'warn',
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-reports/lhci',
    },
  },
};
