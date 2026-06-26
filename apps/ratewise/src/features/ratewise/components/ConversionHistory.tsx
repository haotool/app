import { ArrowRight, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRef, useCallback } from 'react';
import type { ConversionHistoryEntry } from '../types';
import { copyToClipboard, formatConversionForCopy } from '../../../utils/clipboard';
import { useToast } from '../../../components/Toast';
import { CURRENCY_DEFINITIONS } from '../constants';
import { categorizeHistoryEntry } from '../../../stores/converterStore';

interface ConversionHistoryProps {
  history: ConversionHistoryEntry[];
  onReconvert?: (entry: ConversionHistoryEntry) => void;
}

export const ConversionHistory = ({ history, onReconvert }: ConversionHistoryProps) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const getCategoryLabel = useCallback(
    (entry: ConversionHistoryEntry): string | null => {
      const category = categorizeHistoryEntry(entry);
      if (category === 'legacy') return null;
      return t(`conversionHistory.categories.${category}`);
    },
    [t],
  );

  const handleCopy = useCallback(
    async (entry: ConversionHistoryEntry) => {
      const text = formatConversionForCopy(entry);
      const success = await copyToClipboard(text);
      if (success) {
        showToast(t('common.copied'), 'success');
      } else {
        showToast(t('conversionHistory.copyFailed'), 'error');
      }
    },
    [showToast, t],
  );

  const handleClick = useCallback(
    (entry: ConversionHistoryEntry) => {
      if (!isLongPress.current) {
        void handleCopy(entry);
      }
      isLongPress.current = false;
    },
    [handleCopy],
  );

  const handleDoubleClick = useCallback(
    (entry: ConversionHistoryEntry) => {
      onReconvert?.(entry);
    },
    [onReconvert],
  );

  const handleTouchStart = useCallback(
    (entry: ConversionHistoryEntry) => {
      isLongPress.current = false;
      longPressTimer.current = setTimeout(() => {
        isLongPress.current = true;
        onReconvert?.(entry);
      }, 500);
    },
    [onReconvert],
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>, entry: ConversionHistoryEntry) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (event.shiftKey) {
          onReconvert?.(entry);
        } else {
          void handleCopy(entry);
        }
      } else if (event.key === ' ') {
        event.preventDefault();
        void handleCopy(entry);
      }
    },
    [handleCopy, onReconvert],
  );

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {history.map((item, index) => {
        const categoryLabel = getCategoryLabel(item);
        return (
          <div
            key={`${index}-${item.timestamp}`}
            onKeyDown={(e) => handleKeyDown(e, item)}
            role="group"
            tabIndex={0}
            className="card group flex items-center gap-3 p-4 transition-[box-shadow,transform] duration-200
                     hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-label={t('conversionHistory.entryAriaLabel', {
              from: item.from,
              to: item.to,
              amount: item.amount,
              result: item.result,
            })}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReconvert?.(item);
              }}
              onTouchStart={() => handleTouchStart(item)}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              className="-m-1 flex min-h-11 min-w-11 flex-shrink-0 cursor-pointer items-center justify-center -space-x-2 rounded-control p-2
                       transition-[background-color,transform] hover:bg-primary/10 active:scale-95"
              aria-label={t('conversionHistory.reconvertAriaLabel', {
                from: item.from,
                to: item.to,
              })}
            >
              <span className="text-xl z-10">{CURRENCY_DEFINITIONS[item.from]?.flag || '💱'}</span>
              <span className="text-xl">{CURRENCY_DEFINITIONS[item.to]?.flag || '💱'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleClick(item)}
              onDoubleClick={() => handleDoubleClick(item)}
              className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center justify-between rounded-control hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={t('conversionHistory.copyAriaLabel')}
            >
              <div className="text-left">
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm font-bold">
                  <span className="text-text">{item.amount}</span>
                  <span className="text-text-muted">{item.from}</span>
                  <ArrowRight size={12} className="text-text-muted flex-shrink-0" />
                  <span className="text-primary">{item.result}</span>
                  <span className="text-primary">{item.to}</span>
                </div>
                <span className="mt-0.5 block text-xs text-text-muted opacity-60">
                  {item.time}
                  {categoryLabel ? ` · ${categoryLabel}` : ''}
                </span>
              </div>

              <div className="flex items-center gap-1 text-text-muted opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                <Copy size={14} />
                <span className="hidden text-xs sm:inline">{t('common.copy')}</span>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
};
