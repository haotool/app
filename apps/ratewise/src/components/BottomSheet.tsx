/**
 * BottomSheet primitive（E1 系統元件）
 *
 * 收斂 E3 兩個 sheet 殼（TrendSheet / CurrencyPickerSheet）與未來 modal 需求：
 * 拖曳關閉、backdrop、safe-area、fixed（65vh）/ adaptive（max-h 70vh）兩模式。
 * 文案（標題、關閉鈕 aria-label）由消費端傳入，primitive 不綁 i18n。
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { transitions } from '../config/animations';
import { useBodyScrollLock } from '../features/calculator/hooks/useBodyScrollLock';

// modal 焦點循環涵蓋的可聚焦元素（WCAG 2.4.3）。
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** sheet 的 aria-label（role="dialog" 可及名稱）。 */
  ariaLabel: string;
  title: ReactNode;
  /** 關閉按鈕 aria-label。 */
  closeLabel: string;
  children: ReactNode;
  /** fixed：65vh 固定高；adaptive：內容自適應（max-h 70vh）。 */
  size?: 'fixed' | 'adaptive';
  testId?: string;
}

const SIZE_CLASS: Record<NonNullable<BottomSheetProps['size']>, string> = {
  fixed: 'h-[65vh]',
  adaptive: 'max-h-[70vh]',
};

export function BottomSheet({
  isOpen,
  onClose,
  ariaLabel,
  title,
  closeLabel,
  children,
  size = 'adaptive',
  testId,
}: BottomSheetProps) {
  useBodyScrollLock(isOpen);

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // 開啟時初始焦點移入 sheet；關閉時還原到開啟前的觸發元素（WCAG modal 鍵盤要求）。
  useEffect(() => {
    if (!isOpen) return;
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const sheet = sheetRef.current;
    if (sheet && !sheet.contains(document.activeElement)) {
      sheet.focus();
    }
    return () => {
      restoreFocusRef.current?.focus();
      restoreFocusRef.current = null;
    };
  }, [isOpen]);

  // Esc 關閉＋Tab 焦點困於 sheet 內循環。
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const sheet = sheetRef.current;
      if (!sheet) return;
      const focusables = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      const first = focusables[0];
      const last = focusables.at(-1);
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      const active = document.activeElement;
      const isInside = active instanceof HTMLElement && sheet.contains(active);
      if (event.shiftKey) {
        if (!isInside || active === first || active === sheet) {
          event.preventDefault();
          last.focus();
        }
      } else if (!isInside || active === last || active === sheet) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') {
    return null;
  }

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { y: number } },
  ) => {
    if (info.offset.y > 100) {
      onClose();
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={sheetRef}
            tabIndex={-1}
            className={`fixed inset-x-0 bottom-0 z-50 bg-surface rounded-t-card shadow-floating flex flex-col pb-[env(safe-area-inset-bottom,0px)] outline-none ${SIZE_CLASS[size]}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={transitions.keyboardSheet}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            data-testid={testId}
          >
            <div className="flex justify-center py-3">
              <div className="w-12 h-1 bg-neutral-darker rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 pb-2">
              <h2 className="text-lg font-semibold text-neutral-text">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center text-neutral-text-muted hover:text-neutral-text-secondary transition-colors"
                aria-label={closeLabel}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
