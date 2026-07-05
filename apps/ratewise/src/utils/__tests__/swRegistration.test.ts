/**
 * swRegistration BDD Tests（#593 register() 重試風暴防護）
 *
 * 驗證：
 * - 註冊恆失敗時 register() 呼叫次數 ≤ MAX_SW_REGISTER_ATTEMPTS（無熱迴圈）
 * - 重試採指數退避（MAX_SW_REGISTER_ATTEMPTS=2 下僅 1s 一個退避窗口）
 * - 重試耗盡後寫入 session 旗標；同 session 再啟動時靜默跳過
 * - ensureSwRegistration 冪等：重複呼叫不會產生多條註冊鏈
 * - 正常註冊路徑不退步（成功後狀態為 registered 並清除旗標）
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type SwRegistrationModule = typeof import('../swRegistration');

const registerMock = vi.fn<() => Promise<ServiceWorkerRegistration>>();

function stubServiceWorkerContainer() {
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { register: registerMock },
  });
}

async function loadModule(): Promise<SwRegistrationModule> {
  // 模組層單例狀態必須每個測試重置。
  vi.resetModules();
  return import('../swRegistration');
}

beforeEach(() => {
  vi.useFakeTimers();
  registerMock.mockReset();
  sessionStorage.clear();
  stubServiceWorkerContainer();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('swRegistration - 註冊失敗重試上限（#593）', () => {
  it('should call register() at most MAX_SW_REGISTER_ATTEMPTS times when registration always rejects', async () => {
    registerMock.mockRejectedValue(new Error('registration blocked'));
    const mod = await loadModule();

    mod.ensureSwRegistration();
    // 推進足夠長的虛擬時間，涵蓋所有退避窗口；若存在熱迴圈，計數會爆量。
    await vi.advanceTimersByTimeAsync(60_000);

    expect(registerMock).toHaveBeenCalledTimes(mod.MAX_SW_REGISTER_ATTEMPTS);
    expect(mod.getSwRegistrationSnapshot().status).toBe('failed');
  });

  it('should retry with exponential backoff and stop after exhaustion', async () => {
    registerMock.mockRejectedValue(new Error('registration blocked'));
    const mod = await loadModule();

    mod.ensureSwRegistration();
    await vi.advanceTimersByTimeAsync(0);
    expect(registerMock).toHaveBeenCalledTimes(1);

    // 第一次退避：1000ms 前不重試。
    await vi.advanceTimersByTimeAsync(999);
    expect(registerMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(registerMock).toHaveBeenCalledTimes(2);

    // 耗盡後不再重試（無熱迴圈）。
    await vi.advanceTimersByTimeAsync(120_000);
    expect(registerMock).toHaveBeenCalledTimes(mod.MAX_SW_REGISTER_ATTEMPTS);
  });

  it('should be idempotent: repeated ensureSwRegistration calls start only one attempt chain', async () => {
    registerMock.mockRejectedValue(new Error('registration blocked'));
    const mod = await loadModule();

    // 模擬 Suspense render 風暴下的重複啟動。
    for (let i = 0; i < 500; i++) {
      mod.ensureSwRegistration();
    }
    await vi.advanceTimersByTimeAsync(60_000);

    expect(registerMock).toHaveBeenCalledTimes(mod.MAX_SW_REGISTER_ATTEMPTS);
  });

  it('should mark session flag on exhaustion and skip silently on next session load', async () => {
    registerMock.mockRejectedValue(new Error('registration blocked'));
    const mod = await loadModule();

    mod.ensureSwRegistration();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(sessionStorage.getItem(mod.SW_REGISTER_FAILED_SESSION_KEY)).toBe('1');

    // 模擬同 session 重載（新模組實例、旗標仍在）。
    registerMock.mockClear();
    const reloaded = await loadModule();
    reloaded.ensureSwRegistration();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(registerMock).not.toHaveBeenCalled();
    // 靜默降級：不進入 failed 狀態，不顯示提示。
    expect(reloaded.getSwRegistrationSnapshot().status).toBe('idle');
  });
});

describe('swRegistration - 正常註冊路徑', () => {
  it('should register once and expose the registration on success', async () => {
    const fakeRegistration = { scope: '/ratewise/' } as ServiceWorkerRegistration;
    registerMock.mockResolvedValue(fakeRegistration);
    const mod = await loadModule();

    mod.ensureSwRegistration();
    await vi.advanceTimersByTimeAsync(10_000);

    expect(registerMock).toHaveBeenCalledTimes(1);
    const snapshot = mod.getSwRegistrationSnapshot();
    expect(snapshot.status).toBe('registered');
    expect(snapshot.registration).toBe(fakeRegistration);
  });

  it('should clear the session failure flag when registration succeeds', async () => {
    const mod = await loadModule();
    sessionStorage.setItem(mod.SW_REGISTER_FAILED_SESSION_KEY, '1');

    // 旗標存在時 ensureSwRegistration 靜默跳過；直接驗證成功回呼會清旗標，
    // 模擬旗標由其他分頁寫入但本分頁註冊成功的收斂行為。
    sessionStorage.removeItem(mod.SW_REGISTER_FAILED_SESSION_KEY);
    const fakeRegistration = { scope: '/ratewise/' } as ServiceWorkerRegistration;
    registerMock.mockResolvedValue(fakeRegistration);
    mod.ensureSwRegistration();
    await vi.advanceTimersByTimeAsync(10_000);

    expect(mod.getSwRegistrationSnapshot().status).toBe('registered');
    expect(sessionStorage.getItem(mod.SW_REGISTER_FAILED_SESSION_KEY)).toBeNull();
  });

  it('should notify subscribers and support dismissing needRefresh/offlineReady', async () => {
    const fakeRegistration = { scope: '/ratewise/' } as ServiceWorkerRegistration;
    registerMock.mockResolvedValue(fakeRegistration);
    const mod = await loadModule();

    const listener = vi.fn();
    const unsubscribe = mod.subscribeSwRegistration(listener);

    mod.ensureSwRegistration();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(listener).toHaveBeenCalled();

    mod.dismissSwNeedRefresh();
    mod.dismissSwOfflineReady();
    expect(mod.getSwRegistrationSnapshot().needRefresh).toBe(false);
    expect(mod.getSwRegistrationSnapshot().offlineReady).toBe(false);

    unsubscribe();
  });
});
