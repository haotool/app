/**
 * NavOverlay – 全螢幕羅盤導航（issue #752 佈局 v2）
 * 佈局：上 58% 地圖可視區（全彩主內容、照片錨、pill）→ 下 42% 弧形羅盤 deck。
 * 幾何契約：deck 盤面由 stage 量測值經 computeDeckGeometry 單一尺寸源推導；
 * 視高不足或橫向時降級 56px 方向膠囊（CompassCapsule），杜絕 Hub 吞沒刻度環。
 * 盤面／膠囊／權限卡拆為 CompassArcStage、CompassCapsule、NavPermissionSheet。
 */
import { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Car, Check, Clock, MapPin, Move, X, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ThemeConfig, ParkingRecord } from '@app/park-keeper/types';
import { useNavigation, getDirectionInfo } from '@app/park-keeper/hooks/useNavigation';
import { isAligned, computeDeckGeometry } from '@app/park-keeper/services/compassGeometry';
import type { DeckGeometry } from '@app/park-keeper/services/compassGeometry';
import { WARNING_COLOR, ON_PRIMARY_COLOR } from '@app/park-keeper/config/colors';
import { useModalDialog } from '@app/park-keeper/hooks/useModalDialog';
import { useScreenWakeLock } from '@app/park-keeper/hooks/useScreenWakeLock';
import { COMPASS_THEME_STYLES } from '@app/park-keeper/config/compassThemeStyles';
import { formatPlateLabel, isPlateUnset } from '@app/park-keeper/services/formatPlate';
import { formatElapsed } from './PickupHeroCard';
import CompassArcStage from './CompassArcStage';
import CompassCapsule from './CompassCapsule';
import NavPermissionSheet from './NavPermissionSheet';
import PhotoViewerModal from './PhotoViewerModal';

const MiniMap = lazy(() => import('./MiniMap'));

/** 對準觸覺脈衝（Android；iOS 不支援 vibrate 靜默降級）。 */
const ALIGNED_VIBRATE_PATTERN = [30, 40, 30];

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
            <CompassArcStage
              geo={geo}
              theme={theme}
              compassStyle={compassStyle}
              trueAnimHeading={trueAnimHeading}
              animTargetBearing={animTargetBearing}
              compassBlocked={compassBlocked}
              hasValidLocation={hasValidLocation}
              arrived={arrived}
              aligned={aligned}
              isIndoor={isIndoor}
              showArrivedCTA={showArrivedCTA}
              distanceValue={distanceValue}
              distanceUnit={distanceUnit}
              direction={direction}
              directionHint={directionHint}
              onClose={onClose}
            />
          )}

          {/* 降級方向膠囊（56px SSOT）：視高低於閾值或橫向，杜絕 Hub 吞沒。 */}
          {geo?.mode === 'capsule' && (
            <CompassCapsule
              theme={theme}
              trueAnimHeading={trueAnimHeading}
              animTargetBearing={animTargetBearing}
              compassBlocked={compassBlocked}
              hasValidLocation={hasValidLocation}
              arrived={arrived}
              aligned={aligned}
              isIndoor={isIndoor}
              showArrivedCTA={showArrivedCTA}
              distanceValue={distanceValue}
              distanceUnit={distanceUnit}
              directionHint={directionHint}
              onClose={onClose}
            />
          )}
        </div>
      </div>

      {/* 3. 權限卡／校準卡（全覆蓋維持——設計意圖；可互動） */}
      <NavPermissionSheet
        theme={theme}
        compassBlocked={compassBlocked}
        showCalibration={showCalibration}
        permissionState={permissionState}
        requestCompassPermission={requestCompassPermission}
        recheckCalibration={recheckCalibration}
      />

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
