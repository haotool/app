/**
 * Christmas Easter Egg - Main Component
 * @file ChristmasEasterEgg.tsx
 * @description 聖誕彩蛋主組件，顯示全屏聖誕樹和下雪動畫
 *
 * 觸發條件：用戶輸入 106575 ÷ 1225 = 87
 * 持續時間：1 分鐘
 */

import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import type { ChristmasEasterEggProps } from './types';
import { ChristmasTree } from './ChristmasTree';
import { SnowAnimation } from './SnowAnimation';
import { CHRISTMAS_EASTER_EGG_DURATION } from './utils';
import './styles/christmas.css';

/**
 * 聖誕彩蛋主組件
 * @description 全屏顯示聖誕樹、下雪動畫和祝福語
 * @param isVisible - 是否顯示彩蛋
 * @param onClose - 關閉彩蛋的回調函數
 */
export function ChristmasEasterEgg({ isVisible, onClose }: ChristmasEasterEggProps) {
  // 自動關閉計時器（1 分鐘後自動關閉）
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      onClose();
    }, CHRISTMAS_EASTER_EGG_DURATION);

    return () => clearTimeout(timer);
  }, [isVisible, onClose]);

  // 點擊任意位置關閉
  const handleClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // 按 Escape 鍵關閉
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);

  // SSR guard
  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[9999] christmas-background flex flex-col items-center justify-center cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          onClick={handleClick}
          role="dialog"
          aria-modal="true"
          aria-label="聖誕彩蛋"
        >
          {/* 下雪動畫 */}
          <SnowAnimation count={60} />

          {/* 聖誕樹 */}
          <motion.div
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 0.2 }}
          >
            <ChristmasTree size={180} />
          </motion.div>

          {/* 祝福語 */}
          <motion.div
            className="christmas-greeting mt-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Merry Christmas!
            </h1>
            <p className="text-2xl md:text-3xl text-yellow-300 font-semibold drop-shadow-md">
              {new Date().getFullYear()} 聖誕快樂
            </p>
            <p className="text-sm text-neutral-text-muted mt-6 opacity-70">點擊任意處關閉</p>
          </motion.div>

          {/* 底部裝飾 */}
          <motion.div
            className="absolute bottom-8 text-white/50 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            106575 ÷ 1225 = 87
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
