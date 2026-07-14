/**
 * Root-scope SW 導覽 fallback 清單 SSOT（046 §5 防護）。
 * vite.config.ts（Workbox navigateFallback allow/denylist）與行為測試共用單一來源；
 * 本模組必須保持零依賴，確保 vite config 載入安全。
 */

/** haotool 自身路由：只有這些 path 允許 SW navigate fallback 至 index.html。 */
// 型別維持 RegExp[]（非 readonly）：Workbox navigateFallback 選項要求可變陣列。
export const HAOTOOL_NAVIGATE_FALLBACK_ALLOWLIST: RegExp[] = [
  /^\/$/,
  /^\/tools(?:\/.*)?$/,
  /^\/about(?:\/.*)?$/,
  /^\/contact(?:\/.*)?$/,
];

/** 同網域 sibling apps：明確排除，避免 root SW 劫持子 app 路徑。 */
export const SIBLING_APP_DENYLIST: RegExp[] = [
  /^\/ratewise(?:\/.*)?$/,
  /^\/nihonname(?:\/.*)?$/,
  /^\/park-keeper(?:\/.*)?$/,
  /^\/quake-school(?:\/.*)?$/,
  /^\/split-meow(?:\/.*)?$/,
  /^\/starpuff(?:\/.*)?$/,
];
