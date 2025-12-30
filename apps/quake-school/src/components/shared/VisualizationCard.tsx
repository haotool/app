/**
 * 統一視覺化卡片容器組件
 *
 * 建立日期: 2025-12-30
 * 目的: 提供三段式結構（header/visualization/footer），消除過度嵌套
 * 使用方式: 所有視覺化組件的統一容器模式
 */

import React from 'react';
import { CARD_STYLES, type VisualizationHeight } from '../../styles/card-system';

export interface VisualizationCardProps {
  /**
   * Header 區塊內容
   * - 標題、副標題、控制按鈕、模式切換器
   */
  header: React.ReactNode;

  /**
   * Visualization 區塊內容
   * - SVG 視覺化內容
   * - 直接渲染，無額外嵌套容器
   */
  visualization: React.ReactNode;

  /**
   * Footer 區塊內容
   * - 資訊說明、互動控制（滑桿、按鈕）
   */
  footer: React.ReactNode;

  /**
   * 視覺化區域高度
   * - small: 48/56 (手機/平板)
   * - medium: 56/64 (預設)
   * - large: 64/80
   */
  visualizationHeight?: VisualizationHeight;

  /**
   * 額外的容器 className（用於特殊情況）
   */
  className?: string;
}

/**
 * 統一視覺化卡片容器
 *
 * **結構** (2-3 層):
 * ```
 * div.card (外層容器)
 *   ├─ header (標題區)
 *   ├─ section.visualization (視覺化區)
 *   │  └─ {children} (直接渲染 SVG)
 *   └─ footer (底部區)
 * ```
 *
 * **空間計算**:
 * - 手機端（375px）: 375 - 24 - 48 = 303px (81% 利用率)
 * - vs 舊版: 375 - 24 - 64 - 48 - 24 = 215px (57% 利用率)
 *
 * @example
 * ```tsx
 * <VisualizationCard
 *   header={<h4>標題</h4>}
 *   visualization={<svg>...</svg>}
 *   footer={<p>說明</p>}
 *   visualizationHeight="medium"
 * />
 * ```
 */
export const VisualizationCard: React.FC<VisualizationCardProps> = ({
  header,
  visualization,
  footer,
  visualizationHeight = 'medium',
  className = '',
}) => {
  return (
    <div className={`${CARD_STYLES.container} ${className}`}>
      {/* Header: 標題、控制按鈕、模式切換器 */}
      <div className={CARD_STYLES.header}>{header}</div>

      {/* Visualization: SVG 視覺化內容（直接渲染，無額外嵌套） */}
      <div className={`${CARD_STYLES.visualization} ${CARD_STYLES.height[visualizationHeight]}`}>
        {visualization}
      </div>

      {/* Footer: 資訊說明、互動控制 */}
      <div className={CARD_STYLES.footer}>{footer}</div>
    </div>
  );
};

export default VisualizationCard;
