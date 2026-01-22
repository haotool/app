import { useRef } from 'react';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  favorites: CurrencyCode[];
  rateType: RateType;
  details?: Record<string, RateDetails>;
  onAmountChange: (code: CurrencyCode, value: string) => void;
  onQuickAmount: (amount: number) => void;
  onToggleFavorite: (code: CurrencyCode) => void;
  onRateTypeChange: (type: RateType) => void;
  onBaseCurrencyChange: (code: CurrencyCode) => void;
}

export const MultiConverter = ({
  sortedCurrencies,
  multiAmounts,
  baseCurrency,
  favorites,
  rateType,
  details,
  onAmountChange,
  onQuickAmount,
  onToggleFavorite,
  onRateTypeChange,
  onBaseCurrencyChange,
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
    <>
      {/* 快速金額按鈕 - 簡約風格 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(CURRENCY_QUICK_AMOUNTS[baseCurrency] || CURRENCY_QUICK_AMOUNTS.TWD).map(
          (amount: number) => (
            <button
              key={amount}
              onClick={() => onQuickAmount(amount)}
              className="px-3 py-1.5 bg-surface-soft hover:bg-primary/10 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {amount.toLocaleString()}
            </button>
          ),
        )}
      </div>

      {/* 貨幣列表 - SSOT 風格 */}
      <div
        className="flex-grow overflow-y-auto overflow-x-visible space-y-2 -mx-1 px-1"
        tabIndex={0}
        role="region"
        aria-label={t('multiConverter.currencyListLabel')}
      >
        {sortedCurrencies.map((code) => {
          const isFavorite = favorites.includes(code);
          const isBase = code === baseCurrency;
          return (
            <div
              key={code}
              onClick={() => {
                if (!isBase) {
                  onBaseCurrencyChange(code);
                }
              }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isBase
                  ? 'bg-primary/10 ring-2 ring-primary/30 cursor-default'
                  : 'bg-surface-soft cursor-pointer hover:bg-primary/5 hover:shadow-sm active:scale-[0.99]'
              }`}
            >
              {/* 左側：星星 + 國旗 + 貨幣資訊 */}
              <div className="flex items-center gap-2.5 flex-shrink-0 min-w-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(code);
                  }}
                  className="hover:scale-110 transition flex-shrink-0"
                  type="button"
                  aria-label={
                    isFavorite
                      ? t('multiConverter.removeFavorite', { code })
                      : t('multiConverter.addFavorite', { code })
                  }
                  title={
                    isFavorite
                      ? t('multiConverter.removeFavorite', { code })
                      : t('multiConverter.addFavorite', { code })
                  }
                >
                  <Star
                    className={isFavorite ? 'text-favorite' : 'text-text-muted'}
                    size={16}
                    fill={isFavorite ? 'currentColor' : 'none'}
                  />
                </button>
                <span className="text-xl flex-shrink-0">{CURRENCY_DEFINITIONS[code].flag}</span>
                <div className="min-w-0">
                  <div className="font-semibold text-sm leading-tight">{code}</div>
                  <div className="text-[11px] opacity-60 leading-tight truncate">
                    {t(`currencies.${code}`)}
                  </div>
                </div>
              </div>

              {/* 右側：金額 + 匯率資訊（與左側對齊） */}
              <div className="flex-1 min-w-0 ml-2">
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
      </div>

      {/* 計算機鍵盤 */}
      <CalculatorKeyboard
        isOpen={calculator.isOpen}
        onClose={calculator.closeCalculator}
        onConfirm={calculator.handleConfirm}
        initialValue={calculator.initialValue}
      />
    </>
  );
};
