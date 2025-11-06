import { useState, useRef, useLayoutEffect } from 'react';

interface RateTypeTooltipProps {
  children: React.ReactNode;
  message: string;
  isDisabled: boolean;
}

export const RateTypeTooltip = ({ children, message, isDisabled }: RateTypeTooltipProps) => {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // 使用 useLayoutEffect 確保在 DOM 繪製前計算位置
  useLayoutEffect(() => {
    if (!show || !triggerRef.current || !tooltipRef.current) {
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current || !tooltipRef.current) return;
      
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      // 計算位置（置於觸發元素下方並居中）
      let left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      const top = triggerRect.bottom + 8;
      
      // 防止 tooltip 超出視窗左右邊界
      const padding = 8;
      if (left < padding) {
        left = padding;
      } else if (left + tooltipRect.width > window.innerWidth - padding) {
        left = window.innerWidth - tooltipRect.width - padding;
      }
      
      setPosition({ top, left });
    };

    // 立即計算位置
    updatePosition();
    
    // 監聽滾動和視窗大小變化
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [show]);

  const handleClick = (e: React.MouseEvent) => {
    if (isDisabled) {
      e.stopPropagation();
      setShow(true);
      
      // 3秒後自動消失
      setTimeout(() => setShow(false), 3000);
    }
  };

  return (
    <>
      <div ref={triggerRef} onClick={handleClick} className="inline-block">
        {children}
      </div>
      
      {show && (
        <>
          {/* 背景遮罩（點擊關閉） */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShow(false)}
          />
          
          {/* Tooltip 內容 */}
          <div
            ref={tooltipRef}
            className="fixed z-50 animate-in fade-in-0 zoom-in-95 duration-200"
            style={{ 
              top: `${position.top}px`, 
              left: `${position.left}px` 
            }}
          >
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-white/20 backdrop-blur-sm">
              {/* 小箭頭 */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-600 rotate-45 border-l border-t border-white/20" />
              
              {/* 訊息內容 */}
              <p className="relative text-sm font-medium whitespace-nowrap">
                {message}
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
};

