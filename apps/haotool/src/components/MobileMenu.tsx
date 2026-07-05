import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { APP_INFO } from '../config/app-info';
import Wordmark from './Wordmark';
import { buttonClass } from './Button';
import { NAV_ITEMS } from './nav-items';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

/**
 * 全屏行動選單（deep-dive §4.7）：白實底 overlay、鎖 body scroll、Esc 關閉、focus trap。
 * 開合 240ms opacity + translateY(8px)（reduced-motion 僅 opacity）；關閉態以 inert 移出焦點鏈。
 */
export default function MobileMenu({ open, onClose }: MobileMenuProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const overlay = overlayRef.current;
    if (!overlay) return undefined;

    document.body.style.overflow = 'hidden';

    const focusables = () =>
      Array.from(overlay.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
    focusables()[0]?.focus();

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [open, onClose]);

  return (
    <div
      ref={overlayRef}
      id="mobile-menu"
      className="mobile-menu fixed inset-0 z-(--z-overlay) flex flex-col bg-surface md:hidden"
      data-open={open}
      inert={!open}
    >
      <div className="flex h-16 shrink-0 items-center justify-between px-5">
        <Link to="/" className="focus-ring press hover:opacity-80" onClick={onClose}>
          <span className="sr-only">{APP_INFO.shortName} 首頁</span>
          <Wordmark />
        </Link>
        <button
          type="button"
          onClick={onClose}
          aria-label="關閉選單"
          className="press press-scale focus-ring inline-flex size-11 items-center justify-center rounded-icon text-text hover:bg-background"
        >
          <X className="size-6" aria-hidden="true" />
        </button>
      </div>

      <nav aria-label="主導覽" className="flex-1 overflow-y-auto">
        <ul>
          {NAV_ITEMS.map((item) => (
            <li key={item.to} className="border-b border-border">
              <Link
                to={item.to}
                onClick={onClose}
                className="press focus-ring-inset flex h-14 items-center px-5 text-[22px] font-bold text-text hover:bg-background active:bg-background"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 space-y-4 px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-4">
        <a
          href={APP_INFO.github}
          target="_blank"
          rel="noopener noreferrer"
          className="press focus-ring inline-flex h-11 items-center text-[15px] font-medium text-text hover:text-primary-strong"
        >
          GitHub
        </a>
        <Link to="/contact/" onClick={onClose} className={buttonClass('primary', 'w-full')}>
          聊聊你的專案
        </Link>
      </div>
    </div>
  );
}
