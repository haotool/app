import { AnimatePresence, motion } from 'motion/react';
import { Banknote, CreditCard, Store, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { segmentedSwitch } from '../../../config/animations';
import { singleConverterLayoutTokens } from '../../../config/design-tokens';
import { RateTypeTooltip } from '../../../components/RateTypeTooltip';
import type { RateSource, RateType } from '../types';
import type { RateTypeAvailability } from '../../../utils/exchangeRateCalculation';

interface RateSelectorProps {
  rateType: RateType;
  rateSource: RateSource;
  rateTypeAvailability: RateTypeAvailability;
  hasExchangeShop: boolean;
  /** 刷卡估算 pill（ADR-002 Phase 1）；flag off 或情境不支援時不渲染（零暴露）。 */
  hasCard?: boolean;
  onRateTypeChange: (type: RateType) => void;
  onRateSourceChange: (source: RateSource) => void;
}

interface BankRateOption {
  value: RateType;
  label: string;
  ariaLabel: string;
  unavailableMessage: string;
  icon: typeof TrendingUp;
}

// 內容驅動佈局（#651 前置）：欄數由子元素數量隱式決定，2/3/4 pills 免改版。
// minmax(max-content,1fr)：空間足夠時等寬，受 max-w 擠壓時退至內容寬下限，文字永不截斷換行。
const PILL_GRID_CLASS = 'inline-grid grid-flow-col auto-cols-[minmax(max-content,1fr)]';

// 熱區與視覺分離（比照 SegmentedControl sm / #644 星號）：
// button 為 44×44 透明熱區（WCAG 2.5.8），-my-[10px] 負邊距抵銷垂直外擴，容器與卡片版面不變。
const PILL_HIT_CLASS =
  '-my-[10px] flex min-h-11 min-w-11 items-center justify-center focus:outline-none group/pill relative';

export const RateSelector = ({
  rateType,
  rateSource,
  rateTypeAvailability,
  hasExchangeShop,
  hasCard = false,
  onRateTypeChange,
  onRateSourceChange,
}: RateSelectorProps) => {
  const { t } = useTranslation();
  const bankRateOptions: BankRateOption[] = [
    {
      value: 'spot',
      label: t('singleConverter.spotRate'),
      ariaLabel: t('singleConverter.switchToSpot'),
      unavailableMessage: t('singleConverter.rateTypeUnavailable', {
        rateType: t('singleConverter.spotRate'),
      }),
      icon: TrendingUp,
    },
    {
      value: 'cash',
      label: t('singleConverter.cashRate'),
      ariaLabel: t('singleConverter.switchToCash'),
      unavailableMessage: t('singleConverter.rateTypeUnavailable', {
        rateType: t('singleConverter.cashRate'),
      }),
      icon: Banknote,
    },
  ];

  // 視覺 pill 維持 24px（h-6）：熱區外擴不改變韓系緊湊視覺。
  const pillVisualClass = (isActive: boolean) =>
    `relative flex h-6 w-full min-w-0 items-center justify-center gap-0.5 whitespace-nowrap leading-none ${singleConverterLayoutTokens.rateCard.rateTypeButton} rounded-full font-semibold group-focus-visible/pill:ring-2 group-focus-visible/pill:ring-primary/50 ${
      isActive ? 'text-white' : 'text-text/70 hover:text-text'
    }`;

  // 實底 pill 使用主色深階（zen 定義 --color-primary-strong），確保白字 WCAG AA 對比。
  const renderIndicator = (isActive: boolean) => (
    <AnimatePresence>
      {isActive && (
        <motion.div
          layoutId="rate-selector-indicator"
          className="absolute inset-0 rounded-full bg-[rgb(var(--color-primary-strong,var(--color-primary)))] shadow-md"
          transition={segmentedSwitch.indicator}
        />
      )}
    </AnimatePresence>
  );

  return (
    <div
      data-testid="rate-selector"
      className={`${PILL_GRID_CLASS} h-7 max-w-[calc(100%_-_1.5rem)] bg-background/80 backdrop-blur-md rounded-full p-0.5 shadow-sm border border-border/60 ${singleConverterLayoutTokens.rateCard.rateTypeContainer}`}
      role="group"
      aria-label={t('singleConverter.rateTypeGroup')}
    >
      {bankRateOptions.map((option) => {
        const Icon = option.icon;
        const isActive = rateSource === 'bank' && rateType === option.value;
        const isUnavailable = !rateTypeAvailability[option.value];
        const optionButton = (
          <motion.button
            key={option.value}
            type="button"
            data-testid="rate-selector-pill"
            onClick={() => {
              if (isUnavailable) return;
              onRateSourceChange('bank');
              onRateTypeChange(option.value);
            }}
            whileHover={isUnavailable ? undefined : segmentedSwitch.item.whileHover}
            whileTap={isUnavailable ? undefined : segmentedSwitch.item.whileTap}
            animate={{ opacity: isActive ? 1 : segmentedSwitch.inactiveOpacity }}
            className={`${PILL_HIT_CLASS} ${isUnavailable ? 'cursor-not-allowed' : ''}`}
            aria-label={option.ariaLabel}
            aria-pressed={isActive}
            // 用 aria-disabled 而非原生 disabled：原生 disabled 會吞掉點擊，
            // RateTypeTooltip 的禁用原因提示將永遠無法觸發（onClick guard 已阻擋切換）。
            aria-disabled={isUnavailable || undefined}
          >
            <span className={`${pillVisualClass(isActive)} ${isUnavailable ? 'opacity-60' : ''}`}>
              {renderIndicator(isActive)}
              <motion.span
                className="relative z-10 inline-flex"
                animate={{ scale: isActive ? segmentedSwitch.activeIconScale : 1 }}
              >
                <Icon
                  className={singleConverterLayoutTokens.rateCard.rateTypeIcon}
                  aria-hidden="true"
                />
              </motion.span>
              <span className="relative z-10 leading-none">{option.label}</span>
            </span>
          </motion.button>
        );

        if (!isUnavailable) {
          return optionButton;
        }

        return (
          // triggerClassName="grid"：讓 pill 在 tooltip 包裝下仍撐滿格軌並免除 inline 基線偏移。
          <RateTypeTooltip
            key={option.value}
            message={option.unavailableMessage}
            isDisabled={true}
            triggerClassName="grid"
          >
            {optionButton}
          </RateTypeTooltip>
        );
      })}

      {hasExchangeShop && (
        <motion.button
          type="button"
          data-testid="rate-selector-pill"
          onClick={() => onRateSourceChange('exchange-shop')}
          whileHover={segmentedSwitch.item.whileHover}
          whileTap={segmentedSwitch.item.whileTap}
          animate={{
            opacity: rateSource === 'exchange-shop' ? 1 : segmentedSwitch.inactiveOpacity,
          }}
          className={PILL_HIT_CLASS}
          aria-pressed={rateSource === 'exchange-shop'}
          aria-label={t('singleConverter.switchToExchangeShop')}
        >
          <span className={pillVisualClass(rateSource === 'exchange-shop')}>
            {renderIndicator(rateSource === 'exchange-shop')}
            <motion.span
              className="relative z-10 inline-flex"
              animate={{
                scale: rateSource === 'exchange-shop' ? segmentedSwitch.activeIconScale : 1,
              }}
            >
              <Store
                className={singleConverterLayoutTokens.rateCard.rateTypeIcon}
                aria-hidden="true"
              />
            </motion.span>
            <span className="relative z-10 leading-none">
              {t('singleConverter.exchangeShopRate')}
            </span>
          </span>
        </motion.button>
      )}

      {/* 刷卡估算 pill（第四選項，ADR-002 Phase 1）：#660 內容驅動佈局直接容納。 */}
      {hasCard && (
        <motion.button
          type="button"
          data-testid="rate-selector-pill"
          onClick={() => onRateSourceChange('card')}
          whileHover={segmentedSwitch.item.whileHover}
          whileTap={segmentedSwitch.item.whileTap}
          animate={{
            opacity: rateSource === 'card' ? 1 : segmentedSwitch.inactiveOpacity,
          }}
          className={PILL_HIT_CLASS}
          aria-pressed={rateSource === 'card'}
          aria-label={t('singleConverter.switchToCard')}
        >
          <span className={pillVisualClass(rateSource === 'card')}>
            {renderIndicator(rateSource === 'card')}
            <motion.span
              className="relative z-10 inline-flex"
              animate={{
                scale: rateSource === 'card' ? segmentedSwitch.activeIconScale : 1,
              }}
            >
              <CreditCard
                className={singleConverterLayoutTokens.rateCard.rateTypeIcon}
                aria-hidden="true"
              />
            </motion.span>
            <span className="relative z-10 leading-none">{t('singleConverter.cardRate')}</span>
          </span>
        </motion.button>
      )}
    </div>
  );
};
