/**
 * NavOverlay – Full-screen compass navigation (original "liquid glass" design)
 * 自 pages/Home.tsx 純搬移抽出（issue #711 S0）；props 契約凍結，行為零變更。
 */
import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ArrowUp,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  ArrowUpLeft,
  Car,
  Check,
  MapPin,
  X,
  Navigation,
  Navigation2,
  Footprints,
  Smartphone,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ThemeConfig, ParkingRecord } from '@app/park-keeper/types';
import { useNavigation, getDirectionInfo } from '@app/park-keeper/hooks/useNavigation';
import type { DirectionIconType } from '@app/park-keeper/hooks/useNavigation';
import {
  cardinalLabelPosition,
  isCardinalIndex,
  isMajorIndex,
  tickLength,
  tickStrokeWidth,
  tickOpacity,
  COMPASS_CX,
  COMPASS_CY,
  COMPASS_OUTER_R,
  COMPASS_NORTH_INDEX,
  COMPASS_TICK_START_Y,
} from '@app/park-keeper/services/compassGeometry';
import {
  NORTH_COLOR,
  ARRIVED_COLOR,
  WARNING_COLOR,
  ARRIVED_BORDER,
  ARRIVED_GLOW,
  WARNING_BORDER,
  WARNING_GLOW,
} from '@app/park-keeper/config/colors';
import PhotoViewerModal from './PhotoViewerModal';

const MiniMap = lazy(() => import('./MiniMap'));

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

interface NavOverlayProps {
  record: ParkingRecord;
  theme: ThemeConfig;
  onClose: () => void;
  cacheDurationDays: number;
  onPhotoOffsetChange?: (offset: { x: number; y: number }) => void;
}

export default function NavOverlay({
  record,
  theme,
  onClose,
  cacheDurationDays,
  onPhotoOffsetChange,
}: NavOverlayProps) {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const miniMapText = {
    markerCarLabel: t('map.marker_car'),
    markerUserLabel: t('map.marker_you'),
    legendCurrentLabel: t('map.legend_current'),
    legendCarLabel: t('map.legend_car'),
    dragCarHintLabel: t('map.drag_car_hint'),
    ariaInteractiveSelectionLabel: t('map.aria_interactive_selection'),
    ariaInteractiveTrackingLabel: t('map.aria_interactive_tracking'),
    ariaStaticLabel: t('map.aria_static'),
  };
  const nav = useNavigation(record);
  const {
    userLoc,
    heading,
    trueAnimHeading,
    distance,
    stepCount,
    animTargetBearing,
    relativeRotation,
    isIndoor,
    arrivedState,
    hasValidLocation,
    isPhoneFlat,
  } = nav;

  const isDarkTheme = theme.id === 'racing' || theme.id === 'minimalist';
  const glassStyle = isDarkTheme
    ? {
        bg: 'bg-slate-900/70',
        border: 'border-white/20',
        text: 'text-white',
        subText: 'text-white/70',
      }
    : {
        bg: 'bg-white/80',
        border: 'border-black/10',
        text: 'text-slate-900',
        subText: 'text-slate-900/70',
      };

  const arrived = arrivedState;
  const [showArrivedCTA, setShowArrivedCTA] = useState(false);

  // 抵達後 1 秒顯示「關閉導航」按鈕；離開抵達狀態時由 cleanup 重置。
  useEffect(() => {
    if (!arrived) return;
    const timer = setTimeout(() => setShowArrivedCTA(true), 1000);
    return () => {
      clearTimeout(timer);
      setShowArrivedCTA(false);
    };
  }, [arrived]);

  const direction = getDirectionInfo(relativeRotation);
  const directionHint = t(direction.i18nKey);

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.05 }}
      className="fixed inset-0 z-1000 flex flex-col overflow-hidden font-sans min-h-dvh"
      style={{ backgroundColor: theme.colors.background }}
    >
      {/* 1. Top Header */}
      <div
        className="absolute top-0 inset-x-0 h-32 z-30 px-6 pt-safe-top flex justify-between items-start pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, ${theme.colors.background} 0%, ${theme.colors.background}E6 60%, transparent 100%)`,
        }}
      >
        <div className="pointer-events-auto mt-2">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-md"
              style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}
            >
              <Car size={16} />
            </div>
            <h2
              className="text-3xl font-black tracking-tighter drop-shadow-sm"
              style={{ color: theme.colors.text }}
            >
              {record.plateNumber}
            </h2>
          </div>
          <div
            className="flex items-center gap-2 font-black uppercase text-[10px] tracking-[0.2em] opacity-80 pl-10"
            style={{ color: theme.colors.primary }}
          >
            <MapPin size={12} strokeWidth={3} /> {t('record.floor')} • {record.floor}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('nav.close_nav')}
          className="pointer-events-auto w-11 h-11 mt-2 flex items-center justify-center backdrop-blur-2xl rounded-full transition-all active:scale-90 shadow-lg"
          style={{
            backgroundColor: `${theme.colors.surface}80`,
            color: theme.colors.text,
            border: `1px solid ${theme.colors.text}10`,
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* 2. Liquid Glass HUD */}
      <div className="absolute top-28 left-4 right-4 z-30 pointer-events-none flex flex-col items-center">
        <motion.div
          initial={shouldReduceMotion ? false : { y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`backdrop-blur-2xl saturate-150 border rounded-4xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.1)] flex items-center justify-between relative overflow-hidden w-full max-w-sm ${glassStyle.bg} ${glassStyle.border}`}
        >
          <div className="flex items-center gap-4 relative z-10">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-500 shadow-lg"
              style={{
                backgroundColor: !hasValidLocation
                  ? '#f59e0b'
                  : isIndoor
                    ? '#fb923c'
                    : theme.colors.primary,
                color: '#fff',
              }}
            >
              {!hasValidLocation ? (
                <motion.div
                  animate={shouldReduceMotion ? { opacity: 0.7 } : { opacity: [1, 0.35, 1] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                >
                  <Navigation size={24} />
                </motion.div>
              ) : isIndoor ? (
                <Footprints size={24} />
              ) : (
                <Navigation2 size={24} strokeWidth={3} className="rotate-45" />
              )}
            </div>
            <div>
              <p
                className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${glassStyle.subText}`}
              >
                {!hasValidLocation
                  ? t('nav.gps_waiting')
                  : isIndoor
                    ? t('nav.indoor_mode')
                    : t('record.distance')}
              </p>
              <div className="flex items-baseline gap-1">
                <p className={`text-2xl font-black tracking-tight ${glassStyle.text}`}>
                  {!hasValidLocation
                    ? '···'
                    : isIndoor
                      ? stepCount
                      : distance !== null
                        ? Math.round(distance)
                        : '--'}
                </p>
                {hasValidLocation && (
                  <span className={`text-xs font-bold uppercase ${glassStyle.subText}`}>
                    {isIndoor ? t('nav.steps') : t('nav.unit_meters')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3. Map Layer (Background) */}
      <div className="flex-1 relative z-0">
        <Suspense
          fallback={
            <div className="w-full h-full" style={{ background: theme.colors.background }} />
          }
        >
          {record.latitude != null && record.longitude != null && (
            <MiniMap
              lat={record.latitude}
              lng={record.longitude}
              userLat={userLoc?.lat}
              userLng={userLoc?.lng}
              heading={heading}
              theme={theme}
              interactive={true}
              allowZoom={true}
              showZoomControl={false}
              lockBounds={false}
              autoFitTrackedPositions={true}
              showRecenterButton={true}
              recenterLabel={t('map.recenter_both')}
              cacheDurationDays={cacheDurationDays}
              text={miniMapText}
              className="grayscale-[0.2]"
              mapKey={`nav-${record.id}`}
              photoData={record.photoData}
              onPhotoClick={() => setShowPhotoModal(true)}
              parkedHeading={record.parkedHeading}
              trackedViewportInsets={{ top: 148, right: 36, bottom: 332, left: 36 }}
              photoOffset={record.photoOffset}
              onPhotoPositionChange={onPhotoOffsetChange}
            />
          )}
        </Suspense>
      </div>

      {/* 4. Professional Compass Deck */}
      <div
        className="absolute bottom-0 inset-x-0 h-[45vh] border-t shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-[2.5rem] -mt-8 z-20 overflow-hidden pb-safe-bottom"
        style={{
          backgroundColor: theme.colors.background,
          borderColor: `${theme.colors.text}10`,
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle at center, ${theme.colors.text} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="w-full h-full flex flex-col items-center justify-center pt-2 pb-2">
          <div className="mb-3 flex flex-col items-center">
            <ArrowUp size={20} style={{ color: theme.colors.primary }} strokeWidth={3} />
            <span
              className="text-[10px] font-black uppercase tracking-[0.28em]"
              style={{ color: theme.colors.primary }}
            >
              {t('nav.phone_top')}
            </span>
          </div>

          {/* Main Compass Dial */}
          <div className="relative w-72 h-72 flex items-center justify-center">
            {/* SVG Compass Ring */}
            <motion.div
              className="absolute inset-0"
              style={{ rotate: -trueAnimHeading }}
              transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            >
              <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
                {/* Outer compass boundary ring – turns green on arrival */}
                <circle
                  cx={COMPASS_CX}
                  cy={COMPASS_CY}
                  r={COMPASS_OUTER_R}
                  fill="none"
                  stroke={arrived ? ARRIVED_COLOR : theme.colors.text}
                  strokeWidth={arrived ? 2 : 1}
                  opacity={arrived ? 0.45 : 0.1}
                />
                {/* 刻度線群組 */}
                {Array.from({ length: 36 }).map((_, i) => {
                  const angle = i * 10;
                  const isNorth = i === COMPASS_NORTH_INDEX;
                  const tLen = tickLength(i);
                  return (
                    <g key={i} transform={`rotate(${angle} ${COMPASS_CX} ${COMPASS_CY})`}>
                      <line
                        x1={COMPASS_CX}
                        y1={COMPASS_TICK_START_Y}
                        x2={COMPASS_CX}
                        y2={COMPASS_TICK_START_Y + tLen}
                        stroke={isNorth ? NORTH_COLOR : theme.colors.text}
                        strokeWidth={tickStrokeWidth(i)}
                        opacity={tickOpacity(i)}
                        strokeLinecap="round"
                      />
                    </g>
                  );
                })}
                {/* 方位角ラベル — 絕對座標渲染，不使用反向旋轉，排除定位偏移 bug */}
                {[0, 9, 18, 27].map((i) => {
                  if (!isCardinalIndex(i) || isMajorIndex(i)) return null;
                  const { x, y } = cardinalLabelPosition(i);
                  const isNorth = i === COMPASS_NORTH_INDEX;
                  return (
                    <text
                      key={`cardinal-${i}`}
                      x={x}
                      y={y}
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

            {/* Target Pointer – fades: arrived → 0 (jitter at ~0m), indoor → 0.4, no GPS → 0.25 */}
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: !hasValidLocation ? 0.25 : arrived ? 0 : isIndoor ? 0.4 : 1 }}
              transition={{ duration: 0.6 }}
              style={{ rotate: -trueAnimHeading }}
            >
              <motion.div
                className="w-full h-full"
                style={{ rotate: animTargetBearing }}
                transition={{ type: 'spring', stiffness: 60, damping: 15 }}
              >
                <div className="absolute top-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                  <div
                    className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg"
                    style={{ backgroundColor: `${theme.colors.primary}E6` }}
                  >
                    {t('map.marker_car')}
                  </div>
                  <div
                    className="w-0 h-0 border-l-[11px] border-l-transparent border-r-[11px] border-r-transparent border-b-[32px]"
                    style={{
                      borderBottomColor: theme.colors.primary,
                      filter: `drop-shadow(0 0 10px ${theme.colors.primary}80) drop-shadow(0 2px 4px rgba(0,0,0,0.25))`,
                    }}
                  />
                  <div
                    className="w-1 h-5 rounded-full opacity-60"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                </div>
              </motion.div>
            </motion.div>

            {/* Center Hub – 所有導航資訊的唯一視覺中心 */}
            <motion.div
              className="absolute w-36 h-36 rounded-full border-2 flex flex-col items-center justify-center z-10 overflow-hidden"
              animate={{
                borderColor: arrived
                  ? ARRIVED_BORDER
                  : !isPhoneFlat && hasValidLocation
                    ? WARNING_BORDER
                    : `${theme.colors.text}10`,
                boxShadow: arrived
                  ? `0 0 0 8px ${ARRIVED_GLOW}, 0 8px 32px rgba(0,0,0,0.14)`
                  : !isPhoneFlat && hasValidLocation
                    ? `0 0 0 5px ${WARNING_GLOW}, 0 8px 32px rgba(0,0,0,0.14)`
                    : '0 8px 32px rgba(0,0,0,0.12)',
              }}
              transition={{ duration: 0.45 }}
              style={{
                backgroundColor: `${theme.colors.background}D4`,
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
              }}
            >
              {/* 手機未平放時的外圈脈衝提示 */}
              {!isPhoneFlat && hasValidLocation && !arrived && (
                <motion.div
                  className="absolute inset-0 rounded-full border border-red-400 pointer-events-none"
                  animate={
                    shouldReduceMotion
                      ? { opacity: 0.35 }
                      : { scale: [1, 1.05, 1], opacity: [0.55, 0.1, 0.55] }
                  }
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                />
              )}

              <AnimatePresence mode="wait">
                {arrived ? (
                  /* ── 抵達狀態 ── */
                  <motion.div
                    key="arrived"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                    className="flex flex-col items-center gap-0.5 px-2"
                  >
                    <Check size={32} style={{ color: ARRIVED_COLOR }} strokeWidth={2.5} />
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
                          className="mt-1 px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest text-white shadow-md active:scale-95 pointer-events-auto"
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
                      GPS
                    </p>
                    <p
                      className="text-[7px] font-bold uppercase tracking-[0.18em]"
                      style={{ color: theme.colors.text, opacity: 0.35 }}
                    >
                      {t('nav.gps_waiting')}
                    </p>
                  </motion.div>
                ) : (
                  /* ── 正常導航狀態 ── */
                  <motion.div
                    key="normal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center w-full px-2"
                  >
                    {/* 距離 / 步數 */}
                    <p
                      className="text-3xl font-black tracking-tight leading-none"
                      style={{ color: theme.colors.text }}
                    >
                      {isIndoor ? stepCount : distance !== null ? Math.round(distance) : '--'}
                    </p>
                    <p
                      className="text-[9px] font-bold uppercase tracking-widest mt-0.5"
                      style={{ color: theme.colors.text, opacity: 0.4 }}
                    >
                      {isIndoor ? t('nav.steps') : t('nav.unit_meters')}
                    </p>

                    {/* 分隔線 */}
                    <div
                      className="w-8 h-px my-1.5"
                      style={{ backgroundColor: `${theme.colors.text}15` }}
                    />

                    {/* 方向 or 手機平放提示（互斥） */}
                    <AnimatePresence mode="wait">
                      {!isPhoneFlat ? (
                        <motion.div
                          key="hold-flat"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.25 }}
                          className="flex flex-col items-center gap-0.5"
                        >
                          <motion.div
                            animate={
                              shouldReduceMotion ? { rotate: 12 } : { rotate: [14, -14, 14] }
                            }
                            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                          >
                            <Smartphone size={16} color={WARNING_COLOR} />
                          </motion.div>
                          <p
                            className="text-[7px] font-black uppercase tracking-[0.14em]"
                            style={{ color: WARNING_COLOR, opacity: 0.9 }}
                          >
                            {t('nav.hold_flat')}
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="direction"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.25 }}
                          className="flex flex-col items-center gap-0"
                          aria-label={directionHint}
                        >
                          <DirectionIcon
                            type={direction.iconType}
                            size={20}
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
        </div>
      </div>

      {/* Photo Modal */}
      {showPhotoModal && record.photoData && (
        <PhotoViewerModal
          src={record.photoData}
          alt="Parking spot"
          onClose={() => setShowPhotoModal(false)}
          containerClassName="absolute inset-0"
        />
      )}
    </motion.div>
  );
}
