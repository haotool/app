/**
 * Park-Keeper Home Page
 * Faithfully reproduces the original .example/park-keeper/App.tsx UI/UX
 * within the monorepo SSG architecture.
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  useReducedMotion,
  type Variants,
} from 'motion/react';
import {
  Settings as SettingsIcon,
  Car,
  Search,
  List as ListIcon,
  AlertTriangle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ParkingRecord, AppSettings, ThemeConfig } from '@app/park-keeper/types';
import { THEMES, DEFAULT_SETTINGS, CUTE_WORDMARK_GRADIENT } from '@app/park-keeper/constants';
import { dbService } from '@app/park-keeper/services/db';
import { PLATE_UNSET_SENTINEL } from '@app/park-keeper/services/formatPlate';
import { syncMapTileCacheConfig } from '@app/park-keeper/services/mapTileCache';
import { pendingCtaPhoto } from '@app/park-keeper/services/pendingCtaPhoto';
import { useThemeTokens } from '@app/park-keeper/hooks/useThemeTokens';
import QuickEntry from '@app/park-keeper/components/QuickEntry';
import NavOverlay from '@app/park-keeper/components/NavOverlay';
import SettingsTab from '@app/park-keeper/components/SettingsTab';
import BrandLogo from '@app/park-keeper/components/BrandLogo';
import RecordCard from '@app/park-keeper/components/RecordCard';
import PickupHeroCard from '@app/park-keeper/components/PickupHeroCard';
import QuickCaptureCta from '@app/park-keeper/components/QuickCaptureCta';
import ListSkeleton from '@app/park-keeper/components/ListSkeleton';
import {
  NAV_CONTENT_H,
  NAV_ICON_SIZE,
  NAV_ICON_STROKE_ACTIVE,
  NAV_ICON_STROKE_INACTIVE,
  NAV_INDICATOR_CLS,
  NAV_INDICATOR_LAYOUT_ID,
  NAV_INDICATOR_TRANSITION,
  NAV_LABEL_BASE_CLS,
  NAV_TAB_GAP_CLS,
} from '@app/park-keeper/config/navBar';

// ---------------------------------------------------------------------------
// ANIMATION VARIANTS
// ---------------------------------------------------------------------------
const pageVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.98, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { ease: [0.25, 0.46, 0.45, 0.94], duration: 0.4 },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 1.01,
    filter: 'blur(2px)',
    transition: { ease: 'easeIn', duration: 0.25 },
  },
};

/** prefers-reduced-motion 版本：僅保留淡入淡出，移除位移/縮放/模糊。 */
const reducedPageVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

/** 教學入口：text 實色（cute @0.8 混色僅 3.68:1，故不做 opacity dimming）＋觸控熱區
 *  min-h-12（48px，R6 review：44px 名目值在行動裝置實測可縮至 43.27px）；
 *  載入態與內容態共用，markup 須與 HomeShell 同構。 */
function GuideEntryLink({ color, label }: { color: string; label: string }) {
  return (
    <div className="text-center">
      <Link
        to="/guide"
        className="inline-flex items-center justify-center min-h-12 min-w-12 px-4 text-xs font-bold underline underline-offset-4 hover:opacity-80 transition-opacity"
        style={{ color }}
      >
        {label}
      </Link>
    </div>
  );
}

/**
 * 空狀態教學入口卡（issue #753）：0 筆時取代純文字連結＋獨立空狀態訊息的雙元件組合，
 * 收斂為單一 soft depth 卡片（rounded-3xl＋1dp border＋theme surface），同時承載訊息與捷徑教學入口。
 * 不設 aria-label：accessible name 由完整可見文字自然組成，滿足 WCAG 2.5.3 Label in Name
 *（round-4 Sonnet F3，axe label-content-name-mismatch）。
 */
function EmptyStateGuideCard({
  theme,
  message,
  hint,
  label,
}: {
  theme: ThemeConfig;
  message: string;
  hint: string;
  label: string;
}) {
  return (
    <Link
      to="/guide"
      className="min-h-11 flex flex-col items-center gap-2 text-center px-6 py-10 rounded-3xl border border-black/1 shadow-elevation-1 active:scale-[0.99] transition-transform"
      style={{ backgroundColor: theme.colors.surface }}
    >
      <Car
        size={40}
        strokeWidth={1.5}
        aria-hidden
        style={{ color: theme.colors.primary, opacity: 0.35 }}
      />
      {/* 文字一律實色達 AA（issue #753 審查收斂）：message=text、hint=textMuted；
          連結不得用 pastel primary 當字色（cute 對白 surface 僅 1.69:1），改 text＋underline。 */}
      <p
        className="font-black text-xs uppercase tracking-[0.2em]"
        style={{ color: theme.colors.text }}
      >
        {message}
      </p>
      <p
        className="text-[11px] font-medium max-w-[220px] leading-relaxed"
        style={{ color: theme.colors.textMuted }}
      >
        {hint}
      </p>
      <span
        className="mt-1 text-[11px] font-bold underline underline-offset-4"
        style={{ color: theme.colors.text }}
      >
        {label}
      </span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// HOME PAGE
// ---------------------------------------------------------------------------
interface HomeProps {
  initialTab?: 'list' | 'settings';
}

export default function Home({ initialTab = 'list' }: HomeProps) {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const activePageVariants = shouldReduceMotion ? reducedPageVariants : pageVariants;
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
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [records, setRecords] = useState<ParkingRecord[]>([]);
  const [currentTab, setCurrentTab] = useState<'list' | 'settings'>(initialTab);
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [ctaPhotoFile, setCtaPhotoFile] = useState<File | null>(null);
  const [navRecord, setNavRecord] = useState<ParkingRecord | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storageUnavailable, setStorageUnavailable] = useState(false);

  const minimalistTheme = THEMES['minimalist'];
  const theme = THEMES[settings.theme] ?? minimalistTheme ?? THEMES['racing'];
  if (!theme) throw new Error('Theme config not found');

  const loadRecords = useCallback(async () => {
    try {
      const data = await dbService.getRecords();
      setRecords(data);
    } catch {
      setStorageUnavailable(true);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (typeof window !== 'undefined' && !('indexedDB' in window)) {
        setStorageUnavailable(true);
      }
      // 讀取失敗回退預設並照常標記已載入，避免清理排程與 SW 對齊僵死。
      let savedSettings = DEFAULT_SETTINGS;
      try {
        savedSettings = await dbService.getSettings();
      } catch (error) {
        console.warn('Settings load failed, using defaults', error);
      }
      setSettings(savedSettings);
      setSettingsLoaded(true);
      // 冷啟動即執行照片保存天數清理，再載入列表以反映清理結果。
      // 清理失敗（含 getRecords 拋錯）不得阻斷啟動；儲存層可用性由 loadRecords 錯誤路徑呈現。
      try {
        await dbService.runStartupCleanup(savedSettings.cacheDurationDays);
      } catch (error) {
        console.warn('Startup cleanup failed', error);
      }
      await loadRecords();
      setIsLoading(false);
    };
    void init();
  }, [loadRecords]);

  // 前景喚醒與 BFCache 還原觸發清理（iOS 無 Periodic Background Sync，見 research §C8）。
  useEffect(() => {
    const runCleanup = () => {
      dbService
        .runStartupCleanup(settings.cacheDurationDays)
        .then((cleaned) => {
          if (cleaned > 0) void loadRecords();
        })
        .catch((error: unknown) => {
          // 前景喚醒清理失敗僅記錄，不阻斷 app（getRecords 拋錯時避免 unhandled rejection）。
          console.warn('Foreground cleanup failed', error);
        });
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') runCleanup();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      // BFCache 還原不一定觸發 visibilitychange，需另行補跑。
      if (event.persisted) runCleanup();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [settings.cacheDurationDays, loadRecords]);

  useThemeTokens(theme);

  useEffect(() => {
    // 設定載入前不得送出預設值，否則會覆寫 SW 已持久化的使用者天數。
    if (!settingsLoaded) return;
    void syncMapTileCacheConfig(settings.cacheDurationDays);
  }, [settingsLoaded, settings.cacheDurationDays]);

  const updateSettings = useCallback((next: AppSettings) => {
    setSettings(next);
    void dbService.saveSettings(next);
  }, []);

  const handleSave = useCallback(
    async (data: Partial<ParkingRecord>) => {
      const newRecord: ParkingRecord = {
        id: crypto.randomUUID(),
        plateNumber: data.plateNumber ?? PLATE_UNSET_SENTINEL,
        floor: data.floor ?? '?',
        notes: data.notes ?? '',
        timestamp: Date.now(),
        photoData: data.photoData,
        hasPhoto: !!data.hasPhoto,
        latitude: data.latitude,
        longitude: data.longitude,
        parkedHeading: data.parkedHeading,
      };
      await dbService.saveRecord(newRecord);
      await loadRecords();
      setToast(t('record.saved'));
      setTimeout(() => setToast(null), 2500);
      if (currentTab !== 'list') setCurrentTab('list');
    },
    [loadRecords, t, currentTab],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await dbService.deleteRecord(id);
      await loadRecords();
      setToast(t('record.deleted'));
      setTimeout(() => setToast(null), 2500);
    },
    [loadRecords, t],
  );

  const handleUpdate = useCallback(async (id: string, updates: Partial<ParkingRecord>) => {
    let previousRecord: ParkingRecord | null = null;

    setRecords((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        previousRecord = item;
        return { ...item, ...updates };
      }),
    );
    setNavRecord((prev) => (prev?.id === id ? { ...prev, ...updates } : prev));

    try {
      await dbService.updateRecord(id, updates);
    } catch (error) {
      if (previousRecord) {
        setRecords((prev) =>
          prev.map((item) => (item.id === id ? (previousRecord ?? item) : item)),
        );
        setNavRecord((prev) => (prev?.id === id ? previousRecord : prev));
      }
      throw error;
    }
  }, []);

  const filteredRecords = records.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.plateNumber.toLowerCase().includes(q) ||
      r.floor.toLowerCase().includes(q) ||
      (r.notes ?? '').toLowerCase().includes(q)
    );
  });

  // 首屏 IA 狀態驅動雙模式（design brief 裁決）：現役記錄 = 最新一筆（getRecords 依時間降冪）。
  const latestRecord = records[0] ?? null;

  const handleCtaPhoto = useCallback((file: File) => {
    setCtaPhotoFile(file);
    setShowQuickEntry(true);
  }, []);

  // 主動作唯一化（issue #753）：底部 + FAB 移除，「不拍照手動記錄」第三級文字動作
  // 承接其職能——開啟 QuickEntry 空照片模式（不預帶 ctaPhotoFile）。
  const handleManualEntry = useCallback(() => {
    setShowQuickEntry(true);
  }, []);

  // 接手 SSG 殼（HomeShell）hydration 前開啟相機的照片，不落失使用者輸入。
  useEffect(() => pendingCtaPhoto.subscribe(handleCtaPhoto), [handleCtaPhoto]);

  // 浮層（QuickEntry sheet / NavOverlay）開啟時背景 inert，
  // 阻絕背景互動與 a11y tree 露出（issue #725 modal 語意）。
  // aria-hidden＋pointer-events-none 為 inert 未支援環境（Safari <15.5）的雙保險。
  const overlayOpen = showQuickEntry || navRecord !== null;

  return (
    <LayoutGroup>
      <div
        inert={overlayOpen}
        aria-hidden={overlayOpen || undefined}
        className={`h-screen w-full flex flex-col overflow-hidden font-sans ${overlayOpen ? 'pointer-events-none' : ''}`}
        style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}
      >
        {/* Premium Header */}
        {/* glass 不進首屏（issue #753 視覺語言）：移除 backdrop-blur，
            以較高不透明度純色維持捲動內容遮蔽力。 */}
        <header
          className="px-6 pb-4 pt-safe-top z-30 border-b border-black/3"
          style={{ backgroundColor: theme.colors.background + 'F0' }}
        >
          <div className="flex justify-between items-center max-w-md mx-auto w-full pt-4">
            <div className="flex items-center gap-3">
              <BrandLogo theme={theme} />
              {theme.id === 'cute' ? (
                <h1
                  className={`text-3xl font-black tracking-normal ${theme.font} bg-clip-text text-transparent drop-shadow-[0_2px_2px_rgba(0,0,0,0.05)]`}
                  style={{
                    // 對比修至 AA（issue #753）：CUTE_WORDMARK_GRADIENT 三色 4.80–5.45:1（on #FFFAF4）。
                    backgroundImage: `linear-gradient(to right, ${CUTE_WORDMARK_GRADIENT.join(', ')})`,
                  }}
                >
                  ParkKeeper
                </h1>
              ) : (
                <h1
                  className={`text-2xl font-black tracking-tight ${theme.font} bg-clip-text text-transparent`}
                  style={{
                    backgroundImage: `linear-gradient(to right, ${theme.colors.text}, ${theme.colors.primary})`,
                  }}
                >
                  ParkKeeper
                </h1>
              )}
            </div>

            {/* 0 筆時隱藏搜尋框：避免對空列表呈現死 UI（issue #753 空狀態）。 */}
            {currentTab === 'list' && records.length > 0 && (
              <div className="relative w-32 transition-all focus-within:w-40">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-30"
                  size={14}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('record.search')}
                  aria-label={t('record.search')}
                  className="w-full h-11 pl-9 pr-3 rounded-full text-[11px] font-bold outline-none bg-black/4 focus:bg-white/50 focus:shadow-sm transition-all"
                />
              </div>
            )}
          </div>
        </header>

        {/* Main Content：Layout 已提供唯一 main landmark，此處用 div 修 axe
            landmark-no-duplicate-main／landmark-main-is-top-level（R6 NEW-3）。 */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {currentTab === 'list' ? (
              <motion.div
                key="list"
                variants={activePageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="h-full overflow-y-auto no-scrollbar px-5 pt-5 pb-40"
              >
                {isLoading ? (
                  // 載入態與 SSG 殼（HomeShell）同構：hero CTA＋教學入口原位保留，
                  // 僅列表區顯示骨架——消除水合後閃爍與二次 LCP 候選（issue #725 審查收斂）。
                  <>
                    <div className="max-w-md mx-auto space-y-5 mb-5">
                      <QuickCaptureCta
                        theme={theme}
                        variant="hero"
                        label={t('home.quick_record_cta')}
                        hint={t('record.photo_tap')}
                        onPhotoSelected={handleCtaPhoto}
                        onManualEntry={handleManualEntry}
                        manualEntryLabel={t('home.manual_entry')}
                      />
                      <GuideEntryLink color={theme.colors.text} label={t('guide.entry')} />
                    </div>
                    <ListSkeleton theme={theme} />
                  </>
                ) : (
                  <div className="max-w-md mx-auto space-y-5">
                    {storageUnavailable && (
                      <div
                        role="alert"
                        className="flex items-center gap-3 p-4 rounded-2xl text-xs font-bold"
                        style={{
                          backgroundColor: `${theme.colors.primary}10`,
                          color: theme.colors.primary,
                        }}
                      >
                        <AlertTriangle size={18} className="shrink-0" />
                        <span>{t('error.storage_unavailable')}</span>
                      </div>
                    )}
                    {/* 首屏 IA 狀態驅動雙模式（design brief 裁決）：
                        有現役記錄 → 取車 hero 卡置頂 + 次要拍照 CTA；
                        無記錄 → 拍照 CTA hero（≥30dvh）置頂 + 空狀態 + 教學入口。 */}
                    {latestRecord ? (
                      <>
                        <PickupHeroCard
                          record={latestRecord}
                          theme={theme}
                          onNavigate={setNavRecord}
                        />
                        <QuickCaptureCta
                          theme={theme}
                          variant="compact"
                          label={t('home.quick_record_cta')}
                          hint={t('record.photo_tap')}
                          onPhotoSelected={handleCtaPhoto}
                          onManualEntry={handleManualEntry}
                          manualEntryLabel={t('home.manual_entry')}
                        />
                      </>
                    ) : (
                      <QuickCaptureCta
                        theme={theme}
                        variant="hero"
                        label={t('home.quick_record_cta')}
                        hint={t('record.photo_tap')}
                        onPhotoSelected={handleCtaPhoto}
                        onManualEntry={handleManualEntry}
                        manualEntryLabel={t('home.manual_entry')}
                      />
                    )}
                    {/* 空狀態（issue #753）：單一教學入口卡取代純文字連結＋獨立空狀態訊息組合；
                        text-xs（非 text-sm）維持 hydration 後文字繪製面積小於 SSG 殼首屏最大文字，
                        避免觸發更晚的 LCP entry（issue #738）。 */}
                    {records.length === 0 ? (
                      <EmptyStateGuideCard
                        theme={theme}
                        message={t('record.empty')}
                        hint={t('home.empty_guide_hint')}
                        label={t('guide.entry')}
                      />
                    ) : (
                      <GuideEntryLink color={theme.colors.text} label={t('guide.entry')} />
                    )}
                    {filteredRecords.map((r) => (
                      <RecordCard
                        key={r.id}
                        record={r}
                        theme={theme}
                        onDelete={handleDelete}
                        onUpdate={handleUpdate}
                        onNavigate={setNavRecord}
                        // 僅一筆且該筆即 hero 時降為精簡列，避免同筆照片/導航資訊重複
                        //（round-2 Composer U-R2-02；管理操作編輯/刪除/備註仍保留）。
                        compact={records.length === 1 && r.id === latestRecord?.id}
                        cacheDurationDays={settings.cacheDurationDays}
                        miniMapText={miniMapText}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="settings"
                variants={activePageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="h-full"
              >
                <SettingsTab settings={settings} updateSettings={updateSettings} theme={theme} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation
            高度架構：content div（56px 固定）+ safe-area spacer（分離），
            避免 pb-safe-bottom 吃掉可見內容高度。
            glass 不進首屏（issue #753 視覺語言）：移除 backdrop-blur，改高不透明度純色。 */}
        <nav
          className="fixed bottom-0 inset-x-0 z-30 border-t border-black/5"
          style={{ backgroundColor: theme.colors.background + 'F0' }}
        >
          {/* 可見內容區：固定 56px，與 safe area 無關 */}
          <div className={`flex ${NAV_CONTENT_H} max-w-md mx-auto px-6`}>
            {/* List Tab */}
            <div className="flex-1 h-full">
              <button
                type="button"
                aria-label={t('tab.list')}
                onClick={() => setCurrentTab('list')}
                className={`w-full h-full flex flex-col items-center justify-center ${NAV_TAB_GAP_CLS} relative group`}
              >
                {/* inactive 對比修至 AA（issue #753）：改用 theme.colors.textMuted 全不透明度，
                    取代 opacity-30 dimming（原做法在部分主題背景下對比 <3:1）。 */}
                <div
                  className={`transition-all duration-300 ${currentTab === 'list' ? 'scale-105' : ''}`}
                  style={{
                    color: currentTab === 'list' ? theme.colors.primary : theme.colors.textMuted,
                  }}
                >
                  <ListIcon
                    size={NAV_ICON_SIZE}
                    strokeWidth={
                      currentTab === 'list' ? NAV_ICON_STROKE_ACTIVE : NAV_ICON_STROKE_INACTIVE
                    }
                  />
                </div>
                {/* active 標籤字色用 text（R6 axe 守門）：Kawaii pastel primary 當字色僅
                    1.66:1；active 視覺由 icon primary 色＋indicator bar 承擔。 */}
                <span
                  className={NAV_LABEL_BASE_CLS}
                  style={{
                    color: currentTab === 'list' ? theme.colors.text : theme.colors.textMuted,
                  }}
                >
                  {t('tab.list')}
                </span>

                {currentTab === 'list' && (
                  <motion.div
                    layoutId={NAV_INDICATOR_LAYOUT_ID}
                    className={NAV_INDICATOR_CLS}
                    style={{ backgroundColor: theme.colors.primary }}
                    transition={NAV_INDICATOR_TRANSITION}
                  />
                )}
              </button>
            </div>

            {/* Settings Tab */}
            <div className="flex-1 h-full">
              <button
                type="button"
                aria-label={t('tab.settings')}
                onClick={() => setCurrentTab('settings')}
                className={`w-full h-full flex flex-col items-center justify-center ${NAV_TAB_GAP_CLS} relative group`}
              >
                <div
                  className={`transition-all duration-300 ${currentTab === 'settings' ? 'scale-105' : ''}`}
                  style={{
                    color:
                      currentTab === 'settings' ? theme.colors.primary : theme.colors.textMuted,
                  }}
                >
                  <SettingsIcon
                    size={NAV_ICON_SIZE}
                    strokeWidth={
                      currentTab === 'settings' ? NAV_ICON_STROKE_ACTIVE : NAV_ICON_STROKE_INACTIVE
                    }
                  />
                </div>
                <span
                  className={NAV_LABEL_BASE_CLS}
                  style={{
                    color: currentTab === 'settings' ? theme.colors.text : theme.colors.textMuted,
                  }}
                >
                  {t('tab.settings')}
                </span>

                {currentTab === 'settings' && (
                  <motion.div
                    layoutId={NAV_INDICATOR_LAYOUT_ID}
                    className={NAV_INDICATOR_CLS}
                    style={{ backgroundColor: theme.colors.primary }}
                    transition={NAV_INDICATOR_TRANSITION}
                  />
                )}
              </button>
            </div>
          </div>

          {/* Safe area spacer：獨立元素，不影響內容高度計算 */}
          <div className="pb-safe-bottom" />
        </nav>
      </div>

      {/* 浮層置於 inert 主容器之外：開啟時背景被隔離、浮層自身保持可互動 */}
      {/* QuickEntry */}
      <QuickEntry
        theme={theme}
        onSave={handleSave}
        isVisible={showQuickEntry}
        onClose={() => {
          setShowQuickEntry(false);
          // 清除 CTA 已拍照片，避免下次開啟面板誤帶舊照。
          setCtaPhotoFile(null);
        }}
        cacheDurationDays={settings.cacheDurationDays}
        initialPhotoFile={ctaPhotoFile}
      />

      {/* NavOverlay */}
      <AnimatePresence>
        {navRecord && (
          <NavOverlay
            record={navRecord}
            theme={theme}
            onClose={() => setNavRecord(null)}
            cacheDurationDays={settings.cacheDurationDays}
            onPhotoOffsetChange={(offset) => {
              void handleUpdate(navRecord.id, { photoOffset: offset });
            }}
          />
        )}
      </AnimatePresence>

      {/* Toast (centered pill) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { y: 20, opacity: 0 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { y: 20, opacity: 0 }}
            className="fixed left-1/2 -translate-x-1/2 px-8 py-3.5 rounded-full shadow-elevation-4 z-100 border border-white/10"
            style={{
              // 底部導覽列 56px＋進場位移 20px：7.5rem 保證 toast 全程（含進場動畫）
              // 不遮 bottom nav（FAB 已於 issue #753 移除）。
              bottom: 'calc(7.5rem + env(safe-area-inset-bottom))',
              backgroundColor: theme.colors.primary,
              color: theme.colors.onPrimary,
            }}
          >
            <span className="text-[11px] font-black uppercase tracking-widest">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}
