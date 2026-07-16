import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'motion/react';
import { Camera, Trash2, Check, Grid, Loader2, AlertCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ThemeConfig, ParkingRecord } from '@app/park-keeper/types';
import { compressImage } from '@app/park-keeper/services/imageUtils';
import { useDeviceOrientation } from '@app/park-keeper/hooks/useDeviceOrientation';
import { useModalDialog } from '@app/park-keeper/hooks/useModalDialog';
import { GEO_TIMEOUT_MS } from '@app/park-keeper/hooks/useNavigation';
import { WARNING_COLOR } from '@app/park-keeper/config/colors';
import { plateMemory } from '@app/park-keeper/services/plateMemory';

const MiniMap = lazy(() => import('./MiniMap'));

const FLOORS = ['B3', 'B2', 'B1', '1F', '2F', '3F', '4F', 'Custom'];

// 觸覺回饋：不支援的平台（iOS Safari）靜默略過。模組層宣告確保 hook 依賴穩定。
const vibrate = (pattern: number | number[] = 15) => {
  if (navigator.vibrate) navigator.vibrate(pattern);
};

interface QuickEntryProps {
  theme: ThemeConfig;
  onSave: (record: Partial<ParkingRecord>) => void | Promise<void>;
  isVisible: boolean;
  onClose: () => void;
  cacheDurationDays?: number;
  // fullscreen：/add 快速記錄頁全螢幕模式；sheet（預設）：既有 bottom sheet 行為不變。
  mode?: 'sheet' | 'fullscreen';
  // 首屏拍照 CTA 已取得的照片：開啟面板時直接帶入，走同一條壓縮管線。
  initialPhotoFile?: File | null;
}

const panelVariants: Variants = {
  hidden: { y: '110%', opacity: 0 },
  visible: {
    y: '0%',
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 28,
      stiffness: 300,
      mass: 0.8,
      when: 'beforeChildren',
      staggerChildren: 0.08,
    },
  },
  exit: { y: '110%', opacity: 0, transition: { type: 'spring', damping: 30, stiffness: 300 } },
};

// 全螢幕模式為頁面內容而非浮層，僅淡入並沿用子項 stagger。
const fullscreenVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { when: 'beforeChildren', staggerChildren: 0.08 },
  },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 20 },
  },
};

// prefers-reduced-motion：僅保留淡入淡出，移除位移/縮放/彈簧（issue #725）。
const reducedPanelVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15, when: 'beforeChildren' } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

const reducedItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
};

export default function QuickEntry({
  theme,
  onSave,
  isVisible,
  onClose,
  cacheDurationDays,
  mode = 'sheet',
  initialPhotoFile = null,
}: QuickEntryProps) {
  const { t } = useTranslation();
  const isFullscreen = mode === 'fullscreen';
  const shouldReduceMotion = useReducedMotion();
  const activePanelVariants = shouldReduceMotion ? reducedPanelVariants : panelVariants;
  const activeFullscreenVariants = shouldReduceMotion ? reducedPanelVariants : fullscreenVariants;
  const activeItemVariants = shouldReduceMotion ? reducedItemVariants : itemVariants;
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
  const [plate, setPlate] = useState(() => plateMemory.get() ?? '');
  const [plateHistory, setPlateHistory] = useState<string[]>(() => plateMemory.getHistory());
  const [selectedFloor, setSelectedFloor] = useState(() => plateMemory.getFloor() ?? '');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [customFloorMode, setCustomFloorMode] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // 照片來源引導卡（issue #725）：process＝讀取/壓縮失敗、cancelled＝相機取消或未取得照片。
  const [photoIssue, setPhotoIssue] = useState<'process' | 'cancelled' | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationHeading, setLocationHeading] = useState<number | null>(null);
  const watchId = useRef<number | null>(null);
  const { heading: parkedHeading } = useDeviceOrientation({ enabled: isVisible });

  // Sheet 模式為 modal：dialog 語意＋focus trap＋Esc（fullscreen 為 /add 頁面內容，不套用）。
  const sheetRef = useRef<HTMLDivElement>(null);
  useModalDialog(sheetRef, isVisible && !isFullscreen, onClose);

  const stopTracking = useCallback(() => {
    if (watchId.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const startPrecisionTracking = useCallback(() => {
    if (!navigator.geolocation) return;
    stopTracking();
    setIsLocating(true);
    setLocationDenied(false);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationAccuracy(pos.coords.accuracy);
        setLocationHeading(typeof pos.coords.heading === 'number' ? pos.coords.heading : null);
        setIsLocating(false);
        setLocationDenied(false);
      },
      () => {
        // 不得靜默回退預設座標：無座標時允許儲存但明示未記錄位置。
        setIsLocating(false);
        setLocationDenied(true);
      },
      { enableHighAccuracy: true, timeout: GEO_TIMEOUT_MS, maximumAge: 0 },
    );
  }, [stopTracking]);

  // 壓縮任務世代序號：面板關閉或新任務啟動時遞增，過期 resolve 不得寫回狀態。
  const photoJobRef = useRef(0);

  const processPhotoFile = useCallback(async (file: File) => {
    const job = ++photoJobRef.current;
    setIsProcessing(true);
    try {
      const compressed = await compressImage(file, 1024, 0.7);
      if (job !== photoJobRef.current) return;
      setPhoto(compressed);
      // 成功才清除引導卡，避免 mode="wait" 期間多段 children 切換造成視覺跳動。
      setPhotoIssue(null);
      vibrate(50);
    } catch {
      if (job !== photoJobRef.current) return;
      setPhotoIssue('process');
      vibrate([50, 50, 50]);
    } finally {
      if (job === photoJobRef.current) setIsProcessing(false);
    }
  }, []);

  useEffect(() => {
    if (isVisible) {
      startPrecisionTracking();
      // 開啟面板時以上次已儲存的記憶預填，覆蓋關閉前未儲存的暫時輸入。
      setPlate(plateMemory.get() ?? '');
      setSelectedFloor(plateMemory.getFloor() ?? '');
      setPlateHistory(plateMemory.getHistory());
      // 首屏 CTA 已拍好的照片直接帶入（宿主於關閉時清除，避免重開誤帶舊照）。
      if (initialPhotoFile) void processPhotoFile(initialPhotoFile);
    } else {
      stopTracking();
      // 作廢仍在壓縮中的任務，避免關閉後 resolve 殘留照片。
      photoJobRef.current += 1;
      setNotes('');
      setPhoto(null);
      setPhotoIssue(null);
      setIsProcessing(false);
      setSaveStatus('idle');
      setCustomFloorMode(false);
      setLocationHeading(null);
      setLocationDenied(false);
    }
    return () => stopTracking();
  }, [isVisible, startPrecisionTracking, stopTracking, initialPhotoFile, processPhotoFile]);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processPhotoFile(file);
      e.target.value = '';
    }
  };

  const triggerAutoSave = async (floorValue: string) => {
    if (saveStatus !== 'idle') return;
    setSelectedFloor(floorValue);
    setSaveStatus('saving');
    vibrate([20, 40]);

    const recordData: Partial<ParkingRecord> = {
      plateNumber: plate || 'N/A',
      floor: floorValue,
      notes: notes.trim(),
      photoData: photo ?? undefined,
      hasPhoto: !!photo,
      // GPS 不可用時不寫入任何預設座標，保持 undefined。
      latitude: location?.lat,
      longitude: location?.lng,
      parkedHeading: parkedHeading ?? locationHeading ?? undefined,
    };

    await new Promise((r) => setTimeout(r, 600));
    try {
      await onSave(recordData);
    } catch {
      // 儲存失敗：不寫記憶、不關面板，恢復可重試狀態。
      setSaveStatus('idle');
      vibrate([50, 50, 50]);
      return;
    }
    // 僅於儲存成功時才正式寫入記憶；空車號不覆寫既有記憶（清記憶只走 clear）。
    if (plate.trim()) plateMemory.commit(plate);
    plateMemory.commitFloor(floorValue);
    setSaveStatus('success');
    setTimeout(() => onClose(), 400);
  };

  const gpsIndicatorClass = isLocating
    ? 'bg-amber-500 animate-pulse'
    : locationAccuracy && locationAccuracy > 50
      ? 'bg-red-500'
      : locationAccuracy && locationAccuracy > 20
        ? 'bg-orange-400'
        : 'bg-green-500';

  const showLocationDeniedCard = locationDenied && !location;

  const formContent = (
    <>
      <motion.div
        variants={activeItemVariants}
        className={isFullscreen ? 'flex flex-col gap-4' : 'flex gap-4 h-36'}
      >
        <div
          className={`relative rounded-3xl overflow-hidden bg-[var(--color-surface)] border-2 border-dashed border-[color:var(--color-primary)]/10 flex items-center justify-center shadow-inner group ${
            isFullscreen ? 'w-full min-h-[42dvh]' : 'flex-1'
          }`}
        >
          <AnimatePresence mode="wait">
            {photo ? (
              <motion.div
                key="photo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full absolute inset-0"
              >
                <img
                  src={photo}
                  className="w-full h-full object-cover"
                  alt={t('record.photo_alt')}
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    vibrate(10);
                    setPhoto(null);
                  }}
                  aria-label={t('record.remove_photo')}
                  className="absolute top-1 right-1 min-w-11 min-h-11 flex items-center justify-center bg-black/60 rounded-full text-white backdrop-blur-md"
                >
                  <Trash2 size={14} />
                </motion.button>
              </motion.div>
            ) : photoIssue ? (
              /* 照片來源引導卡：說明＋重新拍照＋返回，不得死路（issue #725）。 */
              <motion.div
                key="issue"
                data-testid="photo-issue-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center text-center px-3 py-2 w-full gap-1.5"
              >
                <AlertCircle className="shrink-0" size={20} style={{ color: WARNING_COLOR }} />
                <span
                  className="text-[10px] font-bold leading-snug"
                  style={{ color: WARNING_COLOR }}
                >
                  {photoIssue === 'process' ? t('error.image') : t('error.photo_cancelled')}
                </span>
                <span className="text-[9px] font-medium leading-snug opacity-60">
                  {t('error.photo_source_help')}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <label
                    className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide text-white cursor-pointer active:scale-95 transition-transform bg-[var(--color-primary)]"
                    onClick={() => vibrate(10)}
                  >
                    {t('action.retake_photo')}
                    <input
                      data-testid="photo-issue-retake-input"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => void handlePhoto(e)}
                      disabled={isProcessing}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      vibrate(10);
                      setPhotoIssue(null);
                    }}
                    className="px-3 py-1.5 bg-black/5 rounded-full text-[10px] font-black uppercase tracking-wide active:scale-95 transition-transform"
                  >
                    {t('action.dismiss')}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.label
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-transform active:scale-95"
                onClick={() => vibrate(10)}
              >
                {isProcessing ? (
                  <Loader2
                    size={isFullscreen ? 48 : 28}
                    className="animate-spin text-[var(--color-primary)]"
                  />
                ) : (
                  <Camera
                    size={isFullscreen ? 48 : 28}
                    className="text-[var(--color-primary)] mb-2 opacity-70"
                  />
                )}
                <span
                  className={`font-black uppercase tracking-widest ${
                    isFullscreen ? 'text-sm opacity-60' : 'text-[10px] opacity-40'
                  }`}
                >
                  {isProcessing ? t('record.processing') : t('record.photo_tap')}
                </span>
                <input
                  data-testid="quick-entry-photo-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => void handlePhoto(e)}
                  // 使用者取消相機/選擇器（或相機無法開啟被系統關閉）→ 顯示引導卡。
                  // React 僅對 dialog 綁 cancel，file input 需原生監聽（React 19 ref cleanup）。
                  ref={(el) => {
                    if (!el) return undefined;
                    const onCancel = () => setPhotoIssue('cancelled');
                    el.addEventListener('cancel', onCancel);
                    return () => el.removeEventListener('cancel', onCancel);
                  }}
                  disabled={isProcessing}
                />
              </motion.label>
            )}
          </AnimatePresence>
        </div>
        <div
          className={`relative rounded-3xl overflow-hidden border-2 border-[color:var(--color-primary)]/5 shadow-inner bg-[var(--color-surface)] ${
            isFullscreen ? 'w-full h-32' : 'flex-1'
          }`}
        >
          {showLocationDeniedCard ? (
            <div
              data-testid="location-denied-card"
              className="w-full h-full flex flex-col items-center justify-center text-center gap-1.5 px-3 py-2"
            >
              <AlertCircle className="shrink-0" size={16} style={{ color: WARNING_COLOR }} />
              <span className="text-[9px] font-bold leading-snug" style={{ color: WARNING_COLOR }}>
                {t('error.location_denied')}
              </span>
              <span className="text-[8px] font-black uppercase tracking-wide opacity-40">
                {t('record.no_location')}
              </span>
              <button
                type="button"
                onClick={() => {
                  vibrate(10);
                  startPrecisionTracking();
                }}
                className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wide active:scale-95 transition-transform"
                style={{ backgroundColor: `${WARNING_COLOR}14`, color: WARNING_COLOR }}
              >
                {t('action.retry')}
              </button>
            </div>
          ) : (
            <>
              <Suspense fallback={<div className="w-full h-full bg-black/5 animate-pulse" />}>
                {location && (
                  <MiniMap
                    lat={location.lat}
                    lng={location.lng}
                    theme={theme}
                    interactive={true}
                    allowZoom={false}
                    showZoomControl={false}
                    lockBounds={true}
                    cacheDurationDays={cacheDurationDays}
                    text={miniMapText}
                    onLocationSelect={(la, ln) => setLocation({ lat: la, lng: ln })}
                  />
                )}
              </Suspense>
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-xl shadow-sm">
                <div className={`w-2 h-2 rounded-full ${gpsIndicatorClass}`} />
                <span className="text-[8px] font-black uppercase text-gray-500 tracking-tighter">
                  {isLocating ? t('nav.gps_waiting') : `${locationAccuracy?.toFixed(0) ?? '?'}m`}
                </span>
              </div>
            </>
          )}
        </div>
      </motion.div>

      <motion.div variants={activeItemVariants} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            placeholder={t('record.plate')}
            className="w-full h-16 px-6 pr-14 rounded-2xl bg-[var(--color-surface)] border-2 border-[color:var(--color-primary)]/5 outline-none font-black text-2xl tracking-tighter shadow-sm focus:border-[color:var(--color-primary)]/20 transition-all placeholder:opacity-30"
          />
          {plate && (
            <button
              type="button"
              onClick={() => {
                setPlate('');
                vibrate(10);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
              aria-label={t('record.clear_plate')}
            >
              <X size={20} className="opacity-40" />
            </button>
          )}
        </div>
        {/* 歷史車號一鍵切換（design brief 旅程 A #3）：去重排除當前輸入值 */}
        {plateHistory.filter((p) => p !== plate).length > 0 && (
          <div className="flex flex-wrap gap-2" data-testid="plate-history-chips">
            {plateHistory
              .filter((p) => p !== plate)
              .map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    vibrate(10);
                    setPlate(p);
                  }}
                  className="min-h-11 px-4 rounded-full text-xs font-black tracking-wide bg-[var(--color-surface)] border border-[color:var(--color-primary)]/15 text-[var(--color-text)] active:scale-95 transition-transform"
                >
                  {p}
                </button>
              ))}
          </div>
        )}
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            // 自動展開高度。
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          placeholder={t('record.notes_placeholder')}
          rows={1}
          className="w-full min-h-12 px-6 py-3.5 rounded-2xl bg-[var(--color-surface)] border border-[color:var(--color-primary)]/5 outline-none text-[11px] font-bold placeholder:opacity-40 resize-none overflow-hidden leading-relaxed"
        />
      </motion.div>

      <motion.div variants={activeItemVariants} className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">
            {t('record.floor')}
          </span>
          <span className="text-[9px] font-bold text-[var(--color-primary)] bg-[color:var(--color-primary)]/10 px-3 py-1 rounded-full animate-pulse">
            {t('record.save_hint')}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-3.5">
          {FLOORS.map((f) => (
            <motion.button
              key={f}
              layout
              disabled={saveStatus !== 'idle'}
              onClick={() => {
                if (f === 'Custom') {
                  vibrate(10);
                  setCustomFloorMode(true);
                } else void triggerAutoSave(f);
              }}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className={`h-14 rounded-2xl text-[13px] font-black border-2 flex items-center justify-center relative overflow-hidden
                ${selectedFloor === f ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-lg' : 'bg-[var(--color-surface)] border-black/5 text-[var(--color-text)]'}
                ${saveStatus !== 'idle' && selectedFloor !== f ? 'opacity-20' : ''}`}
            >
              {saveStatus === 'saving' && selectedFloor === f ? (
                <Loader2 className="animate-spin" size={20} />
              ) : saveStatus === 'success' && selectedFloor === f ? (
                <Check size={24} strokeWidth={4} />
              ) : f === 'Custom' ? (
                <Grid size={20} />
              ) : (
                f
              )}
            </motion.button>
          ))}
        </div>
        <AnimatePresence>
          {customFloorMode && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10 }}
              className="pt-2 overflow-hidden"
            >
              <div className="flex gap-3">
                <input
                  autoFocus
                  type="text"
                  value={selectedFloor === 'Custom' ? '' : selectedFloor}
                  onChange={(e) => setSelectedFloor(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void triggerAutoSave(selectedFloor)}
                  placeholder={t('record.zone_placeholder')}
                  className="flex-1 h-14 px-6 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-primary)] outline-none text-base font-black shadow-inner"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => void triggerAutoSave(selectedFloor)}
                  className="w-14 h-14 rounded-2xl bg-[var(--color-primary)] text-white flex items-center justify-center shadow-lg"
                >
                  <Check size={24} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );

  if (isFullscreen) {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            variants={activeFullscreenVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full"
          >
            <div className="max-w-md mx-auto space-y-6 px-6 pb-8 pt-2">{formContent}</div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            data-testid="quick-entry-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => {
              vibrate(10);
              onClose();
            }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
          />
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('add.title')}
            tabIndex={-1}
            variants={activePanelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col pointer-events-auto overflow-hidden border-t border-white/10 outline-none"
            style={{ backgroundColor: theme.colors.background }}
          >
            <div
              data-testid="quick-entry-handle"
              className="w-full flex justify-center pt-5 pb-2"
              onClick={() => {
                vibrate(10);
                onClose();
              }}
            >
              <div className="w-12 h-1.5 rounded-full bg-black/10" />
            </div>
            <div className="px-6 pb-safe-bottom">
              <div className="max-w-md mx-auto space-y-6 pb-8 pt-2">{formContent}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
