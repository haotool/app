/**
 * 全站共用 Layout（Header / Footer 佔位版）
 * 語意 landmark：header / nav / main / footer + SkipLink（PRD §8）
 * 視覺細節由後續 wave 深化；本檔僅基礎排版，無漸層無陰影。
 */
import { Link, Outlet } from 'react-router-dom';
import { Github } from 'lucide-react';
import { APP_INFO, getCopyrightNotice } from '../config/app-info';
import { TOOLS, getToolUrl } from '../config/tools';

const NAV_ITEMS = [
  { to: '/tools/', label: '工具' },
  { to: '/about/', label: '關於' },
  { to: '/contact/', label: '聯繫' },
] as const;

function Wordmark() {
  return (
    <span className="text-lg font-bold">
      <span className="text-text">{APP_INFO.wordmarkPrefix}</span>
      <span className="text-primary">{APP_INFO.wordmarkAccent}</span>
    </span>
  );
}

function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between px-5 md:px-6">
        <Link to="/" aria-label={`${APP_INFO.shortName} 首頁`}>
          <Wordmark />
        </Link>
        <nav aria-label="主導覽">
          <ul className="flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-sm text-text">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={APP_INFO.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="inline-flex items-center text-text"
              >
                <Github size={20} aria-hidden="true" />
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-[1120px] space-y-8 px-5 py-12 md:px-6">
        <div>
          <Wordmark />
          <p className="mt-2 text-sm text-text-muted">
            {APP_INFO.subtitle} — 免費、開源、不收集個資的台灣網頁工具集。
          </p>
        </div>
        <nav aria-label="工具連結">
          <h2 className="text-sm font-semibold">工具</h2>
          <ul className="mt-2 space-y-1">
            {TOOLS.map((tool) => (
              <li key={tool.id}>
                <a href={getToolUrl(tool)} className="text-sm text-text-muted">
                  {tool.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="頁面連結">
          <h2 className="text-sm font-semibold">頁面</h2>
          <ul className="mt-2 space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-sm text-text-muted">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/about/#privacy" className="text-sm text-text-muted">
                隱私政策
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="社群連結">
          <h2 className="text-sm font-semibold">社群</h2>
          <ul className="mt-2 space-y-1">
            <li>
              <a
                href={APP_INFO.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-text-muted"
              >
                GitHub
              </a>
            </li>
            <li>
              <a
                href={APP_INFO.threadsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-text-muted"
              >
                Threads {APP_INFO.socialHandle}
              </a>
            </li>
          </ul>
        </nav>
        <p className="text-xs text-text-muted">{getCopyrightNotice()}</p>
      </div>
    </footer>
  );
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-surface focus:px-4 focus:py-2"
      >
        跳至主內容
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
