/**
 * RollingText Component
 * 文字滾動動畫組件 - 模擬老虎機/骰子效果
 *
 * 當 text prop 變化時，觸發以下動畫序列：
 * 1. 模糊 + 縮小 + 變色
 * 2. 顯示隨機日文字元
 * 3. 恢復清晰並顯示最終文字
 */

import { useState, useEffect } from 'react';

interface RollingTextProps {
  text: string;
  className?: string;
  /** 動畫步數（預設 6）*/
  steps?: number;
  /** 每步間隔（毫秒，預設 50）*/
  interval?: number;
  /** 是否啟用動畫（預設 true）*/
  animate?: boolean;
}

// 隨機字元池 - 日文漢字和假名
const SCRAMBLE_CHARS = '一二三四五六七八九十甲乙丙丁天地人和風月花雪';

/**
 * RollingText - 文字滾動動畫組件
 */
export function RollingText({
  text,
  className = '',
  steps = 6,
  interval = 50,
  animate = true,
}: RollingTextProps) {
  const [display, setDisplay] = useState(text);
  const [isBlur, setIsBlur] = useState(false);

  useEffect(() => {
    if (!animate) {
      setDisplay(text);
      return;
    }

    // 觸發動畫序列
    setIsBlur(true);

    let currentStep = 0;

    const animationInterval = setInterval(() => {
      currentStep++;

      if (currentStep < steps) {
        // 顯示隨機字元（保持與目標文字相同長度）
        const randomText = text
          .split('')
          .map(() => SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)])
          .join('');
        setDisplay(randomText);
      } else {
        // 動畫結束，顯示最終文字
        clearInterval(animationInterval);
        setDisplay(text);
        setIsBlur(false);
      }
    }, interval);

    return () => clearInterval(animationInterval);
  }, [text, steps, interval, animate]);

  return (
    <span
      className={`
        inline-block
        transition-all duration-200
        ${isBlur ? 'blur-[2px] scale-95 opacity-70 text-red-800' : 'blur-0 scale-100 opacity-100'}
        ${className}
      `.trim()}
    >
      {display}
    </span>
  );
}

export default RollingText;
