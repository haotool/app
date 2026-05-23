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
  type LucideIcon,
} from 'lucide-react';
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
import { appPageTokens } from '../config/design-tokens';
import type { RateMode } from '../features/ratewise/types';
import { useConverterStore } from '../stores/converterStore';

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
      <div className={appPageTokens.narrowShell}>
        {/* 介面風格區塊 */}
        <section className="mb-8">
          <div className={appPageTokens.section.headerRow}>
            <Palette className="h-3.5 w-3.5" />
            <h2 className={appPageTokens.section.headerText}>{t('settings.interfaceStyle')}</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {STYLE_OPTIONS.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => setStyle(option.value)}
                disabled={!isLoaded}
                whileHover={segmentedSwitch.item.whileHover}
                whileTap={segmentedSwitch.item.whileTap}
                transition={transitions.instant}
                className={`
                  relative p-3 h-20 flex flex-col justify-end overflow-hidden rounded-lg
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
                <motion.div
                  className="absolute top-0 right-0 w-16 h-16 opacity-15 -mr-4 -mt-4 rounded-full"
                  style={{ backgroundColor: option.previewAccent }}
                  animate={{
                    scale: style === option.value ? segmentedSwitch.activeIconScale : 1,
                  }}
                  transition={transitions.spring}
                />

                {style === option.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={transitions.spring}
                    className="absolute top-2 right-2 rounded-full p-0.5"
                    style={{ backgroundColor: option.previewAccent }}
                  >
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </motion.div>
                )}

                <div className="flex flex-col items-start w-full relative z-10">
                  <span className="font-bold text-sm leading-tight">
                    {t(`styles.${option.value}` as Parameters<typeof t>[0])}
                  </span>
                  <span className="text-xs font-medium leading-tight">
                    {t(`styles.${option.value}Desc` as Parameters<typeof t>[0])}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* 語言區塊 */}
        <section className={appPageTokens.section.wrapper}>
          <div className={appPageTokens.section.headerRow}>
            <Globe className="h-3.5 w-3.5" />
            <h2 className={appPageTokens.section.headerText}>{t('settings.language')}</h2>
          </div>

          <div className={segmentedSwitch.containerClass}>
            {LANGUAGE_OPTIONS.map((option) => {
              const isActive = currentLanguage === option.value;
              return (
                <motion.button
                  key={option.value}
                  type="button"
                  onClick={() => handleLanguageChange(option.value)}
                  whileHover={{ ...segmentedSwitch.item.whileHover, opacity: 1 }}
                  whileTap={segmentedSwitch.item.whileTap}
                  animate={{ opacity: isActive ? 1 : segmentedSwitch.inactiveOpacity }}
                  transition={transitions.default}
                  className={`${segmentedSwitch.itemBaseClass} flex-col`}
                  aria-pressed={isActive}
                  aria-label={option.label}
                >
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
                  <span className="text-xs font-bold">{option.label}</span>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* 匯率模式區塊 */}
        <section className={appPageTokens.section.wrapper}>
          <div className={appPageTokens.section.headerRow}>
            <TrendingUp className="h-3.5 w-3.5" />
            <h2 className={appPageTokens.section.headerText}>{t('settings.rateMode')}</h2>
          </div>

          <div className={segmentedSwitch.containerClass}>
            {RATE_MODE_OPTIONS.map((option) => {
              const isActive = rateMode === option.value;
              return (
                <motion.button
                  key={option.value}
                  type="button"
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
                  <span className="relative z-10 text-xs font-bold">
                    {t(option.labelKey as Parameters<typeof t>[0])}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <p className="mt-3 px-1 text-xs leading-relaxed font-medium text-center text-text-muted">
            {t(
              RATE_MODE_OPTIONS.find((option) => option.value === rateMode)?.descKey as Parameters<
                typeof t
              >[0],
            )}
          </p>
        </section>

        {/* 儲存與快取區塊 */}
        <section className={appPageTokens.section.wrapper}>
          <div className={appPageTokens.section.headerRow}>
            <Database className="h-3.5 w-3.5" />
            <h2 className={appPageTokens.section.headerText}>{t('settings.storageCache')}</h2>
          </div>

          <div className={appPageTokens.infoCard}>
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
            <p className="text-xs mt-2 font-medium text-center text-text-muted">
              {t('settings.updateNote')}
            </p>
          </div>
        </section>

        {/* 資料管理區塊 */}
        <section className={appPageTokens.section.wrapper}>
          <div className={appPageTokens.section.headerRow}>
            <ShieldAlert className="h-3.5 w-3.5" />
            <h2 className={appPageTokens.section.headerText}>{t('settings.dataManagement')}</h2>
          </div>

          <div className={appPageTokens.listCard}>
            <motion.button
              type="button"
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
        <section className={appPageTokens.section.wrapper}>
          <div className={appPageTokens.section.headerRow}>
            <HelpCircle className="h-3.5 w-3.5" />
            <h2 className={appPageTokens.section.headerText}>{t('settings.supportInfo')}</h2>
          </div>

          <div className={`${appPageTokens.listCard} divide-y divide-border/50`}>
            <Link to="/faq/" className={appPageTokens.linkRow}>
              <span className="text-sm font-medium">{t('settings.faq')}</span>
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link to="/guide/" className={appPageTokens.linkRow}>
              <span className="text-sm font-medium">{t('settings.usageGuide')}</span>
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link to="/about/" className={appPageTokens.linkRow}>
              <span className="text-sm font-medium">{t('settings.aboutUs')}</span>
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link to="/privacy/" className={appPageTokens.linkRow}>
              <span className="text-sm font-medium">{t('settings.privacyPolicy')}</span>
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link to="/open-data/" className={appPageTokens.linkRow}>
              <span className="text-sm font-medium">{t('settings.openDataApi')}</span>
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link to="/seo-tech/" className={appPageTokens.linkRow}>
              <span className="text-sm font-medium">{t('settings.seoTech')}</span>
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
            <a
              href={APP_INFO.github}
              target="_blank"
              rel="noopener noreferrer"
              className={appPageTokens.linkRow}
            >
              <span className="text-sm font-medium">{t('settings.openSource')}</span>
              <ExternalLink className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </section>

        {/* 關於區塊 */}
        <section className={appPageTokens.section.wrapper}>
          <div className={appPageTokens.infoCard}>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="opacity-60">{t('settings.appVersion')}</span>
                <span className="font-bold font-mono">{getDisplayVersion()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-60">{t('settings.designSystem')}</span>
                <span className="font-bold">{t('settings.sixStylesSST')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-60">{t('settings.techStack')}</span>
                <span className="font-bold">{t('settings.reactTailwind')}</span>
              </div>
            </div>

            <div className="mt-4 border-t border-border/50 pt-4">
              <p className="text-xs text-center font-medium text-text-muted">
                {t('settings.copyright')}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
