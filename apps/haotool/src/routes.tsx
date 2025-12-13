/**
 * Application Routes
 * Routes for vite-react-ssg
 */
import type { RouteRecord } from 'vite-react-ssg';
import Layout from './components/Layout';

const routes: RouteRecord[] = [
  {
    path: '/',
    Component: Layout,
    children: [
      {
        index: true,
        lazy: async () => {
          const { default: Home } = await import('./pages/Home');
          return { Component: Home };
        },
      },
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
