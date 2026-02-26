/**
 * Park-Keeper Home Page
 * Faithfully reproduces the original .example/park-keeper/App.tsx UI/UX
 * within the monorepo SSG architecture.
 */
import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
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
  MapPin,
  Clock,
  X,
  Navigation,
  Navigation2,
  Footprints,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ThemeConfig, ParkingRecord, AppSettings, LanguageType } from '@app/park-keeper/types';
import { THEMES, DEFAULT_SETTINGS } from '@app/park-keeper/constants';
import { dbService } from '@app/park-keeper/services/db';
import { getVersionInfo } from '@app/park-keeper/config/version';
import QuickEntry from '@app/park-keeper/components/QuickEntry';
import { useNavigation } from '@app/park-keeper/hooks/useNavigation';

const MiniMap = lazy(() => import('@app/park-keeper/components/MiniMap'));

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
// NAV OVERLAY – Full-screen compass navigation (original "liquid glass" design)
// ---------------------------------------------------------------------------
function NavOverlay({
  record,
  theme,
  onClose,
}: {
  record: ParkingRecord;
  theme: ThemeConfig;
  onClose: () => void;
}) {
  const { t } = useTranslation();
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

  // Symmetric ±30° threshold; dead-band at [0,30] ∪ [330,360) → straight
  const TURN_DEG = 30;
  let directionHint = t('nav.straight');
  let directionArrow = '↑';
  if (relativeRotation > TURN_DEG && relativeRotation < 180 - TURN_DEG) {
    directionHint = t('nav.turn_right');
    directionArrow = '→';
  } else if (relativeRotation > 180 + TURN_DEG && relativeRotation < 360 - TURN_DEG) {
    directionHint = t('nav.turn_left');
    directionArrow = '←';
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
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
          className="pointer-events-auto w-10 h-10 mt-2 flex items-center justify-center backdrop-blur-2xl rounded-full transition-all active:scale-90 shadow-lg"
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
          initial={{ y: -20, opacity: 0 }}
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
                  animate={{ opacity: [1, 0.35, 1] }}
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
                    {isIndoor ? t('nav.steps') : 'Meters'}
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
              text={miniMapText}
              className="grayscale-[0.2]"
              mapKey={`nav-${record.id}`}
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
          {/* Main Compass Dial */}
          <div className="relative w-72 h-72 flex items-center justify-center">
            {/* SVG Compass Ring */}
            <motion.div
              className="absolute inset-0"
              style={{ rotate: -trueAnimHeading }}
              transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            >
              <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
                {/* Outer compass boundary ring */}
                <circle
                  cx="150"
                  cy="150"
                  r="140"
                  fill="none"
                  stroke={theme.colors.text}
                  strokeWidth="1"
                  opacity="0.1"
                />
                {Array.from({ length: 36 }).map((_, i) => {
                  const angle = i * 10;
                  const isCardinal = i % 9 === 0;
                  const isMajor = i % 3 === 0 && !isCardinal;
                  const tickLength = isCardinal ? 22 : isMajor ? 13 : 7;
                  const strokeW = isCardinal ? 3 : isMajor ? 1.5 : 0.8;
                  const opacity = isCardinal ? 1 : isMajor ? 0.45 : 0.18;
                  const isNorth = i === 0;
                  return (
                    <g key={i} transform={`rotate(${angle} 150 150)`}>
                      <line
                        x1="150"
                        y1="10"
                        x2="150"
                        y2={10 + tickLength}
                        stroke={isNorth ? '#ef4444' : theme.colors.text}
                        strokeWidth={strokeW}
                        opacity={opacity}
                        strokeLinecap="round"
                      />
                      {isCardinal && (
                        <text
                          x="150"
                          y="68"
                          textAnchor="middle"
                          fill={isNorth ? '#ef4444' : theme.colors.text}
                          fontSize="20"
                          fontWeight="900"
                          transform={`rotate(${-angle} 150 68)`}
                          opacity={isNorth ? 1 : 0.85}
                        >
                          {i === 0
                            ? t('compass.n')
                            : i === 9
                              ? t('compass.e')
                              : i === 18
                                ? t('compass.s')
                                : t('compass.w')}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </motion.div>

            {/* Target Pointer – dimmed when GPS unavailable */}
            <motion.div
              className="absolute inset-0 transition-opacity duration-500"
              style={{
                rotate: -trueAnimHeading,
                opacity: hasValidLocation ? 1 : 0.25,
              }}
            >
              <motion.div
                className="w-full h-full"
                style={{ rotate: animTargetBearing }}
                transition={{ type: 'spring', stiffness: 60, damping: 15 }}
              >
                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
                  <div
                    className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[26px]"
                    style={{
                      borderBottomColor: theme.colors.primary,
                      filter: `drop-shadow(0 0 10px ${theme.colors.primary}80) drop-shadow(0 2px 4px rgba(0,0,0,0.25))`,
                    }}
                  />
                  <div
                    className="w-0.5 h-4 rounded-full opacity-40"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                </div>
              </motion.div>
            </motion.div>

            {/* Center Hub – Distance + Direction / Arrived / GPS Waiting */}
            <div
              className="absolute w-28 h-28 rounded-full border-2 flex flex-col items-center justify-center z-10 backdrop-blur-sm transition-all duration-500"
              style={{
                borderColor: arrived ? 'rgba(34,197,94,0.5)' : `${theme.colors.text}12`,
                backgroundColor: `${theme.colors.background}CC`,
                boxShadow: arrived
                  ? '0 0 0 6px rgba(34,197,94,0.12), 0 4px 24px rgba(0,0,0,0.12)'
                  : '0 4px 24px rgba(0,0,0,0.12)',
              }}
            >
              {arrived ? (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                >
                  <Check size={38} style={{ color: '#22c55e' }} strokeWidth={3} />
                </motion.div>
              ) : !hasValidLocation ? (
                <motion.div
                  className="flex flex-col items-center gap-1"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                >
                  <Navigation size={24} style={{ color: theme.colors.primary }} />
                  <p
                    className="text-[8px] font-bold uppercase tracking-widest"
                    style={{ color: theme.colors.text, opacity: 0.45 }}
                  >
                    GPS
                  </p>
                </motion.div>
              ) : (
                <>
                  <p
                    className="text-3xl font-black tracking-tight leading-none"
                    style={{ color: theme.colors.text }}
                  >
                    {isIndoor ? stepCount : distance !== null ? Math.round(distance) : '--'}
                  </p>
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest mt-0.5"
                    style={{ color: theme.colors.text, opacity: 0.45 }}
                  >
                    {isIndoor ? t('nav.steps') : 'm'}
                  </p>
                  {!isIndoor && (
                    <p
                      className="text-sm font-black mt-1 leading-none"
                      style={{ color: theme.colors.primary }}
                      aria-label={directionHint}
                    >
                      {directionArrow}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Status Footer */}
          <div className="mt-4 mb-2 flex flex-col items-center min-h-[48px] justify-center">
            <AnimatePresence>
              {arrived && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, y: 8 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="px-8 py-3 bg-green-500 rounded-full text-xs font-black uppercase tracking-[0.3em] text-white shadow-[0_0_20px_rgba(34,197,94,0.35)]"
                >
                  {t('nav.arrived')}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
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

  const filteredRecords = records.filter(
    (r) =>
      r.plateNumber.includes(search.toUpperCase()) ||
      r.floor.toLowerCase().includes(search.toLowerCase()),
  );

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
                      <div
                        key={r.id}
                        className="rounded-4xl p-5 shadow-elevation-2 border border-black/1 overflow-hidden"
                        style={{ backgroundColor: theme.colors.surface }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="p-2.5 rounded-2xl"
                              style={{
                                backgroundColor: `${theme.colors.primary}15`,
                                color: theme.colors.primary,
                              }}
                            >
                              <Car size={18} />
                            </div>
                            <div>
                              <h3 className="font-black text-base leading-none mb-1">
                                {r.plateNumber}
                              </h3>
                              <div className="flex items-center gap-3 text-[10px] font-black opacity-30 uppercase tracking-tight">
                                <span
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: `${theme.colors.primary}08`,
                                    color: theme.colors.primary,
                                  }}
                                >
                                  <MapPin size={10} />
                                  {r.floor}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock size={10} />
                                  {new Date(r.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleDelete(r.id)}
                            className="p-2 opacity-10 hover:opacity-100 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Photo + Map row */}
                        <div className="flex gap-2.5 h-36 mb-4">
                          <div className="flex-[1.2] rounded-2xl overflow-hidden bg-black/5 shadow-inner">
                            {r.photoData ? (
                              <img
                                src={r.photoData}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center opacity-20">
                                <Plus size={20} />
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setNavRecord(r)}
                            className="flex-1 rounded-2xl overflow-hidden bg-black/5 shadow-inner border border-black/2 cursor-pointer active:scale-95 transition-transform group relative"
                          >
                            {r.latitude != null && r.longitude != null ? (
                              <Suspense
                                fallback={
                                  <div className="w-full h-full animate-pulse bg-gray-200" />
                                }
                              >
                                <MiniMap
                                  lat={r.latitude}
                                  lng={r.longitude}
                                  theme={theme}
                                  interactive={false}
                                  text={miniMapText}
                                  mapKey={r.id}
                                />
                              </Suspense>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center opacity-20 text-[8px] font-black uppercase tracking-widest">
                                No Map
                              </div>
                            )}
                            <div
                              className="absolute inset-0 z-10 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                              style={{ backgroundColor: `${theme.colors.primary}66` }}
                            >
                              <Navigation
                                size={28}
                                className="text-white drop-shadow-2xl animate-bounce mb-1"
                              />
                              <span className="text-[8px] font-black text-white uppercase tracking-widest">
                                NAVIGATE
                              </span>
                            </div>
                          </button>
                        </div>

                        {r.notes && (
                          <p className="text-[11px] opacity-60 bg-black/2 p-3 rounded-2xl font-medium leading-relaxed italic">
                            &ldquo;{r.notes}&rdquo;
                          </p>
                        )}
                      </div>
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
            <NavOverlay record={navRecord} theme={theme} onClose={() => setNavRecord(null)} />
          )}
        </AnimatePresence>

        {/* Bottom Navigation */}
        <nav
          className="fixed bottom-0 inset-x-0 h-20 pb-safe-bottom z-30 backdrop-blur-xl border-t border-black/2"
          style={{ backgroundColor: theme.colors.background + 'CC' }}
        >
          <div className="flex h-full max-w-md mx-auto relative px-6">
            {/* List Tab */}
            <div className="flex-1 h-full">
              <button
                type="button"
                onClick={() => setCurrentTab('list')}
                className="w-full h-full flex flex-col items-center justify-center gap-1 relative group"
              >
                <div
                  className={`transition-all duration-300 ${currentTab === 'list' ? 'scale-105' : 'opacity-30 group-hover:opacity-50'}`}
                  style={{ color: currentTab === 'list' ? theme.colors.primary : undefined }}
                >
                  <ListIcon size={22} strokeWidth={currentTab === 'list' ? 2.5 : 2} />
                </div>
                <span
                  className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${currentTab === 'list' ? '' : 'opacity-30'}`}
                  style={{ color: currentTab === 'list' ? theme.colors.primary : undefined }}
                >
                  {t('tab.list')}
                </span>

                {currentTab === 'list' && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 w-8 h-1 rounded-t-full"
                    style={{ backgroundColor: theme.colors.primary }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
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
                onClick={() => setCurrentTab('settings')}
                className="w-full h-full flex flex-col items-center justify-center gap-1 relative group"
              >
                <div
                  className={`transition-all duration-300 ${currentTab === 'settings' ? 'scale-105' : 'opacity-30 group-hover:opacity-50'}`}
                  style={{ color: currentTab === 'settings' ? theme.colors.primary : undefined }}
                >
                  <SettingsIcon size={22} strokeWidth={currentTab === 'settings' ? 2.5 : 2} />
                </div>
                <span
                  className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${currentTab === 'settings' ? '' : 'opacity-30'}`}
                  style={{ color: currentTab === 'settings' ? theme.colors.primary : undefined }}
                >
                  {t('tab.settings')}
                </span>

                {currentTab === 'settings' && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 w-8 h-1 rounded-t-full"
                    style={{ backgroundColor: theme.colors.primary }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            </div>
          </div>
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
    </LayoutGroup>
  );
}
