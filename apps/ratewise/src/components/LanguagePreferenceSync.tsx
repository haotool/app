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

// 模組級單次旗標：每次 page load 只同步一次。
// 本元件掛於 AppLayout 與 Layout 兩個佈局，跨佈局 SPA 導覽會 remount effect；
// 若每次 remount 都重放 init 前捕捉的偏好，session 內手動切換的語言會被回滾（#595 審查 B1）。
let hasSyncedPreference = false;

export function LanguagePreferenceSync() {
  useEffect(() => {
    if (hasSyncedPreference) return;
    hasSyncedPreference = true;

    const preferred = getPreferredLanguage();
    if (preferred !== i18n.resolvedLanguage) {
      void i18n.changeLanguage(preferred);
    }
  }, []);

  return null;
}

// 測試專用：重置單次同步旗標，模擬新的 page load。
// eslint-disable-next-line react-refresh/only-export-components
export function resetLanguagePreferenceSyncForTests() {
  hasSyncedPreference = false;
}
