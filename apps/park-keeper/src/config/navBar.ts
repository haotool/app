/**
 * navBar.ts — 底部導覽列設計代幣 SSOT
 *
 * 所有與底部導覽列相關的尺寸、間距、動畫參數必須在此定義。
 * 元件直接引用，禁止在元件內硬編碼數字或 class 字串。
 *
 * 高度架構（重要）：
 *   <nav>
 *     <div h=NAV_CONTENT_H>  ← 可見內容（固定 56px，與 safe area 無關）
 *     <div pb-safe-bottom />  ← safe area spacer（獨立，避免吃掉內容高度）
 *   </nav>
 *
 * 參考規範：
 *   - iOS HIG Tab Bar: 49pt 可見高度 + safe-area-inset-bottom
 *   - Material Design 3 Navigation Bar: 56dp 可見高度
 */

// ---------------------------------------------------------------------------
// 高度
// ---------------------------------------------------------------------------

/** 可見內容區高度 class（不含 safe-area-inset-bottom）。 */
export const NAV_CONTENT_H = 'h-14'; // 56px — 業界標準

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

/** Icon 尺寸（px）。傳入 Lucide `size` prop。 */
export const NAV_ICON_SIZE = 22;

/** Icon strokeWidth（active 狀態）。 */
export const NAV_ICON_STROKE_ACTIVE = 2.5;

/** Icon strokeWidth（inactive 狀態）。 */
export const NAV_ICON_STROKE_INACTIVE = 2;

// ---------------------------------------------------------------------------
// Active Indicator
// ---------------------------------------------------------------------------

/**
 * Active indicator Tailwind class。
 * 位置：頂部（top-0）；尺寸：32px × 3px；圓角向下。
 * 業界標準：2–3px，iOS / Android 均適用。
 */
export const NAV_INDICATOR_CLS = 'absolute top-0 w-8 h-[3px] rounded-b-full' as const;

// ---------------------------------------------------------------------------
// Framer Motion
// ---------------------------------------------------------------------------

/** Indicator 共享 layoutId（不可重複使用於其他元素）。 */
export const NAV_INDICATOR_LAYOUT_ID = 'nav-indicator' as const;

/** Indicator 切換動畫參數。 */
export const NAV_INDICATOR_TRANSITION = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
} as const;

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

/** Tab 文字標籤 Tailwind class（active / inactive 共用基底）。 */
export const NAV_LABEL_BASE_CLS =
  'text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300' as const;

/** Tab 文字標籤 inactive 附加 class。 */
export const NAV_LABEL_INACTIVE_CLS = 'opacity-30' as const;
