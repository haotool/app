/**
 * Park-Keeper Home Page
 * Faithfully reproduces the original .example/park-keeper/App.tsx UI/UX
 * within the monorepo SSG architecture.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup, type Variants } from 'motion/react';
import { Plus, Settings as SettingsIcon, Car, Search, List as ListIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ParkingRecord, AppSettings } from '@app/park-keeper/types';
import { THEMES, DEFAULT_SETTINGS } from '@app/park-keeper/constants';
import { dbService } from '@app/park-keeper/services/db';
import { syncMapTileCacheConfig } from '@app/park-keeper/services/mapTileCache';
import QuickEntry from '@app/park-keeper/components/QuickEntry';
import { UpdatePrompt } from '@app/park-keeper/components/UpdatePrompt';
import NavOverlay from '@app/park-keeper/components/NavOverlay';
import SettingsTab from '@app/park-keeper/components/SettingsTab';
import BrandLogo from '@app/park-keeper/components/BrandLogo';
import RecordCard from '@app/park-keeper/components/RecordCard';
import {
  NAV_CONTENT_H,
  NAV_ICON_SIZE,
  NAV_ICON_STROKE_ACTIVE,
  NAV_ICON_STROKE_INACTIVE,
  NAV_INDICATOR_CLS,
  NAV_INDICATOR_LAYOUT_ID,
  NAV_INDICATOR_TRANSITION,
  NAV_LABEL_BASE_CLS,
  NAV_LABEL_INACTIVE_CLS,
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

// ---------------------------------------------------------------------------
// HOME PAGE
// ---------------------------------------------------------------------------
interface HomeProps {
  initialTab?: 'list' | 'settings';
}

export default function Home({ initialTab = 'list' }: HomeProps) {
  const { t, i18n } = useTranslation();
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
  const [navRecord, setNavRecord] = useState<ParkingRecord | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const minimalistTheme = THEMES['minimalist'];
  const theme = THEMES[settings.theme] ?? minimalistTheme ?? THEMES['racing'];
  if (!theme) throw new Error('Theme config not found');

  const loadRecords = useCallback(async () => {
    const data = await dbService.getRecords();
    setRecords(data);
  }, []);

  useEffect(() => {
    const init = async () => {
      // 讀取失敗回退預設並照常標記已載入，避免清理排程與 SW 對齊僵死。
      let savedSettings = DEFAULT_SETTINGS;
      try {
        savedSettings = await dbService.getSettings();
      } catch (error) {
        console.warn('Settings load failed, using defaults', error);
      }
      setSettings(savedSettings);
      setSettingsLoaded(true);
      void i18n.changeLanguage(savedSettings.language);
      // 冷啟動即執行照片保存天數清理，再載入列表以反映清理結果。
      await dbService.runStartupCleanup(savedSettings.cacheDurationDays);
      await loadRecords();
    };
    void init();
  }, [i18n, loadRecords]);

  // 前景喚醒與 BFCache 還原觸發清理（iOS 無 Periodic Background Sync，見 research §C8）。
  useEffect(() => {
    const runCleanup = () => {
      void dbService.runStartupCleanup(settings.cacheDurationDays).then((cleaned) => {
        if (cleaned > 0) void loadRecords();
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

  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', theme.colors.primary);
    document.documentElement.style.setProperty('--color-bg', theme.colors.background);
    document.documentElement.style.setProperty('--color-surface', theme.colors.surface);
    document.documentElement.style.setProperty('--color-text', theme.colors.text);

    const hex = theme.colors.primary.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    document.documentElement.style.setProperty('--color-primary-rgb', `${r}, ${g}, ${b}`);
  }, [theme]);

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
        plateNumber: data.plateNumber ?? 'N/A',
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

  return (
    <LayoutGroup>
      <div
        className="h-screen w-full flex flex-col overflow-hidden font-sans"
        style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}
      >
        {/* Premium Header */}
        <header
          className="px-6 pb-4 pt-safe-top z-30 backdrop-blur-xl border-b border-black/3"
          style={{ backgroundColor: theme.colors.background + 'CC' }}
        >
          <div className="flex justify-between items-center max-w-md mx-auto w-full pt-4">
            <div className="flex items-center gap-3">
              <BrandLogo theme={theme} />
              {theme.id === 'cute' ? (
                <h1
                  className={`text-3xl font-black tracking-normal ${theme.font} bg-clip-text text-transparent bg-linear-to-r from-[#FF9A9E] via-[#FFB7B2] to-[#FF9A9E] drop-shadow-[0_2px_2px_rgba(0,0,0,0.05)]`}
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

            {currentTab === 'list' && (
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
                  className="w-full h-10 pl-9 pr-3 rounded-full text-[11px] font-bold outline-none bg-black/4 focus:bg-white/50 focus:shadow-sm transition-all"
                />
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {currentTab === 'list' ? (
              <motion.div
                key="list"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="h-full overflow-y-auto no-scrollbar px-5 pt-5 pb-40"
              >
                <div className="max-w-md mx-auto space-y-5">
                  {filteredRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-10">
                      <Car size={60} strokeWidth={1.5} />
                      <p className="font-black text-sm uppercase mt-4 tracking-[0.2em]">
                        {t('record.empty')}
                      </p>
                    </div>
                  ) : (
                    filteredRecords.map((r) => (
                      <RecordCard
                        key={r.id}
                        record={r}
                        theme={theme}
                        onDelete={handleDelete}
                        onUpdate={handleUpdate}
                        onNavigate={setNavRecord}
                        cacheDurationDays={settings.cacheDurationDays}
                        miniMapText={miniMapText}
                      />
                    ))
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="settings"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="h-full"
              >
                <SettingsTab settings={settings} updateSettings={updateSettings} theme={theme} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* QuickEntry */}
        <QuickEntry
          theme={theme}
          onSave={handleSave}
          isVisible={showQuickEntry}
          onClose={() => setShowQuickEntry(false)}
          cacheDurationDays={settings.cacheDurationDays}
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

        {/* Bottom Navigation
            高度架構：content div（56px 固定）+ safe-area spacer（分離），
            避免 pb-safe-bottom 吃掉可見內容高度。 */}
        <nav
          className="fixed bottom-0 inset-x-0 z-30 backdrop-blur-xl border-t border-black/5"
          style={{ backgroundColor: theme.colors.background + 'CC' }}
        >
          {/* 可見內容區：固定 56px，與 safe area 無關 */}
          <div className={`flex ${NAV_CONTENT_H} max-w-md mx-auto relative px-6`}>
            {/* List Tab */}
            <div className="flex-1 h-full">
              <button
                type="button"
                aria-label={t('tab.list')}
                onClick={() => setCurrentTab('list')}
                className={`w-full h-full flex flex-col items-center justify-center ${NAV_TAB_GAP_CLS} relative group`}
              >
                <div
                  className={`transition-all duration-300 ${currentTab === 'list' ? 'scale-105' : 'opacity-30 group-hover:opacity-50'}`}
                  style={{ color: currentTab === 'list' ? theme.colors.primary : undefined }}
                >
                  <ListIcon
                    size={NAV_ICON_SIZE}
                    strokeWidth={
                      currentTab === 'list' ? NAV_ICON_STROKE_ACTIVE : NAV_ICON_STROKE_INACTIVE
                    }
                  />
                </div>
                <span
                  className={`${NAV_LABEL_BASE_CLS} ${currentTab !== 'list' ? NAV_LABEL_INACTIVE_CLS : ''}`}
                  style={{ color: currentTab === 'list' ? theme.colors.primary : undefined }}
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

            {/* FAB spacer */}
            <div className="w-20" />

            {/* Centered FAB */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2">
              <motion.button
                type="button"
                onClick={() => setShowQuickEntry(true)}
                whileTap={{ scale: 0.9, rotate: 90 }}
                whileHover={{ scale: 1.05 }}
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-elevation-3 border-4 transition-colors"
                style={{
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.background,
                  boxShadow: `${theme.colors.primary}66 0px 8px 25px`,
                }}
              >
                <Plus size={32} stroke="#fff" strokeWidth={3} />
              </motion.button>
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
                  className={`transition-all duration-300 ${currentTab === 'settings' ? 'scale-105' : 'opacity-30 group-hover:opacity-50'}`}
                  style={{ color: currentTab === 'settings' ? theme.colors.primary : undefined }}
                >
                  <SettingsIcon
                    size={NAV_ICON_SIZE}
                    strokeWidth={
                      currentTab === 'settings' ? NAV_ICON_STROKE_ACTIVE : NAV_ICON_STROKE_INACTIVE
                    }
                  />
                </div>
                <span
                  className={`${NAV_LABEL_BASE_CLS} ${currentTab !== 'settings' ? NAV_LABEL_INACTIVE_CLS : ''}`}
                  style={{ color: currentTab === 'settings' ? theme.colors.primary : undefined }}
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

        {/* Toast (centered pill) */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 px-8 py-3.5 rounded-full shadow-elevation-4 z-100 border border-white/10"
              style={{ backgroundColor: theme.colors.primary, color: '#fff' }}
            >
              <span className="text-[11px] font-black uppercase tracking-widest">{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <UpdatePrompt />
    </LayoutGroup>
  );
}
