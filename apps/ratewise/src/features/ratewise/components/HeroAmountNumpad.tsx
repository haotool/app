import { Delete } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { singleConverterLayoutTokens } from '../../../config/design-tokens';
const NUMPAD_KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', 'backspace'] as const;
export function applyHeroAmountKey(current: string, key: string): string {
  if (key === 'backspace') return current.length <= 1 ? '' : current.slice(0, -1);
  if (key === '00') return current === '' || current === '0' ? '0' : current + '00';
  if (current === '0') return key;
  return current + key;
}
interface HeroAmountNumpadProps {
  onKeyPress: (key: string) => void;
  className?: string;
}
export const HeroAmountNumpad = ({ onKeyPress, className = '' }: HeroAmountNumpadProps) => {
  const { t } = useTranslation();
  const tokens = singleConverterLayoutTokens.rateCard;
  return (
    <div
      data-testid="hero-numpad"
      className={`${tokens.heroNumpadGrid} ${className}`.trim()}
      role="group"
      aria-label={t('singleConverter.openCalculator')}
    >
      {NUMPAD_KEYS.map((key) => {
        const isBackspace = key === 'backspace';
        const label = isBackspace
          ? t('singleConverter.numpadBackspace')
          : t('singleConverter.numpadKey', { key });
        return (
          <button
            key={key}
            type="button"
            data-testid={isBackspace ? 'hero-numpad-backspace' : `hero-numpad-key-${key}`}
            className={`${tokens.heroNumpadKey} ${isBackspace ? tokens.heroNumpadKeyDanger : ''}`}
            aria-label={label}
            onClick={() => onKeyPress(key)}
          >
            {isBackspace ? <Delete className="h-5 w-5" aria-hidden="true" /> : key}
          </button>
        );
      })}
    </div>
  );
};
