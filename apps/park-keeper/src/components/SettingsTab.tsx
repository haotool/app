/**
 * SettingsTab – Original design with gradient decorations and animated lang
 * 自 pages/Home.tsx 純搬移抽出（issue #711 S0），行為零變更。
 */
import { useEffect, useRef } from 'react';
import { motion, LayoutGroup } from 'motion/react';
import { Trash2, Check, Palette, Globe, Database, ShieldAlert, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ThemeConfig, AppSettings, LanguageType } from '@app/park-keeper/types';
import { THEMES, CACHE_DAYS } from '@app/park-keeper/constants';
import { dbService } from '@app/park-keeper/services/db';
import { setAppLanguage } from '@app/park-keeper/services/i18n';
import { getVersionInfo } from '@app/park-keeper/config/version';

// 滑桿拖曳防抖：停止拖曳後才執行單次清理，避免每 tick 全掃 IndexedDB。
const CACHE_CLEANUP_DEBOUNCE_MS = 500;

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

export default function SettingsTab({
  settings,
  updateSettings,
  theme,
}: {
  settings: AppSettings;
  updateSettings: (s: AppSettings) => void;
  theme: ThemeConfig;
}) {
  const { t } = useTranslation();
  const versionInfo = getVersionInfo();
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      // 卸載時清除待執行清理；漏掉的清理由啟動/前景喚醒排程接手。
      if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
    };
  }, []);

  const handleLanguageChange = (lang: LanguageType) => {
    // 單一寫入路徑：setAppLanguage 寫 i18n＋localStorage（還原 SSOT），IDB 副本同批保存。
    setAppLanguage(lang);
    updateSettings({ ...settings, language: lang });
  };

  const clearAll = async () => {
    if (window.confirm(t('settings.erase') + '?')) {
      await dbService.clearAllData();
      window.location.reload();
    }
  };

  const handleCacheChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const days = parseInt(e.target.value, 10);
    updateSettings({ ...settings, cacheDurationDays: days });
    if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
    cleanupTimerRef.current = setTimeout(() => {
      // getRecords 改為 throw 後（issue #714），避免滑桿操作產生 unhandled rejection。
      dbService.cleanupCache(days).catch((error: unknown) => {
        console.error('Cleanup cache failed:', error);
      });
    }, CACHE_CLEANUP_DEBOUNCE_MS);
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

              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => updateSettings({ ...settings, theme: th.id })}
                  aria-pressed={isActive}
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
                    style={{ backgroundColor: th.colors.accent }}
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
              {/* 以語言原生名稱為唯一識別（不用 emoji 旗幟：SR 朗讀不一致且與語言非一對一）。 */}
              {[
                { id: 'en', name: 'English' },
                { id: 'zh-TW', name: '繁體中文' },
                { id: 'ja', name: '日本語' },
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
                    <span className="text-sm font-bold">{lang.name}</span>
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
              min={CACHE_DAYS.MIN}
              max={CACHE_DAYS.MAX}
              value={settings.cacheDurationDays}
              onChange={handleCacheChange}
              aria-label={t('settings.days')}
              className="w-full h-1.5 bg-black/5 rounded-lg appearance-none cursor-pointer accent-current"
              style={{ accentColor: theme.colors.primary }}
            />
            <p className="text-[10px] mt-4 opacity-40 font-medium text-center">
              {t('settings.cache_desc')}
            </p>
            <p className="text-[10px] mt-1.5 font-medium text-center text-red-500/70">
              {t('settings.cache_shrink_warning', '調小天數將立即清除較舊照片，且無法復原。')}
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
