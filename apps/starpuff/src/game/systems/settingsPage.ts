// 統一設定頁（v19 #819 卡 4）：純 DOM overlay（沿 keyConfig/shellCards 慣例，
// 不進 Phaser Scene），Title 次選單入口開啟。偏好即改即存（UserSettings SSOT），
// 無草稿語意；按鈕配置（鍵位/持向/縮放）維持既有 keyConfig 專頁，由此轉入。
// 容器沿用 .install-overlay class：isShellBusy 天然視為忙碌（PWA 套用/殼卡排隊互斥）。

import { setMuted } from '../audio/mute';
import { vibratePattern } from '../audio/haptics';
import {
  loadSettings,
  updateSettings,
  type ScreenShakePref,
  type UserSettings,
} from '../core/settings';
import { openKeyConfig } from './keyConfig';

let open = false;
let dismiss: (() => void) | null = null;

export function isSettingsPageOpen(): boolean {
  return open;
}

export function closeSettingsPage(): void {
  dismiss?.();
}

type BooleanPref = 'audioMuted' | 'hapticsEnabled' | 'wakeLockEnabled' | 'reducedMotion';

interface ToggleSpec {
  key: BooleanPref;
  label: string;
  // 顯示語意反轉（audioMuted 儲存「靜音」但 UI 呈現「音效」開關）。
  inverted?: boolean;
  onChange?: (enabled: boolean) => void;
}

// 開關列規格（v19 卡 4/11）：音效切換同步 mute 系統；震動開啟時輕震一次即時回饋。
const TOGGLES: ToggleSpec[] = [
  { key: 'audioMuted', label: '音效', inverted: true, onChange: (on) => setMuted(!on) },
  { key: 'hapticsEnabled', label: '震動回饋', onChange: (on) => on && vibratePattern(15) },
  { key: 'wakeLockEnabled', label: '遊戲中螢幕常亮' },
  { key: 'reducedMotion', label: '減少動態效果' },
];

const SHAKE_OPTIONS: { value: ScreenShakePref; label: string }[] = [
  { value: 'off', label: '關' },
  { value: 'low', label: '弱' },
  { value: 'full', label: '全' },
];

function makeRow(label: string): { row: HTMLDivElement; controls: HTMLDivElement } {
  const row = document.createElement('div');
  row.className = 'settings-row';
  const name = document.createElement('div');
  name.className = 'settings-label';
  name.textContent = label;
  row.appendChild(name);
  const controls = document.createElement('div');
  controls.className = 'settings-seg';
  row.appendChild(controls);
  return { row, controls };
}

function addToggleRow(card: HTMLElement, spec: ToggleSpec): void {
  const { row, controls } = makeRow(spec.label);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'settings-btn';
  button.dataset['setting'] = spec.key;
  const enabledOf = (settings: UserSettings): boolean =>
    spec.inverted === true ? !settings[spec.key] : settings[spec.key];
  const render = (): void => {
    const enabled = enabledOf(loadSettings());
    button.textContent = enabled ? '開' : '關';
    button.classList.toggle('is-on', enabled);
    button.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    button.setAttribute('aria-label', `${spec.label}：${enabled ? '開' : '關'}`);
  };
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    const enabled = !enabledOf(loadSettings());
    updateSettings({ [spec.key]: spec.inverted === true ? !enabled : enabled });
    spec.onChange?.(enabled);
    render();
  });
  render();
  controls.appendChild(button);
  card.appendChild(row);
}

function addShakeRow(card: HTMLElement): void {
  const { row, controls } = makeRow('畫面震動');
  const buttons: HTMLButtonElement[] = [];
  const render = (): void => {
    const current = loadSettings().screenShake;
    buttons.forEach((button) => {
      const active = button.dataset['shake'] === current;
      button.classList.toggle('is-on', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  };
  for (const option of SHAKE_OPTIONS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'settings-btn';
    button.dataset['shake'] = option.value;
    button.textContent = option.label;
    button.setAttribute('aria-label', `畫面震動：${option.label}`);
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      updateSettings({ screenShake: option.value });
      render();
    });
    buttons.push(button);
    controls.appendChild(button);
  }
  render();
  card.appendChild(row);
}

export function openSettingsPage(onClose?: () => void): void {
  if (open) return;
  const shell = document.getElementById('game-shell');
  if (!shell) return;
  open = true;

  const overlay = document.createElement('div');
  overlay.className = 'install-overlay settings-overlay';

  const card = document.createElement('div');
  card.className = 'install-card settings-card';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-label', '設定');

  const close = (): void => {
    document.removeEventListener('keydown', onKeyDown);
    overlay.remove();
    open = false;
    dismiss = null;
    onClose?.();
  };
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') close();
  };
  document.addEventListener('keydown', onKeyDown);
  dismiss = close;

  const title = document.createElement('div');
  title.className = 'install-title';
  title.textContent = '設定';
  card.appendChild(title);

  for (const spec of TOGGLES) addToggleRow(card, spec);
  addShakeRow(card);

  // 按鈕配置轉入口（§34）：鍵位/持向/縮放維持 keyConfig 專頁；先收設定頁再開啟。
  const configButton = document.createElement('button');
  configButton.type = 'button';
  configButton.className = 'install-btn';
  configButton.dataset['setting'] = 'key-config';
  configButton.textContent = '按鈕配置（鍵位與持向）';
  configButton.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    close();
    openKeyConfig();
  });
  card.appendChild(configButton);

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'install-btn install-btn-primary';
  closeButton.dataset['setting'] = 'close';
  closeButton.textContent = '完成';
  closeButton.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    close();
  });
  card.appendChild(closeButton);

  overlay.appendChild(card);
  shell.appendChild(overlay);
}
