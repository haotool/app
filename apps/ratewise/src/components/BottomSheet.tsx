/**
 * BottomSheet primitive（E1 系統元件）
 *
 * 收斂 E3 兩個 sheet 殼（TrendSheet / CurrencyPickerSheet）與未來 modal 需求：
 * 拖曳關閉、backdrop、safe-area、fixed（65vh）/ adaptive（max-h 70vh）兩模式。
 * 文案（標題、關閉鈕 aria-label）由消費端傳入，primitive 不綁 i18n。
 */

import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { transitions } from '../config/animations';
import { useBodyScrollLock } from '../features/calculator/hooks/useBodyScrollLock';

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
            className={`fixed inset-x-0 bottom-0 z-50 bg-surface rounded-t-card shadow-floating flex flex-col pb-[env(safe-area-inset-bottom,0px)] ${SIZE_CLASS[size]}`}
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
