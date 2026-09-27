/**
 * v3 公開切換 SSOT（expand–contract），RateWise 與 split-meow 共用；零依賴以便 v2 資料管線匯入。
 * false 時各 App 不讀取 v3 current、站台生成器不宣告 v3。data workflow 的
 * RATEWISE_FX_V3_ENABLED 只控制 data branch 產出；S4 先開 data gate 驗證，再以一行 PR 改為 true。
 */
export const FX_V3_PUBLIC = false as boolean;
