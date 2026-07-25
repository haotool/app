import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// UserSettings SSOT（v19 #819 卡 4）：sp-settings 單鍵 versioned schema，
// migration 吸收 legacy 散鍵（sp-muted/sp-rotation/sp-key-layout）且向後相容不刪除。

let store: Map<string, string>;

function stubStorage(): void {
  store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  });
}

// 模組級快取隔離：每案重載模組（沿 mute.test.ts resetModules 慣例）。
async function loadSettingsModule() {
  vi.resetModules();
  return import('./settings');
}

beforeEach(() => {
  stubStorage();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadSettings（v19 卡 4：預設與 migration）', () => {
  it('無任何既有資料：回預設並落盤 sp-settings v1', async () => {
    const { SETTINGS_SCHEMA_VERSION, SETTINGS_STORAGE_KEY, loadSettings } =
      await loadSettingsModule();
    const settings = loadSettings();
    expect(settings).toMatchObject({
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      audioMuted: false,
      hapticsEnabled: true,
      wakeLockEnabled: true,
      reducedMotion: false,
      screenShake: 'full',
      shellRotation: null,
      keyLayout: null,
    });
    expect(store.has(SETTINGS_STORAGE_KEY)).toBe(true);
  });

  it('migration 吸收 legacy 散鍵並於落盤成功後刪除（單真相，審查 Should-fix）', async () => {
    store.set('sp-muted', '1');
    store.set('sp-rotation', 'cw');
    store.set('sp-key-layout', JSON.stringify({ version: 2, a: { cx: 0.5, cy: 0.5 } }));
    const { loadSettings } = await loadSettingsModule();
    const settings = loadSettings();
    expect(settings.audioMuted).toBe(true);
    expect(settings.shellRotation).toBe('cw');
    expect(settings.keyLayout).toMatchObject({ version: 2 });
    // 單真相：升版落盤成功即刪 legacy，避免主鍵遺失時吸回過期偏好。
    expect(store.has('sp-muted')).toBe(false);
    expect(store.has('sp-rotation')).toBe(false);
    expect(store.has('sp-key-layout')).toBe(false);
  });

  it('migration 落盤失敗（寫入拋錯）：legacy 散鍵保留不刪', async () => {
    const map = new Map<string, string>([['sp-muted', '1']]);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: (key: string) => void map.delete(key),
    });
    const { loadSettings } = await loadSettingsModule();
    expect(loadSettings().audioMuted).toBe(true);
    expect(map.has('sp-muted')).toBe(true);
  });

  it('legacy 值損毀：sp-rotation 非法值回 null、sp-key-layout 壞 JSON 回 null', async () => {
    store.set('sp-rotation', 'sideways');
    store.set('sp-key-layout', '{oops');
    const { loadSettings } = await loadSettingsModule();
    const settings = loadSettings();
    expect(settings.shellRotation).toBeNull();
    expect(settings.keyLayout).toBeNull();
  });

  it('sp-settings 已存在：直接採用且不再讀 legacy 鍵', async () => {
    const first = await loadSettingsModule();
    first.updateSettings({ audioMuted: true, screenShake: 'low' });
    store.set('sp-muted', '0');
    const second = await loadSettingsModule();
    const settings = second.loadSettings();
    expect(settings.audioMuted).toBe(true);
    expect(settings.screenShake).toBe('low');
  });

  it('未知 schema 版本或形狀損毀（無 legacy）：回退預設（不 crash）', async () => {
    store.set('sp-settings', JSON.stringify({ schemaVersion: 99, audioMuted: true }));
    const first = await loadSettingsModule();
    expect(first.loadSettings().audioMuted).toBe(false);
    store.set('sp-settings', '{broken');
    const second = await loadSettingsModule();
    expect(second.loadSettings().schemaVersion).toBe(second.SETTINGS_SCHEMA_VERSION);
  });

  it('主鍵壞 JSON＋legacy 散鍵（審查 Blocking）：回退 migration 吸收且回寫修復主鍵', async () => {
    store.set('sp-settings', '{broken');
    store.set('sp-muted', '1');
    store.set('sp-rotation', 'cw');
    const { SETTINGS_STORAGE_KEY, loadSettings } = await loadSettingsModule();
    const settings = loadSettings();
    expect(settings.audioMuted).toBe(true);
    expect(settings.shellRotation).toBe('cw');
    // 主鍵已被修復回寫：重載模組後直接讀主鍵仍得恢復值。
    expect(JSON.parse(store.get(SETTINGS_STORAGE_KEY) ?? '{}')).toMatchObject({
      audioMuted: true,
      shellRotation: 'cw',
    });
  });

  it('主鍵未知 schemaVersion＋legacy 散鍵：同樣回退 migration 吸收', async () => {
    store.set('sp-settings', JSON.stringify({ schemaVersion: 99 }));
    store.set('sp-muted', '1');
    const { loadSettings } = await loadSettingsModule();
    expect(loadSettings().audioMuted).toBe(true);
  });

  it('欄位收斂：非法 screenShake 回 full、非布林欄位回預設', async () => {
    store.set(
      'sp-settings',
      JSON.stringify({
        schemaVersion: 1,
        audioMuted: 'yes',
        hapticsEnabled: false,
        wakeLockEnabled: true,
        reducedMotion: true,
        screenShake: 'extreme',
        shellRotation: 'ccw',
        keyLayout: null,
      }),
    );
    const { loadSettings } = await loadSettingsModule();
    const settings = loadSettings();
    expect(settings.audioMuted).toBe(false);
    expect(settings.hapticsEnabled).toBe(false);
    expect(settings.reducedMotion).toBe(true);
    expect(settings.screenShake).toBe('full');
    expect(settings.shellRotation).toBe('ccw');
  });

  it('localStorage 不可用：回預設不拋錯，updateSettings 仍更新記憶體快取', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {
        throw new Error('denied');
      },
    });
    const { loadSettings, updateSettings } = await loadSettingsModule();
    expect(loadSettings().audioMuted).toBe(false);
    updateSettings({ audioMuted: true });
    expect(loadSettings().audioMuted).toBe(true);
  });
});

describe('updateSettings 與變更通知', () => {
  it('部分更新：合併現值、落盤、並通知訂閱者', async () => {
    const { SETTINGS_STORAGE_KEY, loadSettings, onSettingsChanged, updateSettings } =
      await loadSettingsModule();
    loadSettings();
    const seen: boolean[] = [];
    const off = onSettingsChanged((settings) => seen.push(settings.reducedMotion));
    updateSettings({ reducedMotion: true });
    expect(seen).toEqual([true]);
    expect(JSON.parse(store.get(SETTINGS_STORAGE_KEY) ?? '{}')).toMatchObject({
      reducedMotion: true,
    });
    // 退訂後不再通知。
    off();
    updateSettings({ reducedMotion: false });
    expect(seen).toEqual([true]);
  });

  it('keyLayout 子樹原樣存取（由 core/layout 負責解析）', async () => {
    const { loadSettings, updateSettings } = await loadSettingsModule();
    const layout = { version: 2, a: { cx: 0.9, cy: 0.7 }, b: { cx: 0.9, cy: 0.3 }, scale: 1 };
    updateSettings({ keyLayout: layout });
    expect(loadSettings().keyLayout).toEqual(layout);
    updateSettings({ keyLayout: null });
    expect(loadSettings().keyLayout).toBeNull();
  });
});
