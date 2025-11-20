/**
 * Calculator Feature - Body Scroll Lock Hook
 * @file useBodyScrollLock.ts
 * @description iOS/Android 兼容的背景滾動鎖定 hook
 * @see docs/dev/012_calculator_modal_sync_enhancement.md Section "背景滾動鎖定"
 * @see UX 研究：https://benfrain.com/preventing-body-scroll-for-modals-in-ios/
 *
 * Linus 哲學：
 * - ✅ 簡潔執念：無需第三方庫，純 CSS + DOM 操作
 * - ✅ 實用主義：解決 iOS Safari 的實際問題
 * - ✅ 消除特殊情況：統一處理 iOS、Android、Desktop
 */

import { useLayoutEffect } from 'react';

/**
 * 背景滾動鎖定 Hook
 * @description 當 Modal 開啟時鎖定背景滾動，關閉時恢復
 * @param isLocked - 是否鎖定滾動
 *
 * @example
 * ```tsx
 * function CalculatorModal({ isOpen }: { isOpen: boolean }) {
 *   useBodyScrollLock(isOpen);
 *
 *   if (!isOpen) return null;
 *   return <div>Calculator Modal</div>;
 * }
 * ```
 *
 * ## 技術細節
 *
 * ### iOS Safari 的問題
 * - `overflow: hidden` 在 iOS Safari 上無效
 * - 背景仍可滾動，破壞 Modal 體驗
 *
 * ### 解決方案
 * 1. 保存當前滾動位置
 * 2. 應用 `position: fixed` + `top: -${scrollY}px`
 * 3. 清理時恢復滾動位置
 *
 * ### 優點
 * - ✅ 適用於 iOS Safari、Android Chrome、Desktop
 * - ✅ 無需第三方庫（符合 KISS 原則）
 * - ✅ 無佈局跳動（保留滾動條空間）
 * - ✅ 無記憶體洩漏（完整 cleanup）
 */
export function useBodyScrollLock(isLocked: boolean): void {
  useLayoutEffect(() => {
    // 未鎖定時不執行
    if (!isLocked) return;

    // 1. 保存當前滾動位置
    const scrollY = window.scrollY;

    // 2. 應用鎖定樣式
    const originalStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overflowY: document.body.style.overflowY,
    };

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflowY = 'scroll'; // 保留滾動條空間，避免佈局跳動

    // 3. 清理函數：恢復原始狀態
    return () => {
      // 恢復原始樣式
      document.body.style.position = originalStyles.position;
      document.body.style.top = originalStyles.top;
      document.body.style.width = originalStyles.width;
      document.body.style.overflowY = originalStyles.overflowY;

      // 恢復滾動位置（無跳動）
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}
