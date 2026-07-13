import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Github, Menu } from 'lucide-react';
import { APP_INFO } from '../config/app-info';
import Wordmark from './Wordmark';
import MobileMenu from './MobileMenu';
import { NAV_ITEMS } from './nav-items';
import { useMagnetic } from './interactions';

/**
 * 全站 Header（deep-dive §4.7）：h 64px、白實底、底部 1px border、sticky。
 * 捲動 >8px 加安靜陰影（唯一狀態變化；rAF + passive，FR-010）；無毛玻璃濾鏡。
 */
export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // S5-b magnetic hover（GitHub icon 鈕；hero 主/次 CTA 於 Home 內）。
  const githubRef = useMagnetic<HTMLAnchorElement>();

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 8);
    };
    const handleScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      {/* site-header：S6 View Transition 獨立快照（轉場中導航列恆常穩定）。 */}
      <header
        className={`site-header sticky top-0 z-(--z-header) border-b border-border bg-surface transition-shadow duration-200 ${
          scrolled ? 'shadow-quiet' : ''
        }`}
      >
        <div className="shell flex h-16 items-center justify-between">
          <Link
            to="/"
            viewTransition
            className="press focus-ring inline-flex items-center hover:opacity-80"
          >
            <span className="sr-only">{APP_INFO.shortName} 首頁</span>
            {/* 僅 Header 實例參與 S1 開場動畫（M1）；Footer/MobileMenu 維持 SVG。 */}
            <Wordmark variant="animated" />
          </Link>

          <nav aria-label="主導覽" className="hidden md:block">
            <ul className="flex items-center gap-8">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    viewTransition
                    className={({ isActive }) =>
                      `press focus-ring inline-flex h-11 items-center text-[15px] active:opacity-80 ${
                        isActive
                          ? 'font-semibold text-primary-strong'
                          : 'font-medium text-text hover:text-primary-strong'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
              <li>
                <a
                  ref={githubRef}
                  href={APP_INFO.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="press focus-ring group inline-flex size-11 items-center justify-center rounded-icon hover:bg-background"
                >
                  <span className="magnet-item">
                    <Github
                      className="size-[22px] text-text-muted group-hover:text-text"
                      aria-hidden="true"
                    />
                  </span>
                </a>
              </li>
            </ul>
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="開啟選單"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="press press-scale focus-ring inline-flex size-11 items-center justify-center rounded-icon text-text hover:bg-background md:hidden"
          >
            <Menu className="size-6" aria-hidden="true" />
          </button>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
