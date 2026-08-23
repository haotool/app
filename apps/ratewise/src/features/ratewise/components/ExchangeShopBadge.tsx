import { AlertTriangle, Store } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { slideUpVariants, transitions } from '../../../config/animations';
import { singleConverterLayoutTokens } from '../../../config/design-tokens';
import {
  getExchangeShopRateAgeHours,
  isExchangeShopRateStale,
  type ExchangeShopRate,
} from '../../../services/moneyboxRateService';

interface ExchangeShopBadgeProps {
  rate: ExchangeShopRate;
}

export function ExchangeShopBadge({ rate }: ExchangeShopBadgeProps) {
  const { t } = useTranslation();
  const tokens = singleConverterLayoutTokens.rateCard;
  // `updateTime` 只是給人看的字串，讀者無從判斷「2026/08/22 08:56」是幾小時前；
  // 過期判定一律以 ISO timestamp 計算，年齡未知時不揭露（寧可不顯示，也不顯示錯誤年齡）。
  const isStale = isExchangeShopRateStale(rate);
  const ageHours = getExchangeShopRateAgeHours(rate);

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
      {isStale && ageHours !== null ? (
        <>
          <span className={tokens.exchangeShopBadgeDot}>•</span>
          {/* role=status 而非 alert：這是持續存在的狀態描述，不是需要打斷使用者的即時事件 */}
          <span className={tokens.exchangeShopBadgeStale} role="status">
            <AlertTriangle className={tokens.exchangeShopBadgeStaleIcon} aria-hidden="true" />
            {t('singleConverter.staleExchangeShopRate', { hours: ageHours })}
          </span>
        </>
      ) : null}
      {rate.isFallback ? (
        <>
          <span className={tokens.exchangeShopBadgeDot}>•</span>
          <span>{t('singleConverter.fallbackRate')}</span>
        </>
      ) : null}
    </motion.div>
  );
}
