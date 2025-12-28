/**
 * Layout Component
 * 提供全站共用的佈局結構
 *
 * 建立時間: 2025-12-29T02:27:28+08:00
 */

import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Info, HelpCircle, BookOpen, AlertTriangle } from 'lucide-react';

const navItems = [
  { path: '/', label: '首頁', icon: Home },
  { path: '/guide/', label: '防災指南', icon: BookOpen },
  { path: '/faq/', label: '常見問題', icon: HelpCircle },
  { path: '/about/', label: '關於', icon: Info },
];

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        跳至主要內容
      </a>

      {/* Header */}
      <header className="bg-red-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-xl font-bold hover:opacity-90 transition-opacity"
              aria-label="Quake-School 首頁"
            >
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
              <span>Quake-School</span>
            </Link>

            <nav aria-label="主要導航">
              <ul className="flex items-center gap-1 sm:gap-4">
                {navItems.map(({ path, label, icon: Icon }) => {
                  const isActive =
                    path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(path.replace(/\/$/, ''));
                  return (
                    <li key={path}>
                      <Link
                        to={path}
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                          isActive ? 'bg-red-700 font-medium' : 'hover:bg-red-500'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon className="w-4 h-4" aria-hidden="true" />
                        <span className="hidden sm:inline">{label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="mb-2">© {new Date().getFullYear()} Quake-School 地震防災教室</p>
            <p className="text-sm text-gray-400">
              由{' '}
              <a
                href="https://haotool.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:text-red-300 underline"
              >
                haotool
              </a>{' '}
              製作 | PWA 離線可用
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
