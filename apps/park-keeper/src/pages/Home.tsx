/**
 * Park-Keeper Home Page
 * Faithfully reproduces the original .example/park-keeper/App.tsx UI/UX
 * within the monorepo SSG architecture.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup, type Variants } from 'motion/react';
import {
  Plus,
  Settings as SettingsIcon,
  Car,
  Trash2,
  Search,
  Check,
  List as ListIcon,
  Palette,
  Globe,
  Database,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ThemeConfig, ParkingRecord, AppSettings, LanguageType } from '@app/park-keeper/types';
import { THEMES, DEFAULT_SETTINGS } from '@app/park-keeper/constants';
import { dbService } from '@app/park-keeper/services/db';
import { syncMapTileCacheConfig } from '@app/park-keeper/services/mapTileCache';
import { getVersionInfo } from '@app/park-keeper/config/version';
import QuickEntry from '@app/park-keeper/components/QuickEntry';
import { UpdatePrompt } from '@app/park-keeper/components/UpdatePrompt';
import NavOverlay from '@app/park-keeper/components/NavOverlay';
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
// BRAND LOGO – Original "P" letter designs
// ---------------------------------------------------------------------------
function BrandLogo({ theme }: { theme: ThemeConfig }) {
  const colors = theme.colors;

  switch (theme.id) {
    case 'racing':
      return (
        <div className="flex items-center justify-center">
          <svg viewBox="0 0 40 40" className="w-8 h-8 drop-shadow-[0_0_8px_rgba(0,242,255,0.6)]">
            <defs>
              <linearGradient id="nitroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.primary} />
                <stop offset="100%" stopColor={colors.secondary} />
              </linearGradient>
            </defs>
            <path
              d="M 8 32 L 14 8 L 32 8 L 28 20 L 16 20 L 13 32 Z"
              fill="none"
              stroke="url(#nitroGrad)"
              strokeWidth="3"
              strokeLinecap="square"
            />
            <path d="M 32 8 L 36 8" stroke={colors.accent} strokeWidth="3" />
            <circle cx="22" cy="14" r="2" fill={colors.accent} />
          </svg>
        </div>
      );
    case 'cute':
      return (
        <div className="flex items-center justify-center">
          <svg
            viewBox="0 0 40 40"
            className="w-10 h-10 transform hover:scale-110 transition-transform duration-300"
          >
            <defs>
              <linearGradient id="cuteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.primary} />
                <stop offset="100%" stopColor={colors.secondary} />
              </linearGradient>
            </defs>
            <path
              d="M 12 32 L 12 14 C 12 6 30 6 30 15 C 30 24 12 24 12 24"
              stroke="url(#cuteGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M 12 14 C 12 9 24 9 24 15"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity="0.5"
            />
            <path
              d="M 34 32 L 30 36 L 26 32 C 25 31 25 29 26 28 C 27 27 29 27 30 28 L 30 28 L 31 28 C 32 27 34 27 35 28 C 36 29 36 31 35 32 Z"
              fill={colors.accent}
              stroke={colors.primary}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );
    case 'literary':
      return (
        <div className="flex items-center justify-center">
          <svg viewBox="0 0 40 40" className="w-8 h-8">
            <path
              d="M 12 32 L 12 10 C 12 8 13 6 18 6 L 24 6 C 30 6 32 10 32 15 C 32 20 28 23 24 23 L 14 23"
              stroke={colors.primary}
              strokeWidth="2.5"
              fill="none"
            />
            <path d="M 12 32 L 8 32 M 12 32 L 16 32" stroke={colors.primary} strokeWidth="2.5" />
            <path d="M 10 8 L 8 8" stroke={colors.primary} strokeWidth="2.5" />
            <path d="M 22 11 L 22 17" stroke={colors.accent} strokeWidth="2" opacity="0.6" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="flex items-center justify-center">
          <svg viewBox="0 0 40 40" className="w-8 h-8">
            <rect
              x="6"
              y="6"
              width="28"
              height="28"
              rx="8"
              stroke={colors.primary}
              strokeWidth="2.5"
              fill="none"
            />
            <path
              d="M 15 28 L 15 12 L 22 12 C 25 12 26 13 26 16 C 26 19 25 20 22 20 L 15 20"
              stroke={colors.primary}
              strokeWidth="2.5"
              fill="none"
            />
            <circle cx="28" cy="28" r="4" fill={colors.accent} />
          </svg>
        </div>
      );
  }
}

// ---------------------------------------------------------------------------
// SETTING GROUP
// ---------------------------------------------------------------------------
function SettingGroup({
  icon: Icon,
  title,
  children,
  theme,
}: {
  icon: React.ComponentType<{ size: number }>;
  title: string;
  children?: React.ReactNode;
  theme: ThemeConfig;
}) {
  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-2 px-2 opacity-40">
        <Icon size={14} />
        <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.font}`}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SETTINGS TAB – Original design with gradient decorations and animated lang
// ---------------------------------------------------------------------------
function SettingsTab({
  settings,
  updateSettings,
  theme,
}: {
  settings: AppSettings;
  updateSettings: (s: AppSettings) => void;
  theme: ThemeConfig;
}) {
  const { t, i18n } = useTranslation();
  const versionInfo = getVersionInfo();

  const handleLanguageChange = (lang: LanguageType) => {
    void i18n.changeLanguage(lang);
    updateSettings({ ...settings, language: lang });
  };

  const clearAll = async () => {
    if (window.confirm(t('settings.erase') + '?')) {
      await dbService.clearAllData();
      window.location.reload();
    }
  };

  const handleCacheChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const days = parseInt(e.target.value, 10);
    updateSettings({ ...settings, cacheDurationDays: days });
    await dbService.cleanupCache(days);
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-32">
      <div className="px-5 py-6 max-w-md mx-auto">
        {/* Theme Selection */}
        <section className="mb-8">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <Palette size={14} />
            <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.font}`}>
              {t('settings.visual')}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Object.values(THEMES).map((th) => {
              const isActive = settings.theme === th.id;
              const decorColor =
                th.id === 'racing'
                  ? '#00D4FF'
                  : th.id === 'cute'
                    ? '#FF69B4'
                    : th.id === 'minimalist'
                      ? '#2C3E50'
                      : '#8B4513';

              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => updateSettings({ ...settings, theme: th.id })}
                  className={`relative p-4 h-24 flex items-end overflow-hidden rounded-xl transition-all shadow-sm ${isActive ? 'ring-2 ring-offset-2' : ''}`}
                  style={
                    {
                      backgroundColor: th.colors.background,
                      color: th.colors.text,
                      '--tw-ring-color': theme.colors.primary,
                    } as React.CSSProperties
                  }
                >
                  <div
                    className="absolute top-0 right-0 w-20 h-20 opacity-10 -mr-6 -mt-6 rounded-full"
                    style={{ backgroundColor: decorColor }}
                  />
                  <div className="flex justify-between items-center w-full relative z-10">
                    <span className={`font-bold ${th.font}`}>{th.name}</span>
                    {isActive && (
                      <div className="bg-green-500 rounded-full p-1">
                        <Check size={12} color="white" strokeWidth={2} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Language Selection (Segmented Control Animation) */}
        <SettingGroup icon={Globe} title={t('settings.language')} theme={theme}>
          <LayoutGroup>
            <div className="bg-black/5 rounded-[20px] p-1.5 flex gap-1 relative shadow-inner">
              {[
                { id: 'en', flag: '🇺🇸', name: 'English' },
                { id: 'zh-TW', flag: '🇹🇼', name: '繁體中文' },
                { id: 'ja', flag: '🇯🇵', name: '日本語' },
              ].map((lang) => {
                const isActive = settings.language === lang.id;
                return (
                  <button
                    type="button"
                    key={lang.id}
                    onClick={() => handleLanguageChange(lang.id as LanguageType)}
                    className={`flex-1 py-3 rounded-2xl flex flex-col items-center justify-center gap-1 relative z-10 transition-colors ${isActive ? '' : 'opacity-60 hover:opacity-100'}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeLang"
                        className="absolute inset-0 rounded-2xl shadow-sm z-[-1]"
                        style={{ backgroundColor: theme.colors.surface }}
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="text-xl mb-1 filter drop-shadow-sm">{lang.flag}</span>
                    <span className="text-[10px] font-bold">{lang.name}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
        </SettingGroup>

        {/* Storage & Cache */}
        <SettingGroup icon={Database} title={t('settings.storage')} theme={theme}>
          <div
            className="rounded-3xl overflow-hidden shadow-elevation-1 border border-black/5 p-5"
            style={{ backgroundColor: theme.colors.surface }}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold opacity-60 uppercase tracking-wider">
                {t('settings.days')}
              </span>
              <span className="text-2xl font-black" style={{ color: theme.colors.primary }}>
                {settings.cacheDurationDays}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              value={settings.cacheDurationDays}
              onChange={(e) => void handleCacheChange(e)}
              className="w-full h-1.5 bg-black/5 rounded-lg appearance-none cursor-pointer accent-current"
              style={{ accentColor: theme.colors.primary }}
            />
            <p className="text-[10px] mt-4 opacity-40 font-medium text-center">
              {t('settings.cache_desc')}
            </p>
          </div>
        </SettingGroup>

        {/* Danger Zone */}
        <SettingGroup icon={ShieldAlert} title={t('settings.danger')} theme={theme}>
          <div
            className="rounded-3xl overflow-hidden shadow-elevation-1 border border-black/5"
            style={{ backgroundColor: theme.colors.surface }}
          >
            <button
              type="button"
              onClick={() => void clearAll()}
              className="w-full px-5 py-4 flex items-center justify-between active:bg-red-50 group transition-colors"
            >
              <span className="text-xs font-black text-red-500 uppercase tracking-widest">
                {t('settings.erase')}
              </span>
              <Trash2
                size={16}
                className="text-red-500 opacity-40 group-active:opacity-100 transition-opacity"
              />
            </button>
          </div>
        </SettingGroup>

        {/* App Info */}
        <SettingGroup icon={Clock} title={t('settings.app_info')} theme={theme}>
          <div
            className="rounded-3xl overflow-hidden shadow-elevation-1 border border-black/5 p-5"
            style={{ backgroundColor: theme.colors.surface }}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-xs font-bold opacity-60 uppercase tracking-wider">
                {t('settings.current_version')}
              </span>
              <span
                className="text-lg font-black font-mono tracking-tight"
                style={{ color: theme.colors.primary }}
              >
                {versionInfo.displayVersion}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold opacity-60 uppercase tracking-wider">
                {t('settings.build_time')}
              </span>
              <span className="text-xs font-medium opacity-80">
                {versionInfo.formattedBuildTime}
              </span>
            </div>
            <p className="text-[10px] mt-4 opacity-40 font-medium text-center break-all">
              {versionInfo.fullVersion}
            </p>
          </div>
        </SettingGroup>

        <footer className="text-center mt-8 pb-4" aria-label={t('settings.current_version')}>
          <p className={`text-[10px] opacity-35 uppercase tracking-[0.18em] ${theme.font}`}>
            {t('settings.current_version')}
          </p>
          <p className="text-xs font-mono font-bold opacity-70 mt-1">
            {versionInfo.displayVersion}
          </p>
        </footer>
      </div>
    </div>
  );
}

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
      const savedSettings = await dbService.getSettings();
      setSettings(savedSettings);
      void i18n.changeLanguage(savedSettings.language);
      await loadRecords();
    };
    void init();
  }, [i18n, loadRecords]);

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
    void syncMapTileCacheConfig(settings.cacheDurationDays);
  }, [settings.cacheDurationDays]);

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
