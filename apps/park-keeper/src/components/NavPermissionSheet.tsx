/**
 * NavPermissionSheet – 羅盤權限／校準全覆蓋卡（自 NavOverlay 純搬移拆出）。
 * 全頁覆蓋屬設計意圖：prompt（iOS 手勢授權）、denied（重試引導）、
 * calibrate（8 字校準＋手動重新偵測）三態。
 */
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ThemeConfig } from '@app/park-keeper/types';
import type { CompassPermissionState } from '@app/park-keeper/hooks/useNavigation';
import { WARNING_COLOR } from '@app/park-keeper/config/colors';

// ---------------------------------------------------------------------------
// 8 字校準動畫（SVG lemniscate；reduced-motion 時顯示靜態路徑）
// ---------------------------------------------------------------------------
function CalibrationFigureEight({ color, animate }: { color: string; animate: boolean }) {
  // 雙圓相扣的 8 字路徑（水平 lemniscate 近似）。
  const path =
    'M 60 30 C 60 10, 30 10, 30 30 C 30 50, 60 50, 60 30 C 60 10, 90 10, 90 30 C 90 50, 60 50, 60 30';
  return (
    <svg viewBox="0 0 120 60" className="w-28 h-14" aria-hidden="true">
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.35"
      />
      {animate && (
        <circle r="5" fill={color}>
          <animateMotion dur="2.4s" repeatCount="indefinite" path={path} />
        </circle>
      )}
    </svg>
  );
}

export interface NavPermissionSheetProps {
  theme: ThemeConfig;
  compassBlocked: boolean;
  showCalibration: boolean;
  permissionState: CompassPermissionState;
  requestCompassPermission: () => Promise<void> | void;
  recheckCalibration: () => void;
}

export default function NavPermissionSheet({
  theme,
  compassBlocked,
  showCalibration,
  permissionState,
  requestCompassPermission,
  recheckCalibration,
}: NavPermissionSheetProps) {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {(compassBlocked || showCalibration) && (
        <motion.div
          key={permissionState === 'denied' ? 'denied' : showCalibration ? 'calibrate' : 'prompt'}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="absolute inset-0 z-40 flex items-center justify-center px-6 pointer-events-auto"
          style={{ backgroundColor: `${theme.colors.background}80` }}
        >
          <div
            className="mx-auto w-full max-w-[17rem] rounded-3xl p-5 backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.22)] flex flex-col items-center text-center gap-2"
            style={{
              backgroundColor: `${theme.colors.surface}F0`,
              border: `1px solid ${theme.colors.text}14`,
            }}
          >
            {permissionState === 'prompt' ? (
              <>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: `${theme.colors.primary}1A`,
                    color: theme.colors.primary,
                  }}
                >
                  <Compass size={24} />
                </div>
                <p className="text-sm font-black" style={{ color: theme.colors.text }}>
                  {t('nav.enable_compass_title')}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: theme.colors.textMuted }}>
                  {t('nav.enable_compass_desc')}
                </p>
                <button
                  type="button"
                  onClick={() => void requestCompassPermission()}
                  className="mt-1 w-full min-h-11 px-4 rounded-2xl font-black text-sm text-white shadow-lg active:scale-95 transition-transform"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  {t('nav.enable_compass_cta')}
                </button>
              </>
            ) : permissionState === 'denied' ? (
              <>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${WARNING_COLOR}1A`, color: WARNING_COLOR }}
                >
                  <Compass size={24} />
                </div>
                <p className="text-sm font-black" style={{ color: theme.colors.text }}>
                  {t('nav.permission_denied_title')}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: theme.colors.textMuted }}>
                  {t('nav.permission_denied_desc')}
                </p>
                <button
                  type="button"
                  onClick={() => void requestCompassPermission()}
                  className="mt-1 w-full min-h-11 px-4 rounded-2xl font-black text-sm shadow active:scale-95 transition-transform"
                  style={{
                    backgroundColor: `${theme.colors.text}0D`,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.text}1F`,
                  }}
                >
                  {t('nav.permission_retry')}
                </button>
              </>
            ) : (
              <>
                <CalibrationFigureEight
                  color={theme.colors.primary}
                  animate={!shouldReduceMotion}
                />
                <p className="text-sm font-black" style={{ color: theme.colors.text }}>
                  {t('nav.calibrate_title')}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: theme.colors.textMuted }}>
                  {t('nav.calibrate_desc')}
                </p>
                {/* 手動重新偵測：不依賴系統自動恢復（reduced-motion 下唯一離場入口）。 */}
                <button
                  type="button"
                  onClick={recheckCalibration}
                  className="mt-1 w-full min-h-11 px-4 rounded-2xl font-black text-sm shadow active:scale-95 transition-transform"
                  style={{
                    backgroundColor: `${theme.colors.text}0D`,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.text}1F`,
                  }}
                >
                  {t('nav.calibrate_recheck')}
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
