/**
 * v3 公開切換 SSOT（expand–contract），RateWise 與 split-meow 共用；零依賴以便 v2 資料管線匯入。
 * false 時各 App 不讀取 v3 current、站台生成器不宣告 v3。data workflow 的
 * RATEWISE_FX_V3_ENABLED 只控制 data branch 產出；S4 先開 data gate 驗證，再以一行 PR 改為 true。
 */
export const FX_V3_PUBLIC = true;

/**
 * vite define 注入的建置期字面常數（值取自 FX_V3_PUBLIC；型別宣告只在此處）。
 * rolldown 不做跨模組常數折疊，只有字面值能讓 tree-shaking 移除 v3 分支與其匯入。
 */
declare const __FX_V3_PUBLIC_BUILD__: boolean | undefined;

/**
 * App 程式碼的 v3 閘門：建置時為字面常數（可消除死碼）；無 define 的環境（vitest、Node 腳本）
 * 以 typeof 守護避免 ReferenceError，並回落至可 mock 的 FX_V3_PUBLIC。
 */
export function isFxV3Public(): boolean {
  return typeof __FX_V3_PUBLIC_BUILD__ !== 'undefined' ? __FX_V3_PUBLIC_BUILD__ : FX_V3_PUBLIC;
}
