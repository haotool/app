import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getStoredLanguage } from '../services/i18n';
import { SITE_CONFIG } from '../../app.config.mjs';
import { UpdatePrompt } from './UpdatePrompt';

const APP_NAME = SITE_CONFIG.name;
const CURRENT_YEAR = 2026;

function normalizePathname(pathname: string) {
  if (pathname === '/') return pathname;
  return pathname.replace(/\/+$/, '');
}

export default function Layout() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();

  useEffect(() => {
    // 首屏一律以 zh-TW hydrate（與 SSG 一致），掛載後才還原使用者語言偏好。
    const stored = getStoredLanguage();
    if (stored && stored !== i18n.language) void i18n.changeLanguage(stored);
  }, [i18n]);
  const normalizedPathname = normalizePathname(pathname);
  const showFooter = normalizedPathname === '/about';
  const footerLinkCls =
    'inline-block px-3.5 py-3.5 -mx-3.5 -my-3.5 hover:text-slate-300 transition-colors';

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
      {/* 全域掛載：確保 /add 捷徑、/guide、/about 等非 Home 路由也能自動消費 waiting SW（issue #725 pre-release 稽核 C-P0）。 */}
      <UpdatePrompt />
      {showFooter && (
        <footer className="py-4 px-6 text-center border-t border-black/5">
          <address className="not-italic text-sm text-slate-500">
            <span suppressHydrationWarning>© {CURRENT_YEAR}</span>{' '}
            <a
              href="https://app.haotool.org/about/"
              rel="author"
              className="inline-block px-1 py-1.5 -mx-1 -my-1.5 hover:text-slate-400 transition-colors"
            >
              阿璋 (Ah Zhang)
            </a>{' '}
            · {APP_NAME}. {t('footer.rights_reserved')}
          </address>
          <nav
            className="flex items-center justify-center gap-4 text-xs text-slate-400 mt-2"
            aria-label="Footer"
          >
            <Link to="/about/" className={footerLinkCls}>
              {t('footer.about')}
            </Link>
            <Link to="/settings/" className={footerLinkCls}>
              {t('footer.settings')}
            </Link>
            <Link to="/about/#privacy" className={footerLinkCls}>
              {t('footer.privacy')}
            </Link>
          </nav>
        </footer>
      )}
    </div>
  );
}
