import { useEffect, useRef, useState } from 'react';

/**
 * RateTypeTooltip - 匯率類型提示組件
 *
 * 提示不可用匯率類型的原因（例如 KRW 僅提供現金匯率）。
 * 觸發子元素須使用 aria-disabled（非原生 disabled），
 * 原生 disabled 會吞掉點擊事件導致提示永遠不出現。
 * 顏色走主題 token（primary-strong），隨 7 種主題切換。
 */

interface RateTypeTooltipProps {
  children: React.ReactNode;
  message: string;
  isDisabled: boolean;
  /** 觸發層 display 覆寫：grid/flex 場景避免 inline-block 的 baseline 對齊造成子元素垂直偏移。 */
  triggerClassName?: string;
}

const AUTO_HIDE_MS = 3000;

export const RateTypeTooltip = ({
  children,
  message,
  isDisabled,
  triggerClassName,
}: RateTypeTooltipProps) => {
  const [show, setShow] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  // 卸載時清理計時器，避免 setState on unmounted 與計時器洩漏。
  useEffect(() => clearHideTimer, []);

  const handleClick = (e: React.MouseEvent) => {
    if (isDisabled) {
      e.stopPropagation();
      setShow(true);

      // 重複點擊重置倒數，避免舊計時器提前關閉新提示。
      clearHideTimer();
      hideTimerRef.current = setTimeout(() => setShow(false), AUTO_HIDE_MS);
    }
  };

  const dismiss = () => {
    clearHideTimer();
    setShow(false);
  };

  return (
    <div className="relative inline-block">
      {/* 觸發元素 */}
      <div onClick={handleClick} className={triggerClassName ?? 'inline-block'}>
        {children}
      </div>

      {/* Tooltip - 使用 CSS 相對定位（在上方顯示） */}
      {show && (
        <>
          {/* 背景遮罩（點擊關閉） */}
          <div className="fixed inset-0 z-40" onClick={dismiss} />

          {/* Tooltip 內容（相對定位在觸發元素上方） */}
          <div
            role="status"
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-in fade-in-0 zoom-in-95 duration-200"
          >
            <div className="relative bg-[rgb(var(--color-primary-strong,var(--color-primary)))] text-white px-4 py-2 rounded-lg shadow-floating border border-white/20 backdrop-blur-sm whitespace-nowrap">
              {/* 訊息內容 */}
              <p className="text-sm font-medium">{message}</p>

              {/* 小箭頭（指向下方）- 與氣泡同色（SSOT Design Token） */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                <div className="w-3 h-3 bg-[rgb(var(--color-primary-strong,var(--color-primary)))] rotate-45 border-r border-b border-white/20" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
