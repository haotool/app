/**
 * Application Routes for vite-react-ssg
 * 4 條 SEO 路由（lazy）+ 共用 Layout + 404（含 catch-all）。
 * SSG 預渲染路徑 SSOT 為 app.config.mjs 的 SEO_PATHS；/404 額外預渲染供 nginx error_page 使用。
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
        entry: 'src/pages/Home.tsx',
      },
      {
        path: 'tools',
        lazy: async () => {
          const { default: Tools } = await import('./pages/Tools');
          return { Component: Tools };
        },
        entry: 'src/pages/Tools.tsx',
      },
      {
        path: 'about',
        lazy: async () => {
          const { default: About } = await import('./pages/About');
          return { Component: About };
        },
        entry: 'src/pages/About.tsx',
      },
      {
        path: 'contact',
        lazy: async () => {
          const { default: Contact } = await import('./pages/Contact');
          return { Component: Contact };
        },
        entry: 'src/pages/Contact.tsx',
      },
      {
        path: '404',
        lazy: async () => {
          const { default: NotFound } = await import('./pages/NotFound');
          return { Component: NotFound };
        },
        entry: 'src/pages/NotFound.tsx',
      },
      {
        path: '*',
        lazy: async () => {
          const { default: NotFound } = await import('./pages/NotFound');
          return { Component: NotFound };
        },
        entry: 'src/pages/NotFound.tsx',
      },
    ],
  },
];

export default routes;
