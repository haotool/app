/**
 * NavOverlay – 全螢幕羅盤導航（issue #752 佈局 v2）
 * 佈局：上 58% 地圖可視區（全彩主內容、照片錨、pill）→ 下 42% 弧形羅盤 deck。
 * 幾何契約：deck 盤面由 stage 量測值經 computeDeckGeometry 單一尺寸源推導；
 * 視高不足或橫向時降級 56px 方向膠囊，杜絕 Hub 吞沒刻度環。
 * 主題差異化以 token＋樣式參數實現（COMPASS_THEME_STYLES），不 fork 元件。
 */
import { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ArrowUp,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  ArrowUpLeft,
  Car,
  Check,
  Clock,
  Compass,
  MapPin,
  Move,
  X,
  Navigation,
  Footprints,
  Smartphone,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ThemeConfig, ParkingRecord } from '@app/park-keeper/types';
import { useNavigation, getDirectionInfo } from '@app/park-keeper/hooks/useNavigation';
import type { DirectionIconType } from '@app/park-keeper/hooks/useNavigation';
import {
  cardinalLabelPosition,
  cardinalLabelUprightTransform,
  isCardinalIndex,
  isMajorIndex,
  tickLength,
  tickStrokeWidth,
  tickOpacity,
  targetWedgePath,
  isAligned,
  computeDeckGeometry,
  CAPSULE_HEIGHT,
  COMPASS_NORTH_INDEX,
  TARGET_WEDGE_HALF_ANGLE_DEG,
  TICK_COUNT,
  TICK_STEP_DEG,
} from '@app/park-keeper/services/compassGeometry';
import type { DeckGeometry } from '@app/park-keeper/services/compassGeometry';
import {
  NORTH_COLOR,
  ARRIVED_COLOR,
  WARNING_COLOR,
  ARRIVED_BORDER,
  ARRIVED_GLOW,
  ON_PRIMARY_COLOR,
} from '@app/park-keeper/config/colors';
import { useModalDialog } from '@app/park-keeper/hooks/useModalDialog';
import { useScreenWakeLock } from '@app/park-keeper/hooks/useScreenWakeLock';
import { COMPASS_THEME_STYLES } from '@app/park-keeper/config/compassThemeStyles';
import { formatPlateLabel, isPlateUnset } from '@app/park-keeper/services/formatPlate';
import { formatElapsed } from './PickupHeroCard';
import PhotoViewerModal from './PhotoViewerModal';

const MiniMap = lazy(() => import('./MiniMap'));

/** 對準觸覺脈衝（Android；iOS 不支援 vibrate 靜默降級）。 */
const ALIGNED_VIBRATE_PATTERN = [30, 40, 30];

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
  const { t, i18n } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  // 照片位置調整模式：地圖照片錨變為可拖曳（持久化鏈不變）；入口在地圖區。
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
    recheckCalibration,
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
  // useLayoutEffect：與 Hub 邊框視覺變化同一 commit tick 觸發，
  // 消除 useEffect 排程造成的 ~50ms 視覺/觸覺不同步（issue #725 Gemini P3）。
  useLayoutEffect(() => {
    if (aligned && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ALIGNED_VIBRATE_PATTERN);
    }
  }, [aligned]);

  const direction = getDirectionInfo(relativeRotation);
  const directionHint = t(direction.i18nKey);

  const compassBlocked = permissionState !== 'granted';
  const showCalibration = permissionState === 'granted' && needsCalibration;

  // Deck stage 量測（單一尺寸源）：hub/弧/刻度/楔形全部由此推導。
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState<{ w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => setStageSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const geo: DeckGeometry | null = stageSize ? computeDeckGeometry(stageSize.w, stageSize.h) : null;

  const elapsed = formatElapsed(record.timestamp, i18n.language) ?? t('home.just_now');
  // 區域變數收窄型別，供 JSX 使用（避免 non-null assertion）。
  const recordLat = record.latitude;
  const recordLng = record.longitude;
  const hasMapCoords = recordLat != null && recordLng != null;

  const distanceValue = isIndoor ? stepCount : distance !== null ? Math.round(distance) : '--';
  const distanceUnit = isIndoor ? t('nav.steps') : t('nav.unit_meters');

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
      {/* 0. 上 58% 地圖可視區（+24px 底部延伸墊入 deck 圓角後方）。
          MiniMap 為全彩主內容：車位 pin＋照片縮圖錨（tap 開檢視器）＋使用者位置。 */}
      <div
        className="absolute inset-x-0 top-0 z-0 overflow-hidden"
        style={{ height: 'calc(58% + 24px)' }}
      >
        <Suspense
          fallback={
            <div className="w-full h-full" style={{ background: theme.colors.background }} />
          }
        >
          {recordLat != null && recordLng != null && (
            <MiniMap
              lat={recordLat}
              lng={recordLng}
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
              className=""
              mapKey={`nav-${record.id}`}
              photoData={record.photoData}
              photoDraggable={photoEditMode}
              onPhotoClick={() => setShowPhotoModal(true)}
              parkedHeading={record.parkedHeading}
              trackedViewportInsets={{ top: 108, right: 36, bottom: 64, left: 36 }}
              photoOffset={record.photoOffset}
              onPhotoPositionChange={onPhotoOffsetChange}
            />
          )}
        </Suspense>

        {/* 平放提示／照片調整提示 pill：地圖區底緣（不蓋 deck 楔形與錨點）。 */}
        <AnimatePresence>
          {photoEditMode ? (
            <motion.div
              key="photo-edit-hint"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute inset-x-0 bottom-9 z-20 flex justify-center pointer-events-none"
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
          ) : (
            !compassBlocked &&
            !isPhoneFlat &&
            !arrived && (
              <motion.div
                key="hold-flat"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="absolute inset-x-0 bottom-9 z-20 flex justify-center pointer-events-none"
              >
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md whitespace-nowrap shadow-lg"
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
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>

        {/* 照片位置調整入口（地圖區右下；photoOffset 持久化鏈不變）。 */}
        {record.photoData && hasMapCoords && (
          <button
            type="button"
            onClick={() => setPhotoEditMode((v) => !v)}
            aria-label={photoEditMode ? t('nav.photo_adjust_done') : t('nav.photo_adjust')}
            aria-pressed={photoEditMode}
            className="absolute right-4 bottom-9 z-20 min-h-11 px-3.5 rounded-2xl flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wide backdrop-blur-md active:scale-95 transition-transform shadow-lg"
            style={
              photoEditMode
                ? { backgroundColor: theme.colors.primary, color: ON_PRIMARY_COLOR }
                : {
                    backgroundColor: `${theme.colors.surface}CC`,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.text}1A`,
                  }
            }
          >
            {photoEditMode ? <Check size={14} strokeWidth={3} /> : <Move size={14} />}
            {photoEditMode ? t('nav.photo_adjust_done') : t('nav.photo_adjust')}
          </button>
        )}

        {/* 無座標記錄的照片入口回退（地圖不渲染時保留照片可達性）。 */}
        {record.photoData && !hasMapCoords && (
          <button
            type="button"
            onClick={() => setShowPhotoModal(true)}
            aria-label={t('record.view_photo')}
            className="absolute right-4 bottom-9 z-20 w-14 h-14 rounded-2xl overflow-hidden shadow-lg active:scale-95 transition-transform"
            style={{ border: `2px solid ${theme.colors.surface}` }}
          >
            <img
              src={record.photoData}
              alt={t('record.photo_alt')}
              className="w-full h-full object-cover"
            />
          </button>
        )}
      </div>

      {/* 1. Top Header：車牌＋關閉。
          車牌毛玻璃 pill 自帶底色（不依賴漸層供對比），漸層收短且提前透明。 */}
      <div
        className="absolute top-0 inset-x-0 z-30 px-5 pt-safe-top flex justify-between items-start pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, ${theme.colors.background}F2 0%, ${theme.colors.background}A6 45%, transparent 78%)`,
        }}
      >
        <div className="pointer-events-auto mt-2 pb-4">
          <div
            className="flex items-center gap-2 backdrop-blur-2xl rounded-2xl pl-1.5 pr-3.5 py-1.5 shadow-lg"
            style={{
              backgroundColor: `${theme.colors.surface}CC`,
              border: `1px solid ${theme.colors.text}10`,
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}
            >
              <Car size={16} />
            </div>
            <h2
              className="text-2xl font-black tracking-tighter"
              style={{ color: theme.colors.text }}
            >
              {/* 未填車號 sentinel 經 formatPlate SSOT 轉換，與 RecordCard/hero 卡一致。 */}
              {isPlateUnset(record.plateNumber) ? (
                <span className="opacity-50 text-lg">
                  {formatPlateLabel(record.plateNumber, t('record.plate_unset'))}
                </span>
              ) : (
                record.plateNumber
              )}
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

      {/* 2. 下 42% 羅盤 deck（sheet 語彙：圓角上緣＋資訊緊湊列＋弧形盤面 stage）。 */}
      <div
        data-testid="compass-deck"
        className="absolute inset-x-0 bottom-0 h-[42%] z-20 flex flex-col rounded-t-[2rem] border-t shadow-[0_-10px_40px_rgba(0,0,0,0.12)] pb-safe-bottom"
        style={{
          backgroundColor: theme.colors.background,
          borderColor: `${theme.colors.text}10`,
        }}
      >
        {/* 資訊緊湊列：樓層／車號／備註／經過時間（deck 上緣；距離唯一顯示於 hub）。 */}
        <div
          data-testid="nav-info-strip"
          className="shrink-0 h-12 px-5 flex items-center gap-2.5 min-w-0 max-w-md w-full mx-auto"
        >
          <span
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-black tracking-tight"
            style={{ backgroundColor: `${theme.colors.primary}14`, color: theme.colors.primary }}
          >
            <MapPin size={12} strokeWidth={3} />
            {record.floor}
          </span>
          <span
            className="shrink-0 text-sm font-bold tracking-tight"
            style={{
              color: theme.colors.text,
              opacity: isPlateUnset(record.plateNumber) ? 0.5 : 1,
            }}
          >
            {formatPlateLabel(record.plateNumber, t('record.plate_unset'))}
          </span>
          {record.notes ? (
            <span
              className="flex-1 min-w-0 truncate text-xs"
              style={{ color: theme.colors.textMuted }}
            >
              {record.notes}
            </span>
          ) : (
            <span className="flex-1" />
          )}
          <span
            className="shrink-0 flex items-center gap-1 text-xs font-bold tabular-nums"
            style={{ color: theme.colors.textMuted }}
          >
            <Clock size={11} strokeWidth={2.5} />
            {elapsed}
          </span>
        </div>

        {/* 弧形盤面 stage：量測 → computeDeckGeometry → arc 或 capsule。 */}
        <div ref={stageRef} className="relative flex-1 min-h-0 overflow-hidden">
          {geo?.mode === 'arc' && (
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
                    if (!isCardinalIndex(i) || isMajorIndex(i)) return null;
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
                          filter: aligned
                            ? `drop-shadow(0 0 6px ${theme.colors.primary})`
                            : undefined,
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
          )}

          {/* 降級方向膠囊（56px SSOT）：視高低於閾值或橫向，杜絕 Hub 吞沒。 */}
          {geo?.mode === 'capsule' && (
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
                    arrived
                      ? ARRIVED_BORDER
                      : aligned
                        ? theme.colors.primary
                        : `${theme.colors.text}14`
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
                        className="px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest text-white shadow-md active:scale-95"
                        style={{ backgroundColor: ARRIVED_COLOR }}
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
          )}
        </div>
      </div>

      {/* 3. 權限卡／校準卡（全覆蓋維持——設計意圖；可互動） */}
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
