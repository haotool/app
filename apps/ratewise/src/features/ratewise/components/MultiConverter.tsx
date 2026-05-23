import { Suspense, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Star } from 'lucide-react';
import { activeHighlight } from '../../../config/animations';
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
import { quickAmountButtonTokens } from '../../../config/design-tokens';

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
  const inputRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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

  const getNextAvailableOption = (
    availability: ReturnType<typeof getUnifiedRateAvailability>,
  ): UnifiedRateOption | null => {
    const order: UnifiedRateOption[] = ['spot', 'cash', 'exchange-shop'];
    const currentIndex = order.indexOf(availability.current);
    for (let i = 1; i <= order.length; i++) {
      const nextIndex = (currentIndex + i) % order.length;
      const next = order[nextIndex];
      if (
        (next === 'spot' && availability.spot) ||
        (next === 'cash' && availability.cash) ||
        (next === 'exchange-shop' && availability.exchangeShop)
      ) {
        return next;
      }
    }
    return null;
  };

  const handleUnifiedToggle = (currency: CurrencyCode) => {
    const availability = getUnifiedRateAvailability(currency);
    const next = getNextAvailableOption(availability);
    if (!next || next === availability.current) return;

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
      <div className="flex gap-2 mb-4 min-w-0 overflow-x-auto scrollbar-hide [overflow-y:hidden] [-webkit-overflow-scrolling:touch]">
        {(CURRENCY_QUICK_AMOUNTS[baseCurrency] || CURRENCY_QUICK_AMOUNTS.TWD).map(
          (amount: number) => (
            <button
              type="button"
              key={amount}
              onClick={() => {
                onQuickAmount(amount);
                if ('vibrate' in navigator) {
                  navigator.vibrate(30);
                }
              }}
              className={quickAmountButtonTokens.className}
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
                data-testid="multi-currency-row"
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
                  <div className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center">
                    {code === 'TWD' ? (
                      <div aria-hidden="true" data-testid="twd-star-fixed">
                        <Star className="w-4 h-4 text-favorite fill-favorite" />
                      </div>
                    ) : favorites.includes(code) ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(code);
                        }}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 transition-transform hover:scale-110 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={t('favorites.removeFavorite')}
                      >
                        <Star className="w-4 h-4 text-favorite fill-favorite" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(code);
                        }}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 opacity-30 transition-opacity hover:bg-surface-elevated hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={t('favorites.addFavorite')}
                      >
                        <Star className="w-4 h-4 text-text-muted" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isBase) {
                        onBaseCurrencyChange(code);
                      }
                    }}
                    className="flex min-h-11 min-w-0 items-center gap-2 rounded-lg text-left transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-pressed={isBase}
                    aria-label={t('multiConverter.setBaseCurrency', {
                      name: t(`currencies.${code}`),
                      code,
                    })}
                  >
                    <span className="w-7 flex-shrink-0 text-center text-xl leading-none">
                      {CURRENCY_DEFINITIONS[code].flag}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold leading-tight">{code}</span>
                      <span className="block truncate text-xs font-medium leading-tight text-text">
                        {t(`currencies.${code}`)}
                      </span>
                    </span>
                  </button>
                </div>

                <div className="relative z-10 flex-1 min-w-0 ml-2">
                  <button
                    type="button"
                    ref={(el) => {
                      inputRefs.current[code] = el;
                    }}
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
                    className="block min-h-11 w-full cursor-pointer rounded-lg text-right text-base font-bold leading-tight transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label={t('multiConverter.amountClickCalculator', {
                      name: t(`currencies.${code}`),
                      code,
                    })}
                  >
                    {formatAmountDisplay(multiAmounts[code] ?? '', code) || '0.00'}
                  </button>
                  <div className="mt-1 text-right text-xs leading-tight text-text">
                    {(() => {
                      const availability = getUnifiedRateAvailability(code);
                      const nextOption = getNextAvailableOption(availability);
                      const canToggle = availability.availableCount > 1 && nextOption !== null;

                      return canToggle ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnifiedToggle(code);
                          }}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 font-semibold text-primary-dark transition-colors hover:bg-surface-elevated hover:text-primary-darker focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          aria-label={t('multiConverter.switchToNextRate', {
                            next: getOptionLabel(nextOption),
                          })}
                        >
                          {getOptionLabel(availability.current)}
                        </button>
                      ) : (
                        <RateTypeTooltip
                          message={t('multiConverter.onlyOneRateAvailable')}
                          isDisabled={true}
                        >
                          <button
                            type="button"
                            className="inline-flex min-h-11 min-w-11 cursor-help items-center justify-center rounded-lg px-2 font-medium text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
