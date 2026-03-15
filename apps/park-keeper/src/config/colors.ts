/**
 * colors.ts — 語意色彩常數 SSOT
 *
 * 所有在元件中使用的語意顏色（非主題系統的 theme.colors）
 * 必須在此統一定義，避免同一色彩硬編碼散落多處。
 *
 * rgba 衍生常數由基底 hex 手動對齊；若修改基底色，衍生值必須同步更新。
 */

// ---------------------------------------------------------------------------
// 基底語意色（6 位 hex）
// ---------------------------------------------------------------------------

/** 北方向指針色（紅）。用於羅盤 N 標籤、刻度、PhoneFlatRing。 */
export const NORTH_COLOR = '#ef4444';

/** 抵達狀態色（綠）。用於 Check icon、CTA 按鈕、外圈高亮。 */
export const ARRIVED_COLOR = '#22c55e';

/** 警告狀態色（紅橙）。用於手機平放提示、GPS 等待提示。等同 NORTH_COLOR，語意獨立以利未來分拆。 */
export const WARNING_COLOR = '#ef4444';

// ---------------------------------------------------------------------------
// rgba 衍生常數（動畫過渡與 SVG 半透明疊層）
// ---------------------------------------------------------------------------

/** 抵達狀態邊框色（α=0.55）。Hub border color when arrived。 */
export const ARRIVED_BORDER = 'rgba(34,197,94,0.55)';

/** 抵達狀態光暈色（α=0.10）。Hub box-shadow glow when arrived。 */
export const ARRIVED_GLOW = 'rgba(34,197,94,0.1)';

/** 警告狀態邊框色（α=0.45）。Hub border color when phone not flat。 */
export const WARNING_BORDER = 'rgba(239,68,68,0.45)';

/** 警告狀態光暈色（α=0.08）。Hub box-shadow glow when phone not flat。 */
export const WARNING_GLOW = 'rgba(239,68,68,0.08)';

/** PhoneFlatRing 虛線環筆畫色（α=0.50）。 */
export const WARNING_RING_STROKE = 'rgba(239,68,68,0.5)';

/** PhoneFlatRing 螢幕區域填色（α=0.18）。 */
export const WARNING_SCREEN_FILL = 'rgba(239,68,68,0.18)';

/** PhoneFlatRing 底部標籤文字色（α=0.85）。 */
export const WARNING_LABEL = 'rgba(239,68,68,0.85)';
