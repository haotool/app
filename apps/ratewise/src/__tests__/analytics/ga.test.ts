/**
 * GA4 Analytics 單元測試
 *
 * 驗證重點：
 * 1. arguments 物件而非 Array（GA4 靜默失效的根本原因）
 * 2. transport_type: beacon 設定
 * 3. 初始化 guard（防止重複載入）
 * 4. gtag 未就緒時的靜默略過行為
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// 每個 describe block 透過 vi.resetModules() + 動態 import 取得乾淨的 singleton 狀態
async function importFresh() {
  vi.resetModules();
  return import('@shared/analytics/ga');
}

describe('initGA', () => {
  beforeEach(() => {
    // 清除 window 上的 GA 相關狀態
    delete (window as Partial<Window>).dataLayer;
    delete (window as Partial<Window>).gtag;
    // 移除測試中注入的 script tags
    document.head.querySelectorAll('script[src*="googletagmanager"]').forEach((el) => el.remove());
  });

  it('measurementId 為空時不初始化', async () => {
    const { initGA } = await importFresh();
    initGA('');
    expect(window.dataLayer).toBeUndefined();
    expect(window.gtag).toBeUndefined();
  });

  it('初始化後建立 window.dataLayer', async () => {
    const { initGA } = await importFresh();
    initGA('G-TEST123456');
    expect(window.dataLayer).toBeDefined();
    expect(Array.isArray(window.dataLayer)).toBe(true);
  });

  it('gtag 呼叫使用 arguments 物件而非 Array（防止 GA4 靜默失效）', async () => {
    const { initGA } = await importFresh();
    initGA('G-TEST123456');

    // 清除 initGA 內部產生的呼叫，重設 dataLayer 進行精確驗證
    window.dataLayer = [];
    window.gtag('test-command', 'test-arg');

    const pushed = window.dataLayer[0];

    // 關鍵斷言：arguments 物件不是真 Array
    // 若使用 spread（...args），Array.isArray 會回傳 true，GA4 即失效
    expect(Array.isArray(pushed)).toBe(false);

    // 應為類陣列物件（IArguments），具備 length 與數字索引
    expect(pushed).toHaveProperty('length', 2);
    expect((pushed as IArguments)[0]).toBe('test-command');
    expect((pushed as IArguments)[1]).toBe('test-arg');
  });

  it('config 呼叫包含 transport_type: beacon', async () => {
    const { initGA } = await importFresh();
    initGA('G-TEST123456');

    // 找出 config 呼叫的 arguments 物件
    const configCall = (window.dataLayer as IArguments[]).find((args) => args[0] === 'config');

    expect(configCall).toBeDefined();
    const configOptions = configCall?.[2] as Record<string, unknown>;
    expect(configOptions?.['transport_type']).toBe('beacon');
    expect(configOptions?.['send_page_view']).toBe(false);
    expect(configOptions?.['anonymize_ip']).toBe(true);
  });

  it('注入 gtag.js script 至 document.head', async () => {
    const { initGA } = await importFresh();
    initGA('G-TEST123456');

    const script = document.head.querySelector('script[src*="googletagmanager"]');
    expect(script).not.toBeNull();
    expect(script?.getAttribute('src')).toBe(
      'https://www.googletagmanager.com/gtag/js?id=G-TEST123456',
    );
    // jsdom 中 IDL 屬性（script.async）不反映為 content attribute，
    // 應直接檢查 JS property 而非 hasAttribute
    expect((script as HTMLScriptElement | null)?.async).toBe(true);
  });

  it('重複呼叫不重複初始化（singleton guard）', async () => {
    const { initGA } = await importFresh();
    initGA('G-TEST123456');
    const scriptCountBefore = document.head.querySelectorAll(
      'script[src*="googletagmanager"]',
    ).length;

    initGA('G-ANOTHER111');
    const scriptCountAfter = document.head.querySelectorAll(
      'script[src*="googletagmanager"]',
    ).length;

    // 第二次呼叫不應再注入 script
    expect(scriptCountAfter).toBe(scriptCountBefore);
  });
});

describe('scheduleAfterPageLoad', () => {
  it('readyState 為 complete 時應立即初始化且不註冊 load listener', async () => {
    const { scheduleAfterPageLoad } = await importFresh();
    const task = vi.fn();
    const addEventListener = vi.fn();

    const mode = scheduleAfterPageLoad(
      task,
      { readyState: 'complete' } as Document,
      { addEventListener } as unknown as Window,
    );

    expect(mode).toBe('immediate');
    expect(task).toHaveBeenCalledTimes(1);
    expect(addEventListener).not.toHaveBeenCalled();
  });

  it('readyState 未 complete 時應延後到 load 事件執行', async () => {
    const { scheduleAfterPageLoad } = await importFresh();
    const task = vi.fn();
    const addEventListener = vi.fn();

    const mode = scheduleAfterPageLoad(
      task,
      { readyState: 'interactive' } as Document,
      { addEventListener } as unknown as Window,
    );

    expect(mode).toBe('deferred');
    expect(task).not.toHaveBeenCalled();
    expect(addEventListener).toHaveBeenCalledWith('load', task, { once: true });
  });
});

describe('trackPageview', () => {
  beforeEach(() => {
    delete (window as Partial<Window>).gtag;
  });

  it('gtag 未就緒時靜默略過（不拋出例外）', async () => {
    const { trackPageview } = await importFresh();
    expect(() => trackPageview('/test')).not.toThrow();
  });

  it('送出 page_view 事件含正確路徑與標題', async () => {
    const { initGA, trackPageview } = await importFresh();
    initGA('G-TEST123456');

    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;

    trackPageview('/about', 'About Us');

    expect(gtagSpy).toHaveBeenCalledWith('event', 'page_view', {
      page_path: '/about',
      page_title: 'About Us',
      page_location: window.location.href,
    });
  });

  it('未傳入 title 時使用 document.title', async () => {
    const { initGA, trackPageview } = await importFresh();
    initGA('G-TEST123456');

    document.title = 'RateWise 測試頁';
    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;

    trackPageview('/');

    const callArgs = gtagSpy.mock.calls[0]?.[2] as Record<string, unknown>;
    expect(callArgs?.['page_title']).toBe('RateWise 測試頁');
  });
});

describe('trackEvent', () => {
  beforeEach(() => {
    delete (window as Partial<Window>).gtag;
  });

  it('gtag 未就緒時靜默略過（不拋出例外）', async () => {
    const { trackEvent } = await importFresh();
    expect(() => trackEvent('button_click')).not.toThrow();
  });

  it('送出自訂事件含參數', async () => {
    const { initGA, trackEvent } = await importFresh();
    initGA('G-TEST123456');

    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;

    trackEvent('currency_convert', { from: 'USD', to: 'TWD', amount: 100 });

    expect(gtagSpy).toHaveBeenCalledWith('event', 'currency_convert', {
      from: 'USD',
      to: 'TWD',
      amount: 100,
    });
  });

  it('無 params 時仍正常呼叫', async () => {
    const { initGA, trackEvent } = await importFresh();
    initGA('G-TEST123456');

    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;

    trackEvent('pwa_install');

    expect(gtagSpy).toHaveBeenCalledWith('event', 'pwa_install', undefined);
  });
});
