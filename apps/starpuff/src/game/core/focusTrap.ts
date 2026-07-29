// 模態焦點鎖定（#870）：宣告 `role="dialog"` + `aria-modal="true"` 的 overlay
// 必須同時做到「焦點移入、循環侷限於容器內、關閉後還原」——只宣告不實作等於對
// 螢幕閱讀器謊報模態語意，鍵盤使用者仍能 Shift+Tab 回到底層並啟用它（實證：設定頁
// 開啟中可切換場景）。此模組供所有此類 overlay 共用，避免每個 overlay 各寫一份。

// 可聚焦候選：涵蓋本 repo overlay 實際會用到的元素型別。
// `[tabindex]:not([tabindex="-1"])` 收自訂可聚焦節點；disabled 與負 tabindex 一律排除。
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface FocusTrap {
  release(): void;
}

// 只取「當下真的可聚焦」的元素：隱藏節點（display:none／visibility:hidden／
// 尺寸為 0）仍會被 querySelectorAll 選中，但 focus() 對它們無效——若把它們算進
// 循環邊界，Tab 會停在看不見的地方，等同沒有鎖定。
function focusableIn(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (element) =>
      element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement,
  );
}

// 還原目標的重查依據（`data-menu` 在本 repo 的 DOM 鈕慣例中唯一）：Phaser 場景
// resize 會 remove 並重建這些按鈕（`hud.addDomButton` 的 relayout／shutdown 路徑），
// 於是 overlay 開啟期間若發生一次 relayout，開啟當下抓到的節點就脫離了文件，
// 直接 focus() 會無效而讓焦點掉到 body——實測為間歇性失敗（CI 視窗尺寸變動時更常見）。
function restoreTargetOf(snapshot: HTMLElement | null): HTMLElement | null {
  if (snapshot === null) return null;
  if (snapshot.isConnected) return snapshot;
  const menuId = snapshot.dataset['menu'];
  return menuId ? document.querySelector<HTMLElement>(`[data-menu="${menuId}"]`) : null;
}

export function createFocusTrap(container: HTMLElement): FocusTrap {
  // 還原目標在移動焦點「之前」取得——之後 activeElement 就是容器內的元素了。
  const previouslyFocused =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;
    const focusable = focusableIn(container);
    if (focusable.length === 0) {
      // 容器內無可聚焦元素：焦點無處可去，直接吞掉 Tab 好過讓它跑到底層。
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    // 焦點已在容器外（例如底層元素以程式方式取得焦點）也拉回來，不只處理邊界。
    if (!(active instanceof HTMLElement) || !container.contains(active)) {
      event.preventDefault();
      (event.shiftKey ? last : first)?.focus();
      return;
    }
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last?.focus();
      return;
    }
    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  // capture 階段攔截：overlay 內的元素若自行處理 keydown 並 stopPropagation，
  // 冒泡階段的 listener 會收不到，鎖定就破了。
  document.addEventListener('keydown', onKeyDown, true);

  // 模態需同時攔住遊戲層鍵盤（#870）：Phaser 的 keyboard plugin 掛在 window 的冒泡階段，
  // 於是「按 Enter 關閉設定頁」的同一個事件會繼續冒泡並觸發 TitleScene 的
  // `keydown-ENTER`→開始遊戲——實測為間歇性場景切換（設定頁關掉的瞬間跑進 Game）。
  // 在容器的**冒泡**階段 stopPropagation：容器內元素的 click／activation 已在 target
  // 階段完成故不受影響，同節點同階段的其他 listener（設定頁的 Escape）照常執行，
  // 只有繼續往 window 冒泡的遊戲層收不到。不可改用 capture——那會在事件抵達按鈕前
  // 就切斷傳播，連 Enter 觸發 click 都沒了。
  const stopGameKeys = (event: KeyboardEvent): void => event.stopPropagation();
  container.addEventListener('keydown', stopGameKeys);
  container.addEventListener('keyup', stopGameKeys);

  // 開啟時把焦點移入第一個控制項（驗收標準 1）。容器本身不設 tabindex——
  // 有可聚焦子項時聚焦子項才符合「落在第一個可聚焦控制項」的預期。
  focusableIn(container)[0]?.focus();

  return {
    release() {
      document.removeEventListener('keydown', onKeyDown, true);
      container.removeEventListener('keydown', stopGameKeys);
      container.removeEventListener('keyup', stopGameKeys);
      // 還原焦點至觸發元素（#870 驗收 3）。節點可能已被場景 relayout 重建，
      // 故先經 restoreTargetOf 重查；真的找不到就不動焦點，好過 focus 到脫離節點。
      restoreTargetOf(previouslyFocused)?.focus();
    },
  };
}
