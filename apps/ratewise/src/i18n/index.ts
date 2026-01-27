/**
 * i18n Configuration
 *
 * 國際化配置，支援繁體中文、英文、日文
 *
 * 語系正規化策略：
 * - supportedLngs: 明確列出支援的語系代碼
 * - nonExplicitSupportedLngs: 允許 zh-Hant/zh-TW/zh 等變體映射到 zh-TW
 * - load: 'languageOnly' 配合 fallbackLng 確保 zh-Hant → zh-TW
 *
 * 使用 resolvedLanguage 而非 language：
 * - i18n.language 可能回傳原始偵測值（如 zh-Hant）
 * - i18n.resolvedLanguage 回傳實際載入的語系（如 zh-TW）
 *
 * @reference [context7:/websites/i18next:resolvedLanguage:2026-01-27]
 * @reference [context7:/websites/i18next:nonExplicitSupportedLngs:2026-01-27]
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

/**
 * i18next resources 配置
 *
 * 重要：zh-Hant 必須映射到 zh-TW 翻譯
 * 因為 index.html 的 lang="zh-Hant"，當 localStorage 無值時，
 * LanguageDetector 會從 htmlTag 偵測到 zh-Hant
 *
 * @reference [context7:/websites/i18next:fallback:2026-01-27]
 */
const resources = {
  en: { translation: en },
  'zh-TW': { translation: zhTW },
  'zh-Hant': { translation: zhTW }, // 映射 zh-Hant → zh-TW 翻譯
  ja: { translation: ja },
};

/**
 * 正規化語系代碼
 *
 * 將各種中文語系變體統一映射到 zh-TW：
 * - zh-Hant (BCP 47 繁體中文通用標籤)
 * - zh-Hant-TW (台灣繁體中文)
 * - zh-TW (台灣中文)
 * - zh (通用中文)
 *
 * @param lng - 原始語系代碼
 * @returns 正規化後的語系代碼（zh-TW | en | ja）
 */
export function normalizeLanguage(lng: string | undefined): SupportedLanguage {
  if (!lng) return 'zh-TW';

  // 中文變體正規化（zh-Hant, zh-Hant-TW, zh-TW, zh → zh-TW）
  if (lng.startsWith('zh')) {
    return 'zh-TW';
  }

  // 日文變體正規化（ja-JP → ja）
  if (lng.startsWith('ja')) {
    return 'ja';
  }

  // 英文變體正規化（en-US, en-GB → en）
  if (lng.startsWith('en')) {
    return 'en';
  }

  // 未知語系 fallback 到預設值
  return 'zh-TW';
}

/**
 * 取得當前解析後的語系
 *
 * 優先使用 resolvedLanguage（實際載入的語系），
 * 若不可用則透過 normalizeLanguage 正規化 language。
 *
 * @returns 正規化後的語系代碼
 */
export function getResolvedLanguage(): SupportedLanguage {
  // resolvedLanguage 是 i18next v21+ 推薦的 API
  // 它會回傳實際載入翻譯檔的語系，而非原始偵測值
  const resolved = i18n.resolvedLanguage;
  if (resolved && SUPPORTED_LANGUAGES.includes(resolved as SupportedLanguage)) {
    return resolved as SupportedLanguage;
  }

  // Fallback: 正規化 language 屬性
  return normalizeLanguage(i18n.language);
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // 明確列出所有支援的語系代碼（包含 zh-Hant 因為 index.html lang="zh-Hant"）
    supportedLngs: ['zh-TW', 'zh-Hant', 'en', 'ja'],
    // 語系 fallback 配置：zh-Hant → zh-TW
    fallbackLng: {
      'zh-Hant': ['zh-TW'],
      zh: ['zh-TW'],
      default: ['zh-TW'],
    },
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'htmlTag', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'ratewise-language',
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
