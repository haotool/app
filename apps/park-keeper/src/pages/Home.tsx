/**
 * Park-Keeper Home Page
 * Main app view: records list, settings tab, QuickEntry FAB, NavOverlay compass.
 */
import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import {
  Search,
  Plus,
  List,
  Settings,
  Trash2,
  Compass,
  X,
  ChevronRight,
  Camera,
  MapPin,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type {
  ThemeConfig,
  ParkingRecord,
  AppSettings,
  ThemeType,
  LanguageType,
} from '@app/park-keeper/types';
import { THEMES, DEFAULT_SETTINGS } from '@app/park-keeper/constants';
import { dbService } from '@app/park-keeper/services/db';
import QuickEntry from '@app/park-keeper/components/QuickEntry';
import { useNavigation } from '@app/park-keeper/hooks/useNavigation';

const MiniMap = lazy(() => import('@app/park-keeper/components/MiniMap'));

// -----------------------------------------------------------------------------
// BRAND LOGO - Theme-specific SVG
// -----------------------------------------------------------------------------
function BrandLogo({ theme, className = '' }: { theme: ThemeConfig; className?: string }) {
  const c = theme.colors.primary;
  const size = 36;

  switch (theme.id) {
    case 'racing':
      return (
        <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden>
          <path
            d="M8 28 L12 20 L16 24 L20 16 L28 20 L32 12 L40 16 L40 36 L8 36 Z"
            fill="none"
            stroke={c}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="14" cy="36" r="4" fill={c} />
          <circle cx="34" cy="36" r="4" fill={c} />
          <path d="M24 16 L24 28" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'cute':
      return (
        <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden>
          <ellipse cx="24" cy="28" rx="14" ry="10" fill={c} opacity="0.9" />
          <rect x="12" y="20" width="24" height="14" rx="4" fill={c} />
          <circle cx="18" cy="34" r="4" fill={theme.colors.text} opacity="0.4" />
          <circle cx="30" cy="34" r="4" fill={theme.colors.text} opacity="0.4" />
          <path
            d="M22 14 Q24 10 26 14"
            fill="none"
            stroke={c}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'minimalist':
      return (
        <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden>
          <rect
            x="10"
            y="18"
            width="28"
            height="16"
            rx="2"
            fill="none"
            stroke={c}
            strokeWidth="2"
          />
          <path d="M16 34 L16 38 M32 34 L32 38" stroke={c} strokeWidth="2" strokeLinecap="round" />
          <circle cx="16" cy="38" r="2" fill={c} />
          <circle cx="32" cy="38" r="2" fill={c} />
        </svg>
      );
    case 'literary':
      return (
        <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden>
          <path
            d="M14 24 L20 16 L26 24 L32 18 L38 26 L38 34 L14 34 Z"
            fill="none"
            stroke={c}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="18" cy="34" r="3" fill={c} />
          <circle cx="34" cy="34" r="3" fill={c} />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden>
          <rect
            x="12"
            y="20"
            width="24"
            height="14"
            rx="2"
            fill="none"
            stroke={c}
            strokeWidth="2"
          />
          <circle cx="18" cy="36" r="3" fill={c} />
          <circle cx="30" cy="36" r="3" fill={c} />
        </svg>
      );
  }
}

// -----------------------------------------------------------------------------
// NAV OVERLAY - Full-screen compass navigation
// -----------------------------------------------------------------------------
interface NavOverlayProps {
  record: ParkingRecord;
  theme: ThemeConfig;
  onClose: () => void;
}

function NavOverlay({ record, theme, onClose }: NavOverlayProps) {
  const { t } = useTranslation();
  const nav = useNavigation(record);
  const {
    userLoc,
    trueAnimHeading,
    distance,
    stepCount,
    targetBearing,
    relativeRotation,
    isPhoneFlat,
    isIndoor,
  } = nav;

  const hasLocation = typeof record.latitude === 'number' && typeof record.longitude === 'number';
  const arrived = distance !== null && distance < 8;

  const getDirectionHint = (): string => {
    if (arrived) return t('nav.arrived');
    if (relativeRotation >= 345 || relativeRotation <= 15) return t('nav.straight');
    if (relativeRotation > 15 && relativeRotation < 180) return t('nav.turn_right');
    return t('nav.turn_left');
  };

  const vibrate = (p: number | number[] = 10) => {
    if (navigator.vibrate) navigator.vibrate(p);
  };

  if (!hasLocation) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/30 backdrop-blur-sm">
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 pt-safe-top pb-3"
        style={{ backgroundColor: theme.colors.surface + 'E6', color: theme.colors.text }}
      >
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight">{record.plateNumber}</span>
          <span className="text-sm opacity-70">{record.floor}</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            vibrate(10);
            onClose();
          }}
          className="p-2 rounded-full hover:bg-black/5"
          aria-label="Close"
        >
          <X size={24} />
        </motion.button>
      </header>

      {/* Map background */}
      <div className="absolute inset-0 top-16 z-0">
        <Suspense
          fallback={
            <div
              className="w-full h-full animate-pulse"
              style={{ backgroundColor: theme.colors.background }}
            />
          }
        >
          {userLoc && record.latitude != null && record.longitude != null && (
            <MiniMap
              lat={record.latitude}
              lng={record.longitude}
              userLat={userLoc.lat}
              userLng={userLoc.lng}
              theme={theme}
              interactive={false}
              mapKey="nav"
            />
          )}
        </Suspense>
      </div>

      {/* Glass HUD */}
      <div
        className="relative z-10 mx-4 mt-4 flex items-center justify-between rounded-2xl px-5 py-4 backdrop-blur-xl"
        style={{
          backgroundColor: theme.colors.surface + 'CC',
          border: `1px solid ${theme.colors.primary}30`,
        }}
      >
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase opacity-60">{t('record.distance')}</span>
          <span className="text-xl font-black">
            {arrived ? (
              <span style={{ color: theme.colors.accent }}>{t('nav.arrived')}</span>
            ) : isIndoor ? (
              `${stepCount} ${t('nav.steps')}`
            ) : distance !== null ? (
              `${Math.round(distance)} m`
            ) : (
              '--'
            )}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold uppercase opacity-60">{t('record.bearing')}</span>
          <span className="text-xl font-black">{Math.round(targetBearing)}°</span>
        </div>
      </div>

      {/* Compass dial */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-6">
        <div className="relative w-64 h-64">
          <motion.svg
            viewBox="0 0 200 200"
            className="w-full h-full"
            style={{
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))',
              transform: `rotate(${-trueAnimHeading}deg)`,
            }}
          >
            <circle
              cx="100"
              cy="100"
              r="95"
              fill="none"
              stroke={theme.colors.primary}
              strokeWidth="2"
              opacity="0.3"
            />
            <circle
              cx="100"
              cy="100"
              r="85"
              fill={theme.colors.surface + 'E6'}
              stroke={theme.colors.primary}
              strokeWidth="1"
            />
            {/* Degree ticks */}
            {Array.from({ length: 36 }).map((_, i) => {
              const deg = i * 10;
              const rad = ((deg - 90) * Math.PI) / 180;
              const r1 = 85;
              const r2 = deg % 90 === 0 ? 70 : deg % 30 === 0 ? 78 : 82;
              const x1 = 100 + r1 * Math.cos(rad);
              const y1 = 100 + r1 * Math.sin(rad);
              const x2 = 100 + r2 * Math.cos(rad);
              const y2 = 100 + r2 * Math.sin(rad);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={theme.colors.primary}
                  strokeWidth={deg % 90 === 0 ? 2 : 1}
                  opacity={deg % 90 === 0 ? 1 : 0.5}
                />
              );
            })}
            {/* N E S W labels */}
            {[
              { label: t('compass.n'), y: 22 },
              { label: t('compass.e'), x: 178, y: 100 },
              { label: t('compass.s'), y: 178 },
              { label: t('compass.w'), x: 22, y: 100 },
            ].map(({ label, x = 100, y }) => (
              <text
                key={label}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fill: theme.colors.primary,
                  fontSize: 14,
                  fontWeight: 'bold',
                }}
              >
                {label}
              </text>
            ))}
            {/* Target arrow - points to bearing relative to phone */}
            <g transform={`translate(100, 100) rotate(${relativeRotation}) translate(0, -55)`}>
              <path
                d="M 0 -20 L -8 12 L 0 8 L 8 12 Z"
                fill={theme.colors.accent}
                stroke={theme.colors.text}
                strokeWidth="1"
              />
            </g>
          </motion.svg>
        </div>
      </div>

      {/* Direction hint */}
      <div
        className="relative z-10 mx-6 mb-4 rounded-xl py-3 text-center font-bold"
        style={{
          backgroundColor: theme.colors.surface + 'E6',
          color: theme.colors.text,
        }}
      >
        {getDirectionHint()}
      </div>

      {/* Phone flat alert */}
      <AnimatePresence>
        {!isPhoneFlat && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 left-6 right-6 z-20 rounded-xl py-3 px-4 flex items-center gap-3"
            style={{
              backgroundColor: theme.colors.accent + 'E6',
              color: theme.colors.text,
            }}
          >
            <Compass size={20} />
            <span className="text-sm font-bold">{t('nav.hold_flat')}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// -----------------------------------------------------------------------------
// SETTINGS TAB
// -----------------------------------------------------------------------------
interface SettingsTabProps {
  theme: ThemeConfig;
  settings: AppSettings;
  onSettingsChange: (s: Partial<AppSettings>) => void;
  onSaveSettings: (s: AppSettings) => Promise<void>;
}

const LANGUAGE_OPTIONS: { code: LanguageType; flag: string; label: string }[] = [
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'zh-TW', flag: '🇹🇼', label: '繁體中文' },
  { code: 'ja', flag: '🇯🇵', label: '日本語' },
];

function SettingsTab({ theme, settings, onSettingsChange, onSaveSettings }: SettingsTabProps) {
  const { t } = useTranslation();

  const handleThemeSelect = (id: ThemeType) => {
    onSettingsChange({ theme: id });
  };

  const handleLanguageSelect = (lang: LanguageType) => {
    onSettingsChange({ language: lang });
  };

  const handleCacheChange = (days: number) => {
    onSettingsChange({ cacheDurationDays: days });
  };

  const handleClearAll = async () => {
    if (!window.confirm(t('settings.erase') + '?')) return;
    await dbService.clearAllData();
    void onSaveSettings(DEFAULT_SETTINGS);
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
  };

  const themeKeys = Object.keys(THEMES) as ThemeType[];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8 pb-32"
    >
      {/* Theme selection */}
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest opacity-60 mb-4">
          {t('settings.visual')}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {themeKeys.map((id) => {
            const tConfig = THEMES[id];
            if (!tConfig) return null;
            const isSelected = settings.theme === id;
            return (
              <motion.button
                key={id}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleThemeSelect(id)}
                className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-colors"
                style={{
                  backgroundColor: tConfig.colors.surface,
                  borderColor: isSelected ? tConfig.colors.primary : 'transparent',
                  boxShadow: isSelected ? `0 0 0 2px ${tConfig.colors.primary}` : undefined,
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: tConfig.colors.primary + '30' }}
                >
                  <BrandLogo theme={tConfig} />
                </div>
                <span className="text-sm font-bold" style={{ color: tConfig.colors.text }}>
                  {tConfig.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Language selection */}
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest opacity-60 mb-4">
          {t('settings.language')}
        </h2>
        <div className="flex gap-3">
          {LANGUAGE_OPTIONS.map((opt) => {
            const isSelected = settings.language === opt.code;
            return (
              <motion.button
                key={opt.code}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleLanguageSelect(opt.code)}
                className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all"
                style={{
                  backgroundColor: isSelected ? theme.colors.primary + '20' : theme.colors.surface,
                  borderColor: isSelected ? theme.colors.primary : 'transparent',
                }}
              >
                <span className="text-2xl">{opt.flag}</span>
                <span className="text-xs font-bold" style={{ color: theme.colors.text }}>
                  {opt.label}
                </span>
                {isSelected && (
                  <motion.div
                    layoutId="lang-indicator"
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Cache duration */}
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest opacity-60 mb-4">
          {t('settings.storage')}
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span style={{ color: theme.colors.textMuted }}>{t('settings.cache_desc')}</span>
            <span className="font-bold" style={{ color: theme.colors.primary }}>
              {settings.cacheDurationDays} {t('settings.days')}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            value={settings.cacheDurationDays}
            onChange={(e) => handleCacheChange(parseInt(e.target.value, 10))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              accentColor: theme.colors.primary,
            }}
          />
        </div>
      </section>

      {/* Danger zone */}
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest opacity-60 mb-4">
          {t('settings.danger')}
        </h2>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => void handleClearAll()}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-red-500/50 bg-red-500/10 text-red-600 font-bold"
        >
          <Trash2 size={18} />
          {t('settings.erase')}
        </motion.button>
      </section>
    </motion.div>
  );
}

// -----------------------------------------------------------------------------
// RECORD CARD
// -----------------------------------------------------------------------------
interface RecordCardProps {
  record: ParkingRecord;
  theme: ThemeConfig;
  onNavigate: () => void;
  onDelete: () => void;
}

function RecordCard({ record, theme, onNavigate, onDelete }: RecordCardProps) {
  const { t } = useTranslation();
  const hasLocation = typeof record.latitude === 'number' && typeof record.longitude === 'number';
  const canNavigate = hasLocation;

  const vibrate = (p: number | number[] = 10) => {
    if (navigator.vibrate) navigator.vibrate(p);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrate([20, 40]);
    onDelete();
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="rounded-2xl overflow-hidden border shadow-sm"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.primary + '20',
      }}
    >
      <button
        type="button"
        onClick={() => canNavigate && (vibrate(10), onNavigate())}
        className="w-full flex gap-4 p-4 text-left"
      >
        {/* Photo thumbnail */}
        <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-black/5 flex items-center justify-center">
          {record.hasPhoto && record.photoData ? (
            <img src={record.photoData} alt="" className="w-full h-full object-cover" />
          ) : (
            <Camera size={24} style={{ color: theme.colors.textMuted }} />
          )}
        </div>

        {/* Mini map or placeholder */}
        <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-black/5">
          {hasLocation ? (
            <Suspense
              fallback={
                <div
                  className="w-full h-full animate-pulse"
                  style={{ backgroundColor: theme.colors.background }}
                />
              }
            >
              <MiniMap
                lat={record.latitude ?? 0}
                lng={record.longitude ?? 0}
                theme={theme}
                interactive={false}
                mapKey={record.id}
              />
            </Suspense>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ color: theme.colors.textMuted }}
            >
              <MapPin size={20} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div
            className="font-black text-lg tracking-tight truncate"
            style={{ color: theme.colors.text }}
          >
            {record.plateNumber}
          </div>
          <div className="text-sm font-bold mt-0.5" style={{ color: theme.colors.textMuted }}>
            {record.floor}
          </div>
          <div className="text-xs mt-1 opacity-70" style={{ color: theme.colors.textMuted }}>
            {new Date(record.timestamp).toLocaleString()}
          </div>
        </div>

        {canNavigate && (
          <div className="shrink-0 flex items-center">
            <ChevronRight size={20} style={{ color: theme.colors.primary }} />
          </div>
        )}
      </button>

      {/* Delete */}
      <div className="px-4 pb-4 flex justify-end">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleDelete}
          className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-red-600 text-sm font-bold"
        >
          <Trash2 size={14} />
          {t('record.deleted').toLowerCase()}
        </motion.button>
      </div>
    </motion.article>
  );
}

// -----------------------------------------------------------------------------
// TOAST
// -----------------------------------------------------------------------------
function Toast({
  message,
  visible,
  theme,
  onDismiss,
}: {
  message: string;
  visible: boolean;
  theme: ThemeConfig;
  onDismiss: () => void;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 left-4 right-4 z-50 rounded-2xl py-4 px-5 shadow-lg"
          style={{
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            border: `1px solid ${theme.colors.primary}30`,
          }}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold">{message}</span>
            <button
              type="button"
              onClick={onDismiss}
              className="p-2 -mr-2 rounded-full hover:bg-black/5"
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// -----------------------------------------------------------------------------
// HOME PAGE
// -----------------------------------------------------------------------------
const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
  exit: { opacity: 0 },
};

export default function Home() {
  const { t, i18n } = useTranslation();
  const [records, setRecords] = useState<ParkingRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'settings'>('list');
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const [navRecord, setNavRecord] = useState<ParkingRecord | null>(null);
  const [toast, setToast] = useState({ message: '', visible: false });
  const [isLoading, setIsLoading] = useState(true);

  const theme = THEMES[settings.theme] ?? THEMES['minimalist'] ?? THEMES['racing'];
  if (!theme) throw new Error('Theme config not found');

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    const tId = setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
    return () => clearTimeout(tId);
  }, []);

  const loadRecords = useCallback(async () => {
    const data = await dbService.getRecords();
    setRecords(data);
  }, []);

  const loadSettings = useCallback(async () => {
    const data = await dbService.getSettings();
    setSettings(data);
  }, []);

  useEffect(() => {
    const load = async () => {
      await loadRecords();
      await loadSettings();
      setIsLoading(false);
    };
    void load();
  }, [loadRecords, loadSettings]);

  useEffect(() => {
    void i18n.changeLanguage(settings.language);
  }, [settings.language, i18n]);

  const handleSaveRecord = useCallback(
    async (partial: Partial<ParkingRecord>) => {
      const record: ParkingRecord = {
        id: crypto.randomUUID(),
        plateNumber: partial.plateNumber ?? 'N/A',
        floor: partial.floor ?? '1F',
        notes: partial.notes,
        timestamp: Date.now(),
        photoData: partial.photoData,
        hasPhoto: partial.hasPhoto ?? false,
        latitude: partial.latitude,
        longitude: partial.longitude,
      };
      await dbService.saveRecord(record);
      setRecords((prev) => [record, ...prev]);
      showToast(t('record.saved'));
    },
    [showToast, t],
  );

  const handleDeleteRecord = useCallback(
    async (id: string) => {
      await dbService.deleteRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      showToast(t('record.deleted'));
    },
    [showToast, t],
  );

  const handleSettingsChange = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      void dbService.saveSettings(next);
      return next;
    });
  }, []);

  const handleSaveSettings = useCallback(async (s: AppSettings) => {
    await dbService.saveSettings(s);
    setSettings(s);
  }, []);

  const filteredRecords = records.filter(
    (r) =>
      r.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.floor.toLowerCase().includes(search.toLowerCase()),
  );

  const vibrate = (p: number | number[] = 10) => {
    if (navigator.vibrate) navigator.vibrate(p);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        fontFamily: `var(--font-${theme.font})`,
      }}
    >
      {/* Premium header */}
      <header
        className="sticky top-0 z-30 px-4 pt-safe-top pb-4"
        style={{ backgroundColor: theme.colors.background }}
      >
        <div className="flex items-center gap-3 mb-4">
          <BrandLogo theme={theme} />
          <h1 className="text-xl font-black tracking-tight">{t('app.title')}</h1>
        </div>
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: theme.colors.textMuted }}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('record.search')}
            aria-label={t('record.search')}
            className="w-full pl-11 pr-4 py-3 rounded-2xl outline-none font-medium"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              border: `2px solid ${theme.colors.primary}10`,
            }}
          />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4">
        <AnimatePresence mode="wait">
          {activeTab === 'list' ? (
            <motion.div
              key="list"
              variants={listVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4 pb-36"
            >
              {isLoading ? (
                <div
                  className="py-16 text-center font-bold"
                  style={{ color: theme.colors.textMuted }}
                >
                  Loading...
                </div>
              ) : filteredRecords.length === 0 ? (
                <div
                  className="py-16 text-center font-bold"
                  style={{ color: theme.colors.textMuted }}
                >
                  {t('record.empty')}
                </div>
              ) : (
                filteredRecords.map((record) => (
                  <RecordCard
                    key={record.id}
                    record={record}
                    theme={theme}
                    onNavigate={() => setNavRecord(record)}
                    onDelete={() => void handleDeleteRecord(record.id)}
                  />
                ))
              )}
            </motion.div>
          ) : (
            <SettingsTab
              key="settings"
              theme={theme}
              settings={settings}
              onSettingsChange={handleSettingsChange}
              onSaveSettings={handleSaveSettings}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 flex pb-safe-bottom px-4 py-3 gap-2 z-40"
        style={{
          backgroundColor: theme.colors.surface + 'F5',
          borderTop: `1px solid ${theme.colors.primary}15`,
        }}
      >
        <button
          type="button"
          onClick={() => {
            vibrate(10);
            setActiveTab('list');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-colors ${
            activeTab === 'list' ? 'text-white' : ''
          }`}
          style={{
            backgroundColor: activeTab === 'list' ? theme.colors.primary : 'transparent',
            color: activeTab === 'list' ? theme.colors.surface : theme.colors.textMuted,
          }}
        >
          <List size={20} />
          {t('tab.list')}
        </button>
        <button
          type="button"
          onClick={() => {
            vibrate(10);
            setActiveTab('settings');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-colors ${
            activeTab === 'settings' ? 'text-white' : ''
          }`}
          style={{
            backgroundColor: activeTab === 'settings' ? theme.colors.primary : 'transparent',
            color: activeTab === 'settings' ? theme.colors.surface : theme.colors.textMuted,
          }}
        >
          <Settings size={20} />
          {t('tab.settings')}
        </button>
      </nav>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => {
          vibrate(20);
          setQuickEntryOpen(true);
        }}
        className="fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
        style={{
          backgroundColor: theme.colors.primary,
          color: theme.colors.surface,
        }}
        aria-label="Add parking record"
      >
        <Plus size={28} strokeWidth={3} />
      </motion.button>

      {/* QuickEntry */}
      <QuickEntry
        theme={theme}
        onSave={handleSaveRecord}
        isVisible={quickEntryOpen}
        onClose={() => setQuickEntryOpen(false)}
      />

      {/* NavOverlay */}
      <AnimatePresence>
        {navRecord?.latitude != null && navRecord?.longitude != null && navRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100]"
          >
            <NavOverlay record={navRecord} theme={theme} onClose={() => setNavRecord(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <Toast
        message={toast.message}
        visible={toast.visible}
        theme={theme}
        onDismiss={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </div>
  );
}
