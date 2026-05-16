/**
 * i18n Configuration
 *
 * 國際化配置，支援繁體中文、英文、日文、韓文
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
import ko from './locales/ko';

export const SUPPORTED_LANGUAGES = ['zh-TW', 'en', 'ja', 'ko'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'zh-TW';
export const LANGUAGE_STORAGE_KEY = 'ratewise-language';

export const LANGUAGE_OPTIONS: { value: SupportedLanguage; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
  { value: 'ko', label: '한국어', flag: '🇰🇷' },
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
  ko: { translation: ko },
};

const canUseDOMLanguageDetection = typeof window !== 'undefined';
const canUseBrowserLanguageStorage = canUseDOMLanguageDetection && import.meta.env.MODE !== 'test';

export function getLanguageDetectionOrder(
  hasDOM = canUseDOMLanguageDetection,
  canUseStorage = canUseBrowserLanguageStorage,
): string[] {
  if (!hasDOM) {
    return [];
  }

  return canUseStorage ? ['localStorage', 'htmlTag', 'navigator'] : ['htmlTag', 'navigator'];
}

export function getInitialLanguage(): SupportedLanguage {
  return DEFAULT_LANGUAGE;
}

const initialLanguage = getInitialLanguage();

export function getPreferredClientLanguage({
  storageLanguage,
  htmlLanguage,
  navigatorLanguage,
}: {
  storageLanguage?: string | null;
  htmlLanguage?: string | null;
  navigatorLanguage?: string | null;
}): SupportedLanguage {
  const candidate =
    storageLanguage?.trim() ||
    htmlLanguage?.trim() ||
    navigatorLanguage?.trim() ||
    DEFAULT_LANGUAGE;

  return normalizeLanguage(candidate);
}

export function resolveClientPreferredLanguage(): SupportedLanguage {
  if (!canUseDOMLanguageDetection) {
    return DEFAULT_LANGUAGE;
  }

  let storageLanguage: string | null = null;
  try {
    storageLanguage = window.localStorage?.getItem(LANGUAGE_STORAGE_KEY) ?? null;
  } catch {
    storageLanguage = null;
  }

  const htmlLanguage = document.documentElement.lang;
  const navigatorLanguage = navigator.languages?.[0] ?? navigator.language;

  return getPreferredClientLanguage({ storageLanguage, htmlLanguage, navigatorLanguage });
}

export function persistLanguagePreference(language: SupportedLanguage): void {
  if (!canUseDOMLanguageDetection || import.meta.env.MODE === 'test') {
    return;
  }

  try {
    window.localStorage?.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Storage may be blocked in private or embedded contexts; language still changes in memory.
  }
}

export function syncClientLanguagePreference(): void {
  if (!canUseDOMLanguageDetection || import.meta.env.MODE === 'test') {
    return;
  }

  const preferredLanguage = resolveClientPreferredLanguage();
  if (preferredLanguage !== getResolvedLanguage()) {
    void i18n.changeLanguage(preferredLanguage);
  }
}

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
 * @returns 正規化後的語系代碼（zh-TW | en | ja | ko）
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

  // 韓文變體正規化（ko-KR → ko）
  if (lng.startsWith('ko')) {
    return 'ko';
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
    lng: initialLanguage,
    // 明確列出所有支援的語系代碼（包含 zh-Hant 因為 index.html lang="zh-Hant"）
    supportedLngs: ['zh-TW', 'zh-Hant', 'en', 'ja', 'ko'],
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
      order: getLanguageDetectionOrder(),
      // Avoid overwriting a stored user preference during the zh-TW hydration pass.
      // Settings persists explicit language changes via persistLanguagePreference().
      caches: [],
      lookupLocalStorage: 'ratewise-language',
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
