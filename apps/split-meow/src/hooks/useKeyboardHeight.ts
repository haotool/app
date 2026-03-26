import { useState, useEffect } from 'react';

/**
 * 偵測 iOS / Android 虛擬鍵盤高度。
 *
 * 原理：iOS Safari PWA 的 `position:fixed` 元素錨定在 layout viewport，
 * 鍵盤彈起時 layout viewport 不縮小，導致固定元素被鍵盤遮住。
 * 透過 `visualViewport` API 取得 visual viewport 的實際高度，
 * 計算差值即為鍵盤佔據的高度，再用 translateY 把 BottomSheet 往上推。
 *
 * 參考：https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport
 */
export function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // visual viewport 縮小 = 鍵盤出現；offsetTop 補偏移（頁面滾動時不為 0）
      const kh = window.innerHeight - vv.height - vv.offsetTop;
      setKeyboardHeight(Math.max(0, Math.round(kh)));
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return keyboardHeight;
}
