/**
 * Layout component for NihonName
 * Provides consistent page structure with SEO defaults
 */
import { Outlet } from 'react-router-dom';
import { HelmetProvider } from '../utils/react-helmet-async';

export function Layout() {
  return (
    <HelmetProvider>
      <div className="min-h-screen bg-stone-100">
        <Outlet />
      </div>
    </HelmetProvider>
  );
}

export default Layout;
