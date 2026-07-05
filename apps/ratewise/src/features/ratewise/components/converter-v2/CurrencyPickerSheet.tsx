/**
 * E3 v2 幣別選擇 bottom sheet：取代 legacy 原生 select（審計指出的最大差距）。
 * 僅供 v2 模式使用，不動 legacy 模式的 select。
 * @see .claude/prds/ratewise-e3-converter-v2-design.md
 */

import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { transitions } from '../../../../config/animations';
import { useBodyScrollLock } from '../../../calculator/hooks/useBodyScrollLock';
import { CURRENCY_DEFINITIONS } from '../../constants';
import type { CurrencyCode } from '../../types';

const CURRENCY_CODES = Object.keys(CURRENCY_DEFINITIONS) as CurrencyCode[];

export interface CurrencyPickerSheetProps {
  isOpen: boolean;
  selected: CurrencyCode;
  onSelect: (code: CurrencyCode) => void;
  onClose: () => void;
}

export function CurrencyPickerSheet({
  isOpen,
  selected,
  onSelect,
  onClose,
}: CurrencyPickerSheetProps) {
  const { t } = useTranslation();
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
            className="fixed inset-x-0 bottom-0 z-50 bg-surface rounded-t-3xl shadow-2xl max-h-[70vh] flex flex-col"
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
            aria-label={t('converterV2.pickerTitle')}
            data-testid="currency-picker-sheet"
          >
            <div className="flex justify-center py-3">
              <div className="w-12 h-1 bg-neutral-darker rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 pb-2">
              <h2 className="text-lg font-semibold text-neutral-text">
                {t('converterV2.pickerTitle')}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center text-neutral-text-muted hover:text-neutral-text-secondary transition-colors"
                aria-label={t('converterV2.close')}
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
            <ul className="flex-1 overflow-y-auto px-3 pb-6" role="listbox">
              {CURRENCY_CODES.map((code) => {
                const definition = CURRENCY_DEFINITIONS[code];
                const isSelected = code === selected;
                return (
                  <li key={code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => onSelect(code)}
                      data-testid={`currency-option-${code}`}
                      className={`flex w-full items-center justify-between rounded-xl px-3 min-h-[48px] text-left transition-colors ${
                        isSelected ? 'bg-primary/10' : 'hover:bg-surface-elevated'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-xl" aria-hidden="true">
                          {definition.flag}
                        </span>
                        <span className="font-semibold text-text">{code}</span>
                        <span className="text-sm text-neutral-text-secondary">
                          {definition.name}
                        </span>
                      </span>
                      {isSelected && (
                        <svg
                          className="w-5 h-5 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
