import { Suspense, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Star } from 'lucide-react';
import { activeHighlight } from '../../../config/animations';
import { CURRENCY_DEFINITIONS, CURRENCY_QUICK_AMOUNTS } from '../constants';
import type { CurrencyCode, MultiAmountsState, RateMode, RateSource, RateType } from '../types';
import type { RateDetails } from '../hooks/useExchangeRates';
import { formatExchangeRate, formatAmountDisplay } from '../../../utils/currencyFormatter';
import { RateTypeTooltip } from '../../../components/RateTypeTooltip';
import { useCalculatorModal } from '../hooks/useCalculatorModal';
import {
  getCurrencyRateTypeAvailability,
  getUnitExchangeRate,
} from '../../../utils/exchangeRateCalculation';
import {
  getExchangeShopRateForPair,
  type ExchangeShopRatesByCurrency,
} from '../../../services/moneyboxRateService';
import { CalculatorKeyboard } from '../../calculator/components/CalculatorKeyboard';

interface MultiConverterProps {
  sortedCurrencies: CurrencyCode[];
  multiAmounts: MultiAmountsState;
  baseCurrency: CurrencyCode;
  rateType: RateType;
  rateMode: RateMode;
  rateSource?: RateSource;
  details?: Record<string, RateDetails>;
  exchangeShopRatesByCurrency?: ExchangeShopRatesByCurrency;
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
  rateMode,
  rateSource = 'bank',
  details,
  exchangeShopRatesByCurrency = {},
  favorites,
  onAmountChange,
  onQuickAmount,
  onRateTypeChange,
  onBaseCurrencyChange,
  onToggleFavorite,
}: MultiConverterProps) => {
  const { t } = useTranslation();
  const inputRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const calculator = useCalculatorModal<CurrencyCode>({
    onConfirm: (currency, result) => {
      onAmountChange(currency, result.toString());
    },
    getInitialValue: (currency) => {
      const value = multiAmounts[currency];
      const parsed = parseFloat(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    },
  });

  const hasOnlyOneRateType = (
    currency: CurrencyCode,
  ): { hasOnlyOne: boolean; availableType: RateType | null; reason: string } => {
    const availability = getCurrencyRateTypeAvailability(currency, details);
    const hasSpot = availability.spot;
    const hasCash = availability.cash;

    if (!hasSpot && !hasCash) {
      return { hasOnlyOne: false, availableType: null, reason: '' };
    }

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

  const getRateDisplay = (currency: CurrencyCode): string => {
    if (currency === baseCurrency) {
      return t('multiConverter.baseCurrency');
    }

    const hasCurrencyDetails = (code: CurrencyCode) => code === 'TWD' || Boolean(details?.[code]);
    if (!hasCurrencyDetails(baseCurrency) || !hasCurrencyDetails(currency)) {
      return t('multiConverter.calculating');
    }

    const exchangeShopRate = getExchangeShopRateForPair(
      baseCurrency,
      currency,
      exchangeShopRatesByCurrency,
    );
    const unitRate = getUnitExchangeRate(
      baseCurrency,
      currency,
      details,
      rateType,
      rateMode,
      null,
      {
        rateSource,
        exchangeShopRate,
      },
    );
    if (!unitRate) return t('multiConverter.noData');

    return `1 ${baseCurrency} = ${formatExchangeRate(unitRate)} ${currency}`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
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
                {isBase && (
                  <motion.div
                    layoutId="base-currency-highlight"
                    className={activeHighlight.highlightClass}
                    transition={activeHighlight.transition}
                  />
                )}
                <div className="relative z-10 flex items-center gap-2 flex-shrink-0 min-w-0">
                  <div className="w-6 flex-shrink-0 flex items-center justify-center">
                    {code === 'TWD' ? (
                      <div aria-hidden="true" data-testid="twd-star-fixed">
                        <Star className="w-4 h-4 text-favorite fill-favorite" />
                      </div>
                    ) : favorites.includes(code) ? (
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

      <Suspense fallback={null}>
        <CalculatorKeyboard
          isOpen={calculator.isOpen}
          onClose={calculator.closeCalculator}
          onConfirm={calculator.handleConfirm}
          initialValue={calculator.initialValue}
        />
      </Suspense>
    </div>
  );
};
