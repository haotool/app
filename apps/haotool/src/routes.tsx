/**
 * Application Routes
 * Routes for vite-react-ssg
 * [update:2025-12-16] - Home page now uses its own layout (aligned with .example)
 */
import type { RouteRecord } from 'vite-react-ssg';
import Layout from './components/Layout';

const routes: RouteRecord[] = [
  // Home page - standalone layout (aligned with .example/haotool.org-v1.0.6)
  {
    path: '/',
    lazy: async () => {
      const { default: Home } = await import('./pages/Home');
      return { Component: Home };
    },
  },
  // Other pages use shared Layout
  {
    path: '/',
    Component: Layout,
    children: [
      {
        path: 'projects',
        lazy: async () => {
          const { default: Projects } = await import('./pages/Projects');
          return { Component: Projects };
        },
      },
      {
        path: 'about',
        lazy: async () => {
          const { default: About } = await import('./pages/About');
          return { Component: About };
        },
      },
      {
        path: 'contact',
        lazy: async () => {
          const { default: Contact } = await import('./pages/Contact');
          return { Component: Contact };
        },
      },
    ],
  },
];

export function getIncludedRoutes(): string[] {
  return ['/', '/projects/', '/about/', '/contact/'];
}

export default routes;
