/**
 * Generate sitemap.xml for NihonName
 * Run before build to ensure sitemap is up-to-date
 *
 * Features:
 * - Dynamic lastmod based on actual file modification time
 * - Fallback to build date if file not found
 * - Hreflang support for i18n
 */
import { writeFileSync, statSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE_URL = 'https://app.haotool.org/nihonname';
const TODAY = new Date().toISOString().split('T')[0];

/**
 * Get file last modification date
 * @param {string} pagePath - URL path (e.g., '/faq', '/history/kominka')
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
function getPageLastMod(pagePath) {
  // Map URL paths to actual source files
  const pathToFile = {
    '/': 'src/pages/Home.tsx',
    '/about': 'src/pages/About.tsx',
    '/guide': 'src/pages/Guide.tsx',
    '/faq': 'src/pages/FAQ.tsx',
    '/history': 'src/pages/history/index.tsx',
    '/history/kominka': 'src/pages/history/KominkaMovement.tsx',
    '/history/shimonoseki': 'src/pages/history/ShimonosekiTreaty.tsx',
    '/history/san-francisco': 'src/pages/history/SanFranciscoTreaty.tsx',
  };

  const sourceFile = pathToFile[pagePath];
  if (!sourceFile) {
    console.warn(`⚠️  No source file mapping for path: ${pagePath}, using TODAY`);
    return TODAY;
  }

  const filePath = resolve(__dirname, '..', sourceFile);

  try {
    if (!existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}, using TODAY`);
      return TODAY;
    }

    const stats = statSync(filePath);
    const lastMod = stats.mtime.toISOString().split('T')[0];
    console.log(`✅ ${pagePath} → ${lastMod} (${sourceFile})`);
    return lastMod;
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    return TODAY;
  }
}

const pages = [
  { path: '/', priority: '1.0', changefreq: 'monthly' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
  { path: '/guide', priority: '0.8', changefreq: 'monthly' },
  { path: '/faq', priority: '0.9', changefreq: 'monthly' },
  // History pages - SEO FAQ pages
  { path: '/history', priority: '0.9', changefreq: 'monthly' },
  { path: '/history/kominka', priority: '0.85', changefreq: 'monthly' },
  { path: '/history/shimonoseki', priority: '0.85', changefreq: 'monthly' },
  { path: '/history/san-francisco', priority: '0.85', changefreq: 'monthly' },
];

function generateSitemap() {
  const urls = pages
    .map(
      (page) => `  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${getPageLastMod(page.path)}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <xhtml:link rel="alternate" hreflang="zh-TW" href="${BASE_URL}${page.path}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${page.path}" />
  </url>`,
    )
    .join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;

  const outputPath = resolve(__dirname, '../public/sitemap.xml');
  writeFileSync(outputPath, sitemap, 'utf-8');
  console.log(`✅ Sitemap generated: ${outputPath}`);
}

generateSitemap();
