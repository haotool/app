import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import dns from 'node:dns';

dns.setDefaultResultOrder('verbatim');

const __dirname = dirname(fileURLToPath(import.meta.url));

function readPackageVersion(): string {
  const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
  return packageJson.version;
}

function getVersionFromGitTag(): string | null {
  try {
    const described = execSync('git describe --tags --long --match "@app/park-keeper@*"', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    const tagMatch = /@app\/park-keeper@(\d+\.\d+\.\d+)-(\d+)-g[0-9a-f]+/.exec(described);
    if (!tagMatch) return null;

    const tagVersion = tagMatch[1];
    const distance = tagMatch[2];
    if (!tagVersion || !distance) return null;
    return Number(distance) === 0 ? tagVersion : `${tagVersion}+build.${distance}`;
  } catch {
    return null;
  }
}

function getVersionFromBuildMetadata(baseVersion: string): string | null {
  try {
    const commitCount =
      process.env['GIT_COMMIT_COUNT'] ??
      execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim();
    return `${baseVersion}+build.${commitCount}`;
  } catch {
    return null;
  }
}

function getDevelopmentVersion(baseVersion: string): string {
  try {
    const commitHash =
      process.env['GIT_COMMIT_HASH'] ??
      execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
    const isDirty =
      execSync('git status --porcelain', { encoding: 'utf-8' }).trim().length > 0 ? '-dirty' : '';
    return `${baseVersion}+sha.${commitHash}${isDirty}`;
  } catch {
    return baseVersion;
  }
}

function isValidSemverLikeVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version);
}

function generateVersion(): string {
  const baseVersion = readPackageVersion();

  // Development builds keep package.json semver and append git SHA metadata.
  if (!process.env['CI'] && process.env['NODE_ENV'] !== 'production') {
    return getDevelopmentVersion(baseVersion);
  }

  // Production builds prefer release tags, then fallback to build metadata.
  const version = getVersionFromGitTag() ?? getVersionFromBuildMetadata(baseVersion) ?? baseVersion;

  if (!isValidSemverLikeVersion(version)) {
    return baseVersion;
  }

  return version;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const appVersion = generateVersion();
  const buildTime = new Date().toISOString();

  const baseFromEnv =
    env['VITE_PARK_KEEPER_BASE_PATH'] ?? process.env['VITE_PARK_KEEPER_BASE_PATH'];
  const base = baseFromEnv ?? (mode === 'production' || process.env['CI'] ? '/park-keeper/' : '/');

  const manifestScope = base.endsWith('/') ? base : `${base}/`;

  return {
    base,
    server: {
      port: 3004,
      strictPort: true,
      open: true,
      host: '0.0.0.0',
    },
    preview: {
      port: 4176,
      strictPort: true,
    },
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __BUILD_TIME__: JSON.stringify(buildTime),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
      'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
    },
    resolve: {
      alias: {
        '@app/park-keeper': resolve(__dirname, './src'),
      },
    },
    plugins: [
      tailwindcss(),
      react(),
      {
        name: 'inject-version-meta',
        transformIndexHtml(html) {
          return html.replace(/__APP_VERSION__/g, appVersion).replace(/__BUILD_TIME__/g, buildTime);
        },
      },
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
        deleteOriginFile: false,
      }),
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024,
        deleteOriginFile: false,
      }),
      VitePWA({
        base,
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        workbox: {
          globPatterns: ['**/*.{js,css,html,json,ico,png,svg,woff,woff2,avif,webp}'],
          globIgnores: ['**/node_modules/**'],
          ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
          clientsClaim: true,
          skipWaiting: true,
          cleanupOutdatedCaches: true,
          navigationPreload: false,
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [
            /^\/api/,
            /\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif)$/,
            /\.(?:js|css|json|woff|woff2)$/,
          ],
          runtimeCaching: [
            {
              urlPattern: /\.html$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'html-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 },
                networkTimeoutSeconds: 5,
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'font-cache',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },
        manifest: {
          id: manifestScope,
          name: '停車好工具',
          short_name: 'ParkKeeper',
          description:
            '智慧停車記錄與導航 PWA。記錄車牌、樓層、GPS 座標與照片，透過羅盤導航快速找回愛車。',
          theme_color: '#f8fafc',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'portrait',
          scope: manifestScope,
          start_url: manifestScope,
          categories: ['utilities', 'navigation'],
          lang: 'zh-TW',
          icons: [
            { src: 'icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
            {
              src: 'icons/icon-512.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
        },
      }),
    ],
    build: {
      target: 'es2020',
      minify: 'terser',
      sourcemap: false,
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug', 'console.info', 'console.warn'],
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (typeof process !== 'undefined' && process.env['SSR'] === 'true') return undefined;
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
              if (id.includes('react-router-dom') || id.includes('@remix-run'))
                return 'vendor-router';
              if (id.includes('motion') || id.includes('framer-motion')) return 'vendor-motion';
              if (id.includes('leaflet') || id.includes('react-leaflet')) return 'vendor-map';
              if (id.includes('i18next')) return 'vendor-i18n';
            }
            return undefined;
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
    ssgOptions: {
      // Keep client entry ordered after HTML parsing so vite-react-ssg hydration data
      // (injected later in the document) is available before React bootstraps.
      script: 'defer',
      formatting: 'none',
      dirStyle: 'nested',
      concurrency: 10,
      // Disable beasties: Tailwind v4 @layer utilities is not properly extracted,
      // causing CSS to be deferred to end of <body> with empty critical CSS inlined.
      // This makes the SSG skeleton invisible on initial paint. Keeping CSS in <head>
      // (render-blocking but styled) is the correct trade-off for this PWA use case.
      beastiesOptions: false,
      async includedRoutes() {
        const { SEO_PATHS } = await import('./app.config.mjs');
        return SEO_PATHS.map((path: string) => (path === '/' ? path : path.replace(/\/$/, '')));
      },
      async onPageRendered(route, renderedHTML) {
        const { getJsonLdForRoute, jsonLdToScriptTags } = await import('./src/seo/jsonld');
        const { getMetaTagsForRoute } = await import('./src/seo/meta-tags');

        const metaTags = getMetaTagsForRoute(route, buildTime);
        const jsonLd = getJsonLdForRoute(route, buildTime);
        const scriptTags = jsonLdToScriptTags(jsonLd);

        let html = renderedHTML;
        html = html.replace(/<title>[^<]*<\/title>/gi, '');
        html = html.replace(/<meta[^>]*name="description"[^>]*>/gis, '');
        html = html.replace(/<meta[^>]*name="keywords"[^>]*>/gis, '');
        html = html.replace(/<meta[^>]*name="robots"[^>]*>/gis, '');
        html = html.replace(/<meta[^>]*name="author"[^>]*>/gis, '');
        html = html.replace(/<link[^>]*rel="canonical"[^>]*>/gis, '');
        html = html.replace(/<meta[^>]*property="og:[^"]*"[^>]*>/gis, '');
        html = html.replace(/<meta[^>]*name="twitter:[^"]*"[^>]*>/gis, '');

        return html.replace('</head>', `${metaTags}\n${scriptTags}</head>`);
      },
    },
  };
});
