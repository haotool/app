/**
 * 地震知識小學堂 - 主佈局元件
 */
import { Outlet } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';

const Layout: React.FC = () => {
  return (
    <HelmetProvider>
      <Helmet>
        <html lang="zh-TW" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
        <meta name="theme-color" content="#0ea5e9" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </Helmet>
      <main className="min-h-screen bg-white">
        <Outlet />
      </main>
    </HelmetProvider>
  );
};

export default Layout;
