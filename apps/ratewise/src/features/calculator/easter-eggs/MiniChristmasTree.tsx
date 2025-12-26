/**
 * Mini Christmas Tree - Draggable Interactive Component
 * @file MiniChristmasTree.tsx
 * @description 可拖動的互動式迷你聖誕樹 - 12 月常駐裝飾
 *
 * 功能：
 * - 可隨意拖動到任意位置（使用 Motion drag）
 * - 點擊時顯示 20 種隨機聖誕祝福（祝福氣泡跟隨聖誕樹）
 * - 長按 1 秒關閉動畫
 * - hover 時有微妙的發光效果
 * - 尺寸：48x64px
 * - 記憶位置（localStorage）
 *
 * [update:2025-12-27T03:08:00+08:00] 修正拖動功能
 * - 移除「↕ 可拖動」提示避免與下拉刷新混淆
 * - 祝福氣泡跟隨聖誕樹位置
 * - 參考: [context7:/websites/motion-dev-docs:drag:2025-12-27]
 */

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getRandomChristmasGreeting } from './christmas-greetings';
import './styles/december-theme.css';

/**
 * localStorage key for tree position
 */
const TREE_POSITION_KEY = 'ratewise_christmas_tree_position';

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
 * 位置介面
 */
interface Position {
  x: number;
  y: number;
}

/**
 * 獲取存儲的位置
 */
function getSavedPosition(): Position | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(TREE_POSITION_KEY);
    if (saved) {
      const pos = JSON.parse(saved) as Position;
      // 驗證位置在合理範圍內
      if (typeof pos.x === 'number' && typeof pos.y === 'number') {
        return pos;
      }
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

/**
 * 保存位置到 localStorage
 */
function savePosition(pos: Position): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TREE_POSITION_KEY, JSON.stringify(pos));
  } catch {
    // ignore storage errors
  }
}

/**
 * 可拖動的互動式迷你聖誕樹組件
 */
export function MiniChristmasTree({
  year: _year,
  className = '',
  onClose,
}: MiniChristmasTreeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [greetingMessage, setGreetingMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const longPressTimer = useRef<number | null>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);

  // 載入保存的位置
  const [initialPosition] = useState<Position | null>(() => getSavedPosition());

  // 點擊：顯示隨機聖誕祝福（只在非拖動時觸發）
  const handleClick = useCallback(() => {
    if (isDragging) return;
    const randomGreeting = getRandomChristmasGreeting();
    setGreetingMessage(randomGreeting);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 3000); // 3 秒後自動隱藏
  }, [isDragging]);

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

  // 拖動開始
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    handlePressEnd(); // 取消長按計時器
  }, [handlePressEnd]);

  // 拖動結束：保存位置
  const handleDragEnd = useCallback(
    (_event: PointerEvent | MouseEvent | TouchEvent, info: { offset: Position }) => {
      setIsDragging(false);
      // 保存新位置（基於初始位置 + 偏移量）
      const baseX = initialPosition?.x ?? 0;
      const baseY = initialPosition?.y ?? 0;
      savePosition({
        x: baseX + info.offset.x,
        y: baseY + info.offset.y,
      });
    },
    [initialPosition],
  );

  return (
    <>
      {/* 拖動約束區域（全屏） */}
      <div
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none z-[99]"
        aria-hidden="true"
      />

      <motion.div
        className={`mini-christmas-tree-container ${className}`}
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          x: initialPosition?.x ?? 0,
          y: initialPosition?.y ?? 0,
        }}
      >
        {/* 祝福氣泡 - 跟隨聖誕樹位置 */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              className="mini-tree-tooltip"
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.8 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
              <span className="tooltip-text">{greetingMessage}</span>
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
          aria-label="聖誕樹裝飾，點擊查看聖誕祝福，可拖動移動位置，長按關閉動畫"
          title="點擊查看聖誕祝福 · 可拖動移動"
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
      </motion.div>
    </>
  );
}
