/**
 * LanguagePreferenceSync — hydration-safe 語言偏好切換
 *
 * i18n 以 lng: 'zh-TW' 固定初始語言，確保 SSG 輸出與 client 首屏一致（消除 #418）。
 * useEffect 在 hydration commit 後執行，此時才切換到 init 前捕捉的使用者偏好。
 *
 * @reference [context7:/websites/i18next:changeLanguage:2026-07-05]
 */

import { useEffect } from 'react';
import i18n, { getPreferredLanguage } from '../i18n';

export function LanguagePreferenceSync() {
  useEffect(() => {
    const preferred = getPreferredLanguage();
    if (preferred !== i18n.resolvedLanguage) {
      void i18n.changeLanguage(preferred);
    }
  }, []);

  return null;
}
