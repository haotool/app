/**
 * ThemeToggle Component - 主題切換器
 *
 * @file ThemeToggle.tsx
 * @description 提供淺色/深色主題切換功能
 *
 * @features
 * - 視覺化當前主題狀態
 * - 一鍵切換淺色/深色模式
 * - 使用 Design Token 樣式（自動適應主題）
 * - 無障礙支援（ARIA labels）
 *
 * @usage
 * ```tsx
 * import { ThemeToggle } from './components/ThemeToggle';
 *
 * function App() {
 *   return (
 *     <header>
 *       <ThemeToggle />
 *     </header>
 *   );
 * }
 * ```
 *
 * @created 2026-01-13
 * @version 1.0.0
 */

import { useTheme } from '../hooks/useTheme';
import { Moon, Sun } from 'lucide-react';

/**
 * ThemeToggle 組件
 *
 * @returns {JSX.Element} 主題切換按鈕
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="
        group relative
        flex items-center gap-2
        px-4 py-2 rounded-lg
        bg-neutral-light text-neutral-text
        hover:bg-neutral active:bg-neutral-dark
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2
      "
      aria-label={`切換為${theme === 'light' ? '深色' : '淺色'}主題`}
      title={`切換為${theme === 'light' ? '深色' : '淺色'}主題`}
    >
      {/* 圖標容器 - 帶動畫 */}
      <div className="relative w-5 h-5">
        {/* 太陽圖標（淺色模式） */}
        <Sun
          className={`
            absolute inset-0
            text-primary
            transition-all duration-300
            ${theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'}
          `}
          size={20}
          aria-hidden="true"
        />

        {/* 月亮圖標（深色模式） */}
        <Moon
          className={`
            absolute inset-0
            text-primary
            transition-all duration-300
            ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}
          `}
          size={20}
          aria-hidden="true"
        />
      </div>

      {/* 主題標籤 */}
      <span className="text-sm font-medium">{theme === 'light' ? '淺色' : '深色'}</span>

      {/* Hover 提示 */}
      <div
        className="
          absolute -top-10 left-1/2 -translate-x-1/2
          px-2 py-1 rounded
          bg-neutral-text text-neutral-light
          text-xs whitespace-nowrap
          opacity-0 group-hover:opacity-100
          pointer-events-none
          transition-opacity duration-200
        "
        aria-hidden="true"
      >
        點擊切換主題
      </div>
    </button>
  );
}

/**
 * ThemeToggleCompact - 緊湊版主題切換器
 *
 * @description 僅顯示圖標的精簡版本，適合空間有限的場景
 *
 * @returns {JSX.Element} 緊湊版主題切換按鈕
 */
export function ThemeToggleCompact() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="
        group relative
        p-2 rounded-lg
        bg-neutral-light text-primary
        hover:bg-neutral active:bg-neutral-dark
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2
      "
      aria-label={`切換為${theme === 'light' ? '深色' : '淺色'}主題`}
      title={`當前：${theme === 'light' ? '淺色' : '深色'}模式`}
    >
      <div className="relative w-5 h-5">
        <Sun
          className={`
            absolute inset-0
            transition-all duration-300
            ${theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'}
          `}
          size={20}
          aria-hidden="true"
        />

        <Moon
          className={`
            absolute inset-0
            transition-all duration-300
            ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}
          `}
          size={20}
          aria-hidden="true"
        />
      </div>
    </button>
  );
}
