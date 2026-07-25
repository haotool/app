import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// PWA 更新時機閘（v19 #819 卡 8）：新版 ready 只標記 pending，殼層忙碌
//（GameScene 進行中/配置中/卡片開啟）絕不套用；回到安全場景（Title/Map/Result）
// 由 controls class 邊界觀察者或低頻重試套用，且僅套用一次。

// 殼層 stub：busy 旗標模擬 #controls.is-active（GameScene 進行中訊號）。
let busy = false;
let controlsClassListeners: (() => void)[] = [];

function stubShellDom(): void {
  const controls = {
    classList: { contains: (name: string) => name === 'is-active' && busy },
  };
  vi.stubGlobal('document', {
    getElementById: (id: string) => (id === 'controls' ? controls : null),
    querySelector: () => null,
  });
  vi.stubGlobal(
    'MutationObserver',
    class {
      constructor(private callback: () => void) {}
      observe(): void {
        controlsClassListeners.push(this.callback);
      }
      disconnect(): void {
        /* noop */
      }
    },
  );
}

function setBusy(next: boolean): void {
  busy = next;
  controlsClassListeners.forEach((fn) => fn());
}

async function loadGate() {
  vi.resetModules();
  return import('./pwaUpdateGate');
}

beforeEach(() => {
  busy = false;
  controlsClassListeners = [];
  stubShellDom();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('pwaUpdateGate（v19 卡 8：安全場景才套用更新）', () => {
  it('殼層安靜（Title/Map/Result）時 queue 即套用，pending 清空', async () => {
    const gate = await loadGate();
    const apply = vi.fn();
    gate.queuePwaUpdate(apply);
    expect(apply).toHaveBeenCalledTimes(1);
    expect(gate.hasPendingPwaUpdate()).toBe(false);
  });

  it('遊戲進行中（controls is-active）queue 只標記 pending 不套用', async () => {
    const gate = await loadGate();
    busy = true;
    const apply = vi.fn();
    gate.queuePwaUpdate(apply);
    expect(apply).not.toHaveBeenCalled();
    expect(gate.hasPendingPwaUpdate()).toBe(true);
  });

  it('遊戲結束（is-active 移除）由 controls 邊界觀察者自動套用', async () => {
    const gate = await loadGate();
    gate.initPwaUpdateGate();
    busy = true;
    const apply = vi.fn();
    gate.queuePwaUpdate(apply);
    expect(apply).not.toHaveBeenCalled();
    setBusy(false);
    expect(apply).toHaveBeenCalledTimes(1);
    expect(gate.hasPendingPwaUpdate()).toBe(false);
  });

  it('單次防重入：套用後重複觸發邊界/重試不再套用', async () => {
    const gate = await loadGate();
    gate.initPwaUpdateGate();
    const apply = vi.fn();
    gate.queuePwaUpdate(apply);
    setBusy(true);
    setBusy(false);
    gate.attemptPwaUpdate();
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('忙碌期間低頻重試：殼層轉靜後由重試計時器套用（無邊界事件亦不卡死）', async () => {
    vi.useFakeTimers();
    const gate = await loadGate();
    busy = true;
    const apply = vi.fn();
    gate.queuePwaUpdate(apply);
    vi.advanceTimersByTime(15_000);
    expect(apply).not.toHaveBeenCalled();
    busy = false;
    vi.advanceTimersByTime(5_000);
    expect(apply).toHaveBeenCalledTimes(1);
    // 套用後計時器解除：再推進不重複套用。
    vi.advanceTimersByTime(30_000);
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('配置面板/殼卡開啟（isShellBusy 其他訊號）同樣延後', async () => {
    const gate = await loadGate();
    // 覆寫 querySelector 模擬 install-overlay 存在（殼卡開啟）。
    const doc = document as unknown as { querySelector: (s: string) => unknown };
    doc.querySelector = () => ({});
    const apply = vi.fn();
    gate.queuePwaUpdate(apply);
    expect(apply).not.toHaveBeenCalled();
    expect(gate.hasPendingPwaUpdate()).toBe(true);
  });
});
