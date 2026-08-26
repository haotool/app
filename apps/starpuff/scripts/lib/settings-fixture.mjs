// 驗證腳本偏好前置／判定 SSOT（#872）：T7-A 後偏好收斂於 sp-settings 單鍵，
// legacy 散鍵（sp-muted/sp-rotation/sp-key-layout）於 migration 落盤成功後即被刪除，
// 腳本再以 legacy 鍵判定會恆為 FAIL。欄位對齊 src/game/core/settings.ts。
// 例外：專測 migration 的腳本（v16-legacy-qa/v16-d1、v14-e 場景一）仍以 legacy 鍵作輸入。

export const SETTINGS_KEY = 'sp-settings';
export const SETTINGS_SCHEMA_VERSION = 2;

// 前置偏好 JSON：parseSettings 要求 schemaVersion 完全相符，其餘欄位缺席回預設。
export function settingsFixture(patch) {
  return JSON.stringify({ schemaVersion: SETTINGS_SCHEMA_VERSION, ...patch });
}

// 供 page.evaluate 使用的讀取器（以 key 作參數傳入，避免序列化外部綁定）。
export function readSetting(page, field) {
  return page.evaluate(
    ([key, name]) => {
      try {
        return JSON.parse(localStorage.getItem(key) ?? '{}')[name];
      } catch {
        return undefined;
      }
    },
    [SETTINGS_KEY, field],
  );
}
