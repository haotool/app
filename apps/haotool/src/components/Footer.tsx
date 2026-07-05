import { Link } from 'react-router-dom';
import { APP_INFO, getCopyrightNotice } from '../config/app-info';
import { TOOLS, getToolUrl } from '../config/tools';
import Wordmark from './Wordmark';
import MailtoLink from './MailtoLink';
import { NAV_ITEMS } from './nav-items';

const FOOTER_LINK_CLASS =
  'press focus-ring text-[15px] leading-[2.2] text-text hover:text-primary-strong active:opacity-80';
const COLUMN_TITLE_CLASS = 'text-[13px] font-bold uppercase tracking-[0.05em] text-text-muted';

/**
 * 全站 Footer（deep-dive §4.8）：白底、頂部 border（唯一允許 border 分節處）、
 * 桌面 4 欄（2fr 1fr 1fr 1fr）/ 行動單欄堆疊；版權列含 GPL-3.0 與隱私連結。
 */
export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="shell pb-[calc(40px+env(safe-area-inset-bottom))] pt-16">
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
                <Link to="/" className={FOOTER_LINK_CLASS}>
                  首頁
                </Link>
              </li>
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className={FOOTER_LINK_CLASS}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="社群連結">
            <h2 className={COLUMN_TITLE_CLASS}>社群</h2>
            <ul className="mt-3">
              <li>
                <a
                  href={APP_INFO.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={FOOTER_LINK_CLASS}
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href={APP_INFO.threadsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={FOOTER_LINK_CLASS}
                >
                  Threads
                </a>
              </li>
              <li>
                <MailtoLink email={APP_INFO.email} className={`focus-ring ${FOOTER_LINK_CLASS}`}>
                  Email
                </MailtoLink>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <p className="text-caption text-text-muted">{getCopyrightNotice()}</p>
          <Link
            to="/about/#privacy"
            className="press focus-ring text-caption text-text-muted hover:text-primary-strong active:opacity-80"
          >
            隱私政策
          </Link>
        </div>
      </div>
    </footer>
  );
}
