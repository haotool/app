import { Outlet } from 'react-router-dom';
import { SITE_CONFIG } from '../../app.config.mjs';

const APP_NAME = SITE_CONFIG.name;

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="py-4 px-6 text-center border-t border-black/5">
        <address className="not-italic text-sm text-slate-500">
          © {new Date().getFullYear()}{' '}
          <a
            href="https://app.haotool.org/about/"
            rel="author"
            className="hover:text-slate-400 transition-colors"
          >
            阿璋 (Ah Zhang)
          </a>{' '}
          · {APP_NAME}. All rights reserved.
        </address>
        <nav
          className="flex items-center justify-center gap-4 text-xs text-slate-400 mt-2"
          aria-label="Footer"
        >
          <a href="/park-keeper/about/" className="hover:text-slate-300 transition-colors">
            About
          </a>
          <a href="/park-keeper/settings/" className="hover:text-slate-300 transition-colors">
            Settings
          </a>
          <a href="/park-keeper/about/#privacy" className="hover:text-slate-300 transition-colors">
            Privacy
          </a>
        </nav>
        <div className="sr-only" aria-hidden="true">
          <span rel="author">阿璋 (Ah Zhang)</span>
          <time dateTime="2026-02-25">Published: 2026-02-25</time>
        </div>
      </footer>
    </div>
  );
}
