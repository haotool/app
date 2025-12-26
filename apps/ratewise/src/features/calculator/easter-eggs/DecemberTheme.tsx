/**
 * December Theme - Main Container Component
 * @file DecemberTheme.tsx
 * @description 12 月聖誕主題主容器組件
 *
 * 功能：
 * - 整合下雪場景、互動式聖誕樹
 * - 透過聖誕樹長按關閉動畫
 * - SSR 安全
 * - 尊重 prefers-reduced-motion
 *
 * 最佳實踐：
 * - 移除獨立開關按鈕，整合到聖誕樹互動中
 * - 點擊聖誕樹提示「長按可以關閉動畫」
 */

import { useDecemberTheme } from '../../../hooks/useDecemberTheme';
import { DecemberSnowScene } from './DecemberSnowScene';
import { MiniChristmasTree } from './MiniChristmasTree';
import './styles/december-theme.css';

/**
 * 12 月聖誕主題主容器組件
 * @description 整合所有 12 月常駐的聖誕裝飾效果
 */
export function DecemberTheme() {
  const { showAnimations, toggleTheme, currentYear, isDecember } = useDecemberTheme();

  // 非 12 月時不渲染任何內容
  if (!isDecember) {
    return null;
  }

  return (
    <>
      {/* 下雪場景 - 僅在動畫啟用時顯示 */}
      {showAnimations && <DecemberSnowScene />}

      {/* 互動式迷你聖誕樹 - 僅在動畫啟用時顯示 */}
      {/* 點擊提示「長按可以關閉動畫」，長按 1 秒關閉 */}
      {showAnimations && <MiniChristmasTree year={currentYear} onClose={toggleTheme} />}
    </>
  );
}

// 預設導出以支援 React.lazy 動態載入
export default DecemberTheme;
