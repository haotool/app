// @vitest-environment jsdom
// starpuff 的 vitest 全域 environment 為 node（純邏輯模組為主，不付 DOM 啟動成本）；
// 焦點鎖定必然涉及 document 與 activeElement，故本檔單獨切 jsdom，不動全域設定。
import { beforeEach, describe, expect, it } from 'vitest';

import { createFocusTrap } from './focusTrap';

// 模態焦點鎖定（#870）：宣告 aria-modal 卻不鎖焦點，等於對 AT 謊報模態語意——
// 鍵盤使用者仍可 Shift+Tab 回底層並啟用它（設定頁開啟中誤切場景的實證來源）。

function makeButton(label: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  // jsdom 不做版面計算，offsetWidth/Height 恆為 0——focusableIn 會據此濾掉元素。
  // 以可設定的 getter 模擬「已渲染」，讓測試驗到的是篩選邏輯本身而非 jsdom 限制。
  Object.defineProperty(button, 'offsetWidth', { value: 10, configurable: true });
  Object.defineProperty(button, 'offsetHeight', { value: 10, configurable: true });
  return button;
}

function pressTab(shiftKey = false): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true }));
}

describe('createFocusTrap（#870）', () => {
  let background: HTMLButtonElement;
  let dialog: HTMLElement;
  let first: HTMLButtonElement;
  let last: HTMLButtonElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    background = makeButton('底層 Title 按鈕');
    document.body.appendChild(background);
    dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    first = makeButton('第一個控制項');
    last = makeButton('完成');
    dialog.append(first, last);
    document.body.appendChild(dialog);
  });

  it('建立時把焦點移入對話框第一個可聚焦控制項', () => {
    background.focus();
    createFocusTrap(dialog);
    expect(document.activeElement).toBe(first);
  });

  it('Tab 於末項時循環回首項，不跑到底層', () => {
    createFocusTrap(dialog);
    last.focus();
    pressTab();
    expect(document.activeElement).toBe(first);
  });

  it('Shift+Tab 於首項時循環到末項——本 issue 的主要缺陷路徑', () => {
    createFocusTrap(dialog);
    first.focus();
    pressTab(true);
    expect(document.activeElement).toBe(last);
    expect(document.activeElement).not.toBe(background);
  });

  it('焦點被移到對話框外時，下一次 Tab 拉回框內', () => {
    createFocusTrap(dialog);
    background.focus();
    pressTab();
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('release 後還原焦點至開啟前的元素', () => {
    background.focus();
    const trap = createFocusTrap(dialog);
    expect(document.activeElement).toBe(first);
    trap.release();
    expect(document.activeElement).toBe(background);
  });

  it('release 後不再攔截 Tab（listener 已解除）', () => {
    background.focus();
    const trap = createFocusTrap(dialog);
    trap.release();
    last.focus();
    pressTab();
    // 已釋放：不再強制循環回 first，焦點維持瀏覽器原生行為（jsdom 下不變）。
    expect(document.activeElement).toBe(last);
  });

  it('觸發元素已從文件移除且無從重查時不還原焦點（避免 focus 到脫離節點）', () => {
    background.focus();
    const trap = createFocusTrap(dialog);
    background.remove();
    expect(() => trap.release()).not.toThrow();
    expect(document.activeElement).not.toBe(background);
  });

  // Phaser 場景 resize 會 remove 並重建 DOM 鈕（hud.addDomButton 的 relayout／shutdown
  // 路徑）。overlay 開啟期間若發生一次 relayout，開啟當下抓到的節點就脫離文件，
  // 直接 focus() 無效而讓焦點掉到 body——實測為間歇性失敗，故以 data-menu 重查。
  it('觸發元素被場景重建時，以 data-menu 重查並還原到新節點', () => {
    background.dataset['menu'] = 'settings';
    background.focus();
    const trap = createFocusTrap(dialog);
    // 模擬 relayout：移除舊節點、以同一 menuId 建立新節點。
    background.remove();
    const rebuilt = makeButton('底層 Title 按鈕（重建）');
    rebuilt.dataset['menu'] = 'settings';
    document.body.appendChild(rebuilt);

    trap.release();
    expect(document.activeElement).toBe(rebuilt);
  });

  it('容器內無可聚焦元素時吞掉 Tab，不讓焦點跑到底層', () => {
    const empty = document.createElement('div');
    document.body.appendChild(empty);
    createFocusTrap(empty);
    background.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
