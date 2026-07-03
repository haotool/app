/**
 * Settings Page - ParkKeeper 風格設定頁面
 *
 * @description 應用程式設定頁面，支援 7 種風格切換與啟動畫面偏好
 *              採用 ParkKeeper 設計風格（圓潤卡片、風格預覽）
 *              SSOT: 風格定義來自 themes.ts
 *
 * 風格選項：
 * - Zen - 極簡專業（預設，品牌藍）
 * - Violet - 經典紫
 * - Nitro - 深色科技感
 * - Racing - 黑紅賽車
 * - Kawaii - 可愛粉嫩
 * - Classic - 復古書卷
 * - Forest - 韓系簡約
 *
 * @reference ParkKeeper UI Design, themes.ts SSOT
 * @created 2026-01-15
 * @updated 2026-07-04 - Plan 014：移除 Ocean，新增 Racing，Forest 改韓系簡約
 * @version 5.0.0
 */

import {
  Palette,
  Globe,
  Database,
  ShieldAlert,
  Check,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  TrendingUp,
  Shuffle,
  Landmark,
  Scale,
  Sparkles,
  Play,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEOHelmet } from '../components/SEOHelmet';
import { motion } from 'motion/react';
import { useAppTheme } from '../hooks/useAppTheme';
import { STYLE_OPTIONS } from '../config/themes';
import { LANGUAGE_OPTIONS, getResolvedLanguage, type SupportedLanguage } from '../i18n';
import { getDisplayVersion } from '../config/version';
import { transitions, segmentedSwitch } from '../config/animations';
import { APP_INFO } from '../config/app-info';
import { APP_ONLY_PAGE_SEO } from '../config/seo-metadata';
import type { RateMode } from '../features/ratewise/types';
import { useConverterStore } from '../stores/converterStore';
import { isSplashEnabled, setSplashEnabled, SPLASH_PREVIEW_EVENT } from '../utils/splashPreference';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { style, setStyle, resetTheme, isLoaded } = useAppTheme();
  const pageSeo = APP_ONLY_PAGE_SEO.settings;
  const { rateMode, setRateMode } = useConverterStore();

  // 啟動畫面偏好：與 useAppTheme 相同模式（initializer 讀 localStorage，SSR 回傳預設）。
  const [splashEnabled, setSplashEnabledState] = useState<boolean>(() => isSplashEnabled());

  const handleSplashToggle = () => {
    setSplashEnabledState((prev) => {
      const next = !prev;
      setSplashEnabled(next);
      return next;
    });
  };

  const handleSplashPreview = () => {
    window.dispatchEvent(new CustomEvent(SPLASH_PREVIEW_EVENT));
  };

  const RATE_MODE_OPTIONS: {
    value: RateMode;
    labelKey: string;
    descKey: string;
    icon: LucideIcon;
  }[] = [
    {
      value: 'auto',
      labelKey: 'settings.rateModeAuto',
      descKey: 'settings.rateModeAutoDesc',
      icon: Shuffle,
    },
    {
      value: 'sell',
      labelKey: 'settings.rateModeSell',
      descKey: 'settings.rateModeSellDesc',
      icon: Landmark,
    },
    {
      value: 'mid',
      labelKey: 'settings.rateModeMid',
      descKey: 'settings.rateModeMidDesc',
      icon: Scale,
    },
  ];

  // 使用正規化後的語系（zh-Hant → zh-TW）
  // @see i18n/index.ts - getResolvedLanguage()
  const currentLanguage = getResolvedLanguage();

  const handleLanguageChange = (lang: SupportedLanguage) => {
    void i18n.changeLanguage(lang);
  };

  return (
    <div className="min-h-full">
      <SEOHelmet
        title={pageSeo.title}
        description={pageSeo.description}
        pathname={pageSeo.pathname}
        robots={pageSeo.robots}
      />
      <h1 className="sr-only">{pageSeo.title}</h1>
      <div className="px-3 sm:px-5 py-6 max-w-md mx-auto">
        {/* 介面風格區塊 */}
        <section className="mb-8">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <Palette className="w-3.5 h-3.5" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">
              {t('settings.interfaceStyle')}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {STYLE_OPTIONS.map((option) => (
              <motion.button
                key={option.value}
                onClick={() => setStyle(option.value)}
                disabled={!isLoaded}
                whileHover={segmentedSwitch.item.whileHover}
                whileTap={segmentedSwitch.item.whileTap}
                transition={transitions.instant}
                className={`
                  relative p-3 h-20 flex flex-col justify-end overflow-hidden rounded-xl
                  shadow-sm disabled:opacity-50
                  ${style === option.value ? 'ring-2 ring-offset-2 shadow-md' : ''}
                `}
                style={
                  {
                    backgroundColor: option.previewBg,
                    color: option.previewText,
                    '--tw-ring-color': option.previewAccent,
                    '--tw-ring-offset-color': 'rgb(var(--color-background))',
                  } as React.CSSProperties
                }
                aria-pressed={style === option.value}
                aria-label={`${t(`styles.${option.value}` as Parameters<typeof t>[0])} ${t(`styles.${option.value}Desc` as Parameters<typeof t>[0])}`}
              >
                {/* 裝飾圓形 */}
                <motion.div
                  className="absolute top-0 right-0 w-16 h-16 opacity-15 -mr-4 -mt-4 rounded-full"
                  style={{ backgroundColor: option.previewAccent }}
                  animate={{ scale: style === option.value ? segmentedSwitch.activeIconScale : 1 }}
                  transition={transitions.spring}
                />

                {/* 選中指示器 */}
                {style === option.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={transitions.spring}
                    className="absolute top-2 right-2 rounded-full p-0.5"
                    style={{ backgroundColor: option.previewAccent }}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}

                {/* 內容 */}
                <div className="flex flex-col items-start w-full relative z-10">
                  <span className="font-bold text-sm leading-tight">
                    {t(`styles.${option.value}` as Parameters<typeof t>[0])}
                  </span>
                  <span className="text-[10px] opacity-60 leading-tight">
                    {t(`styles.${option.value}Desc` as Parameters<typeof t>[0])}
                  </span>
                </div>
              </motion.button>
            ))}

            {/* 自訂主題色 — 功能預告（尚未開放，僅呈現讓使用者預期） */}
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="relative p-3 h-20 flex flex-col justify-end overflow-hidden rounded-xl shadow-sm border border-dashed opacity-50 cursor-not-allowed"
              style={{
                backgroundColor: 'rgb(var(--color-surface))',
                color: 'rgb(var(--color-text))',
                borderColor: 'rgb(var(--color-primary) / 0.35)',
              }}
              aria-label={`${t('styles.custom')} ${t('styles.customDesc')}`}
            >
              <div
                className="absolute top-0 right-0 w-16 h-16 opacity-20 -mr-4 -mt-4 rounded-full"
                style={{
                  background:
                    'conic-gradient(from 0deg, #F87171, #FBBF24, #34D399, #3182F6, #A78BFA, #F87171)',
                }}
              />
              <div className="flex flex-col items-start w-full relative z-10">
                <span className="font-bold text-sm leading-tight">{t('styles.custom')}</span>
                <span className="text-[10px] opacity-60 leading-tight">
                  {t('styles.customDesc')}
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* 語言區塊 - SSOT 風格 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <Globe className="w-3.5 h-3.5" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">
              {t('settings.language')}
            </h2>
          </div>

          <div className={segmentedSwitch.containerClass}>
            {LANGUAGE_OPTIONS.map((option) => {
              const isActive = currentLanguage === option.value;
              return (
                <motion.button
                  key={option.value}
                  onClick={() => handleLanguageChange(option.value)}
                  whileHover={{ ...segmentedSwitch.item.whileHover, opacity: 1 }}
                  whileTap={segmentedSwitch.item.whileTap}
                  animate={{ opacity: isActive ? 1 : segmentedSwitch.inactiveOpacity }}
                  transition={transitions.default}
                  className={`${segmentedSwitch.itemBaseClass} flex-col`}
                  aria-pressed={isActive}
                  aria-label={option.label}
                >
                  {/* 滑動背景指示器 - SSOT layoutId 動畫 */}
                  {isActive && (
                    <motion.div
                      layoutId="language-indicator"
                      className={segmentedSwitch.indicatorClass}
                      transition={segmentedSwitch.indicator}
                    />
                  )}
                  <motion.span
                    animate={{ scale: isActive ? segmentedSwitch.activeIconScale : 1 }}
                    transition={transitions.default}
                    className="text-xl mb-1 filter drop-shadow-sm"
                    aria-hidden="true"
                  >
                    {option.flag}
                  </motion.span>
                  <span className="text-[10px] font-bold">{option.label}</span>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* 匯率模式區塊 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">
              {t('settings.rateMode')}
            </h2>
          </div>

          <div className={segmentedSwitch.containerClass}>
            {RATE_MODE_OPTIONS.map((option) => {
              const isActive = rateMode === option.value;
              return (
                <motion.button
                  key={option.value}
                  onClick={() => setRateMode(option.value)}
                  whileHover={{ ...segmentedSwitch.item.whileHover, opacity: 1 }}
                  whileTap={segmentedSwitch.item.whileTap}
                  animate={{ opacity: isActive ? 1 : segmentedSwitch.inactiveOpacity }}
                  transition={transitions.default}
                  className={`${segmentedSwitch.itemBaseClass} flex-col`}
                  aria-pressed={isActive}
                >
                  {isActive && (
                    <motion.div
                      layoutId="ratemode-indicator"
                      className={segmentedSwitch.indicatorClass}
                      transition={segmentedSwitch.indicator}
                    />
                  )}
                  <motion.span
                    animate={{ scale: isActive ? segmentedSwitch.activeIconScale : 1 }}
                    transition={transitions.default}
                    className="mb-1 relative z-10"
                  >
                    <option.icon
                      className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-primary' : ''}`}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                  </motion.span>
                  <span className="text-[10px] font-bold relative z-10">
                    {t(option.labelKey as Parameters<typeof t>[0])}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* 說明文字 */}
          <p className="text-[10px] opacity-50 mt-2 px-1 leading-relaxed">
            {t(
              RATE_MODE_OPTIONS.find((o) => o.value === rateMode)?.descKey as Parameters<
                typeof t
              >[0],
            )}
          </p>
        </section>

        {/* 啟動畫面區塊 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">
              {t('settings.splashScreen')}
            </h2>
          </div>

          <div className="card overflow-hidden divide-y divide-border">
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{t('settings.splashScreen')}</p>
                <p className="text-[10px] opacity-50 mt-0.5 leading-relaxed">
                  {t('settings.splashScreenDesc')}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={splashEnabled}
                aria-label={t('settings.splashScreen')}
                onClick={handleSplashToggle}
                className="relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200"
                style={{
                  backgroundColor: splashEnabled
                    ? 'rgb(var(--color-primary))'
                    : 'rgb(var(--color-border))',
                }}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    splashEnabled ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
            <motion.button
              onClick={handleSplashPreview}
              whileHover={segmentedSwitch.item.whileHover}
              whileTap={segmentedSwitch.item.whileTap}
              transition={transitions.instant}
              className="w-full px-5 py-3.5 flex items-center justify-center gap-2 text-primary hover:bg-primary/5 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">{t('settings.splashPreview')}</span>
            </motion.button>
          </div>
        </section>

        {/* 儲存與快取區塊 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <Database className="w-3.5 h-3.5" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">
              {t('settings.storageCache')}
            </h2>
          </div>

          <div className="card p-5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold opacity-60 uppercase tracking-wider">
                {t('settings.dataSource')}
              </span>
              <span className="text-lg font-black">{t('settings.taiwanBank')}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold opacity-60 uppercase tracking-wider">
                {t('settings.updateFrequency')}
              </span>
              <span className="text-lg font-black">{t('settings.fiveMinutes')}</span>
            </div>
            <p className="text-[10px] mt-2 opacity-40 font-medium text-center">
              {t('settings.updateNote')}
            </p>
          </div>
        </section>

        {/* 資料管理區塊 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <ShieldAlert className="w-3.5 h-3.5" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">
              {t('settings.dataManagement')}
            </h2>
          </div>

          <div className="card overflow-hidden">
            <motion.button
              onClick={resetTheme}
              disabled={!isLoaded}
              whileHover={segmentedSwitch.item.whileHover}
              whileTap={segmentedSwitch.item.whileTap}
              transition={transitions.instant}
              className="w-full px-5 py-4 flex items-center justify-between group disabled:opacity-50 hover:bg-destructive/10"
            >
              <span className="text-xs font-black text-destructive uppercase tracking-widest">
                {t('settings.resetTheme')}
              </span>
              <ShieldAlert className="w-4 h-4 text-destructive opacity-40 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          </div>
        </section>

        {/* 支援與資訊區塊 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">
              {t('settings.supportInfo')}
            </h2>
          </div>

          <div className="card overflow-hidden divide-y divide-border">
            <Link
              to="/faq/"
              className="w-full px-5 py-4 flex items-center justify-between group hover:bg-primary/5 transition-colors"
            >
              <span className="text-sm font-medium">{t('settings.faq')}</span>
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              to="/guide/"
              className="w-full px-5 py-4 flex items-center justify-between group hover:bg-primary/5 transition-colors"
            >
              <span className="text-sm font-medium">{t('settings.usageGuide')}</span>
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              to="/about/"
              className="w-full px-5 py-4 flex items-center justify-between group hover:bg-primary/5 transition-colors"
            >
              <span className="text-sm font-medium">{t('settings.aboutUs')}</span>
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              to="/privacy/"
              className="w-full px-5 py-4 flex items-center justify-between group hover:bg-primary/5 transition-colors"
            >
              <span className="text-sm font-medium">{t('settings.privacyPolicy')}</span>
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              to="/open-data/"
              className="w-full px-5 py-4 flex items-center justify-between group hover:bg-primary/5 transition-colors"
            >
              <span className="text-sm font-medium">{t('settings.openDataApi')}</span>
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              to="/seo-tech/"
              className="w-full px-5 py-4 flex items-center justify-between group hover:bg-primary/5 transition-colors"
            >
              <span className="text-sm font-medium">{t('settings.seoTech')}</span>
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
            <a
              href={APP_INFO.github}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-5 py-4 flex items-center justify-between group hover:bg-primary/5 transition-colors"
            >
              <span className="text-sm font-medium">{t('settings.openSource')}</span>
              <ExternalLink className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </section>

        {/* 版本資訊 */}
        <footer className="text-center mt-8 pb-4">
          <p className="text-[10px] opacity-40">{t('settings.copyright')}</p>
          <p className="text-xs font-mono opacity-60 mt-1">{getDisplayVersion()}</p>
        </footer>
      </div>
    </div>
  );
}
