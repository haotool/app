/**
 * i18n Configuration
 *
 * @description 國際化配置，支援繁體中文、英文、日文
 * @reference [context7:/i18next/react-i18next]
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en';
import zhTW from './locales/zh-TW';
import ja from './locales/ja';

export const SUPPORTED_LANGUAGES = ['zh-TW', 'en', 'ja'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_OPTIONS: { value: SupportedLanguage; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
];

const resources = {
  en: { translation: en },
  'zh-TW': { translation: zhTW },
  ja: { translation: ja },
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh-TW',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'ratewise-language',
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
