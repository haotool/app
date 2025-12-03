/**
 * JapaneseDiceButton Component
 * 日式骰子按鈕 - 仿傳統日本骰子設計
 *
 * 特色：
 * 1. 3D 立體效果（陰影 + 內凹）
 * 2. 紅色圓點代表「一」（日本傳統骰子特色）
 * 3. 點擊時旋轉動畫
 * 4. Hover 時顯示標籤
 */

import { useState, useCallback } from 'react';

interface JapaneseDiceButtonProps {
  onClick: (e: React.MouseEvent) => void;
  label: string;
  disabled?: boolean;
  /** 骰子尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 自訂 className */
  className?: string;
}

/**
 * JapaneseDiceButton - 日式骰子按鈕
 */
export function JapaneseDiceButton({
  onClick,
  label,
  disabled = false,
  size = 'md',
  className = '',
}: JapaneseDiceButtonProps) {
  const [isRolling, setIsRolling] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || isRolling) return;

      setIsRolling(true);
      onClick(e);

      // 動畫結束後重置狀態
      setTimeout(() => setIsRolling(false), 600);
    },
    [disabled, isRolling, onClick],
  );

  // 根據尺寸決定樣式
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10 md:w-12 md:h-12',
    lg: 'w-12 h-12 md:w-14 md:h-14',
  };

  const dotSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5 md:w-6 md:h-6',
    lg: 'w-6 h-6 md:w-7 md:h-7',
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        group relative flex flex-col items-center justify-center p-2
        transition-all active:scale-90
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `.trim()}
      title={label}
    >
      {/* 3D Dice Container */}
      <div
        className={`
          ${sizeClasses[size]}
          bg-[#fdfbf7]
          rounded-xl
          shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06),inset_0_-2px_4px_rgba(0,0,0,0.05)]
          border border-stone-200
          flex items-center justify-center
          transition-all duration-500
          ${isRolling ? 'animate-dice-roll shadow-sm' : 'hover:shadow-lg hover:-translate-y-0.5'}
        `.trim()}
      >
        {/* Dice Face - 紅色圓點代表「一」（日本傳統骰子特色）*/}
        <div className="relative w-full h-full flex items-center justify-center">
          <div
            className={`
              ${dotSizeClasses[size]}
              bg-red-600
              rounded-full
              shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]
            `.trim()}
          />
        </div>
      </div>

      {/* Label - Hover 時顯示 */}
      <span
        className={`
          mt-1.5
          text-[10px] font-bold
          text-stone-400 group-hover:text-red-700
          transition-colors
          tracking-widest uppercase
          opacity-0 group-hover:opacity-100
          absolute -bottom-4
          whitespace-nowrap
        `.trim()}
      >
        {label}
      </span>

      {/* Dice Roll Animation */}
      <style>{`
        @keyframes dice-roll {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(90deg) scale(0.9); }
          50% { transform: rotate(180deg) scale(0.8); }
          75% { transform: rotate(270deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }
        .animate-dice-roll {
          animation: dice-roll 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </button>
  );
}

export default JapaneseDiceButton;
