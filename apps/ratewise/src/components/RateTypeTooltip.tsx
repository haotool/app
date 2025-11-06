import { useState } from 'react';

/**
 * RateTypeTooltip - 匯率類型提示組件
 * 
 * Linus 風格：簡單的 CSS 相對定位，不需要複雜的 JS 計算
 * "好的代碼不需要注釋，但這個需要因為你可能想回到複雜版本"
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
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShow(false)}
          />
          
          {/* Tooltip 內容（相對定位在觸發元素上方） */}
          <div 
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-in fade-in-0 zoom-in-95 duration-200"
          >
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-2xl border border-white/20 backdrop-blur-sm whitespace-nowrap">
              {/* 訊息內容 */}
              <p className="text-sm font-medium">
                {message}
              </p>
              
              {/* 小箭頭（指向下方） */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                <div className="w-3 h-3 bg-blue-600 rotate-45 border-r border-b border-white/20" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
