/**
 * Meta Tags Generator for SEO
 * [context7:/google/seo-starter-guide:2025-12-13]
 */

const SITE_URL = 'https://app.haotool.org';
const SITE_NAME = 'HAOTOOL.ORG';
const DEFAULT_IMAGE = '/og-image.png';
const TWITTER_HANDLE = '@haotool';

/**
 * Route-specific metadata
 */
const ROUTE_METADATA: Record<
  string,
  {
    title: string;
    description: string;
    image?: string;
    type?: 'website' | 'article' | 'profile';
    keywords?: string[];
  }
> = {
  '/': {
    title: 'HAOTOOL.ORG - Full-Stack Developer Portfolio',
    description:
      'Full-stack developer crafting high-performance web applications with modern technologies. Open source enthusiast and continuous learner.',
    type: 'website',
    keywords: [
      'full-stack developer',
      'web development',
      'React',
      'TypeScript',
      'portfolio',
      'open source',
    ],
  },
  '/projects/': {
    title: 'Projects - HAOTOOL.ORG',
    description:
      'A collection of projects crafted with passion, showcasing skills in full-stack development, design, and problem-solving.',
    type: 'website',
    keywords: ['projects', 'portfolio', 'web apps', 'development'],
  },
  '/about/': {
    title: 'About - HAOTOOL.ORG',
    description:
      'Learn about my journey as a full-stack developer, my skills, expertise, and what drives me to build great software.',
    type: 'profile',
    keywords: ['about', 'developer', 'skills', 'experience'],
  },
  '/contact/': {
    title: 'Contact - HAOTOOL.ORG',
    description:
      "Get in touch for collaborations, freelance opportunities, or just to say hi. Let's build something amazing together.",
    type: 'website',
    keywords: ['contact', 'hire', 'freelance', 'collaboration'],
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
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] ?? char);
}

/**
 * Generate meta tags for a specific route
 */
export function getMetaTagsForRoute(route: string, buildTime: string): string {
  const normalizedRoute = normalizeRoute(route);
  const metadata = ROUTE_METADATA[normalizedRoute] ?? ROUTE_METADATA['/'];
  if (!metadata) {
    return '';
  }
  const canonicalUrl = `${SITE_URL}${normalizedRoute}`;
  const imageUrl = metadata.image ? `${SITE_URL}${metadata.image}` : `${SITE_URL}${DEFAULT_IMAGE}`;

  void buildTime; // Used for documentation, suppress unused warning

  const tags: string[] = [];

  // Basic Meta Tags
  tags.push(`<meta name="description" content="${escapeHtml(metadata.description)}" />`);

  if (metadata.keywords && metadata.keywords.length > 0) {
    tags.push(`<meta name="keywords" content="${metadata.keywords?.join(', ') ?? ''}" />`);
  }

  tags.push(`<meta name="author" content="${SITE_NAME}" />`);
  tags.push(`<meta name="robots" content="index, follow" />`);
  tags.push(`<meta name="googlebot" content="index, follow" />`);

  // Canonical URL
  tags.push(`<link rel="canonical" href="${canonicalUrl}" />`);

  // Open Graph Tags
  tags.push(`<meta property="og:type" content="${metadata.type ?? 'website'}" />`);
  tags.push(`<meta property="og:site_name" content="${SITE_NAME}" />`);
  tags.push(`<meta property="og:title" content="${escapeHtml(metadata.title)}" />`);
  tags.push(`<meta property="og:description" content="${escapeHtml(metadata.description)}" />`);
  tags.push(`<meta property="og:url" content="${canonicalUrl}" />`);
  tags.push(`<meta property="og:image" content="${imageUrl}" />`);
  tags.push(`<meta property="og:image:width" content="1200" />`);
  tags.push(`<meta property="og:image:height" content="630" />`);
  tags.push(`<meta property="og:locale" content="en_US" />`);

  // Twitter Card Tags
  tags.push(`<meta name="twitter:card" content="summary_large_image" />`);
  tags.push(`<meta name="twitter:site" content="${TWITTER_HANDLE}" />`);
  tags.push(`<meta name="twitter:creator" content="${TWITTER_HANDLE}" />`);
  tags.push(`<meta name="twitter:title" content="${escapeHtml(metadata.title)}" />`);
  tags.push(`<meta name="twitter:description" content="${escapeHtml(metadata.description)}" />`);
  tags.push(`<meta name="twitter:image" content="${imageUrl}" />`);

  // Additional Meta Tags
  tags.push(`<meta name="theme-color" content="#6366f1" />`);
  tags.push(`<meta name="apple-mobile-web-app-capable" content="yes" />`);
  tags.push(`<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`);
  tags.push(`<meta name="format-detection" content="telephone=no" />`);

  // Last Modified
  tags.push(`<meta http-equiv="last-modified" content="${buildTime}" />`);

  return tags.join('\n');
}
