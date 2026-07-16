/**
 * NavOverlay – 全螢幕羅盤導航（issue #716 視覺重造）
 * 佈局：MiniMap 全幅背景層 → 上 55% 羅盤盤面（玻璃圓盤浮層）→ 下 45% 資訊卡。
 * 主題差異化以 token＋樣式參數實現（COMPASS_THEME_STYLES），不 fork 元件。
 */
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ArrowUp,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  ArrowUpLeft,
  Car,
  Check,
  Compass,
  MapPin,
  Move,
  X,
  Navigation,
  Navigation2,
  Footprints,
  Smartphone,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ThemeConfig, ThemeType, ParkingRecord } from '@app/park-keeper/types';
import { useNavigation, getDirectionInfo } from '@app/park-keeper/hooks/useNavigation';
import type { DirectionIconType } from '@app/park-keeper/hooks/useNavigation';
import {
  cardinalLabelPosition,
  isCardinalIndex,
  isMajorIndex,
  tickLength,
  tickStrokeWidth,
  tickOpacity,
  targetWedgePath,
  isAligned,
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
  ON_PRIMARY_COLOR,
} from '@app/park-keeper/config/colors';
import { useModalDialog } from '@app/park-keeper/hooks/useModalDialog';
import PhotoViewerModal from './PhotoViewerModal';

const MiniMap = lazy(() => import('./MiniMap'));

// ---------------------------------------------------------------------------
// 主題差異化樣式參數（brief：Nitro 霓虹描邊／Kawaii 粉彩圓潤／Zen 細線極簡／Classic 銅色調）
// ---------------------------------------------------------------------------
interface CompassThemeStyle {
  /** 刻度線寬係數。 */
  tickWidthScale: number;
  /** 刻度端點形狀（Kawaii 圓頭）。 */
  tickLinecap: 'round' | 'butt';
  /** 外環線寬。 */
  outerRingWidth: number;
  /** 外環不透明度。 */
  outerRingOpacity: number;
  /** 盤面霓虹光暈（SVG drop-shadow filter 強度，0 = 無）。 */
  neonGlowRadius: number;
  /** 楔形未對準時不透明度。 */
  wedgeIdleOpacity: number;
}

const COMPASS_THEME_STYLES: Record<ThemeType, CompassThemeStyle> = {
  racing: {
    tickWidthScale: 1,
    tickLinecap: 'butt',
    outerRingWidth: 1.6,
    outerRingOpacity: 0.55,
    neonGlowRadius: 6,
    wedgeIdleOpacity: 0.4,
  },
  cute: {
    tickWidthScale: 1.5,
    tickLinecap: 'round',
    outerRingWidth: 2.5,
    outerRingOpacity: 0.25,
    neonGlowRadius: 0,
    // 粉彩 primary 飽和度低，楔形 idle 提高補償可見度。
    wedgeIdleOpacity: 0.65,
  },
  minimalist: {
    tickWidthScale: 0.8,
    tickLinecap: 'butt',
    outerRingWidth: 0.8,
    outerRingOpacity: 0.14,
    neonGlowRadius: 0,
    wedgeIdleOpacity: 0.32,
  },
  literary: {
    tickWidthScale: 1.1,
    tickLinecap: 'butt',
    outerRingWidth: 2,
    outerRingOpacity: 0.35,
    neonGlowRadius: 0,
    wedgeIdleOpacity: 0.38,
  },
};

/** 對準觸覺脈衝（Android；iOS 不支援 vibrate 靜默降級）。 */
const ALIGNED_VIBRATE_PATTERN = [30, 40, 30];

// ---------------------------------------------------------------------------
// Screen Wake Lock：導航時防熄屏；hidden 釋放、回前景重新取得（iOS 18.4+ 修復）。
// ---------------------------------------------------------------------------
function useScreenWakeLock() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return undefined;

    let sentinel: WakeLockSentinel | null = null;
    let disposed = false;

    const request = async () => {
      try {
        sentinel = await navigator.wakeLock.request('screen');
      } catch {
        // 低電量模式或平台拒絕：靜默降級，不影響導航功能。
        sentinel = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !disposed) void request();
    };

    void request();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      void sentinel?.release().catch(() => undefined);
    };
  }, []);
}

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

export interface NavOverlayProps {
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
  // 照片位置調整模式：盤面暫時淡出，地圖層顯示可拖曳照片（持久化鏈不變）。
  const [photoEditMode, setPhotoEditMode] = useState(false);

  // Modal a11y：dialog 語意＋focus trap＋Esc（issue #725 對齊 PhotoViewerModal 模式）。
  // Esc 於照片檢視器開啟時讓位（其自有 Esc 關閉），以 ref 鏡像避免同一事件內讀到舊 state。
  const dialogRef = useRef<HTMLDivElement>(null);
  const showPhotoModalRef = useRef(false);
  useEffect(() => {
    showPhotoModalRef.current = showPhotoModal;
  }, [showPhotoModal]);
  useModalDialog(dialogRef, true, () => {
    if (!showPhotoModalRef.current) onClose();
  });
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
    permissionState,
    requestCompassPermission,
    needsCalibration,
  } = nav;

  useScreenWakeLock();

  const compassStyle = COMPASS_THEME_STYLES[theme.id];

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

  // 對準判定：權限已授予、GPS 有效、非抵達/室內，誤差 <10°。
  const aligned =
    permissionState === 'granted' &&
    hasValidLocation &&
    !arrived &&
    !isIndoor &&
    isAligned(relativeRotation);

  // 對準瞬間觸發一次觸覺脈衝（edge trigger；iOS 無 vibrate 靜默略過）。
  useEffect(() => {
    if (aligned && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ALIGNED_VIBRATE_PATTERN);
    }
  }, [aligned]);

  const direction = getDirectionInfo(relativeRotation);
  const directionHint = t(direction.i18nKey);

  const compassBlocked = permissionState !== 'granted';
  const showCalibration = permissionState === 'granted' && needsCalibration;

  return (
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={t('nav.dialog_label')}
      tabIndex={-1}
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.05 }}
      className="fixed inset-0 z-1000 flex flex-col overflow-hidden font-sans min-h-dvh outline-none"
      style={{ backgroundColor: theme.colors.background }}
    >
      {/* 0. Map background layer。照片平時不上地圖（資訊卡 96px 縮圖為唯一焦點）；
          照片位置調整模式才顯示可拖曳照片，photoOffset 持久化鏈不變。 */}
      <div className="absolute inset-0 z-0">
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
              showRecenterButton={false}
              showLegend={false}
              recenterLabel={t('map.recenter_both')}
              cacheDurationDays={cacheDurationDays}
              text={miniMapText}
              className={photoEditMode ? '' : 'grayscale-[0.5] opacity-70'}
              mapKey={`nav-${record.id}`}
              photoData={photoEditMode ? record.photoData : undefined}
              onPhotoClick={() => setShowPhotoModal(true)}
              parkedHeading={record.parkedHeading}
              trackedViewportInsets={{ top: 108, right: 36, bottom: 400, left: 36 }}
              photoOffset={record.photoOffset}
              onPhotoPositionChange={onPhotoOffsetChange}
            />
          )}
        </Suspense>
      </div>

      {/* 1. Top Header：車牌＋關閉 */}
      <div
        className="absolute top-0 inset-x-0 z-30 px-5 pt-safe-top flex justify-between items-start pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, ${theme.colors.background} 0%, ${theme.colors.background}CC 55%, transparent 100%)`,
        }}
      >
        <div className="pointer-events-auto mt-2 pb-6">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-md"
              style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}
            >
              <Car size={16} />
            </div>
            <h2
              className="text-2xl font-black tracking-tighter drop-shadow-sm"
              style={{ color: theme.colors.text }}
            >
              {record.plateNumber}
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('nav.close_nav')}
          className="pointer-events-auto w-11 h-11 mt-2 flex items-center justify-center backdrop-blur-2xl rounded-full transition-all active:scale-90 shadow-lg"
          style={{
            backgroundColor: `${theme.colors.surface}CC`,
            color: theme.colors.text,
            border: `1px solid ${theme.colors.text}10`,
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* 照片調整模式提示 pill */}
      <AnimatePresence>
        {photoEditMode && (
          <motion.div
            key="photo-edit-hint"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-28 inset-x-0 z-30 flex justify-center pointer-events-none"
          >
            <div
              className="px-4 py-2 rounded-full backdrop-blur-md text-xs font-bold shadow-lg"
              style={{
                backgroundColor: `${theme.colors.surface}E6`,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.text}14`,
              }}
            >
              {t('nav.photo_adjust_hint')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. 上 55%：羅盤盤面（玻璃圓盤浮於地圖上）；照片調整模式時淡出讓位 */}
      <div
        className="absolute top-0 inset-x-0 h-[55%] z-20 flex items-center justify-center pointer-events-none pt-16"
        style={{
          opacity: photoEditMode ? 0 : 1,
          visibility: photoEditMode ? 'hidden' : 'visible',
          transition: 'opacity 0.3s ease, visibility 0.3s ease',
        }}
      >
        <div className="relative w-76 h-76 max-w-[88vw] max-h-[42vh] aspect-square flex items-center justify-center">
          {/* 玻璃盤面底：讓刻度在地圖上保持可讀 */}
          <div
            className="absolute inset-0 rounded-full backdrop-blur-xl"
            style={{
              backgroundColor: `${theme.colors.background}B8`,
              boxShadow:
                compassStyle.neonGlowRadius > 0
                  ? `0 0 ${compassStyle.neonGlowRadius * 4}px ${theme.colors.primary}59, 0 18px 48px rgba(0,0,0,0.28)`
                  : '0 18px 48px rgba(0,0,0,0.18)',
              border: `${compassStyle.outerRingWidth}px solid ${
                compassStyle.neonGlowRadius > 0 ? theme.colors.primary : theme.colors.text
              }${compassStyle.neonGlowRadius > 0 ? '' : '1F'}`,
            }}
          />

          {/* SVG 刻度環（world-locked 旋轉） */}
          <motion.div
            className="absolute inset-0"
            style={{ rotate: -trueAnimHeading, opacity: compassBlocked ? 0.2 : 1 }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
          >
            <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
              <circle
                cx={COMPASS_CX}
                cy={COMPASS_CY}
                r={COMPASS_OUTER_R}
                fill="none"
                stroke={arrived ? ARRIVED_COLOR : theme.colors.text}
                strokeWidth={arrived ? 2 : compassStyle.outerRingWidth}
                opacity={arrived ? 0.45 : compassStyle.outerRingOpacity}
              />
              {/* 刻度線群組（N 紅錨點、30° 主刻度） */}
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
                      strokeWidth={tickStrokeWidth(i) * compassStyle.tickWidthScale}
                      opacity={tickOpacity(i)}
                      strokeLinecap={compassStyle.tickLinecap}
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

          {/* 目標方位 ±15° 楔形（world-locked：外層抵銷手機朝向、內層指向目標） */}
          <motion.div
            className="absolute inset-0"
            animate={{
              opacity: compassBlocked
                ? 0
                : !hasValidLocation
                  ? 0.2
                  : arrived
                    ? 0
                    : isIndoor
                      ? 0.35
                      : 1,
            }}
            transition={{ duration: 0.6 }}
            style={{ rotate: -trueAnimHeading }}
          >
            <motion.div
              className="w-full h-full"
              style={{ rotate: animTargetBearing }}
              transition={{ type: 'spring', stiffness: 60, damping: 15 }}
            >
              <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
                <path
                  d={targetWedgePath()}
                  fill={theme.colors.primary}
                  opacity={aligned ? 1 : compassStyle.wedgeIdleOpacity}
                  style={{
                    filter: aligned
                      ? `drop-shadow(0 0 ${8 + compassStyle.neonGlowRadius}px ${theme.colors.primary})`
                      : undefined,
                    transition: 'opacity 0.35s ease, filter 0.35s ease',
                  }}
                />
                {/* 楔形尖端車位錨點（圓形＋向上箭頭） */}
                <g transform={`translate(${COMPASS_CX} 14)`}>
                  <circle
                    r="11"
                    fill={theme.colors.primary}
                    opacity={aligned ? 1 : 0.85}
                    style={{
                      filter: aligned ? `drop-shadow(0 0 6px ${theme.colors.primary})` : undefined,
                    }}
                  />
                  <path
                    d="M 0 -4.5 L 4.5 3.5 L 0 1.5 L -4.5 3.5 Z"
                    fill={theme.colors.background}
                  />
                </g>
              </svg>
            </motion.div>
          </motion.div>

          {/* 中心 Hub：距離超大等寬數字（brief：display 級） */}
          <motion.div
            className="absolute w-40 h-40 rounded-full border-2 flex flex-col items-center justify-center z-10 overflow-hidden"
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
              backgroundColor: `${theme.colors.background}E0`,
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
                  <Check size={34} style={{ color: ARRIVED_COLOR }} strokeWidth={2.5} />
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
                /* ── 正常導航狀態：超大等寬距離 ── */
                <motion.div
                  key="normal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center w-full px-2"
                >
                  <p
                    className="text-5xl font-black tracking-tight leading-none tabular-nums"
                    style={{ color: aligned ? theme.colors.primary : theme.colors.text }}
                  >
                    {isIndoor ? stepCount : distance !== null ? Math.round(distance) : '--'}
                  </p>
                  <p
                    className="text-[9px] font-bold uppercase tracking-widest mt-1"
                    style={{ color: theme.colors.text, opacity: 0.4 }}
                  >
                    {isIndoor ? t('nav.steps') : t('nav.unit_meters')}
                  </p>

                  <div
                    className="w-8 h-px my-1.5"
                    style={{ backgroundColor: `${theme.colors.text}15` }}
                  />

                  {/* 對準文案 or 方向提示 */}
                  <AnimatePresence mode="wait">
                    {aligned ? (
                      <motion.div
                        key="aligned"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.25 }}
                        className="flex flex-col items-center gap-0"
                        aria-live="polite"
                      >
                        <ArrowUp size={18} color={theme.colors.primary} strokeWidth={3.5} />
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
                        className="flex flex-col items-center gap-0"
                        aria-label={directionHint}
                      >
                        <DirectionIcon
                          type={direction.iconType}
                          size={18}
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

          {/* 平放提示：半透明覆層 pill（不打斷 Hub 視覺脈絡） */}
          <AnimatePresence>
            {!compassBlocked && !isPhoneFlat && !arrived && (
              <motion.div
                key="hold-flat"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md pointer-events-none whitespace-nowrap"
                style={{
                  backgroundColor: `${theme.colors.surface}D9`,
                  border: `1px solid ${WARNING_COLOR}59`,
                }}
              >
                <Smartphone size={12} color={WARNING_COLOR} />
                <span
                  className="text-[10px] font-black uppercase tracking-[0.12em]"
                  style={{ color: WARNING_COLOR }}
                >
                  {t('nav.hold_flat')}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 權限卡／校準卡（蓋盤面中央，可互動） */}
          <AnimatePresence>
            {(compassBlocked || showCalibration) && (
              <motion.div
                key={
                  permissionState === 'denied' ? 'denied' : showCalibration ? 'calibrate' : 'prompt'
                }
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="absolute inset-x-2 top-1/2 -translate-y-1/2 z-30 pointer-events-auto"
              >
                <div
                  className="mx-auto max-w-[17rem] rounded-3xl p-5 backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.22)] flex flex-col items-center text-center gap-2"
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
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: theme.colors.textMuted }}
                      >
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
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: theme.colors.textMuted }}
                      >
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
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: theme.colors.textMuted }}
                      >
                        {t('nav.calibrate_desc')}
                      </p>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. 下 45%：資訊卡（照片 96px 縮圖＋樓層＋距離＋備註） */}
      <div
        className="absolute bottom-0 inset-x-0 h-[45%] z-20 border-t shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-[2.5rem] overflow-hidden"
        style={{
          backgroundColor: theme.colors.background,
          borderColor: `${theme.colors.text}10`,
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at center, ${theme.colors.text} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div
          className={`relative w-full h-full flex flex-col px-6 pt-6 pb-safe-bottom max-w-md mx-auto ${record.notes ? '' : 'justify-center'}`}
        >
          {/* 照片＋樓層列 */}
          <div className="flex items-center gap-4">
            {record.photoData ? (
              <button
                type="button"
                onClick={() => setShowPhotoModal(true)}
                aria-label={t('record.view_photo')}
                className="shrink-0 w-24 h-24 rounded-3xl overflow-hidden shadow-lg active:scale-95 transition-transform"
                style={{ border: `2px solid ${theme.colors.surface}` }}
              >
                <img
                  src={record.photoData}
                  alt={t('record.photo_alt')}
                  className="w-full h-full object-cover"
                />
              </button>
            ) : (
              <div
                className="shrink-0 w-24 h-24 rounded-3xl flex items-center justify-center"
                style={{
                  backgroundColor: `${theme.colors.text}08`,
                  border: `1px dashed ${theme.colors.text}1F`,
                }}
              >
                <Car size={28} style={{ color: theme.colors.textMuted, opacity: 0.5 }} />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p
                className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1"
                style={{ color: theme.colors.primary }}
              >
                <MapPin size={11} strokeWidth={3} /> {t('record.floor')}
              </p>
              <p
                className="text-5xl font-black tracking-tighter leading-tight truncate"
                style={{ color: theme.colors.text }}
              >
                {record.floor}
              </p>
            </div>
          </div>

          {/* 距離／狀態列（右端：照片位置調整入口） */}
          <div className="flex items-center gap-3 mt-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: !hasValidLocation
                  ? `${WARNING_COLOR}1A`
                  : `${theme.colors.primary}14`,
                color: !hasValidLocation ? WARNING_COLOR : theme.colors.primary,
              }}
            >
              {!hasValidLocation ? (
                <Navigation size={16} />
              ) : isIndoor ? (
                <Footprints size={16} />
              ) : (
                <Navigation2 size={16} strokeWidth={3} className="rotate-45" />
              )}
            </div>
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span
                className="text-xl font-black tabular-nums"
                style={{ color: theme.colors.text }}
              >
                {!hasValidLocation
                  ? '···'
                  : isIndoor
                    ? stepCount
                    : distance !== null
                      ? Math.round(distance)
                      : '--'}
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: theme.colors.textMuted }}
              >
                {!hasValidLocation
                  ? t('nav.gps_waiting')
                  : isIndoor
                    ? t('nav.steps')
                    : t('nav.unit_meters')}
              </span>
            </div>

            {record.photoData && record.latitude != null && record.longitude != null && (
              <button
                type="button"
                onClick={() => setPhotoEditMode((v) => !v)}
                aria-label={photoEditMode ? t('nav.photo_adjust_done') : t('nav.photo_adjust')}
                aria-pressed={photoEditMode}
                className="ml-auto min-h-11 px-3.5 rounded-2xl flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wide shrink-0 active:scale-95 transition-transform"
                style={
                  photoEditMode
                    ? { backgroundColor: theme.colors.primary, color: ON_PRIMARY_COLOR }
                    : {
                        backgroundColor: `${theme.colors.text}0A`,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.text}1A`,
                      }
                }
              >
                {photoEditMode ? <Check size={14} strokeWidth={3} /> : <Move size={14} />}
                {photoEditMode ? t('nav.photo_adjust_done') : t('nav.photo_adjust')}
              </button>
            )}
          </div>

          {/* 備註 */}
          {record.notes && (
            <p
              className="mt-3 text-sm leading-relaxed line-clamp-2"
              style={{ color: theme.colors.textMuted }}
            >
              {record.notes}
            </p>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {showPhotoModal && record.photoData && (
        <PhotoViewerModal
          src={record.photoData}
          alt={t('record.photo_alt')}
          onClose={() => setShowPhotoModal(false)}
          containerClassName="absolute inset-0"
        />
      )}
    </motion.div>
  );
}
