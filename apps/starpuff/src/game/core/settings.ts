// 使用者偏好 SSOT（v19 #819 卡 4）：散落 localStorage 鍵收斂為 sp-settings 單鍵
// versioned schema；migration 一次性吸收 legacy 散鍵（sp-muted/sp-rotation/sp-key-layout），
// 落盤成功即刪 legacy（單真相，見 removeLegacyKeys）。純資料模組（不 import phaser），
// vitest 對象。已知限制：偏好經記憶體快取、無 storage event 跨分頁同步——多分頁併發
// 寫入為 last-writer-wins（遊戲為單分頁互動情境，接受此限制）。
// one-shot 記憶鍵（sp-rotation-notice/sp-install-dismissed/sp-jump-hint 等）非偏好，不入本 schema。

export type ScreenShakePref = 'off' | 'low' | 'full';
export type ShellRotationSetting = 'cw' | 'ccw';

export interface UserSettings {
  schemaVersion: number;
  audioMuted: boolean;
  hapticsEnabled: boolean;
  wakeLockEnabled: boolean;
  reducedMotion: boolean;
  screenShake: ScreenShakePref;
  // null＝從未選擇（rotationNotice 依此判定是否需一次性告知）。
  shellRotation: ShellRotationSetting | null;
  // 虛擬鍵自訂布局子樹（core/layout parseLayoutValue 負責解析與夾限）；null＝預設態
  // 不落盤語意（§95 D1：直橫持各自動態解析預設）。
  keyLayout: unknown;
}

export const SETTINGS_STORAGE_KEY = 'sp-settings';
export const SETTINGS_SCHEMA_VERSION = 1;

// legacy 散鍵（v19 前世代 migration 來源；字面值即歷史 SSOT，不得改動）。
const LEGACY_MUTE_KEY = 'sp-muted';
const LEGACY_ROTATION_KEY = 'sp-rotation';
const LEGACY_LAYOUT_KEY = 'sp-key-layout';

// reducedMotion 預設尊重系統偏好（WCAG 2.3.3）；非瀏覽器環境回 false。
function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function createDefaultSettings(): UserSettings {
  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    audioMuted: false,
    hapticsEnabled: true,
    wakeLockEnabled: true,
    reducedMotion: prefersReducedMotion(),
    screenShake: 'full',
    shellRotation: null,
    keyLayout: null,
  };
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asScreenShake(value: unknown): ScreenShakePref {
  return value === 'off' || value === 'low' || value === 'full' ? value : 'full';
}

function asShellRotation(value: unknown): ShellRotationSetting | null {
  return value === 'cw' || value === 'ccw' ? value : null;
}

// 解析持久化 JSON：欄位逐一收斂（損毀值回預設）；未知版本或形狀損毀回 null 由
// 呼叫端回退預設（沿 core/layout parse/fallback 慣例）。
export function parseSettings(raw: string): UserSettings | null {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;
  if (data['schemaVersion'] !== SETTINGS_SCHEMA_VERSION) return null;
  const defaults = createDefaultSettings();
  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    audioMuted: asBoolean(data['audioMuted'], defaults.audioMuted),
    hapticsEnabled: asBoolean(data['hapticsEnabled'], defaults.hapticsEnabled),
    wakeLockEnabled: asBoolean(data['wakeLockEnabled'], defaults.wakeLockEnabled),
    reducedMotion: asBoolean(data['reducedMotion'], defaults.reducedMotion),
    screenShake: asScreenShake(data['screenShake']),
    shellRotation: asShellRotation(data['shellRotation']),
    keyLayout:
      typeof data['keyLayout'] === 'object' && data['keyLayout'] !== null
        ? data['keyLayout']
        : null,
  };
}

// 一次性 migration（v19 卡 4）：吸收 legacy 散鍵為初始值；legacy 值損毀逐項回預設。
function migrateFromLegacy(): UserSettings {
  const settings = createDefaultSettings();
  try {
    settings.audioMuted = localStorage.getItem(LEGACY_MUTE_KEY) === '1';
    settings.shellRotation = asShellRotation(localStorage.getItem(LEGACY_ROTATION_KEY));
    const rawLayout = localStorage.getItem(LEGACY_LAYOUT_KEY);
    if (rawLayout !== null) {
      try {
        const layout: unknown = JSON.parse(rawLayout);
        settings.keyLayout = typeof layout === 'object' && layout !== null ? layout : null;
      } catch {
        settings.keyLayout = null;
      }
    }
  } catch {
    /* 隱私模式：維持預設。 */
  }
  return settings;
}

// 記憶體快取：getShellRotation 等熱路徑經由本模組取值，避免每次同步讀 localStorage。
let cached: UserSettings | null = null;
const listeners = new Set<(settings: UserSettings) => void>();

function persist(settings: UserSettings): boolean {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

// 單真相收斂（審查 Should-fix）：升版落盤成功即刪 legacy 散鍵——舊版回滾非支援
// 發佈路徑（PWA 部署單向前進），殘留舊值反而會在主鍵遺失時被 migration 吸回過期偏好。
// 僅在 persist 成功後呼叫：寫入失敗（隱私模式/配額滿）保留 legacy 作下次開機來源。
function removeLegacyKeys(): void {
  try {
    localStorage.removeItem(LEGACY_MUTE_KEY);
    localStorage.removeItem(LEGACY_ROTATION_KEY);
    localStorage.removeItem(LEGACY_LAYOUT_KEY);
  } catch {
    /* noop */
  }
}

export function loadSettings(): UserSettings {
  if (cached !== null) return cached;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
  } catch {
    cached = createDefaultSettings();
    return cached;
  }
  if (raw !== null) {
    const parsed = parseSettings(raw);
    if (parsed !== null) {
      cached = parsed;
      return cached;
    }
    // 主鍵損毀（審查 Blocking）：回退 legacy 散鍵吸收（存在即恢復偏好，缺席等同預設），
    // 並回寫修復主鍵——不再默默以預設覆蓋使用者偏好。
    cached = migrateFromLegacy();
    if (persist(cached)) removeLegacyKeys();
    return cached;
  }
  cached = migrateFromLegacy();
  // 落盤即完成升版；成功後刪除 legacy 散鍵（單真相）。
  if (persist(cached)) removeLegacyKeys();
  return cached;
}

export function updateSettings(patch: Partial<Omit<UserSettings, 'schemaVersion'>>): UserSettings {
  const next: UserSettings = {
    ...loadSettings(),
    ...patch,
    schemaVersion: SETTINGS_SCHEMA_VERSION,
  };
  cached = next;
  persist(next);
  listeners.forEach((listener) => listener(next));
  return next;
}

// 變更訂閱（wakeLock 等需即時重同步的消費者）；回傳退訂函式。
export function onSettingsChanged(listener: (settings: UserSettings) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
