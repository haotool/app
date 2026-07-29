import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// PWA 更新時機閘（v19 #819 卡 8＋審查收斂）：新版 ready 只標記 pending，殼層忙碌
//（GameScene 進行中/配置中/卡片開啟）絕不套用；安全場景（Title/Map/Result）由
// controls class 邊界觀察者或低頻重試觸發，且套用前有 1.5s 寬限期——防 reload
// 吃掉場景切換瞬間的點擊（Result 下一關 CTA 競態），寬限內轉忙即放棄本次套用。

// 殼層 stub：busy 旗標模擬 #controls.is-active（GameScene 進行中訊號）；
// scene 旗標模擬 documentElement 的 data-scene（#869 場景訊號 SSOT）。
let busy = false;
let scene = 'Title';
let observerCallbacks: (() => void)[] = [];

function stubShellDom(): void {
  const controls = {
    classList: { contains: (name: string) => name === 'is-active' && busy },
  };
  const documentElement = {
    getAttribute: (name: string) => (name === 'data-scene' ? scene : null),
    setAttribute: (name: string, value: string) => {
      if (name === 'data-scene') scene = value;
    },
  };
  vi.stubGlobal('document', {
    documentElement,
    getElementById: (id: string) => (id === 'controls' ? controls : null),
    querySelector: () => null,
  });
  vi.stubGlobal(
    'MutationObserver',
    class {
      constructor(private callback: () => void) {}
      // controls class 與 data-scene 兩個觀察點共用同一組回呼池：本 stub 不區分
      // 觀察目標，setBusy／setScene 皆全數觸發，等同真實環境「任一訊號變動即重試」。
      observe(): void {
        observerCallbacks.push(this.callback);
      }
      disconnect(): void {
        /* noop */
      }
    },
  );
}

function setBusy(next: boolean): void {
  busy = next;
  observerCallbacks.forEach((fn) => fn());
}

// 場景切換（#869）：白名單外的場景（Credits／Codex／Game）不得自動套用。
function setScene(next: string): void {
  scene = next;
  observerCallbacks.forEach((fn) => fn());
}

async function loadGate() {
  vi.resetModules();
  return import('./pwaUpdateGate');
}

beforeEach(() => {
  vi.useFakeTimers();
  busy = false;
  scene = 'Title';
  observerCallbacks = [];
  stubShellDom();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('pwaUpdateGate（v19 卡 8：安全場景＋寬限期才套用更新）', () => {
  it('殼層安靜 queue：寬限期（1.5s）前不套用，期滿套用且 pending 清空', async () => {
    const gate = await loadGate();
    const apply = vi.fn();
    gate.queuePwaUpdate(apply);
    vi.advanceTimersByTime(1400);
    expect(apply).not.toHaveBeenCalled();
    expect(gate.hasPendingPwaUpdate()).toBe(true);
    vi.advanceTimersByTime(100);
    expect(apply).toHaveBeenCalledTimes(1);
    expect(gate.hasPendingPwaUpdate()).toBe(false);
  });

  it('遊戲進行中（controls is-active）queue 只標記 pending 不套用', async () => {
    const gate = await loadGate();
    busy = true;
    const apply = vi.fn();
    gate.queuePwaUpdate(apply);
    vi.advanceTimersByTime(10_000);
    expect(apply).not.toHaveBeenCalled();
    expect(gate.hasPendingPwaUpdate()).toBe(true);
  });

  it('遊戲結束（is-active 移除）由邊界觀察者觸發，經寬限期套用', async () => {
    const gate = await loadGate();
    gate.initPwaUpdateGate();
    busy = true;
    const apply = vi.fn();
    gate.queuePwaUpdate(apply);
    setBusy(false);
    vi.advanceTimersByTime(1400);
    expect(apply).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('寬限期內殼層轉忙（立即點下一關再入遊戲）：放棄本次套用、保持 pending，再轉靜後套用', async () => {
    const gate = await loadGate();
    gate.initPwaUpdateGate();
    const apply = vi.fn();
    gate.queuePwaUpdate(apply);
    // 寬限期內使用者點了下一關 CTA → 殼層轉忙。
    vi.advanceTimersByTime(800);
    setBusy(true);
    vi.advanceTimersByTime(10_000);
    expect(apply).not.toHaveBeenCalled();
    expect(gate.hasPendingPwaUpdate()).toBe(true);
    // 回到安全場景後照常套用。
    setBusy(false);
    vi.advanceTimersByTime(1500);
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('單次防重入：套用後重複觸發邊界/重試不再套用', async () => {
    const gate = await loadGate();
    gate.initPwaUpdateGate();
    const apply = vi.fn();
    gate.queuePwaUpdate(apply);
    vi.advanceTimersByTime(1500);
    expect(apply).toHaveBeenCalledTimes(1);
    setBusy(true);
    setBusy(false);
    gate.attemptPwaUpdate();
    vi.advanceTimersByTime(30_000);
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('忙碌期間低頻重試：殼層轉靜後由重試＋寬限套用（無邊界事件亦不卡死）', async () => {
    const gate = await loadGate();
    busy = true;
    const apply = vi.fn();
    gate.queuePwaUpdate(apply);
    vi.advanceTimersByTime(15_000);
    expect(apply).not.toHaveBeenCalled();
    busy = false;
    // 下一次重試（≤5s）啟動寬限、再 1.5s 套用。
    vi.advanceTimersByTime(6_500);
    expect(apply).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(30_000);
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('配置面板/殼卡開啟（isShellBusy 其他訊號）同樣延後', async () => {
    const gate = await loadGate();
    const doc = document as unknown as { querySelector: (s: string) => unknown };
    doc.querySelector = () => ({});
    const apply = vi.fn();
    gate.queuePwaUpdate(apply);
    vi.advanceTimersByTime(10_000);
    expect(apply).not.toHaveBeenCalled();
    expect(gate.hasPendingPwaUpdate()).toBe(true);
  });
});

// #869：舊判定「非 isShellBusy 即安全」對 Credits／Codex 失效——兩者皆非 GameScene
// 且無殼卡，會被誤判為可 reload，導致約 14.7s 的謝幕在寬限 1.5s 後即被打斷。
describe('安全場景白名單（#869）', () => {
  it('Credits 謝幕期間不套用，且長時間等待也不套用', async () => {
    const gate = await loadGate();
    setScene('Credits');
    const apply = vi.fn();
    gate.queuePwaUpdate(apply);
    // 遠超謝幕全長（約 14.7s）：舊實作在此早已 reload。
    vi.advanceTimersByTime(30_000);
    expect(apply).not.toHaveBeenCalled();
    expect(gate.hasPendingPwaUpdate()).toBe(true);
  });

  it('Codex 瀏覽期間不套用', async () => {
    const gate = await loadGate();
    setScene('Codex');
    const apply = vi.fn();
    gate.queuePwaUpdate(apply);
    vi.advanceTimersByTime(30_000);
    expect(apply).not.toHaveBeenCalled();
    expect(gate.hasPendingPwaUpdate()).toBe(true);
  });

  it('自 Credits 回到 Title：場景觀察者觸發，寬限期滿後套用', async () => {
    const gate = await loadGate();
    gate.initPwaUpdateGate();
    setScene('Credits');
    const apply = vi.fn();
    gate.queuePwaUpdate(apply);
    vi.advanceTimersByTime(20_000);
    expect(apply).not.toHaveBeenCalled();
    // 謝幕播畢回 Title：controls class 全程未變（兩者皆非 active），
    // 僅靠 controls 觀察者會漏接——data-scene 觀察者是此轉場的唯一即時訊號。
    setScene('Title');
    vi.advanceTimersByTime(1400);
    expect(apply).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('寬限期內離開安全場景（Title→Codex）：放棄本次套用並保持 pending', async () => {
    const gate = await loadGate();
    gate.initPwaUpdateGate();
    const apply = vi.fn();
    gate.queuePwaUpdate(apply);
    vi.advanceTimersByTime(800);
    setScene('Codex');
    vi.advanceTimersByTime(30_000);
    expect(apply).not.toHaveBeenCalled();
    expect(gate.hasPendingPwaUpdate()).toBe(true);
  });

  it('場景訊號未建立（Phaser boot 前）視為不安全——fail-closed', async () => {
    const gate = await loadGate();
    setScene('');
    const doc = document as unknown as { documentElement: { getAttribute: () => null } };
    doc.documentElement.getAttribute = () => null;
    const apply = vi.fn();
    gate.queuePwaUpdate(apply);
    vi.advanceTimersByTime(30_000);
    expect(apply).not.toHaveBeenCalled();
    expect(gate.hasPendingPwaUpdate()).toBe(true);
  });

  it('Map 與 Result 同屬白名單，照常套用', async () => {
    for (const safe of ['Map', 'Result']) {
      const gate = await loadGate();
      setScene(safe);
      const apply = vi.fn();
      gate.queuePwaUpdate(apply);
      vi.advanceTimersByTime(1500);
      expect(apply, `${safe} 應可套用`).toHaveBeenCalledTimes(1);
    }
  });
});
