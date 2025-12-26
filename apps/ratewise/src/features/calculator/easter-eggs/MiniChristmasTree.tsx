/**
 * Mini Christmas Tree - Interactive Component
 * @file MiniChristmasTree.tsx
 * @description 互動式迷你聖誕樹 - 12 月常駐裝飾
 *
 * 功能：
 * - 固定位置在左下角
 * - 點擊時提示「長按可以關閉動畫」
 * - 長按 1 秒關閉動畫
 * - hover 時有微妙的發光效果
 * - 尺寸：48x64px
 */

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import './styles/december-theme.css';

/**
 * Mini Christmas Tree Props
 */
export interface MiniChristmasTreeProps {
  /** 當前年份 */
  year: number;
  /** 自定義 className */
  className?: string;
  /** 關閉動畫回調 */
  onClose?: () => void;
}

/**
 * 互動式迷你聖誕樹組件
 */
export function MiniChristmasTree({
  year: _year,
  className = '',
  onClose,
}: MiniChristmasTreeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const longPressTimer = useRef<number | null>(null);

  // 點擊：顯示提示
  const handleClick = useCallback(() => {
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 2000);
  }, []);

  // 長按開始：啟動計時器
  const handlePressStart = useCallback(() => {
    longPressTimer.current = window.setTimeout(() => {
      onClose?.();
    }, 1000); // 1 秒長按
  }, [onClose]);

  // 長按結束：清除計時器
  const handlePressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  return (
    <div className={`mini-christmas-tree-container ${className}`}>
      {/* 提示氣泡 */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className="mini-tree-tooltip"
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <span className="tooltip-text">長按可以關閉動畫 🎄</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 迷你聖誕樹 */}
      <motion.button
        className="mini-christmas-tree no-focus-ring"
        onClick={handleClick}
        onPointerDown={handlePressStart}
        onPointerUp={handlePressEnd}
        onPointerLeave={handlePressEnd}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="聖誕樹裝飾，點擊查看提示，長按關閉動畫"
        title="點擊查看提示"
      >
        <svg
          width="48"
          height="64"
          viewBox="0 0 48 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mini-tree-svg"
        >
          {/* 星星 */}
          <polygon
            className="mini-tree-star"
            points="24,2 26,10 34,10 28,15 30,23 24,18 18,23 20,15 14,10 22,10"
            fill="#fbbf24"
          />

          {/* 樹冠第一層 */}
          <polygon points="24,16 34,30 14,30" fill="#22c55e" />
          <polygon points="24,16 32,28 16,28" fill="#16a34a" />

          {/* 樹冠第二層 */}
          <polygon points="24,24 38,42 10,42" fill="#22c55e" />
          <polygon points="24,24 36,40 12,40" fill="#16a34a" />

          {/* 樹冠第三層 */}
          <polygon points="24,34 42,56 6,56" fill="#22c55e" />
          <polygon points="24,34 40,54 8,54" fill="#16a34a" />

          {/* 樹幹 */}
          <rect x="20" y="54" width="8" height="8" fill="#92400e" />
          <rect x="21" y="54" width="6" height="8" fill="#78350f" />

          {/* 裝飾球 */}
          <circle cx="20" cy="26" r="2" fill="#ef4444" className="tree-ornament" />
          <circle cx="28" cy="28" r="2" fill="#fbbf24" className="tree-ornament" />
          <circle cx="16" cy="36" r="2.5" fill="#3b82f6" className="tree-ornament" />
          <circle cx="32" cy="38" r="2" fill="#ef4444" className="tree-ornament" />
          <circle cx="24" cy="40" r="2" fill="#fbbf24" className="tree-ornament" />
          <circle cx="12" cy="48" r="2.5" fill="#ef4444" className="tree-ornament" />
          <circle cx="24" cy="50" r="2" fill="#3b82f6" className="tree-ornament" />
          <circle cx="36" cy="48" r="2.5" fill="#fbbf24" className="tree-ornament" />
        </svg>
      </motion.button>
    </div>
  );
}
