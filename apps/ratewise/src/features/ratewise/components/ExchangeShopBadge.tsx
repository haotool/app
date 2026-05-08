import { Store } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { slideUpVariants, transitions } from '../../../config/animations';
import { singleConverterLayoutTokens } from '../../../config/design-tokens';
import type { ExchangeShopRate } from '../../../services/moneyboxRateService';

interface ExchangeShopBadgeProps {
  rate: ExchangeShopRate;
}

export function ExchangeShopBadge({ rate }: ExchangeShopBadgeProps) {
  const { t } = useTranslation();
  const tokens = singleConverterLayoutTokens.rateCard;

  return (
    <motion.div
      className={tokens.exchangeShopBadge}
      variants={slideUpVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={transitions.gentle}
    >
      <Store className={tokens.exchangeShopBadgeIcon} aria-hidden="true" />
      <span className="font-medium">{rate.providerName}</span>
      <span className={tokens.exchangeShopBadgeDot}>•</span>
      <span>{rate.updateTime}</span>
      <span className={tokens.exchangeShopBadgeDot}>•</span>
      <a
        className={tokens.exchangeShopBadgeLink}
        href={rate.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {rate.source}
      </a>
      {rate.isFallback ? (
        <>
          <span className={tokens.exchangeShopBadgeDot}>•</span>
          <span>{t('singleConverter.fallbackRate')}</span>
        </>
      ) : null}
    </motion.div>
  );
}
