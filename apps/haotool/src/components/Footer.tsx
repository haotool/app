import { Link } from 'react-router-dom';
import { APP_INFO, AUTHOR_CONTACT_LINKS, getCopyrightNotice } from '../config/app-info';
import { TOOLS, getToolUrl } from '../config/tools';
import Wordmark from './Wordmark';
import MailtoLink from './MailtoLink';
import { NAV_ITEMS } from './nav-items';

const FOOTER_LINK_CLASS =
  'press focus-ring text-[15px] leading-[2.2] text-text hover:text-primary-strong active:opacity-80';
const COLUMN_TITLE_CLASS = 'text-[13px] font-bold uppercase tracking-[0.05em] text-text-muted';

// F2「正在打造」列（motion-deep-dive §3 F2，PM 核准靜態版）：
// build-time 由 vite define 注入 ratewise 版本（零 runtime fetch）；
// 測試等無 define 環境回落空字串並隱藏整列。
const LATEST_SHIP_VERSION: string = typeof __LATEST_SHIP__ !== 'undefined' ? __LATEST_SHIP__ : '';

/**
 * 全站 Footer（deep-dive §4.8）：白底、頂部 border（唯一允許 border 分節處）、
 * 桌面 4 欄（2fr 1fr 1fr 1fr）/ 行動單欄堆疊；版權列含 GPL-3.0 與隱私連結。
 */
export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="shell pb-[calc(40px+env(safe-area-inset-bottom))] pt-16">
        {/* F2：最近出貨一行 caption（success 圓點＋tabular-nums 版本連至 GitHub releases）。 */}
        {LATEST_SHIP_VERSION ? (
          <p
            data-testid="latest-ship"
            className="mb-12 flex items-center justify-center gap-2 text-caption text-text-muted"
          >
            <span className="size-2 rounded-full bg-success" aria-hidden="true" />
            最近出貨 ·
            <a
              href={`${APP_INFO.github}/releases`}
              target="_blank"
              rel="noopener noreferrer"
              className="press focus-ring tabular-nums hover:text-primary-strong active:opacity-80"
            >
              HaoRate v{LATEST_SHIP_VERSION}
            </a>
          </p>
        ) : null}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[2fr_1fr_1fr_1fr] md:gap-12">
          <div>
            <Wordmark />
            <p className="mt-3 text-[15px] text-text-muted">把好想法，做成好工具。</p>
          </div>

          <nav aria-label="工具連結">
            <h2 className={COLUMN_TITLE_CLASS}>工具</h2>
            <ul className="mt-3">
              {TOOLS.map((tool) => (
                <li key={tool.id}>
                  <a href={getToolUrl(tool)} className={FOOTER_LINK_CLASS}>
                    {tool.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="頁面連結">
            <h2 className={COLUMN_TITLE_CLASS}>頁面</h2>
            <ul className="mt-3">
              <li>
                <Link to="/" viewTransition className={FOOTER_LINK_CLASS}>
                  首頁
                </Link>
              </li>
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} viewTransition className={FOOTER_LINK_CLASS}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="社群連結">
            <h2 className={COLUMN_TITLE_CLASS}>社群</h2>
            <ul className="mt-3">
              {AUTHOR_CONTACT_LINKS.map((link) => (
                <li key={link.id}>
                  {link.href ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={FOOTER_LINK_CLASS}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <MailtoLink email={link.value} className={`focus-ring ${FOOTER_LINK_CLASS}`}>
                      {link.label}
                    </MailtoLink>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <p className="text-caption text-text-muted">{getCopyrightNotice()}</p>
          <Link
            to="/about/#privacy"
            viewTransition
            className="press focus-ring text-caption text-text-muted hover:text-primary-strong active:opacity-80"
          >
            隱私政策
          </Link>
        </div>
      </div>
    </footer>
  );
}
