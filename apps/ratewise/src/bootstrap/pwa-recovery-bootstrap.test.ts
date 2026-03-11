import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '../features/ratewise/storage-keys';

function createStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));

  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    snapshot() {
      return Object.fromEntries(store.entries());
    },
  };
}

function loadBootstrap(appVersion = '2.9.1') {
  const scriptPath = resolve(__dirname, 'pwa-recovery-bootstrap.js');
  return readFileSync(scriptPath, 'utf-8').replace(/__APP_VERSION__/g, appVersion);
}

interface BootstrapContext {
  __RATEWISE_PWA_RECOVERY_PROMISE__?: Promise<boolean>;
  [key: string]: unknown;
}

describe('pwa-recovery-bootstrap', () => {
  it('偵測到舊版 app shell 時會解除註冊、清除快取並重載', async () => {
    const unregisterRatewise = vi.fn().mockResolvedValue(true);
    const unregisterOther = vi.fn().mockResolvedValue(true);
    const reload = vi.fn();
    const deleteCache = vi.fn().mockResolvedValue(true);
    const localStorage = createStorage({
      [STORAGE_KEYS.APP_VERSION]: '2.8.8',
      [STORAGE_KEYS.VERSION_HISTORY]: '["2.8.8"]',
      [STORAGE_KEYS.EXCHANGE_RATES]: '{"USD":30.5}',
      favorites: '["USD"]',
    });
    const context: BootstrapContext = {
      globalThis: undefined as unknown,
      location: { reload },
      navigator: {
        onLine: true,
        serviceWorker: {
          getRegistration: vi.fn().mockResolvedValue(undefined),
          getRegistrations: vi.fn().mockResolvedValue([
            { scope: 'https://app.haotool.org/ratewise/', unregister: unregisterRatewise },
            { scope: 'https://app.haotool.org/other/', unregister: unregisterOther },
          ]),
        },
      },
      caches: {
        keys: vi.fn().mockResolvedValue(['workbox-precache-v2-ratewise', 'third-party-cache']),
        delete: deleteCache,
      },
      localStorage,
      window: undefined as unknown,
      console,
      Promise,
      setTimeout,
      clearTimeout,
    };
    context['globalThis'] = context;
    context['window'] = context;

    vm.createContext(context);
    vm.runInContext(loadBootstrap(), context);
    await context.__RATEWISE_PWA_RECOVERY_PROMISE__;

    expect(unregisterRatewise).toHaveBeenCalledOnce();
    expect(unregisterOther).not.toHaveBeenCalled();
    expect(deleteCache).toHaveBeenCalledWith('workbox-precache-v2-ratewise');
    expect(deleteCache).not.toHaveBeenCalledWith('third-party-cache');
    expect(reload).toHaveBeenCalledOnce();
    expect(localStorage.snapshot()).toEqual({
      favorites: '["USD"]',
      ratewise_pwa_recovery_epoch: '2026-03-11-pwa-hotfix-1',
    });
  });

  it('當前版本已經一致時不應誤清快取', async () => {
    const reload = vi.fn();
    const unregister = vi.fn().mockResolvedValue(true);
    const deleteCache = vi.fn().mockResolvedValue(true);
    const localStorage = createStorage({
      [STORAGE_KEYS.APP_VERSION]: '2.9.1',
      favorites: '["USD"]',
    });
    const context: BootstrapContext = {
      globalThis: undefined as unknown,
      location: { reload },
      navigator: {
        onLine: true,
        serviceWorker: {
          getRegistration: vi.fn().mockResolvedValue(undefined),
          getRegistrations: vi
            .fn()
            .mockResolvedValue([{ scope: 'https://app.haotool.org/ratewise/', unregister }]),
        },
      },
      caches: {
        keys: vi.fn().mockResolvedValue(['workbox-precache-v2-ratewise']),
        delete: deleteCache,
      },
      localStorage,
      window: undefined as unknown,
      console,
      Promise,
      setTimeout,
      clearTimeout,
    };
    context['globalThis'] = context;
    context['window'] = context;

    vm.createContext(context);
    vm.runInContext(loadBootstrap(), context);
    await context.__RATEWISE_PWA_RECOVERY_PROMISE__;

    expect(unregister).not.toHaveBeenCalled();
    expect(deleteCache).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
    expect(localStorage.snapshot()).toEqual({
      [STORAGE_KEYS.APP_VERSION]: '2.9.1',
      favorites: '["USD"]',
    });
  });
});
