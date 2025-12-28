/**
 * Route Configuration
 * [context7:/daydreamer-riri/vite-react-ssg:2025-12-29]
 *
 * 建立時間: 2025-12-29T02:27:28+08:00
 */

import type { RouteRecord } from 'vite-react-ssg';
import { Layout } from './components/Layout';

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        lazy: () => import('./pages/Home'),
      },
      {
        path: 'about',
        lazy: () => import('./pages/About'),
      },
      {
        path: 'faq',
        lazy: () => import('./pages/FAQ'),
      },
      {
        path: 'guide',
        lazy: () => import('./pages/Guide'),
      },
    ],
  },
];
