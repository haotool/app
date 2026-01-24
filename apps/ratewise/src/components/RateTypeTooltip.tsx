import { useState } from 'react';

/**
 * RateTypeTooltip - Exchange Rate Type Tooltip Component
 *
 * @description Displays contextual tooltip for disabled rate type toggle
 *
 * @features
 * - Simple CSS relative positioning (Linus philosophy: avoid complex JS calculations)
 * - Click to show/hide with auto-dismiss after 3 seconds
 * - Backdrop click to dismiss
 * - Smooth fade-in animation
 * - Design token integration for brand-aligned styling
 *
 * @philosophy
 * "Good code doesn't need comments, but this one does because you might want
 *  to go back to the complex version" - Linus Torvalds style simplicity
 *
 * @accessibility
 * - Click-based interaction for touch devices
 * - Backdrop dismiss for easy cancellation
 *
 * @see docs/dev/005_design_token_refactoring.md - Design token migration
 *
 * @created 2025-01-01
 * @updated 2026-01-24
 * @version 2.0.0
 */

interface RateTypeTooltipProps {
  children: React.ReactNode;
  message: string;
  isDisabled: boolean;
}

export const RateTypeTooltip = ({ children, message, isDisabled }: RateTypeTooltipProps) => {
  const [show, setShow] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (isDisabled) {
      e.stopPropagation();
      setShow(true);

      // 3秒後自動消失
      setTimeout(() => setShow(false), 3000);
    }
  };

  return (
    <div className="relative inline-block">
      {/* 觸發元素 */}
      <div onClick={handleClick} className="inline-block">
        {children}
      </div>

      {/* Tooltip - 使用 CSS 相對定位（在上方顯示） */}
      {show && (
        <>
          {/* 背景遮罩（點擊關閉） */}
          <div className="fixed inset-0 z-40" onClick={() => setShow(false)} />

          {/* Tooltip Content (positioned above trigger element) */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="relative bg-gradient-to-r from-brand-button-to to-brand-button-from text-white px-4 py-2 rounded-lg shadow-2xl border border-white/20 backdrop-blur-sm whitespace-nowrap">
              {/* Message content */}
              <p className="text-sm font-medium">{message}</p>

              {/* Arrow pointing downwards */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                <div className="w-3 h-3 bg-brand-button-to rotate-45 border-r border-b border-white/20" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
