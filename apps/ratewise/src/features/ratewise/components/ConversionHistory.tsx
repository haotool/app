/**
 * ConversionHistory Component - 轉換歷史記錄組件
 *
 * [feat:2025-12-26] 增強功能：
 * - 持久化存儲 (localStorage，7 天過期)
 * - 點擊快速重新轉換
 * - 清除全部歷史
 * - 複製轉換結果
 * - 相對時間顯示（今天、昨天、日期）
 * - 懸停視覺反饋
 * - 鍵盤無障礙支援（Enter/Space）
 *
 * 參考: /Users/azlife.eth/.claude/plans/vivid-petting-wozniak.md
 */

import { Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ConversionHistoryEntry } from '../types';
import { copyToClipboard, formatConversionForCopy } from '../../../utils/clipboard';
import { useToast } from '../../../components/Toast';

interface ConversionHistoryProps {
  history: ConversionHistoryEntry[];
  onReconvert?: (entry: ConversionHistoryEntry) => void;
  onClearAll?: () => void;
}

export const ConversionHistory = ({ history, onReconvert, onClearAll }: ConversionHistoryProps) => {
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

  /**
   * 處理鍵盤事件（Enter/Space 重新轉換）
   */
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
    <div className="bg-surface rounded-3xl shadow-xl p-6 mt-4 md:mt-6">
      {/* 標題與清除按鈕 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-text">{t('conversionHistory.title')}</h2>
        {onClearAll && (
          <button
            onClick={onClearAll}
            className="text-sm text-text-muted hover:text-destructive transition-colors"
            aria-label={t('conversionHistory.clearAllAriaLabel')}
          >
            {t('common.clearAll')}
          </button>
        )}
      </div>

      {/* 歷史記錄列表 */}
      <div className="space-y-3">
        {history.map((item, index) => (
          <div
            key={`${index}-${item.timestamp}`}
            onClick={() => onReconvert?.(item)}
            onKeyDown={(e) => handleKeyDown(e, item)}
            role="button"
            tabIndex={0}
            className="flex items-center justify-between p-3 bg-surface-elevated rounded-xl
                       hover:bg-primary/10 hover:shadow-md transition-all cursor-pointer
                       group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={t('conversionHistory.reconvertAriaLabel', {
              amount: item.amount,
              from: item.from,
              to: item.to,
            })}
          >
            {/* 轉換資訊 */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-muted">{item.time}</span>
              <span className="font-semibold text-text">
                {item.amount} {item.from}
              </span>
              <span className="text-text-muted">→</span>
              <span className="font-semibold text-primary">
                {item.result} {item.to}
              </span>
            </div>

            {/* 複製按鈕（懸停時顯示） */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                void handleCopy(item);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity
                         p-2 rounded-lg hover:bg-primary/20 focus:opacity-100"
              aria-label={t('conversionHistory.copyAriaLabel')}
              tabIndex={0}
            >
              <Copy className="w-4 h-4 text-primary" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
