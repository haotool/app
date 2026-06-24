/**
 * Settings Page - ParkKeeper 風格設定頁面
 *
 * @description 應用程式設定頁面，支援 6 種風格切換
 *              採用 ParkKeeper 設計風格（圓潤卡片、風格預覽）
 *              SSOT: 風格定義來自 themes.ts
 *
 * 風格選項：
 * - Zen - 極簡專業（預設）
 * - Nitro - 深色科技感
 * - Kawaii - 可愛粉嫩
 * - Classic - 復古書卷
 * - Ocean - 海洋深邃
 * - Forest - 自然森林
 *
 * @reference ParkKeeper UI Design, themes.ts SSOT
 * @created 2026-01-15
 * @updated 2026-01-17 - 移除深色模式功能，簡化為僅風格切換
 * @version 4.0.0
 */

import {
  BookOpen,
  Palette,
  Globe,
  Database,
  Github,
  ShieldAlert,
  ShieldCheck,
  Check,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  TrendingUp,
  Shuffle,
  Landmark,
  Scale,
  Info,
  SearchCheck,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEOHelmet } from '../components/SEOHelmet';
import { motion } from 'motion/react';
import { useAppTheme } from '../hooks/useAppTheme';
import { STYLE_OPTIONS } from '../config/themes';
import {
  LANGUAGE_OPTIONS,
  getResolvedLanguage,
  persistLanguagePreference,
  type SupportedLanguage,
} from '../i18n';
import { getDisplayVersion } from '../config/version';
import { transitions, segmentedSwitch } from '../config/animations';
import { APP_INFO } from '../config/app-info';
import { APP_ONLY_PAGE_SEO } from '../config/seo-metadata';
import { SUPPORT_INFO_LINKS, type SupportInfoHref } from '../config/support-info';
import type { RateMode } from '../features/ratewise/types';
import { useConverterStore } from '../stores/converterStore';

const SUPPORT_INFO_ICON_BY_HREF = {
  '/faq/': HelpCircle,
  '/guide/': BookOpen,
  '/about/': Info,
  '/open-data/': Database,
  '/seo-tech/': SearchCheck,
  '/privacy/': ShieldCheck,
} satisfies Record<SupportInfoHref, LucideIcon>;

const SUPPORT_LINKS = [
  ...SUPPORT_INFO_LINKS.map((item) => ({
    ...item,
    icon: SUPPORT_INFO_ICON_BY_HREF[item.href],
    external: false,
  })),
  {
    href: APP_INFO.github,
    labelKey: 'settings.openSource',
    descKey: 'settings.openSourceDesc',
    icon: Github,
    external: true,
  },
];

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { style, setStyle, resetTheme, isLoaded } = useAppTheme();
  const pageSeo = APP_ONLY_PAGE_SEO.settings;
  const { rateMode, setRateMode } = useConverterStore();

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
    persistLanguagePreference(lang);
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
          <div className="px-2 mb-3">
            <div className="flex items-center gap-2 opacity-50">
              <HelpCircle className="w-3.5 h-3.5" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">
                {t('settings.supportInfo')}
              </h2>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-text-muted">
              {t('settings.supportInfoDesc')}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {SUPPORT_LINKS.map((item) => {
              const Icon = item.icon;
              const content = (
                <>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-text">{t(item.labelKey)}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-text-muted">
                      {t(item.descKey)}
                    </span>
                  </span>
                  {item.external ? (
                    <ExternalLink className="h-4 w-4 shrink-0 text-text-muted opacity-50 transition-opacity group-hover:opacity-100" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-text-muted opacity-50 transition-opacity group-hover:opacity-100" />
                  )}
                </>
              );

              const className =
                'group flex min-h-[92px] items-center gap-3 rounded-2xl border border-border/70 bg-surface p-4 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background';

              return item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${t(item.labelKey)}${t('common.opensInNewWindow')}`}
                  className={className}
                >
                  {content}
                </a>
              ) : (
                <Link key={item.href} to={item.href} className={className}>
                  {content}
                </Link>
              );
            })}
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
