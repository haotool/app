/**
 * CompassCapsule – 降級方向膠囊（issue #752；自 NavOverlay 純搬移拆出）。
 * deck stage 幾何不足以承載弧模式（矮視高／橫向）時的 56px SSOT 呈現：
 * 方位箭頭（world-locked 旋轉）＋距離＋單位＋方向/對準/抵達文案。
 */
import { motion } from 'motion/react';
import { ArrowUp, Check, Compass, Footprints, Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ThemeConfig } from '@app/park-keeper/types';
import { CAPSULE_HEIGHT } from '@app/park-keeper/services/compassGeometry';
import { ARRIVED_COLOR, ARRIVED_ON_COLOR, ARRIVED_BORDER } from '@app/park-keeper/config/colors';

export interface CompassCapsuleProps {
  theme: ThemeConfig;
  trueAnimHeading: number;
  animTargetBearing: number;
  compassBlocked: boolean;
  hasValidLocation: boolean;
  arrived: boolean;
  aligned: boolean;
  isIndoor: boolean;
  showArrivedCTA: boolean;
  distanceValue: string | number;
  distanceUnit: string;
  directionHint: string;
  onClose: () => void;
}

export default function CompassCapsule({
  theme,
  trueAnimHeading,
  animTargetBearing,
  compassBlocked,
  hasValidLocation,
  arrived,
  aligned,
  isIndoor,
  showArrivedCTA,
  distanceValue,
  distanceUnit,
  directionHint,
  onClose,
}: CompassCapsuleProps) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="compass-capsule"
      className="absolute inset-0 flex items-center justify-center px-4"
    >
      <div
        className="flex items-center gap-3 rounded-full px-5 shadow-lg"
        style={{
          height: CAPSULE_HEIGHT,
          backgroundColor: `${theme.colors.surface}F2`,
          border: `1px solid ${
            arrived ? ARRIVED_BORDER : aligned ? theme.colors.primary : `${theme.colors.text}14`
          }`,
        }}
      >
        {arrived ? (
          <>
            <Check size={22} color={ARRIVED_COLOR} strokeWidth={3} />
            <span
              className="text-sm font-black uppercase tracking-[0.18em]"
              style={{ color: ARRIVED_COLOR }}
            >
              {t('nav.arrived')}
            </span>
            {showArrivedCTA && (
              <button
                type="button"
                onClick={onClose}
                aria-label={t('nav.arrived_close_cta')}
                className="px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-md active:scale-95"
                style={{ backgroundColor: ARRIVED_COLOR, color: ARRIVED_ON_COLOR }}
              >
                {t('nav.close_nav')}
              </button>
            )}
          </>
        ) : compassBlocked ? (
          <Compass size={22} style={{ color: theme.colors.textMuted, opacity: 0.5 }} />
        ) : !hasValidLocation ? (
          <>
            <Navigation size={18} style={{ color: theme.colors.primary }} />
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: theme.colors.textMuted }}
            >
              {t('nav.gps_waiting')}
            </span>
          </>
        ) : (
          <>
            {isIndoor ? (
              <Footprints size={20} style={{ color: theme.colors.primary }} />
            ) : (
              <motion.div
                className="flex"
                animate={{ rotate: animTargetBearing - trueAnimHeading }}
                transition={{ type: 'spring', stiffness: 60, damping: 15 }}
              >
                <ArrowUp
                  size={22}
                  color={aligned ? theme.colors.primary : theme.colors.text}
                  strokeWidth={3}
                />
              </motion.div>
            )}
            <span
              className="text-2xl font-black tabular-nums leading-none"
              style={{ color: aligned ? theme.colors.primary : theme.colors.text }}
            >
              {distanceValue}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: theme.colors.textMuted }}
            >
              {distanceUnit}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: theme.colors.text, opacity: 0.5 }}
              aria-live="polite"
            >
              {isIndoor ? t('nav.indoor_mode') : aligned ? t('nav.aligned') : directionHint}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
