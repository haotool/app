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

// 實際偵測 localStorage 是否可寫：私密模式或嵌入式瀏覽器中 window 存在但
// setItem 會丟錯，僅檢查 window 會讓 i18next caches:['localStorage'] 寫入失敗。
const canUseBrowserLanguageStorage = (() => {
  if (typeof window === 'undefined' || import.meta.env.MODE === 'test') return false;
  const probeKey = '__ratewise_ls_probe__';
  try {
    window.localStorage.setItem(probeKey, '1');
    return true;
  } catch {
    return false;
  } finally {
    // 清除探測 key 與可寫性判定解耦：即使 removeItem 丟錯也不影響 setItem 成功的結論
    try {
      window.localStorage.removeItem(probeKey);
    } catch {
      /* noop */
    }
  }
})();

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

// 在 init 之前捕捉已儲存的語言偏好：init 以固定 lng 啟動時，
// LanguageDetector caches 會立即把 zh-TW 寫回 localStorage，覆寫使用者原偏好。
const storedLanguagePreference = (() => {
  if (!canUseBrowserLanguageStorage) return null;
  try {
    return window.localStorage.getItem('ratewise-language');
  } catch {
    return null;
  }
})();

/**
 * 取得 hydration 後應套用的語言偏好
 *
 * 對齊原 LanguageDetector 順序（localStorage → htmlTag）：
 * 有儲存偏好用偏好，否則以 index.html 的 lang（zh-TW）為準。
 */
export function getPreferredLanguage(): SupportedLanguage {
  if (storedLanguagePreference) return normalizeLanguage(storedLanguagePreference);
  if (typeof document !== 'undefined') return normalizeLanguage(document.documentElement.lang);
  return 'zh-TW';
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // 固定初始語言為 zh-TW：SSG（Node 全域 navigator.language 為 en-US）與 client
    // 首屏必須渲染同一語言，否則頁面層文字 mismatch 觸發 React #418。
    // hydration 完成後由 LanguagePreferenceSync 呼叫 changeLanguage() 重新偵測偏好。
    // @reference [context7:/websites/i18next:lng-overrides-detection:2026-07-05]
    lng: 'zh-TW',
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
      order: canUseBrowserLanguageStorage
        ? ['localStorage', 'htmlTag', 'navigator']
        : ['htmlTag', 'navigator'],
      caches: canUseBrowserLanguageStorage ? ['localStorage'] : [],
      lookupLocalStorage: 'ratewise-language',
    },
    react: {
      useSuspense: false,
    },
  });

// 語言變更時同步 <html lang>：SSG 模板固定 zh-TW，client 切換語言後
// documentElement.lang 必須跟上（無障礙與 SEO 一致性；涵蓋 #594 第 3 項的 lang 面）。
// SSG（Node）無 document，僅 client 註冊。
if (typeof document !== 'undefined') {
  i18n.on('languageChanged', () => {
    document.documentElement.lang = getResolvedLanguage();
  });
  // init 已於 listener 註冊前完成語言設定，需補一次初始同步。
  document.documentElement.lang = getResolvedLanguage();
}

export default i18n;
