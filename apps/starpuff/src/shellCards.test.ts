import { afterEach, describe, expect, it, vi } from 'vitest';
import { whenShellIdle } from './shellCards';

// whenShellIdle 競態窗回歸（#839 e2e 曝露的雙發缺陷）：interval 與 delay timeout
// 共用 attempt——interval 先顯卡後、leftover timeout 觸發前卡片被關閉（busy 訊號
// 消失），timeout 會再執行一次 callback 出現第二張卡；fired 一次性守衛必須鎖住。

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('whenShellIdle one-shot 守衛（#839 審查回歸鎖）', () => {
  it('interval 觸發顯卡後、leftover timeout 前關卡：callback 至多執行一次', () => {
    vi.useFakeTimers();
    // 殼層 stub：Title 恆在（data-menu="start"）；busy＝卡片 overlay 存在與否。
    let busy = false;
    vi.stubGlobal('document', {
      getElementById: () => null,
      querySelector: (selector: string) =>
        selector.includes('install-overlay') ? (busy ? {} : null) : {},
    });
    // callback 顯卡＝殼層轉忙（與 showShellCard 同步佔用 overlay 的行為對齊）。
    const callback = vi.fn(() => {
      busy = true;
    });
    whenShellIdle(callback, 2000);
    // t=1000：interval 首發——殼層安靜，顯卡。
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
    // 競態窗：timeout（t=2000）觸發前玩家關卡，busy 訊號消失。
    busy = false;
    // t=2000：leftover timeout 觸發——fired 守衛必須擋下第二次 callback。
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
    // 後續輪詢皆不得再發（interval 已清、守衛恆立）。
    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('殼層忙碌期不觸發，安靜後才執行一次', () => {
    vi.useFakeTimers();
    let busy = true;
    vi.stubGlobal('document', {
      getElementById: () => null,
      querySelector: (selector: string) =>
        selector.includes('install-overlay') ? (busy ? {} : null) : {},
    });
    const callback = vi.fn();
    whenShellIdle(callback, 2000);
    // 忙碌期：interval 與 timeout 皆不觸發。
    vi.advanceTimersByTime(3000);
    expect(callback).not.toHaveBeenCalled();
    // 安靜後下一輪輪詢執行恰一次。
    busy = false;
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

interface FakeElement {
  textContent: string;
  children: FakeElement[];
  className: string;
  type: string;
  classList: { contains: () => boolean };
  setAttribute: () => void;
  addEventListener: () => void;
  remove: () => void;
  appendChild: (child: FakeElement) => void;
}

function fakeElement(): FakeElement {
  const element: FakeElement = {
    textContent: '',
    children: [],
    className: '',
    type: '',
    classList: { contains: () => false },
    setAttribute: () => undefined,
    addEventListener: () => undefined,
    remove: () => undefined,
    appendChild: (child) => void element.children.push(child),
  };
  return element;
}

describe('notifySaveUnavailable（#868 進度無法保存提示單點）', () => {
  it('寫入失敗觸發時於 Title 安靜時刻顯卡，且每工作階段至多一張', async () => {
    vi.useFakeTimers();
    const shell = fakeElement();
    vi.stubGlobal('document', {
      // Title 在場（data-menu="start"）、無忙碌 overlay、無 controls（略過 MutationObserver）。
      getElementById: (id: string) => (id === 'game-shell' ? shell : null),
      createElement: () => fakeElement(),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      querySelector: (selector: string) => (selector === '[data-menu="start"]' ? {} : null),
    });

    const { notifySaveUnavailable } = await import('./shellCards');
    notifySaveUnavailable();
    vi.advanceTimersByTime(1000);
    expect(shell.children).toHaveLength(1);
    // shell > overlay > card > title
    expect(shell.children[0]?.children[0]?.children[0]?.textContent).toBe('進度無法保存');

    // 連續落盤失敗不得每次彈卡。
    notifySaveUnavailable();
    vi.advanceTimersByTime(5000);
    expect(shell.children).toHaveLength(1);
  });
});
