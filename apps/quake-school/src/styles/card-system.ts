/**
 * Quake-School 統一卡片容器樣式系統
 *
 * 建立日期: 2025-12-30
 * 目的: 消除過度容器嵌套，提升空間利用率（53% → 81%）
 * 原則: Linus "好品味" - 消除特殊情況，統一結構
 */

/**
 * 統一卡片樣式常量
 *
 * 空間計算（375px 手機端）:
 * - 外層卡片: 375px (100%)
 * - 外層 padding: 12px × 2 = 24px (body margin)
 * - 內層 padding: 24px × 2 = 48px (p-6)
 * - 可用空間: 375 - 24 - 48 = 303px (81%)
 */
export const CARD_STYLES = {
  /**
   * 外層卡片容器
   * - 白色背景、大圓角、邊框、陰影
   * - overflow-hidden 確保內容不溢出
   */
  container:
    'w-full bg-white rounded-[2.5rem] border border-sky-100 shadow-xl shadow-sky-100/50 overflow-hidden',

  /**
   * Header 區塊樣式
   * - 標題、控制按鈕、模式切換器
   * - 響應式 padding: p-6 (手機) / sm:p-8 (平板+)
   */
  header: 'p-6 sm:p-8',

  /**
   * Visualization 區塊樣式
   * - SVG 視覺化內容區域
   * - 深色背景（bg-slate-950）突顯視覺效果
   * - flex 置中對齊，overflow-hidden 防止 SVG 溢出
   */
  visualization: 'relative bg-slate-950 flex items-center justify-center overflow-hidden',

  /**
   * Footer 區塊樣式
   * - 資訊說明、互動控制（滑桿、按鈕）
   * - space-y-5 提供垂直間距
   */
  footer: 'p-6 bg-white space-y-5',

  /**
   * 視覺化區域響應式高度
   * - small: 192px (手機) / 224px (平板+)
   * - medium: 224px (手機) / 256px (平板+) - 預設
   * - large: 256px (手機) / 320px (平板+)
   */
  height: {
    small: 'h-48 sm:h-56',
    medium: 'h-56 sm:h-64',
    large: 'h-64 sm:h-80',
  },

  /**
   * SVG 容器樣式（最多 2 層）
   * - outer: 充滿父容器
   * - inner: 充滿容器，overflow-visible 允許動畫超出邊界
   */
  svg: {
    outer: 'w-full h-full',
    inner: 'w-full h-full overflow-visible',
  },
} as const;

/**
 * 視覺化高度類型
 */
export type VisualizationHeight = keyof typeof CARD_STYLES.height;

/**
 * 使用範例:
 *
 * ```tsx
 * import { CARD_STYLES } from '@/styles/card-system';
 *
 * <div className={CARD_STYLES.container}>
 *   <div className={CARD_STYLES.header}>Header Content</div>
 *   <div className={`${CARD_STYLES.visualization} ${CARD_STYLES.height.medium}`}>
 *     <svg className={CARD_STYLES.svg.inner}>...</svg>
 *   </div>
 *   <div className={CARD_STYLES.footer}>Footer Content</div>
 * </div>
 * ```
 */
