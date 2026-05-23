import { AnimatePresence, motion } from 'motion/react';
import { Banknote, Store, TrendingUp } from 'lucide-react';
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

export const RateSelector = ({
  rateType,
  rateSource,
  rateTypeAvailability,
  hasExchangeShop,
  onRateTypeChange,
  onRateSourceChange,
}: RateSelectorProps) => {
  const { t } = useTranslation();
  const optionCountClass = hasExchangeShop
    ? 'grid-cols-3 w-[15rem] compact:w-[14.5rem] tiny:w-[13.75rem] micro:w-[13rem]'
    : 'grid-cols-2 w-[11rem] compact:w-[10.5rem] tiny:w-[10rem] micro:w-[9.5rem]';
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

  const renderIndicator = (isActive: boolean) => (
    <AnimatePresence>
      {isActive && (
        <motion.div
          layoutId="rate-selector-indicator"
          className="absolute inset-0 rounded-full bg-primary shadow-md"
          transition={segmentedSwitch.indicator}
        />
      )}
    </AnimatePresence>
  );

  return (
    <div
      className={`grid h-12 ${optionCountClass} max-w-[calc(100%_-_1.5rem)] rounded-lg border border-border/60 bg-background/80 p-0.5 shadow-sm backdrop-blur-md ${singleConverterLayoutTokens.rateCard.rateTypeContainer}`}
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
            onClick={() => {
              if (isUnavailable) return;
              onRateSourceChange('bank');
              onRateTypeChange(option.value);
            }}
            whileHover={isUnavailable ? undefined : segmentedSwitch.item.whileHover}
            whileTap={isUnavailable ? undefined : segmentedSwitch.item.whileTap}
            animate={{ opacity: isActive ? 1 : segmentedSwitch.inactiveOpacity }}
            className={`relative flex min-h-11 min-w-0 items-center justify-center gap-1 whitespace-nowrap leading-none ${singleConverterLayoutTokens.rateCard.rateTypeButton} rounded-md font-semibold ${
              isActive ? 'text-primary-foreground' : 'text-text/70 hover:text-text'
            } ${isUnavailable ? 'cursor-not-allowed' : ''}`}
            aria-label={option.ariaLabel}
            aria-pressed={isActive}
            disabled={isUnavailable}
          >
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
          </motion.button>
        );

        if (!isUnavailable) {
          return optionButton;
        }

        return (
          <RateTypeTooltip key={option.value} message={option.unavailableMessage} isDisabled={true}>
            {optionButton}
          </RateTypeTooltip>
        );
      })}

      {hasExchangeShop && (
        <motion.button
          type="button"
          onClick={() => onRateSourceChange('exchange-shop')}
          whileHover={segmentedSwitch.item.whileHover}
          whileTap={segmentedSwitch.item.whileTap}
          animate={{
            opacity: rateSource === 'exchange-shop' ? 1 : segmentedSwitch.inactiveOpacity,
          }}
          className={`relative flex min-h-11 min-w-0 items-center justify-center gap-1 whitespace-nowrap leading-none ${singleConverterLayoutTokens.rateCard.rateTypeButton} rounded-md font-semibold ${
            rateSource === 'exchange-shop'
              ? 'text-primary-foreground'
              : 'text-text/70 hover:text-text'
          }`}
          aria-pressed={rateSource === 'exchange-shop'}
          aria-label={t('singleConverter.switchToExchangeShop')}
        >
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
        </motion.button>
      )}
    </div>
  );
};
