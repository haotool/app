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

import { Palette, Globe, Database, ShieldAlert, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { useAppTheme } from '../hooks/useAppTheme';
import { STYLE_OPTIONS } from '../config/themes';
import { LANGUAGE_OPTIONS, getResolvedLanguage, type SupportedLanguage } from '../i18n';
import { getDisplayVersion } from '../config/version';
import { transitions, segmentedSwitch } from '../config/animations';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { style, setStyle, resetTheme, isLoaded } = useAppTheme();

  // 使用正規化後的語系（zh-Hant → zh-TW）
  // @see i18n/index.ts - getResolvedLanguage()
  const currentLanguage = getResolvedLanguage();

  const handleLanguageChange = (lang: SupportedLanguage) => {
    void i18n.changeLanguage(lang);
  };

  return (
    <div className="min-h-full">
      <div className="px-3 sm:px-5 py-6 max-w-md mx-auto">
        {/* 介面風格區塊 */}
        <section className="mb-8">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <Palette className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">
              {t('settings.interfaceStyle')}
            </h3>
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
                aria-label={`${option.label} - ${option.description}`}
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
                  <span className="font-bold text-sm leading-tight">{option.label}</span>
                  <span className="text-[10px] opacity-60 leading-tight">{option.description}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* 語言區塊 - SSOT 風格 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <Globe className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">
              {t('settings.language')}
            </h3>
          </div>

          <div className={segmentedSwitch.containerClass}>
            {LANGUAGE_OPTIONS.map((option) => {
              const isActive = currentLanguage === option.value;
              return (
                <motion.button
                  key={option.value}
                  onClick={() => handleLanguageChange(option.value)}
                  whileHover={segmentedSwitch.item.whileHover}
                  whileTap={segmentedSwitch.item.whileTap}
                  className={`${segmentedSwitch.itemBaseClass} flex-col ${
                    isActive ? '' : 'opacity-60 hover:opacity-100'
                  }`}
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
                  >
                    {option.flag}
                  </motion.span>
                  <span className="text-[10px] font-bold">{option.label}</span>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* 儲存與快取區塊 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <Database className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">
              {t('settings.storageCache')}
            </h3>
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
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">
              {t('settings.dataManagement')}
            </h3>
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

        {/* 關於區塊 */}
        <section className="mb-6">
          <div className="card p-5">
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

            <div className="mt-4 pt-4 border-t border-black/5">
              <p className="text-[10px] opacity-40 text-center font-medium">
                {t('settings.copyright')}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
