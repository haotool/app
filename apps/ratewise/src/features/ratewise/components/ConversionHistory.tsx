/**
 * ConversionHistory Component - 轉換歷史記錄組件
 *
 * @description ParkKeeper 風格的轉換歷史列表
 *              支援點擊重新轉換、複製結果、鍵盤無障礙
 * @version 2.0.0
 */

import { Copy, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ConversionHistoryEntry } from '../types';
import { copyToClipboard, formatConversionForCopy } from '../../../utils/clipboard';
import { useToast } from '../../../components/Toast';
import { CURRENCY_DEFINITIONS } from '../constants';

interface ConversionHistoryProps {
  history: ConversionHistoryEntry[];
  onReconvert?: (entry: ConversionHistoryEntry) => void;
  onClearAll?: () => void;
}

export const ConversionHistory = ({ history, onReconvert }: ConversionHistoryProps) => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  if (history.length === 0) {
    return null;
  }

  /** 複製轉換結果到剪貼簿 */
  const handleCopy = async (entry: ConversionHistoryEntry) => {
    const text = formatConversionForCopy(entry);
    const success = await copyToClipboard(text);
    if (success) {
      showToast(t('common.copied'), 'success');
    } else {
      showToast(t('conversionHistory.copyFailed'), 'error');
    }
  };

  /** 處理鍵盤事件（Enter/Space 重新轉換） */
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    entry: ConversionHistoryEntry,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onReconvert?.(entry);
    }
  };

  return (
    <div className="space-y-2">
      {history.map((item, index) => (
        <div
          key={`${index}-${item.timestamp}`}
          onClick={() => onReconvert?.(item)}
          onKeyDown={(e) => handleKeyDown(e, item)}
          role="button"
          tabIndex={0}
          className="card p-4 flex items-center justify-between group transition-all duration-200
                     hover:shadow-md cursor-pointer active:scale-[0.99]
                     focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label={t('conversionHistory.reconvertAriaLabel', {
            amount: item.amount,
            from: item.from,
            to: item.to,
          })}
        >
          {/* 左側：貨幣旗幟與轉換資訊 */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* 來源貨幣旗幟 */}
            <div className="flex items-center -space-x-2">
              <span className="text-xl z-10">{CURRENCY_DEFINITIONS[item.from]?.flag || '💱'}</span>
              <span className="text-xl">{CURRENCY_DEFINITIONS[item.to]?.flag || '💱'}</span>
            </div>

            {/* 轉換詳情 */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-bold">
                <span className="truncate">{item.amount}</span>
                <span className="text-text-muted">{item.from}</span>
                <ArrowRight size={12} className="text-text-muted flex-shrink-0" />
                <span className="text-primary truncate">{item.result}</span>
                <span className="text-primary">{item.to}</span>
              </div>
              <span className="text-[10px] text-text-muted opacity-60">{item.time}</span>
            </div>
          </div>

          {/* 右側：操作按鈕 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 複製按鈕 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                void handleCopy(item);
              }}
              className="p-2 rounded-lg opacity-40 group-hover:opacity-100 
                         hover:bg-primary/10 transition-all"
              aria-label={t('conversionHistory.copyAriaLabel')}
              tabIndex={0}
            >
              <Copy size={14} className="text-text-muted" />
            </button>

            {/* 重新轉換提示 */}
            <span className="text-[10px] font-bold opacity-0 group-hover:opacity-60 transition text-primary">
              {t('favorites.clickToConvert')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
