/**
 * JSON-LD Structured Data for SEO
 * [context7:/google/structured-data:2025-12-13]
 */

const SITE_URL = 'https://app.haotool.org';
const SITE_NAME = 'HAOTOOL.ORG';
const AUTHOR_NAME = 'HAOTOOL';

interface JsonLdBase {
  '@context': 'https://schema.org';
  '@type': string;
}

interface WebSiteJsonLd extends JsonLdBase {
  '@type': 'WebSite';
  name: string;
  url: string;
  description: string;
  author: {
    '@type': 'Person';
    name: string;
    url: string;
  };
  potentialAction?: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
}

interface PersonJsonLd extends JsonLdBase {
  '@type': 'Person';
  name: string;
  url: string;
  sameAs: string[];
  jobTitle: string;
  description: string;
}

interface WebPageJsonLd extends JsonLdBase {
  '@type': 'WebPage';
  name: string;
  description: string;
  url: string;
  dateModified: string;
  isPartOf: {
    '@type': 'WebSite';
    name: string;
    url: string;
  };
  breadcrumb?: BreadcrumbListJsonLd;
}

interface BreadcrumbListJsonLd extends JsonLdBase {
  '@type': 'BreadcrumbList';
  itemListElement: {
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }[];
}

interface CollectionPageJsonLd extends JsonLdBase {
  '@type': 'CollectionPage';
  name: string;
  description: string;
  url: string;
  mainEntity: {
    '@type': 'ItemList';
    itemListElement: {
      '@type': 'ListItem';
      position: number;
      name: string;
      url: string;
    }[];
  };
}

type JsonLd =
  | WebSiteJsonLd
  | PersonJsonLd
  | WebPageJsonLd
  | BreadcrumbListJsonLd
  | CollectionPageJsonLd;

/**
 * Route-specific metadata
 */
const ROUTE_METADATA: Record<
  string,
  {
    title: string;
    description: string;
    breadcrumbs?: { name: string; url: string }[];
  }
> = {
  '/': {
    title: 'HAOTOOL.ORG - Full-Stack Developer Portfolio',
    description:
      'Full-stack developer crafting high-performance web applications with modern technologies. Open source enthusiast and continuous learner.',
  },
  '/projects/': {
    title: 'Projects - HAOTOOL.ORG',
    description:
      'A collection of projects crafted with passion, showcasing skills in full-stack development, design, and problem-solving.',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Projects', url: '/projects/' },
    ],
  },
  '/about/': {
    title: 'About - HAOTOOL.ORG',
    description:
      'Learn about my journey as a full-stack developer, my skills, expertise, and what drives me to build great software.',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'About', url: '/about/' },
    ],
  },
  '/contact/': {
    title: 'Contact - HAOTOOL.ORG',
    description:
      "Get in touch for collaborations, freelance opportunities, or just to say hi. Let's build something amazing together.",
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Contact', url: '/contact/' },
    ],
  },
};

/**
 * Normalize route to have trailing slash
 */
function normalizeRoute(route: string): string {
  if (route === '/') return '/';
  return route.endsWith('/') ? route : `${route}/`;
}

/**
 * Generate JSON-LD for a specific route
 */
export function getJsonLdForRoute(route: string, buildTime: string): JsonLd[] {
  const normalizedRoute = normalizeRoute(route);
  const metadata = ROUTE_METADATA[normalizedRoute] ?? ROUTE_METADATA['/'];
  if (!metadata) {
    return [];
  }
  const jsonLdArray: JsonLd[] = [];

  // Always include WebSite schema on home page
  if (normalizedRoute === '/') {
    const websiteJsonLd: WebSiteJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      description: metadata.description,
      author: {
        '@type': 'Person',
        name: AUTHOR_NAME,
        url: SITE_URL,
      },
    };
    jsonLdArray.push(websiteJsonLd);

    // Add Person schema on home page
    const personJsonLd: PersonJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: AUTHOR_NAME,
      url: SITE_URL,
      sameAs: [
        'https://github.com/haotool',
        'https://twitter.com/haotool',
        'https://linkedin.com/in/haotool',
      ],
      jobTitle: 'Full-Stack Developer',
      description: metadata.description,
    };
    jsonLdArray.push(personJsonLd);
  }

  // Add WebPage schema for all pages
  const webPageJsonLd: WebPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: metadata.title,
    description: metadata.description,
    url: `${SITE_URL}${normalizedRoute}`,
    dateModified: buildTime,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  // Add breadcrumbs if available
  if (metadata.breadcrumbs && metadata.breadcrumbs.length > 0) {
    const breadcrumbJsonLd: BreadcrumbListJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: metadata.breadcrumbs.map((item, index) => ({
        '@type': 'ListItem' as const,
        position: index + 1,
        name: item.name,
        item: `${SITE_URL}${item.url}`,
      })),
    };
    webPageJsonLd.breadcrumb = breadcrumbJsonLd;
  }

  jsonLdArray.push(webPageJsonLd);

  // Add CollectionPage schema for projects page
  if (normalizedRoute === '/projects/') {
    const collectionJsonLd: CollectionPageJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Featured Projects',
      description: metadata.description,
      url: `${SITE_URL}/projects/`,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'NihonName',
            url: `${SITE_URL}/nihonname/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'RateWise',
            url: `${SITE_URL}/ratewise/`,
          },
        ],
      },
    };
    jsonLdArray.push(collectionJsonLd);
  }

  return jsonLdArray;
}

/**
 * Convert JSON-LD array to script tags
 */
export function jsonLdToScriptTags(jsonLdArray: JsonLd[]): string {
  return jsonLdArray
    .map((jsonLd) => `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`)
    .join('\n');
}
