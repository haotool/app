import { useRef } from 'react';
import { Star } from 'lucide-react';
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
      return { hasOnlyOne: true, availableType: 'spot', reason: `${currency} 僅提供即期匯率` };
    }
    if (hasCash && !hasSpot) {
      return { hasOnlyOne: true, availableType: 'cash', reason: `${currency} 僅提供現金匯率` };
    }
    return { hasOnlyOne: false, availableType: null, reason: '' };
  };

  // 取得匯率顯示資訊（支援任意基準貨幣的交叉匯率計算）
  const getRateDisplay = (currency: CurrencyCode): string => {
    // 基準貨幣直接顯示「基準貨幣」
    if (currency === baseCurrency) {
      return '基準貨幣';
    }

    // 特殊處理：TWD 作為基準貨幣（API 原生支援）
    if (baseCurrency === 'TWD') {
      const detail = details?.[currency];
      if (!detail) return '計算中...';

      let rate = detail[rateType]?.sell;
      if (rate == null) {
        const fallbackType = rateType === 'spot' ? 'cash' : 'spot';
        rate = detail[fallbackType]?.sell;
        if (rate == null) return '無資料';
      }

      // API 提供：1 外幣 = rate TWD，需反向計算：1 TWD = 1/rate 外幣
      const reverseRate = 1 / rate;
      return `1 TWD = ${formatExchangeRate(reverseRate)} ${currency}`;
    }

    // 特殊處理：目標貨幣是 TWD（反向匯率）
    // 例如：基準貨幣是 CNY，目標貨幣是 TWD
    // 已知：1 CNY = 4.41 TWD
    // 顯示：1 CNY = 4.41 TWD
    if (currency === 'TWD') {
      const baseDetail = details?.[baseCurrency];
      if (!baseDetail) return '計算中...';

      let rate = baseDetail[rateType]?.sell;
      if (rate == null) {
        const fallbackType = rateType === 'spot' ? 'cash' : 'spot';
        rate = baseDetail[fallbackType]?.sell;
        if (rate == null) return '無資料';
      }

      // API 提供：1 外幣 = rate TWD，直接顯示
      return `1 ${baseCurrency} = ${formatExchangeRate(rate)} TWD`;
    }

    // 一般情況：基準貨幣是外幣（需計算交叉匯率）
    // 例如：基準貨幣是 USD，要顯示 JPY 的匯率
    // 已知：1 USD = 30.97 TWD, 1 JPY = 0.204 TWD
    // 計算：1 USD = (30.97 / 0.204) JPY = 151.8 JPY
    const baseDetail = details?.[baseCurrency];
    const targetDetail = details?.[currency];

    if (!baseDetail || !targetDetail) return '計算中...';

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

    if (baseRate == null || targetRate == null) return '無資料';

    // 計算交叉匯率：1 基準貨幣 = (baseRate / targetRate) 目標貨幣
    const crossRate = baseRate / targetRate;
    return `1 ${baseCurrency} = ${formatExchangeRate(crossRate)} ${currency}`;
  };

  return (
    <>
      <div className="mb-3">
        <label className="block text-sm font-medium text-neutral-text-secondary mb-2">
          即時多幣別換算{' '}
          <span className="text-xs text-neutral-text-secondary">（點擊 ⭐ 可加入常用）</span>
        </label>
        <div className="flex gap-2 mb-3 flex-wrap">
          {(CURRENCY_QUICK_AMOUNTS[baseCurrency] || CURRENCY_QUICK_AMOUNTS.TWD).map(
            (amount: number) => (
              <button
                key={amount}
                onClick={() => onQuickAmount(amount)}
                className="px-3 py-1 bg-neutral-light hover:bg-primary-light rounded-lg text-sm font-medium transition"
              >
                {amount.toLocaleString()}
              </button>
            ),
          )}
        </div>
      </div>

      <div
        className="flex-grow overflow-y-auto space-y-2 pr-2"
        tabIndex={0}
        role="region"
        aria-label="貨幣列表"
      >
        {sortedCurrencies.map((code) => {
          const isFavorite = favorites.includes(code);
          return (
            <div
              key={code}
              onClick={() => {
                if (code !== baseCurrency) {
                  onBaseCurrencyChange(code);
                }
              }}
              className={`flex items-center justify-between p-3 rounded-xl transition ${
                code === baseCurrency
                  ? 'bg-gradient-to-r from-highlight-from to-highlight-to cursor-default'
                  : 'bg-gradient-to-r from-brand-from to-brand-to cursor-pointer hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(code);
                  }}
                  className="hover:scale-110 transition"
                  type="button"
                  aria-label={isFavorite ? `移除常用貨幣 ${code}` : `加入常用貨幣 ${code}`}
                  title={isFavorite ? `移除常用貨幣 ${code}` : `加入常用貨幣 ${code}`}
                >
                  <Star
                    className={isFavorite ? 'text-favorite' : 'text-gray-300'}
                    size={18}
                    fill={isFavorite ? 'currentColor' : 'none'}
                  />
                </button>
                <span className="text-2xl">{CURRENCY_DEFINITIONS[code].flag}</span>
                <div>
                  <div className="font-semibold text-neutral-text">{code}</div>
                  <div className="text-xs text-neutral-text-secondary">
                    {CURRENCY_DEFINITIONS[code].name}
                  </div>
                </div>
              </div>
              <div className="flex-grow ml-3 relative">
                <div
                  ref={(el) => {
                    inputRefs.current[code] = el;
                  }}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation(); // 防止觸發行 onClick（切換基準貨幣）
                    calculator.openCalculator(code);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      calculator.openCalculator(code);
                    }
                  }}
                  className="w-full text-right pr-3 pl-3 py-2 text-lg font-bold rounded-lg bg-transparent transition cursor-pointer focus:outline-none"
                  aria-label={`${CURRENCY_DEFINITIONS[code].name} (${code}) 金額，點擊開啟計算機`}
                >
                  {formatAmountDisplay(multiAmounts[code] ?? '', code) || '0.00'}
                </div>
                <div className="text-xs text-right mt-0.5">
                  {(() => {
                    const rateTypeInfo = hasOnlyOneRateType(code);
                    const isDisabled = rateTypeInfo.hasOnlyOne;
                    const displayType = rateTypeInfo.availableType ?? rateType;

                    return isDisabled ? (
                      <RateTypeTooltip message={rateTypeInfo.reason} isDisabled={true}>
                        <button
                          className="font-medium text-neutral-text-muted cursor-help hover:text-neutral-text-secondary transition-colors"
                          aria-label={rateTypeInfo.reason}
                        >
                          {displayType === 'spot' ? '即期' : '現金'}
                        </button>
                      </RateTypeTooltip>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRateTypeChange(rateType === 'spot' ? 'cash' : 'spot');
                        }}
                        className={`font-medium transition-colors hover:opacity-80 ${
                          rateType === 'spot' ? 'text-brand-button-to' : 'text-brand-button-from'
                        }`}
                        aria-label={`切換到${rateType === 'spot' ? '現金' : '即期'}匯率`}
                      >
                        {rateType === 'spot' ? '即期' : '現金'}
                      </button>
                    );
                  })()}
                  <span className="text-neutral-text-muted"> · {getRateDisplay(code)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔧 計算機 Modal */}
      {/* [fix:2025-12-25] 始終渲染 CalculatorKeyboard，讓彩蛋在計算機關閉後仍可顯示 */}
      <CalculatorKeyboard
        isOpen={calculator.isOpen}
        onClose={calculator.closeCalculator}
        onConfirm={calculator.handleConfirm}
        initialValue={calculator.initialValue}
      />
    </>
  );
};
