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
