/**
 * ConversionHistory Component - Conversion History List
 * 轉換歷史記錄組件 - 轉換歷史列表
 *
 * @description ParkKeeper styled conversion history list component.
 *              Click on flag area (left) to quickly reconvert with the same currencies.
 *              Click on result area (right) to copy conversion result.
 *              ParkKeeper 風格的轉換歷史列表組件。
 *              點擊國旗區域（左側）可快速帶入相同貨幣進行換算。
 *              點擊結果區域（右側）可複製轉換結果。
 * @version 4.0.0
 */

import { ArrowRight, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRef, useCallback } from 'react';
import type { ConversionHistoryEntry } from '../types';
import { copyToClipboard, formatConversionForCopy } from '../../../utils/clipboard';
import { useToast } from '../../../components/Toast';
import { CURRENCY_DEFINITIONS } from '../constants';
import { categorizeHistoryEntry } from '../../../stores/converterStore';

/**
 * Props for ConversionHistory component
 * ConversionHistory 組件的屬性
 */
interface ConversionHistoryProps {
  /** Array of conversion history entries / 轉換歷史記錄陣列 */
  history: ConversionHistoryEntry[];
  /** Callback when user double-clicks to reconvert / 使用者雙擊重新轉換時的回調 */
  onReconvert?: (entry: ConversionHistoryEntry) => void;
  /** Callback to clear all history / 清除所有歷史記錄的回調 */
  onClearAll?: () => void;
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

  /**
   * Copy conversion result to clipboard
   * 複製轉換結果到剪貼簿
   *
   * @param entry - Conversion history entry to copy / 要複製的轉換歷史記錄
   */
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

  /**
   * Handle single click - copy to clipboard
   * 處理單擊 - 複製到剪貼簿
   */
  const handleClick = useCallback(
    (entry: ConversionHistoryEntry) => {
      if (!isLongPress.current) {
        void handleCopy(entry);
      }
      isLongPress.current = false;
    },
    [handleCopy],
  );

  /**
   * Handle double click - reconvert
   * 處理雙擊 - 重新轉換
   */
  const handleDoubleClick = useCallback(
    (entry: ConversionHistoryEntry) => {
      onReconvert?.(entry);
    },
    [onReconvert],
  );

  /**
   * Handle touch start - start long press timer
   * 處理觸控開始 - 啟動長按計時器
   */
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

  /**
   * Handle touch end - clear long press timer
   * 處理觸控結束 - 清除長按計時器
   */
  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  /**
   * Handle keyboard events for accessibility (Enter to copy, Shift+Enter to reconvert)
   * 處理鍵盤事件以支援無障礙（Enter 複製，Shift+Enter 重新轉換）
   *
   * @param event - Keyboard event / 鍵盤事件
   * @param entry - Conversion history entry / 轉換歷史記錄
   */
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
            className="card p-4 flex items-center gap-3 group transition-all duration-200
                     hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-label={t('conversionHistory.entryAriaLabel', {
              from: item.from,
              to: item.to,
              amount: item.amount,
              result: item.result,
            })}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReconvert?.(item);
              }}
              onTouchStart={() => handleTouchStart(item)}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              className="flex items-center -space-x-2 flex-shrink-0 p-1 -m-1 rounded-lg
                       hover:bg-primary/10 active:scale-95 transition-all cursor-pointer"
              aria-label={t('conversionHistory.reconvertAriaLabel', {
                from: item.from,
                to: item.to,
              })}
            >
              <span className="text-xl z-10">{CURRENCY_DEFINITIONS[item.from]?.flag || '💱'}</span>
              <span className="text-xl">{CURRENCY_DEFINITIONS[item.to]?.flag || '💱'}</span>
            </button>

            <button
              onClick={() => handleClick(item)}
              onDoubleClick={() => handleDoubleClick(item)}
              className="flex-1 min-w-0 flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
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
                <span className="text-[10px] text-text-muted opacity-60 block mt-0.5">
                  {item.time}
                  {categoryLabel ? ` · ${categoryLabel}` : ''}
                </span>
              </div>

              <div className="flex items-center gap-1 text-text-muted opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                <Copy size={14} />
                <span className="hidden sm:inline text-[10px]">{t('common.copy')}</span>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
};
