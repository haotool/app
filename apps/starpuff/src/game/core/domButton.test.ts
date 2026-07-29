import { describe, expect, it, vi } from 'vitest';
import { MIN_MENU_HIT_CSS_PX, bindButtonActivation, menuHitCssRect } from './domButton';

// 直持 390×844 實測縮放（§98 D2 量測基準）：canvas CSS 844×390、邏輯 1039×480。
const SX = 844 / 1039;
const SY = 390 / 480;

// 選單 DOM 鈕邏輯尺寸盤點（Title 主/次選、返回、重置、圖鑑頁籤、區頁籤、EX、節點）。
const MENU_RECTS = [
  { x: 519, y: 316, w: 220, h: 72 },
  { x: 200, y: 408, w: 168, h: 56 },
  { x: 56, y: 34, w: 132, h: 56 },
  { x: 84, y: 448, w: 150, h: 52 },
  { x: 350, y: 84, w: 140, h: 52 },
  { x: 220, y: 78, w: 144, h: 46 },
  { x: 300, y: 174, w: 108, h: 44 },
  { x: 120, y: 300, w: 68, h: 68 },
];

describe('menuHitCssRect（§98 D2 命中短邊保底）', () => {
  it('直持縮放下全部選單鈕命中邊 ≥48 CSS px', () => {
    for (const rect of MENU_RECTS) {
      const css = menuHitCssRect(rect, SX, SY);
      expect(css.w).toBeGreaterThanOrEqual(MIN_MENU_HIT_CSS_PX);
      expect(css.h).toBeGreaterThanOrEqual(MIN_MENU_HIT_CSS_PX);
    }
  });

  it('原始換算已達下限的邊不放大（大鈕視覺＝命中不變）', () => {
    const css = menuHitCssRect({ x: 519, y: 316, w: 220, h: 72 }, SX, SY);
    expect(css.w).toBeCloseTo(220 * SX, 6);
    expect(css.h).toBeCloseTo(72 * SY, 6);
  });

  it('擴張對稱於中心：中心點不因保底而漂移', () => {
    const rect = { x: 300, y: 174, w: 108, h: 44 };
    const css = menuHitCssRect(rect, SX, SY);
    expect(css.left + css.w / 2).toBeCloseTo(rect.x * SX, 6);
    expect(css.top + css.h / 2).toBeCloseTo(rect.y * SY, 6);
  });

  it('倍率 1（未縮放殼）時小鈕同樣吃到 48 下限', () => {
    const css = menuHitCssRect({ x: 100, y: 100, w: 40, h: 40 }, 1, 1);
    expect(css.w).toBe(MIN_MENU_HIT_CSS_PX);
    expect(css.h).toBe(MIN_MENU_HIT_CSS_PX);
  });
});

// 假按鈕：node 環境捕捉 listener，模擬指標鏈與鍵盤 activation 事件序。
interface FakeButton {
  listeners: Map<string, (event: { detail: number; preventDefault: () => void }) => void>;
  addEventListener: (
    type: string,
    handler: (event: { detail: number; preventDefault: () => void }) => void,
  ) => void;
  fire: (type: string, detail?: number) => void;
  // 指標按下時的顯式聚焦（#870）：pointerdown 的 preventDefault 吞掉瀏覽器預設聚焦，
  // 實作補 focus() 恢復原生語意；stub 需一併具備，否則測到的是 stub 缺漏而非行為。
  focus: () => void;
  focusCalls: number;
}

function makeFakeButton(): FakeButton {
  const listeners = new Map<
    string,
    (event: { detail: number; preventDefault: () => void }) => void
  >();
  const button: FakeButton = {
    listeners,
    addEventListener: (type, handler) => void listeners.set(type, handler),
    fire: (type, detail = 1) => listeners.get(type)?.({ detail, preventDefault: () => undefined }),
    focus: () => {
      button.focusCalls += 1;
    },
    focusCalls: 0,
  };
  return button;
}

describe('bindButtonActivation（#823/#830 雙路徑觸發 SSOT）', () => {
  it('指標完整事件鏈（pointerdown→click）僅單次觸發', () => {
    const button = makeFakeButton();
    const onPress = vi.fn();
    bindButtonActivation(button as unknown as HTMLButtonElement, onPress);
    button.fire('pointerdown');
    button.fire('click', 1);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  // #870：pointerdown 的 preventDefault 連帶吞掉瀏覽器預設聚焦，焦點會留在 body——
  // 「點按鈕開啟模態」時模態因此記不到觸發元素、關閉後無從還原。必須在 onPress
  // 之前補上，因為 onPress 可能開啟需要讀取 activeElement 的模態。
  it('指標按下時顯式聚焦按鈕，且發生在 onPress 之前', () => {
    const button = makeFakeButton();
    let focusCallsAtPress = -1;
    const onPress = vi.fn(() => {
      focusCallsAtPress = button.focusCalls;
    });
    bindButtonActivation(button as unknown as HTMLButtonElement, onPress);
    button.fire('pointerdown');
    expect(button.focusCalls).toBe(1);
    expect(focusCallsAtPress).toBe(1);
  });

  it('鍵盤/AT activation（click detail=0，無指標前程）可觸發', () => {
    const button = makeFakeButton();
    const onPress = vi.fn();
    bindButtonActivation(button as unknown as HTMLButtonElement, onPress);
    button.fire('click', 0);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('指標互動後緊接鍵盤 activation 不被誤吞（#830 手勢級旗標）', () => {
    const button = makeFakeButton();
    const onPress = vi.fn();
    bindButtonActivation(button as unknown as HTMLButtonElement, onPress);
    button.fire('pointerdown');
    button.fire('click', 1);
    button.fire('click', 0);
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('手勢中斷（pointercancel）清旗標：下一次 click 照常觸發', () => {
    const button = makeFakeButton();
    const onPress = vi.fn();
    bindButtonActivation(button as unknown as HTMLButtonElement, onPress);
    button.fire('pointerdown');
    button.fire('pointercancel');
    button.fire('click', 1);
    expect(onPress).toHaveBeenCalledTimes(2);
  });
});
