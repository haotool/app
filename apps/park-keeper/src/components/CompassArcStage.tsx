/**
 * CompassArcStage – 弧形羅盤盤面（issue #752 佈局 v2；自 NavOverlay 純搬移拆出）。
 * 幾何一律由 computeDeckGeometry 的 DeckGeometry 推導（單一尺寸源），
 * 含刻度環、±15° 楔形、弧緣車位錨點與 144px 中心 Hub（距離/方向唯一顯示）。
 */
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ArrowUp,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  ArrowUpLeft,
  Check,
  Compass,
  Navigation,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ThemeConfig } from '@app/park-keeper/types';
import type { DirectionInfo, DirectionIconType } from '@app/park-keeper/hooks/useNavigation';
import {
  cardinalLabelPosition,
  cardinalLabelUprightTransform,
  tickLength,
  tickStrokeWidth,
  tickOpacity,
  targetWedgePath,
  COMPASS_NORTH_INDEX,
  TARGET_WEDGE_HALF_ANGLE_DEG,
  TICK_COUNT,
  TICK_STEP_DEG,
} from '@app/park-keeper/services/compassGeometry';
import type { DeckGeometry } from '@app/park-keeper/services/compassGeometry';
import {
  NORTH_COLOR,
  ARRIVED_COLOR,
  ARRIVED_BORDER,
  ARRIVED_GLOW,
} from '@app/park-keeper/config/colors';
import type { CompassThemeStyle } from '@app/park-keeper/config/compassThemeStyles';

// ---------------------------------------------------------------------------
// DirectionIcon – Lucide icon mapped from DirectionIconType
// ---------------------------------------------------------------------------
function DirectionIcon({
  type,
  size,
  color,
}: {
  type: DirectionIconType;
  size: number;
  color: string;
}) {
  const props = { size, color, strokeWidth: 3 };
  switch (type) {
    case 'slight-right':
      return <ArrowUpRight {...props} />;
    case 'right':
      return <ArrowRight {...props} />;
    case 'left':
      return <ArrowLeft {...props} />;
    case 'slight-left':
      return <ArrowUpLeft {...props} />;
    default:
      return <ArrowUp {...props} />;
  }
}

export interface CompassArcStageProps {
  geo: DeckGeometry;
  theme: ThemeConfig;
  compassStyle: CompassThemeStyle;
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
  direction: DirectionInfo;
  directionHint: string;
  onClose: () => void;
}

export default function CompassArcStage({
  geo,
  theme,
  compassStyle,
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
  direction,
  directionHint,
  onClose,
}: CompassArcStageProps) {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  return (
    <div data-testid="compass-arc" className="absolute inset-0">
      {/* 盤面 disc（surface 層；理由：deck 底色已不透明，毋須 blur） */}
      <div
        className="absolute rounded-full"
        style={{
          left: geo.cx - geo.outerR,
          top: geo.cy - geo.outerR,
          width: geo.outerR * 2,
          height: geo.outerR * 2,
          backgroundColor: `${theme.colors.surface}66`,
          boxShadow:
            compassStyle.neonGlowRadius > 0
              ? `0 0 ${compassStyle.neonGlowRadius * 4}px ${theme.colors.primary}59`
              : `0 8px 32px rgba(0,0,0,0.10)`,
          border: `${compassStyle.outerRingWidth}px solid ${
            compassStyle.neonGlowRadius > 0 ? theme.colors.primary : theme.colors.text
          }${compassStyle.neonGlowRadius > 0 ? '' : '1F'}`,
        }}
      />

      {/* SVG 刻度環（world-locked 旋轉；SVG 座標＝CSS px 1:1） */}
      <motion.div
        className="absolute"
        style={{
          left: geo.cx - geo.half,
          top: geo.cy - geo.half,
          width: geo.half * 2,
          height: geo.half * 2,
          rotate: -trueAnimHeading,
          opacity: compassBlocked ? 0.2 : 1,
        }}
        transition={{ type: 'spring', stiffness: 50, damping: 15 }}
      >
        <svg
          viewBox={`0 0 ${geo.half * 2} ${geo.half * 2}`}
          className="w-full h-full overflow-visible"
        >
          <circle
            cx={geo.half}
            cy={geo.half}
            r={geo.outerR}
            fill="none"
            stroke={arrived ? ARRIVED_COLOR : theme.colors.text}
            strokeWidth={arrived ? 2 : compassStyle.outerRingWidth}
            opacity={arrived ? 0.45 : compassStyle.outerRingOpacity}
          />
          {/* 刻度線群組（N 紅錨點、30° 主刻度） */}
          {Array.from({ length: TICK_COUNT }).map((_, i) => {
            const angle = i * TICK_STEP_DEG;
            const isNorth = i === COMPASS_NORTH_INDEX;
            const tLen = tickLength(i);
            return (
              <g key={i} transform={`rotate(${angle} ${geo.half} ${geo.half})`}>
                <line
                  x1={geo.half}
                  y1={geo.half - geo.outerR}
                  x2={geo.half}
                  y2={geo.half - geo.outerR + tLen}
                  stroke={isNorth ? NORTH_COLOR : theme.colors.text}
                  strokeWidth={tickStrokeWidth(i) * compassStyle.tickWidthScale}
                  opacity={tickOpacity(i)}
                  strokeLinecap={compassStyle.tickLinecap}
                />
              </g>
            );
          })}
          {/* 方位字沿弧 — 絕對座標渲染＋以自身錨點反向抵銷容器旋轉，
              轉身時 N/E/S/W 保持直立可辨（issue #733；旋轉中心即文字錨點）。 */}
          {[0, 9, 18, 27].map((i) => {
            const { x, y } = cardinalLabelPosition(i, geo.labelR, geo.half, geo.half);
            const isNorth = i === COMPASS_NORTH_INDEX;
            return (
              <text
                key={`cardinal-${i}`}
                x={x}
                y={y}
                transform={cardinalLabelUprightTransform(
                  i,
                  trueAnimHeading,
                  geo.labelR,
                  geo.half,
                  geo.half,
                )}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isNorth ? NORTH_COLOR : theme.colors.text}
                fontSize="20"
                fontWeight="900"
                opacity={isNorth ? 1 : 0.85}
              >
                {i === COMPASS_NORTH_INDEX
                  ? t('compass.n')
                  : i === 9
                    ? t('compass.e')
                    : i === 18
                      ? t('compass.s')
                      : t('compass.w')}
              </text>
            );
          })}
        </svg>
      </motion.div>

      {/* 目標方位 ±15° 楔形（world-locked：外層抵銷手機朝向、內層指向目標） */}
      <motion.div
        className="absolute"
        animate={{
          opacity: compassBlocked ? 0 : !hasValidLocation ? 0.2 : arrived ? 0 : isIndoor ? 0.35 : 1,
        }}
        transition={{ duration: 0.6 }}
        style={{
          left: geo.cx - geo.half,
          top: geo.cy - geo.half,
          width: geo.half * 2,
          height: geo.half * 2,
          rotate: -trueAnimHeading,
        }}
      >
        <motion.div
          className="w-full h-full"
          style={{ rotate: animTargetBearing }}
          transition={{ type: 'spring', stiffness: 60, damping: 15 }}
        >
          <svg
            viewBox={`0 0 ${geo.half * 2} ${geo.half * 2}`}
            className="w-full h-full overflow-visible"
          >
            <path
              d={targetWedgePath(
                TARGET_WEDGE_HALF_ANGLE_DEG,
                geo.wedgeInnerR,
                geo.wedgeOuterR,
                geo.half,
                geo.half,
              )}
              fill={theme.colors.primary}
              opacity={aligned ? 1 : compassStyle.wedgeIdleOpacity}
              style={{
                filter: aligned
                  ? `drop-shadow(0 0 ${8 + compassStyle.neonGlowRadius}px ${theme.colors.primary})`
                  : undefined,
                transition: 'opacity 0.35s ease, filter 0.35s ease',
              }}
            />
            {/* 楔形尖端車位錨點（圓形＋向上箭頭），錨定於弧緣。 */}
            <g transform={`translate(${geo.half} ${geo.half - geo.outerR + 4})`}>
              <circle
                r="11"
                fill={theme.colors.primary}
                opacity={aligned ? 1 : 0.85}
                style={{
                  filter: aligned ? `drop-shadow(0 0 6px ${theme.colors.primary})` : undefined,
                }}
              />
              <path d="M 0 -4.5 L 4.5 3.5 L 0 1.5 L -4.5 3.5 Z" fill={theme.colors.background} />
            </g>
          </svg>
        </motion.div>
      </motion.div>

      {/* 中心 Hub（144px SSOT）：距離＋方向唯一顯示 */}
      <motion.div
        data-testid="compass-hub"
        className="absolute rounded-full border-2 flex flex-col items-center justify-center z-10 overflow-hidden"
        animate={{
          borderColor: arrived
            ? ARRIVED_BORDER
            : aligned
              ? theme.colors.primary
              : `${theme.colors.text}12`,
          boxShadow: arrived
            ? `0 0 0 8px ${ARRIVED_GLOW}, 0 8px 32px rgba(0,0,0,0.14)`
            : aligned
              ? `0 0 0 6px ${theme.colors.primary}1F, 0 8px 32px rgba(0,0,0,0.14)`
              : '0 8px 32px rgba(0,0,0,0.12)',
        }}
        transition={{ duration: 0.45 }}
        style={{
          left: geo.cx - geo.hubD / 2,
          top: geo.cy - geo.hubD / 2,
          width: geo.hubD,
          height: geo.hubD,
          backgroundColor: `${theme.colors.background}F0`,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <AnimatePresence mode="wait">
          {compassBlocked ? (
            /* ── 權限未授予：Hub 淡置示意 ── */
            <motion.div
              key="blocked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-1"
            >
              <Compass size={30} style={{ color: theme.colors.textMuted }} />
            </motion.div>
          ) : arrived ? (
            /* ── 抵達狀態 ── */
            <motion.div
              key="arrived"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 16 }}
              className="flex flex-col items-center gap-0.5 px-2"
            >
              <Check size={30} style={{ color: ARRIVED_COLOR }} strokeWidth={2.5} />
              <p
                className="text-[11px] font-black uppercase tracking-[0.22em]"
                style={{ color: ARRIVED_COLOR }}
              >
                {t('nav.arrived')}
              </p>
              <AnimatePresence>
                {showArrivedCTA && (
                  <motion.button
                    key="cta"
                    type="button"
                    initial={{ opacity: 0, y: 6, scale: 0.88 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    onClick={onClose}
                    // 與頂部 X 的「關閉導航」區分 accessible name，
                    // 消除 SR/語音控制歧義與 e2e strict-mode 衝突（issue #725 P2）。
                    aria-label={t('nav.arrived_close_cta')}
                    className="mt-1 px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest text-white shadow-md active:scale-95 pointer-events-auto"
                    style={{ backgroundColor: ARRIVED_COLOR }}
                  >
                    {t('nav.close_nav')}
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          ) : !hasValidLocation ? (
            /* ── GPS 等待狀態 ── */
            <motion.div
              key="no-gps"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-0.5"
            >
              <motion.div
                animate={shouldReduceMotion ? { opacity: 0.7 } : { opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              >
                <Navigation size={22} style={{ color: theme.colors.primary }} />
              </motion.div>
              <p
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: theme.colors.primary }}
              >
                {t('nav.gps_label')}
              </p>
              <p
                className="text-[7px] font-bold uppercase tracking-[0.18em]"
                style={{ color: theme.colors.text, opacity: 0.35 }}
              >
                {t('nav.gps_waiting')}
              </p>
            </motion.div>
          ) : (
            /* ── 正常導航狀態：大字等寬距離＋方向提示 ── */
            <motion.div
              key="normal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center w-full px-2"
            >
              <p
                className="text-4xl font-black tracking-tight leading-none tabular-nums"
                style={{ color: aligned ? theme.colors.primary : theme.colors.text }}
              >
                {distanceValue}
              </p>
              <p
                className="text-[9px] font-bold uppercase tracking-widest mt-1"
                style={{ color: theme.colors.text, opacity: 0.4 }}
              >
                {distanceUnit}
              </p>

              {/* 對準文案 or 方向提示 */}
              <AnimatePresence mode="wait">
                {aligned ? (
                  <motion.div
                    key="aligned"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="mt-1.5 flex flex-col items-center gap-0"
                    aria-live="polite"
                  >
                    <ArrowUp size={16} color={theme.colors.primary} strokeWidth={3.5} />
                    <p
                      className="mt-0.5 text-[10px] font-black uppercase tracking-[0.12em]"
                      style={{ color: theme.colors.primary }}
                    >
                      {t('nav.aligned')}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="direction"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="mt-1.5 flex flex-col items-center gap-0"
                    aria-label={directionHint}
                  >
                    <DirectionIcon
                      type={direction.iconType}
                      size={16}
                      color={theme.colors.primary}
                    />
                    <p
                      className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em]"
                      style={{ color: theme.colors.text, opacity: 0.5 }}
                    >
                      {isIndoor ? t('nav.indoor_mode') : directionHint}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
