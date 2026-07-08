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
  TrendingUp,
  Shuffle,
  Landmark,
  Scale,
  Sparkles,
  Play,
  LayoutList,
  Rows3,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEOHelmet } from '../components/SEOHelmet';
import { motion } from 'motion/react';
import { useAppTheme } from '../hooks/useAppTheme';
import { useCustomThemeDraft } from '../hooks/useCustomThemeDraft';
import { useInlineConfirm } from '../hooks/useInlineConfirm';
import { STYLE_OPTIONS, DEFAULT_THEME_CONFIG } from '../config/themes';
import { choosePrimaryForeground, DEFAULT_CUSTOM_PRIMARY } from '../config/custom-theme';
import { CustomThemeSheet } from '../components/CustomThemeSheet';
import { LANGUAGE_OPTIONS, getResolvedLanguage, type SupportedLanguage } from '../i18n';
import { getDisplayVersion } from '../config/version';
import { transitions, segmentedSwitch } from '../config/animations';
import { APP_ONLY_PAGE_SEO } from '../config/seo-metadata';
import type { ConverterV2Variant, RateMode } from '../features/ratewise/types';
import { DEFAULT_CONVERTER_V2_VARIANT, DEFAULT_RATE_MODE } from '../features/ratewise/constants';
import { useConverterStore } from '../stores/converterStore';
import {
  subscribeConverterV2Variant,
  getConverterV2Variant,
  getConverterV2VariantServerSnapshot,
} from '../config/converter-v2-flag';
import { isSplashEnabled, setSplashEnabled, SPLASH_PREVIEW_EVENT } from '../utils/splashPreference';

// SSR 環境呼叫 useLayoutEffect 會產生 React 警告；依 window 存在與否切換（同 #664 慣例）。
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// issue #666：/settings 為預渲染頁，persisted 偏好（variant/rateMode/theme/splash）若於
// 首幀直讀，client render 路徑（hydration de-opt／早期更新／SSG fallback guard）首幀輸出
// 會偏離 SSG HTML，屬 #653 同族破口。模組級旗標記錄本次 page load 是否已完成一次
// hydration：SPA 導覽 remount 首幀直接依 persisted 偏好渲染，不重演 two-pass（零閃爍）。
let hasCompletedHydration = false;

// 測試專用：重置 hydration 旗標，模擬新的 page load。
// eslint-disable-next-line react-refresh/only-export-components
export function resetSettingsHydrationForTests() {
  hasCompletedHydration = false;
}

export default function Settings() {
  const { t, i18n } = useTranslation();
  const {
    config,
    style: persistedStyle,
    setStyle,
    customPrimary: persistedCustomPrimary,
    commitCustomTheme,
    resetTheme,
    isLoaded,
  } = useAppTheme();
  const pageSeo = APP_ONLY_PAGE_SEO.settings;
  const {
    rateMode: persistedRateMode,
    setRateMode,
    singleConverterVariant: persistedConverterVariant,
    setSingleConverterVariant,
  } = useConverterStore();

  // Two-pass render（#666，比照 #664）：第一 pass（hydration）所有 persisted 欄位一律
  // 沿用 SSG server snapshot 值，保證任何強制 client render 的首幀輸出與預渲染 HTML 一致；
  // 第二 pass 由 layout effect 於 paint 前切回 persisted 偏好，無多餘可見預設幀。
  const [hydrated, setHydrated] = useState(hasCompletedHydration);

  useIsomorphicLayoutEffect(() => {
    hasCompletedHydration = true;
    setHydrated(true);
  }, []);

  // URL override 提示：effective 值（含 ?converter= 覆寫）與儲存偏好不一致時顯示 badge。
  // server snapshot 恆 legacy；hydration 完成前 client snapshot 也固定走 server 值（同 #664）。
  const effectiveConverterVariant = useSyncExternalStore(
    subscribeConverterV2Variant,
    hydrated ? getConverterV2Variant : getConverterV2VariantServerSnapshot,
    getConverterV2VariantServerSnapshot,
  );

  // 啟動畫面偏好：initializer 讀 localStorage（SSR 回傳預設 true）。
  const [splashEnabledState, setSplashEnabledState] = useState<boolean>(() => isSplashEnabled());

  // 首幀顯示值：hydration 完成前一律用 SSG 預設（zen／品牌藍／auto／legacy／splash on）。
  const style = hydrated ? persistedStyle : DEFAULT_THEME_CONFIG.style;
  const customPrimary = hydrated ? persistedCustomPrimary : DEFAULT_CUSTOM_PRIMARY;
  const rateMode = hydrated ? persistedRateMode : DEFAULT_RATE_MODE;
  const singleConverterVariant = hydrated
    ? persistedConverterVariant
    : DEFAULT_CONVERTER_V2_VARIANT;
  const splashEnabled = hydrated ? splashEnabledState : true;
  const isConverterVariantOverridden = effectiveConverterVariant !== singleConverterVariant;

  // 主題工作室 draft 模式（E7 wave-B）：開啟即時預覽全站、關閉 sheet 才 commit persist、
  // 「取消」回滾開啟前快照。
  const themeDraft = useCustomThemeDraft({ config, commitCustomTheme });

  // 還原預設（回 zen）＝ commit 動作：sheet 內按鈕經二段確認後呼叫，直接收尾 draft。
  const handleResetTheme = () => {
    resetTheme();
    themeDraft.discard();
  };

  // 設定頁「還原預設主題」入口與 sheet 內語意統一（QA-I #7），同套二段確認（QA-I D12）。
  const settingsResetConfirm = useInlineConfirm(resetTheme);

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

  // 單幣別模式：持久化於 converterStore；URL override 優先序見 config/converter-v2-flag.ts。
  const CONVERTER_VARIANT_OPTIONS: {
    value: ConverterV2Variant;
    labelKey: string;
    descKey: string;
    icon: LucideIcon;
  }[] = [
    {
      value: 'legacy',
      labelKey: 'settings.converterVariantLegacy',
      descKey: 'settings.converterVariantLegacyDesc',
      icon: LayoutList,
    },
    {
      value: 'v2',
      labelKey: 'settings.converterVariantV2',
      descKey: 'settings.converterVariantV2Desc',
      icon: Rows3,
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
            <h2 className="text-2xs font-black uppercase tracking-[0.2em]">
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
                  focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
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
                  <span className="text-2xs opacity-60 leading-tight">
                    {t(`styles.${option.value}Desc` as Parameters<typeof t>[0])}
                  </span>
                </div>
              </motion.button>
            ))}

            {/* 自訂主題色 — 點擊開啟選色 BottomSheet（即選即用） */}
            <motion.button
              type="button"
              onClick={themeDraft.open}
              disabled={!isLoaded}
              whileHover={segmentedSwitch.item.whileHover}
              whileTap={segmentedSwitch.item.whileTap}
              transition={transitions.instant}
              className={`
                relative p-3 h-20 flex flex-col justify-end overflow-hidden rounded-xl
                shadow-sm disabled:opacity-50
                focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
                ${style === 'custom' ? 'ring-2 ring-offset-2 shadow-md' : ''}
              `}
              style={
                {
                  backgroundColor: 'rgb(var(--color-surface))',
                  color: 'rgb(var(--color-text))',
                  '--tw-ring-color': customPrimary,
                  '--tw-ring-offset-color': 'rgb(var(--color-background))',
                } as React.CSSProperties
              }
              aria-pressed={style === 'custom'}
              aria-label={`${t('styles.custom')} ${t('styles.customDesc')}`}
            >
              {/* 裝飾圓形：未啟用時呈彩虹輪，啟用後跟隨使用者主色 */}
              <motion.div
                className="absolute top-0 right-0 w-16 h-16 opacity-20 -mr-4 -mt-4 rounded-full"
                style={{
                  background:
                    style === 'custom'
                      ? customPrimary
                      : 'conic-gradient(from 0deg, #F87171, #FBBF24, #34D399, #3182F6, #A78BFA, #F87171)',
                }}
                animate={{ scale: style === 'custom' ? segmentedSwitch.activeIconScale : 1 }}
                transition={transitions.spring}
              />

              {style === 'custom' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={transitions.spring}
                  className="absolute top-2 right-2 rounded-full p-0.5"
                  style={{ backgroundColor: customPrimary }}
                >
                  <Check
                    className="w-3 h-3"
                    style={{ color: choosePrimaryForeground(customPrimary) }}
                  />
                </motion.div>
              )}

              <div className="flex flex-col items-start w-full relative z-10">
                <span className="font-bold text-sm leading-tight">{t('styles.custom')}</span>
                <span className="text-2xs opacity-60 leading-tight">{t('styles.customDesc')}</span>
              </div>
            </motion.button>
          </div>

          {/* 選色 BottomSheet：色票＋二維選色＋HEX＋背景色調（draft 預覽，關閉才 commit） */}
          <CustomThemeSheet
            isOpen={themeDraft.isOpen}
            onClose={themeDraft.commitClose}
            onCancel={themeDraft.cancel}
            customPrimary={themeDraft.draftPrimary}
            customBackgroundTone={themeDraft.draftTone}
            onSelectPrimary={themeDraft.selectPrimary}
            onSelectBackgroundTone={themeDraft.selectTone}
            onReset={handleResetTheme}
          />
        </section>

        {/* 語言區塊 - SSOT 風格 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <Globe className="w-3.5 h-3.5" />
            <h2 className="text-2xs font-black uppercase tracking-[0.2em]">
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
                  <span className="text-2xs font-bold">{option.label}</span>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* 匯率模式區塊 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            <h2 className="text-2xs font-black uppercase tracking-[0.2em]">
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
                      className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-primary-on-surface' : ''}`}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                  </motion.span>
                  <span className="text-2xs font-bold relative z-10">
                    {t(option.labelKey as Parameters<typeof t>[0])}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* 說明文字 */}
          <p className="text-2xs opacity-50 mt-2 px-1 leading-relaxed">
            {t(
              RATE_MODE_OPTIONS.find((o) => o.value === rateMode)?.descKey as Parameters<
                typeof t
              >[0],
            )}
          </p>
        </section>

        {/* 單幣別模式區塊：經典 legacy／等值雙列 v2（converterStore 持久化） */}
        <section className="mb-6">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <Rows3 className="w-3.5 h-3.5" />
            <h2 className="text-2xs font-black uppercase tracking-[0.2em]">
              {t('settings.singleConverterMode')}
            </h2>
          </div>

          {/* URL override 生效提示：?converter= 覆寫使下方儲存偏好暫時不生效 */}
          {isConverterVariantOverridden && (
            <p
              data-testid="converter-variant-override-badge"
              className="mb-3 mx-1 px-3 py-2 rounded-xl bg-primary/10 text-primary-on-surface text-2xs font-bold leading-relaxed"
            >
              {t('settings.converterVariantOverrideBadge', {
                variant: t(
                  effectiveConverterVariant === 'v2'
                    ? 'settings.converterVariantV2'
                    : 'settings.converterVariantLegacy',
                ),
              })}
            </p>
          )}

          <div className={segmentedSwitch.containerClass}>
            {CONVERTER_VARIANT_OPTIONS.map((option) => {
              const isActive = singleConverterVariant === option.value;
              return (
                <motion.button
                  key={option.value}
                  onClick={() => setSingleConverterVariant(option.value)}
                  whileHover={{ ...segmentedSwitch.item.whileHover, opacity: 1 }}
                  whileTap={segmentedSwitch.item.whileTap}
                  animate={{ opacity: isActive ? 1 : segmentedSwitch.inactiveOpacity }}
                  transition={transitions.default}
                  className={`${segmentedSwitch.itemBaseClass} flex-col`}
                  aria-pressed={isActive}
                  data-testid={`converter-variant-${option.value}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="converter-variant-indicator"
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
                      className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-primary-on-surface' : ''}`}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                  </motion.span>
                  <span className="text-2xs font-bold relative z-10">
                    {t(option.labelKey as Parameters<typeof t>[0])}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* 說明文字 */}
          <p className="text-2xs opacity-50 mt-2 px-1 leading-relaxed">
            {t(
              CONVERTER_VARIANT_OPTIONS.find((o) => o.value === singleConverterVariant)
                ?.descKey as Parameters<typeof t>[0],
            )}
          </p>
        </section>

        {/* 啟動畫面區塊 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <h2 className="text-2xs font-black uppercase tracking-[0.2em]">
              {t('settings.splashScreen')}
            </h2>
          </div>

          <div className="card overflow-hidden divide-y divide-border">
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{t('settings.splashScreen')}</p>
                <p className="text-2xs opacity-50 mt-0.5 leading-relaxed">
                  {t('settings.splashScreenDesc')}
                </p>
              </div>
              {/* 外層 h-11 熱區（WCAG 2.5.8），視覺軌道移入內層 span；補 focus-visible ring（WCAG 2.4.7）。 */}
              <button
                type="button"
                role="switch"
                aria-checked={splashEnabled}
                aria-label={t('settings.splashScreen')}
                onClick={handleSplashToggle}
                className="shrink-0 h-11 w-14 -my-2.5 flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span
                  className="relative block w-11 h-6 rounded-full transition-colors duration-200"
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
                </span>
              </button>
            </div>
            <motion.button
              onClick={handleSplashPreview}
              whileHover={segmentedSwitch.item.whileHover}
              whileTap={segmentedSwitch.item.whileTap}
              transition={transitions.instant}
              className="w-full px-5 py-3.5 flex items-center justify-center gap-2 text-primary-on-surface hover:bg-primary/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset"
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
            <h2 className="text-2xs font-black uppercase tracking-[0.2em]">
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
            <p className="text-2xs mt-2 opacity-40 font-medium text-center">
              {t('settings.updateNote')}
            </p>
          </div>
        </section>

        {/* 資料管理區塊 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <ShieldAlert className="w-3.5 h-3.5" />
            <h2 className="text-2xs font-black uppercase tracking-[0.2em]">
              {t('settings.dataManagement')}
            </h2>
          </div>

          <div className="card overflow-hidden">
            {/* 入口統一（QA-I #7）：與主題工作室 sheet 同一「還原預設主題」語意＋二段確認。 */}
            <motion.button
              onClick={settingsResetConfirm.handlePress}
              disabled={!isLoaded}
              whileHover={segmentedSwitch.item.whileHover}
              whileTap={segmentedSwitch.item.whileTap}
              transition={transitions.instant}
              aria-live="polite"
              className="w-full px-5 py-4 flex items-center justify-between group disabled:opacity-50 hover:bg-destructive/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50 focus-visible:ring-inset"
              data-testid="settings-reset-theme"
            >
              <span className="text-xs font-black text-destructive uppercase tracking-widest">
                {settingsResetConfirm.isConfirming
                  ? t('settings.customThemeResetConfirm')
                  : t('settings.customThemeReset')}
              </span>
              <ShieldAlert className="w-4 h-4 text-destructive opacity-40 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          </div>
        </section>

        {/* 支援與資訊區塊 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <h2 className="text-2xs font-black uppercase tracking-[0.2em]">
              {t('settings.supportInfo')}
            </h2>
          </div>

          <div className="card overflow-hidden divide-y divide-border">
            <Link
              to="/faq/"
              className="w-full px-5 py-4 flex items-center justify-between group hover:bg-primary/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset"
            >
              <span className="text-sm font-medium">{t('settings.faq')}</span>
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              to="/guide/"
              className="w-full px-5 py-4 flex items-center justify-between group hover:bg-primary/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset"
            >
              <span className="text-sm font-medium">{t('settings.usageGuide')}</span>
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              to="/about/"
              className="w-full px-5 py-4 flex items-center justify-between group hover:bg-primary/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset"
            >
              <span className="text-sm font-medium">{t('settings.aboutUs')}</span>
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              to="/privacy/"
              className="w-full px-5 py-4 flex items-center justify-between group hover:bg-primary/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset"
            >
              <span className="text-sm font-medium">{t('settings.privacyPolicy')}</span>
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              to="/open-data/"
              className="w-full px-5 py-4 flex items-center justify-between group hover:bg-primary/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset"
            >
              <span className="text-sm font-medium">{t('settings.openDataApi')}</span>
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              to="/seo-tech/"
              className="w-full px-5 py-4 flex items-center justify-between group hover:bg-primary/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset"
            >
              <span className="text-sm font-medium">{t('settings.seoTech')}</span>
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              to="/open-source/"
              className="w-full px-5 py-4 flex items-center justify-between group hover:bg-primary/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset"
            >
              <span className="text-sm font-medium">{t('settings.openSource')}</span>
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </section>

        {/* 版本資訊 */}
        <footer className="text-center mt-8 pb-4">
          <p className="text-2xs opacity-40">{t('settings.copyright')}</p>
          <p className="text-xs font-mono opacity-60 mt-1">{getDisplayVersion()}</p>
        </footer>
      </div>
    </div>
  );
}
