import type { Page } from '@playwright/test';

/**
 * IndexedDB 無既有設定時，Home.tsx 會把 i18n 語言設為
 * DEFAULT_SETTINGS.language（zh-TW），因此文字斷言統一採用繁體中文，
 * 對應 src/services/i18n.ts 的 zh-TW 翻譯（不受瀏覽器語系影響）。
 */
export const TEXT = {
  platePlaceholder: '車牌號碼',
  tabSettings: '設定',
  manualEntry: '手動記錄（不拍照）',
} as const;

/**
 * 底部 + FAB 已於 issue #753 移除（首屏現代化：主動作唯一化）；
 * 其「開啟 QuickEntry 空照片模式」職能遷移至第三級文字動作「手動記錄（不拍照）」，
 * 以 getByRole 定位可翻譯 button，避免依賴會隨版本改動的 class 名稱。
 */
export function getManualEntryTrigger(page: Page) {
  return page.getByRole('button', { name: TEXT.manualEntry });
}

/**
 * 1x1 透明 PNG（base64），以 buffer 直接注入 setInputFiles，
 * 避免實體圖片檔被 repo 根 .gitignore 的全域 `*.png` 規則排除。
 */
export const TEST_PHOTO_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
