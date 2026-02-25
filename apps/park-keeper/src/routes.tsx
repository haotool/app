/**
 * Park-Keeper Routes for vite-react-ssg
 *
 * SSG requires non-lazy imports for pre-rendering.
 */
import type { RouteRecord } from 'vite-react-ssg';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Settings from './pages/Settings';

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
];
