/**
 * December Theme - Main Container Component
 * @file DecemberTheme.tsx
 * @description 12 月聖誕主題主容器組件
 *
 * 功能：
 * - 整合下雪場景、互動式聖誕樹
 * - 提供主題開關控制
 * - SSR 安全
 * - 尊重 prefers-reduced-motion
 */

import { useDecemberTheme } from '../../../hooks/useDecemberTheme';
import { DecemberSnowScene } from './DecemberSnowScene';
import { MiniChristmasTree } from './MiniChristmasTree';
import './styles/december-theme.css';

/**
 * December Theme Props
 */
export interface DecemberThemeProps {
  /** 是否顯示開關按鈕（預設 true） */
  showToggle?: boolean;
}

/**
 * 12 月聖誕主題主容器組件
 * @description 整合所有 12 月常駐的聖誕裝飾效果
 */
export function DecemberTheme({ showToggle = true }: DecemberThemeProps) {
  const { showAnimations, isDisabledByUser, toggleTheme, currentYear, isDecember } =
    useDecemberTheme();

  // 非 12 月時不渲染任何內容
  if (!isDecember) {
    return null;
  }

  return (
    <>
      {/* 下雪場景 - 僅在動畫啟用時顯示 */}
      {showAnimations && <DecemberSnowScene />}

      {/* 互動式迷你聖誕樹 - 僅在動畫啟用時顯示 */}
      {showAnimations && <MiniChristmasTree year={currentYear} />}

      {/* 主題開關按鈕 */}
      {showToggle && (
        <button
          className="december-theme-toggle"
          onClick={toggleTheme}
          aria-label={isDisabledByUser ? '啟用聖誕主題' : '關閉聖誕主題'}
          title={isDisabledByUser ? '點擊啟用聖誕主題' : '點擊關閉聖誕主題'}
        >
          {isDisabledByUser ? '🎄 啟用聖誕' : '❄️ 關閉動畫'}
        </button>
      )}
    </>
  );
}

// 預設導出以支援 React.lazy 動態載入
export default DecemberTheme;
