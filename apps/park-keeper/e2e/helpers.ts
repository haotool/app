import type { Page } from '@playwright/test';

/**
 * IndexedDB 無既有設定時，Home.tsx 會把 i18n 語言設為
 * DEFAULT_SETTINGS.language（zh-TW），因此文字斷言統一採用繁體中文，
 * 對應 src/services/i18n.ts 的 zh-TW 翻譯（不受瀏覽器語系影響）。
 */
export const TEXT = {
  platePlaceholder: '車牌號碼',
  tabSettings: '設定',
} as const;

/**
 * FAB（快速記錄按鈕）目前沒有 aria-label（issue #717 待補），
 * 以「底部導覽列中唯一沒有 aria-label 的 button」定位，
 * 避免依賴會隨版本改動的 class 名稱。
 */
export function getFab(page: Page) {
  return page.locator('nav button:not([aria-label])');
}

/**
 * 1x1 透明 PNG（base64），以 buffer 直接注入 setInputFiles，
 * 避免實體圖片檔被 repo 根 .gitignore 的全域 `*.png` 規則排除。
 */
export const TEST_PHOTO_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
