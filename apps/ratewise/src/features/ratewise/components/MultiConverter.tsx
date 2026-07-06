import { Suspense, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { quickAmountButtonTokens } from '../../../config/design-tokens';
import { motion, AnimatePresence } from 'motion/react';
import { Star } from 'lucide-react';
import { activeHighlight } from '../../../config/animations';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { CURRENCY_DEFINITIONS, CURRENCY_QUICK_AMOUNTS, DEFAULT_RATE_SOURCE } from '../constants';
import type { CurrencyCode, MultiAmountsState, RateMode, RateSource, RateType } from '../types';
import type { RateDetails } from '../hooks/useExchangeRates';
import { formatExchangeRate, formatAmountDisplay } from '../../../utils/currencyFormatter';
import { RateTypeTooltip } from '../../../components/RateTypeTooltip';
import { useCalculatorModal } from '../hooks/useCalculatorModal';
import {
  getPairRateTypeAvailability,
  resolveRateTypeByAvailability,
  getUnitExchangeRate,
} from '../../../utils/exchangeRateCalculation';
import {
  getExchangeShopRateForPair,
  type ExchangeShopRatesByCurrency,
} from '../../../services/moneyboxRateService';
import { CalculatorKeyboard } from '../../calculator/components/CalculatorKeyboard';

type UnifiedRateOption = 'spot' | 'cash' | 'exchange-shop';

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
  onRateSourceChange?: (source: RateSource) => void;
  onBaseCurrencyChange: (code: CurrencyCode) => void;
  onToggleFavorite: (code: CurrencyCode) => void;
}

export const MultiConverter = ({
  sortedCurrencies,
  multiAmounts,
  baseCurrency,
  rateType,
  rateMode,
  rateSource = DEFAULT_RATE_SOURCE,
  details,
  exchangeShopRatesByCurrency = {},
  favorites,
  onAmountChange,
  onQuickAmount,
  onRateTypeChange,
  onRateSourceChange,
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

  const getUnifiedRateAvailability = (
    currency: CurrencyCode,
  ): {
    spot: boolean;
    cash: boolean;
    exchangeShop: boolean;
    current: UnifiedRateOption;
    availableCount: number;
  } => {
    const bankAvailability = getPairRateTypeAvailability(baseCurrency, currency, details);
    const hasExchangeShop =
      getExchangeShopRateForPair(baseCurrency, currency, exchangeShopRatesByCurrency) !== null;
    const resolvedRateType = resolveRateTypeByAvailability(rateType, bankAvailability);

    const current: UnifiedRateOption =
      rateSource === 'exchange-shop' && hasExchangeShop
        ? 'exchange-shop'
        : resolvedRateType === 'spot'
          ? 'spot'
          : 'cash';

    const availableCount =
      (bankAvailability.spot ? 1 : 0) + (bankAvailability.cash ? 1 : 0) + (hasExchangeShop ? 1 : 0);

    return {
      spot: bankAvailability.spot,
      cash: bankAvailability.cash,
      exchangeShop: hasExchangeShop,
      current,
      availableCount,
    };
  };

  const handleUnifiedSelect = (next: UnifiedRateOption) => {
    if (next === 'exchange-shop') {
      onRateSourceChange?.('exchange-shop');
    } else {
      if (rateSource === 'exchange-shop') {
        onRateSourceChange?.('bank');
      }
      onRateTypeChange(next);
    }
  };

  const getOptionLabel = (option: UnifiedRateOption): string => {
    switch (option) {
      case 'spot':
        return t('multiConverter.spotRate');
      case 'cash':
        return t('multiConverter.cashRate');
      case 'exchange-shop':
        return t('singleConverter.exchangeShopRate');
    }
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
      <div className="flex gap-2 mb-4 min-w-0 overflow-x-auto snap-x snap-proximity scrollbar-hide [overflow-y:hidden] [-webkit-overflow-scrolling:touch]">
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
              className={quickAmountButtonTokens.pattern}
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
                        className="-m-2 p-2.5 cursor-pointer transition-transform active:scale-95"
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
                        className="-m-2 p-2.5 cursor-pointer transition-colors"
                        aria-label={t('favorites.addFavorite')}
                      >
                        <Star className="w-4 h-4 text-text-muted/50 hover:text-favorite transition-colors" />
                      </button>
                    )}
                  </div>
                  <span className="text-xl flex-shrink-0 w-7 text-center leading-none">
                    {CURRENCY_DEFINITIONS[code].flag}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm leading-tight">{code}</div>
                    <div className="text-2xs font-medium text-text leading-tight truncate">
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
                  <div className="flex flex-wrap items-center justify-end gap-x-1 text-2xs text-right leading-tight text-text mt-0.5">
                    {(() => {
                      const availability = getUnifiedRateAvailability(code);
                      const canToggle = availability.availableCount > 1;

                      const availableOptions = (
                        ['spot', 'cash', 'exchange-shop'] as UnifiedRateOption[]
                      ).filter(
                        (option) =>
                          (option === 'spot' && availability.spot) ||
                          (option === 'cash' && availability.cash) ||
                          (option === 'exchange-shop' && availability.exchangeShop),
                      );

                      return canToggle ? (
                        // SegmentedControl sm：radiogroup 語意，44px 熱區由負邊距補償不撐高列高。
                        <span
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <SegmentedControl
                            size="sm"
                            value={availability.current}
                            onChange={handleUnifiedSelect}
                            ariaLabel={`${code} ${t('singleConverter.rateTypeGroup')}`}
                            options={availableOptions.map((option) => ({
                              value: option,
                              label: getOptionLabel(option),
                            }))}
                          />
                        </span>
                      ) : (
                        <RateTypeTooltip
                          message={t('multiConverter.onlyOneRateAvailable')}
                          isDisabled={true}
                        >
                          <button
                            className="font-medium text-text cursor-help"
                            aria-label={t('multiConverter.onlyOneRateAvailable')}
                          >
                            {getOptionLabel(availability.current)}
                          </button>
                        </RateTypeTooltip>
                      );
                    })()}
                    <span> · {getRateDisplay(code)}</span>
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
