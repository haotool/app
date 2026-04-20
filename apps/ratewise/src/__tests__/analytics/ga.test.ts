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

    document.title = '測試頁';
    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;

    trackPageview('/');

    const callArgs = gtagSpy.mock.calls[0]?.[2] as Record<string, unknown>;
    expect(callArgs?.['page_title']).toBe('測試頁');
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

describe('detectAiSource', () => {
  it('utm_source=chatgpt.com 優先於 referrer', async () => {
    const { detectAiSource } = await importFresh();
    const result = detectAiSource(
      'https://app.haotool.org/ratewise/?utm_source=chatgpt.com',
      'https://www.google.com/',
    );
    expect(result).toEqual({ id: 'chatgpt', medium: 'utm', raw: 'chatgpt.com' });
  });

  it('referrer host 命中 perplexity.ai', async () => {
    const { detectAiSource } = await importFresh();
    const result = detectAiSource(
      'https://app.haotool.org/ratewise/',
      'https://www.perplexity.ai/search?q=twd',
    );
    expect(result?.id).toBe('perplexity');
    expect(result?.medium).toBe('referrer');
  });

  it('referrer host claude.ai 命中 claude', async () => {
    const { detectAiSource } = await importFresh();
    const result = detectAiSource('https://app.haotool.org/', 'https://claude.ai/chat/abc');
    expect(result?.id).toBe('claude');
  });

  it('非 AI referrer 回傳 null', async () => {
    const { detectAiSource } = await importFresh();
    expect(detectAiSource('https://app.haotool.org/', 'https://www.google.com/')).toBeNull();
    expect(detectAiSource('https://app.haotool.org/', '')).toBeNull();
  });

  it('非法 URL 與 referrer 安全 fallback 回 null', async () => {
    const { detectAiSource } = await importFresh();
    expect(detectAiSource('not-a-url', 'also-not-a-url')).toBeNull();
  });

  it('copilot.microsoft.com referrer 命中 copilot', async () => {
    const { detectAiSource } = await importFresh();
    const result = detectAiSource(
      'https://app.haotool.org/ratewise/',
      'https://copilot.microsoft.com/chats/abc',
    );
    expect(result?.id).toBe('copilot');
    expect(result?.medium).toBe('referrer');
  });

  it('bing.com 一般搜尋不應被誤判為 copilot（避免污染 ai_source）', async () => {
    const { detectAiSource } = await importFresh();
    expect(
      detectAiSource('https://app.haotool.org/ratewise/', 'https://www.bing.com/search?q=twd+usd'),
    ).toBeNull();
    expect(detectAiSource('https://app.haotool.org/ratewise/', 'https://www.bing.com/')).toBeNull();
  });

  it('bing.com/chat 或 /copilotsearch 路徑才視為 copilot referral', async () => {
    const { detectAiSource } = await importFresh();
    const chat = detectAiSource(
      'https://app.haotool.org/ratewise/',
      'https://www.bing.com/chat?q=twd',
    );
    expect(chat?.id).toBe('copilot');
    expect(chat?.raw).toContain('/chat');

    const copilotSearch = detectAiSource(
      'https://app.haotool.org/ratewise/',
      'https://www.bing.com/copilotsearch?q=twd',
    );
    expect(copilotSearch?.id).toBe('copilot');
  });

  it('utm_source=bing.com 一般搜尋不應觸發 copilot 分類', async () => {
    const { detectAiSource } = await importFresh();
    const result = detectAiSource('https://app.haotool.org/ratewise/?utm_source=bing.com', '');
    expect(result).toBeNull();
  });
});

describe('trackAiReferral', () => {
  beforeEach(() => {
    delete (window as Partial<Window>).gtag;
    window.sessionStorage.clear();
  });

  it('gtag 未就緒時靜默略過（不拋出例外）', async () => {
    const { trackAiReferral } = await importFresh();
    expect(() => trackAiReferral()).not.toThrow();
  });

  it('非 AI referrer 不送 ai_referral 事件，但主動清除 ai_source user property', async () => {
    const { initGA, trackAiReferral } = await importFresh();
    initGA('G-TEST123456');
    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;
    Object.defineProperty(document, 'referrer', { value: '', configurable: true });

    trackAiReferral();

    // 不送 ai_referral 事件
    const eventCalls = gtagSpy.mock.calls.filter((args) => args[0] === 'event');
    expect(eventCalls).toHaveLength(0);
    // 主動 reset ai_source 為 null，避免跨 session 殘留前次歸因
    expect(gtagSpy).toHaveBeenCalledWith('set', 'user_properties', { ai_source: null });
  });

  it('非 AI 同 session 第二次呼叫不再 reset（避免覆寫當下狀態）', async () => {
    const { initGA, trackAiReferral } = await importFresh();
    initGA('G-TEST123456');
    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;
    Object.defineProperty(document, 'referrer', { value: '', configurable: true });

    trackAiReferral();
    trackAiReferral();

    const setCalls = gtagSpy.mock.calls.filter((args) => args[0] === 'set');
    expect(setCalls).toHaveLength(1);
  });

  it('同 tab 先直接進站、後從 AI 來源再進站 → 仍應送 ai_referral 事件', async () => {
    const { initGA, trackAiReferral } = await importFresh();
    initGA('G-TEST123456');
    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;

    // 第一次：直接進站
    Object.defineProperty(document, 'referrer', { value: '', configurable: true });
    trackAiReferral();

    // 第二次（同 tab reload / 新頁面）：從 ChatGPT 來
    Object.defineProperty(document, 'referrer', {
      value: 'https://chatgpt.com/share/abc',
      configurable: true,
    });
    trackAiReferral();

    const eventCalls = gtagSpy.mock.calls.filter((args) => args[0] === 'event');
    expect(eventCalls).toHaveLength(1);
    expect(eventCalls[0]?.[1]).toBe('ai_referral');
    const params = eventCalls[0]?.[2] as Record<string, unknown>;
    expect(params?.['ai_source']).toBe('chatgpt');
  });

  it('同 tab 從 ChatGPT 進站後，換到 Perplexity 應再次觸發 ai_referral', async () => {
    const { initGA, trackAiReferral } = await importFresh();
    initGA('G-TEST123456');
    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;

    Object.defineProperty(document, 'referrer', {
      value: 'https://chatgpt.com/share/abc',
      configurable: true,
    });
    trackAiReferral();

    Object.defineProperty(document, 'referrer', {
      value: 'https://www.perplexity.ai/',
      configurable: true,
    });
    trackAiReferral();

    const eventCalls = gtagSpy.mock.calls.filter((args) => args[0] === 'event');
    expect(eventCalls.map((args) => (args[2] as { ai_source?: string })?.ai_source)).toEqual([
      'chatgpt',
      'perplexity',
    ]);
  });

  it('命中 chatgpt referrer 送出 ai_referral 事件並設 user_property', async () => {
    const { initGA, trackAiReferral } = await importFresh();
    initGA('G-TEST123456');
    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;
    Object.defineProperty(document, 'referrer', {
      value: 'https://chatgpt.com/share/abc',
      configurable: true,
    });

    trackAiReferral();

    expect(gtagSpy).toHaveBeenCalledWith('set', 'user_properties', { ai_source: 'chatgpt' });
    const eventCall = gtagSpy.mock.calls.find((args) => args[0] === 'event');
    expect(eventCall?.[1]).toBe('ai_referral');
    const params = eventCall?.[2] as Record<string, unknown>;
    expect(params?.['ai_source']).toBe('chatgpt');
    expect(params?.['ai_medium']).toBe('referrer');
  });

  it('同 session 只送一次（sessionStorage 去重）', async () => {
    const { initGA, trackAiReferral } = await importFresh();
    initGA('G-TEST123456');
    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;
    Object.defineProperty(document, 'referrer', {
      value: 'https://perplexity.ai/',
      configurable: true,
    });

    trackAiReferral();
    trackAiReferral();

    const eventCalls = gtagSpy.mock.calls.filter((args) => args[0] === 'event');
    expect(eventCalls).toHaveLength(1);
  });
});
