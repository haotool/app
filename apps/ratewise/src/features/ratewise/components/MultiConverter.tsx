/**
 * MultiConverter Component - Multi-Currency Converter with Favorites
 * 多幣別轉換器組件 - 支援收藏功能
 *
 * @description Multi-currency converter with star favorite toggle on the left,
 *              fixed flag aspect ratio, and SSOT design tokens.
 *              支援左側星號收藏切換、固定國旗比例、SSOT 設計 Token。
 * @version 2.0.0
 */

import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Star } from 'lucide-react';
import { activeHighlight } from '../../../config/animations';
import { CURRENCY_DEFINITIONS, CURRENCY_QUICK_AMOUNTS } from '../constants';
import type { CurrencyCode, MultiAmountsState, RateType } from '../types';
import type { RateDetails } from '../hooks/useExchangeRates';
import { formatExchangeRate, formatAmountDisplay } from '../../../utils/currencyFormatter';
import { RateTypeTooltip } from '../../../components/RateTypeTooltip';
import { CalculatorKeyboard } from '../../calculator/components/CalculatorKeyboard';
import { useCalculatorModal } from '../hooks/useCalculatorModal';

interface MultiConverterProps {
  sortedCurrencies: CurrencyCode[];
  multiAmounts: MultiAmountsState;
  baseCurrency: CurrencyCode;
  rateType: RateType;
  details?: Record<string, RateDetails>;
  favorites: CurrencyCode[];
  onAmountChange: (code: CurrencyCode, value: string) => void;
  onQuickAmount: (amount: number) => void;
  onRateTypeChange: (type: RateType) => void;
  onBaseCurrencyChange: (code: CurrencyCode) => void;
  onToggleFavorite: (code: CurrencyCode) => void;
}

export const MultiConverter = ({
  sortedCurrencies,
  multiAmounts,
  baseCurrency,
  rateType,
  details,
  favorites,
  onAmountChange,
  onQuickAmount,
  onRateTypeChange,
  onBaseCurrencyChange,
  onToggleFavorite,
}: MultiConverterProps) => {
  const { t } = useTranslation();
  const inputRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 🔧 計算機 Modal 狀態（使用統一的 Hook）
  const calculator = useCalculatorModal<CurrencyCode>({
    onConfirm: (currency, result) => {
      onAmountChange(currency, result.toString());
    },
    getInitialValue: (currency) => {
      // 使用當前貨幣的實際金額，如果為空或無效則使用 0
      const value = multiAmounts[currency];
      const parsed = parseFloat(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    },
  });

  // 檢測某個貨幣是否只有單一匯率類型（只有現金或只有即期）
  const hasOnlyOneRateType = (
    currency: CurrencyCode,
  ): { hasOnlyOne: boolean; availableType: RateType | null; reason: string } => {
    const detail = details?.[currency];
    if (!detail) {
      return { hasOnlyOne: false, availableType: null, reason: '' };
    }

    const hasSpot = detail.spot?.sell != null;
    const hasCash = detail.cash?.sell != null;

    if (hasSpot && !hasCash) {
      return {
        hasOnlyOne: true,
        availableType: 'spot',
        reason: t('multiConverter.spotOnlyNote', { code: currency }),
      };
    }
    if (hasCash && !hasSpot) {
      return {
        hasOnlyOne: true,
        availableType: 'cash',
        reason: t('multiConverter.cashOnlyNote', { code: currency }),
      };
    }
    return { hasOnlyOne: false, availableType: null, reason: '' };
  };

  // 取得匯率顯示資訊（支援任意基準貨幣的交叉匯率計算）
  const getRateDisplay = (currency: CurrencyCode): string => {
    // 基準貨幣直接顯示「基準貨幣」
    if (currency === baseCurrency) {
      return t('multiConverter.baseCurrency');
    }

    // 特殊處理：TWD 作為基準貨幣（API 原生支援）
    if (baseCurrency === 'TWD') {
      const detail = details?.[currency];
      if (!detail) return t('multiConverter.calculating');

      let rate = detail[rateType]?.sell;
      if (rate == null) {
        const fallbackType = rateType === 'spot' ? 'cash' : 'spot';
        rate = detail[fallbackType]?.sell;
        if (rate == null) return t('multiConverter.noData');
      }

      // API 提供：1 外幣 = rate TWD，需反向計算：1 TWD = 1/rate 外幣
      const reverseRate = 1 / rate;
      return `1 TWD = ${formatExchangeRate(reverseRate)} ${currency}`;
    }

    // 特殊處理：目標貨幣是 TWD（反向匯率）
    if (currency === 'TWD') {
      const baseDetail = details?.[baseCurrency];
      if (!baseDetail) return t('multiConverter.calculating');

      let rate = baseDetail[rateType]?.sell;
      if (rate == null) {
        const fallbackType = rateType === 'spot' ? 'cash' : 'spot';
        rate = baseDetail[fallbackType]?.sell;
        if (rate == null) return t('multiConverter.noData');
      }

      // API 提供：1 外幣 = rate TWD，直接顯示
      return `1 ${baseCurrency} = ${formatExchangeRate(rate)} TWD`;
    }

    // 一般情況：基準貨幣是外幣（需計算交叉匯率）
    const baseDetail = details?.[baseCurrency];
    const targetDetail = details?.[currency];

    if (!baseDetail || !targetDetail) return t('multiConverter.calculating');

    // 獲取基準貨幣和目標貨幣對 TWD 的匯率
    let baseRate = baseDetail[rateType]?.sell;
    let targetRate = targetDetail[rateType]?.sell;

    // Fallback 機制（例如 KRW 只有現金匯率）
    if (baseRate == null) {
      const fallbackType = rateType === 'spot' ? 'cash' : 'spot';
      baseRate = baseDetail[fallbackType]?.sell;
    }
    if (targetRate == null) {
      const fallbackType = rateType === 'spot' ? 'cash' : 'spot';
      targetRate = targetDetail[fallbackType]?.sell;
    }

    if (baseRate == null || targetRate == null) return t('multiConverter.noData');

    // 計算交叉匯率：1 基準貨幣 = (baseRate / targetRate) 目標貨幣
    const crossRate = baseRate / targetRate;
    return `1 ${baseCurrency} = ${formatExchangeRate(crossRate)} ${currency}`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 快速金額按鈕
       *
       * SSOT 設計規範：中性變體（所有轉換器一致）
       * @see design-tokens.ts - quickAmountButtonTokens
       *
       * 響應式設計（行動端單行水平滾動）：
       * - min-w-0：允許 flex 子元素收縮到內容尺寸以下，避免擠壓父容器
       *   @reference [context7:/websites/tailwindcss:overflow-wrap:min-width:2026-01-27]
       * - overflow-x-auto：內容溢出時啟用水平滾動
       * - scrollbar-hide：隱藏滾動條保持簡潔美觀
       * - -webkit-overflow-scrolling: touch：iOS 慣性滾動
       *
       * 互動狀態：
       * - 預設：抬升表面背景 + 柔和文字
       * - 懸停：主色調淡化 + 主色文字 + 微幅放大
       * - 按壓：主色調加深 + 縮放回饋
       */}
      <div className="flex gap-2 mb-4 min-w-0 overflow-x-auto scrollbar-hide [overflow-y:hidden] [-webkit-overflow-scrolling:touch]">
        {(CURRENCY_QUICK_AMOUNTS[baseCurrency] || CURRENCY_QUICK_AMOUNTS.TWD).map(
          (amount: number) => (
            <button
              key={amount}
              onClick={() => {
                onQuickAmount(amount);
                if ('vibrate' in navigator) {
                  navigator.vibrate(30);
                }
              }}
              className="
                flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-semibold
                bg-surface-elevated text-text/70
                hover:bg-primary/10 hover:text-primary
                active:bg-primary/20 active:text-primary
                transition-all duration-200 ease-out
                hover:scale-[1.03] active:scale-[0.97]
                hover:shadow-md active:shadow-sm
              "
            >
              {amount.toLocaleString()}
            </button>
          ),
        )}
      </div>

      {/* 貨幣列表 - SSOT 風格
       *
       * Ring Overflow 處理：
       * 基準貨幣使用 ring-2 (2px box-shadow) 高亮顯示，
       * 需要在四個方向預留空間以避免被父容器裁剪。
       * 使用 -m-0.5 p-0.5 (2px) 確保 ring 完整顯示。
       *
       * 滾動由 AppLayout 統一處理，此處移除 overflow-y-auto 避免嵌套滾動
       * flex-1 讓列表填滿可用空間
       * @see AppLayout.tsx - main 區域處理 overflow-y-auto
       * @see https://tailwindcss.com/docs/ring-width
       */}
      <div
        className="flex-1 space-y-2 -m-0.5 p-0.5"
        tabIndex={0}
        role="region"
        aria-label={t('multiConverter.currencyListLabel')}
        data-testid="multi-currency-list"
      >
        <AnimatePresence>
          {sortedCurrencies.map((code) => {
            const isBase = code === baseCurrency;
            return (
              <div
                key={code}
                onClick={() => {
                  if (!isBase) {
                    onBaseCurrencyChange(code);
                  }
                }}
                className={`${activeHighlight.itemBaseClass} transition-colors duration-200 ${
                  isBase ? activeHighlight.itemActiveClass : activeHighlight.itemInactiveClass
                }`}
              >
                {/* 基準貨幣滑動高亮指示器 - layoutId 驅動平滑過渡 */}
                {isBase && (
                  <motion.div
                    layoutId="base-currency-highlight"
                    className={activeHighlight.highlightClass}
                    transition={activeHighlight.transition}
                  />
                )}
                {/* 左側：星號收藏 + 國旗 + 貨幣資訊（z-10 確保在高亮層上方） */}
                <div className="relative z-10 flex items-center gap-2 flex-shrink-0 min-w-0">
                  {/* 收藏星號 - 固定寬度確保對齊 */}
                  <div className="w-6 flex-shrink-0 flex items-center justify-center">
                    {favorites.includes(code) ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(code);
                        }}
                        className="p-0.5 transition-transform hover:scale-110"
                        aria-label={t('favorites.removeFavorite')}
                      >
                        <Star className="w-4 h-4 text-favorite fill-favorite" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(code);
                        }}
                        className="p-0.5 opacity-30 hover:opacity-60 transition-opacity"
                        aria-label={t('favorites.addFavorite')}
                      >
                        <Star className="w-4 h-4 text-text-muted" />
                      </button>
                    )}
                  </div>
                  {/* 國旗 - 使用固定寬度避免變形 */}
                  <span className="text-xl flex-shrink-0 w-7 text-center leading-none">
                    {CURRENCY_DEFINITIONS[code].flag}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm leading-tight">{code}</div>
                    <div className="text-[11px] opacity-60 leading-tight truncate">
                      {t(`currencies.${code}`)}
                    </div>
                  </div>
                </div>

                {/* 右側：金額 + 匯率資訊（z-10 確保在高亮層上方） */}
                <div className="relative z-10 flex-1 min-w-0 ml-2">
                  <div
                    ref={(el) => {
                      inputRefs.current[code] = el;
                    }}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      calculator.openCalculator(code);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        calculator.openCalculator(code);
                      }
                    }}
                    className="text-right text-base font-bold leading-tight cursor-pointer transition hover:opacity-80"
                    aria-label={t('multiConverter.amountClickCalculator', {
                      name: t(`currencies.${code}`),
                      code,
                    })}
                  >
                    {formatAmountDisplay(multiAmounts[code] ?? '', code) || '0.00'}
                  </div>
                  <div className="text-[11px] text-right leading-tight opacity-70 mt-0.5">
                    {(() => {
                      const rateTypeInfo = hasOnlyOneRateType(code);
                      const isDisabled = rateTypeInfo.hasOnlyOne;
                      const displayType = rateTypeInfo.availableType ?? rateType;

                      return isDisabled ? (
                        <RateTypeTooltip message={rateTypeInfo.reason} isDisabled={true}>
                          <button
                            className="font-medium opacity-60 cursor-help hover:opacity-80 transition-opacity"
                            aria-label={rateTypeInfo.reason}
                          >
                            {displayType === 'spot'
                              ? t('multiConverter.spotRate')
                              : t('multiConverter.cashRate')}
                          </button>
                        </RateTypeTooltip>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRateTypeChange(rateType === 'spot' ? 'cash' : 'spot');
                          }}
                          className="font-semibold text-primary hover:text-primary-hover transition-colors"
                          aria-label={
                            rateType === 'spot'
                              ? t('multiConverter.switchToCash')
                              : t('multiConverter.switchToSpot')
                          }
                        >
                          {rateType === 'spot'
                            ? t('multiConverter.spotRate')
                            : t('multiConverter.cashRate')}
                        </button>
                      );
                    })()}
                    <span className="opacity-80"> · {getRateDisplay(code)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 計算機鍵盤 */}
      <CalculatorKeyboard
        isOpen={calculator.isOpen}
        onClose={calculator.closeCalculator}
        onConfirm={calculator.handleConfirm}
        initialValue={calculator.initialValue}
      />
    </div>
  );
};
