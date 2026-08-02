// 新手觸控操作提示（GAME_DESIGN §90）：只在「開始一場新遊戲」時消費一次場次，
// 前五場顯示可捲動模態教學卡；設定可永久關閉，關閉後恢復遊戲操作。場次與開關落在
// UserSettings SSOT，DOM 與 Phaser 場景責任分離。
import { bindButtonActivation } from './game/core/domButton';
import { createFocusTrap, type FocusTrap } from './game/core/focusTrap';
import {
  CONTROL_HINT_MAX_SESSIONS,
  loadSettings,
  updateSettings,
  type UserSettings,
} from './game/core/settings';
import { CONTROL_HINTS_ILLUSTRATION_URL } from './onboardingAssets';

const noop = (): void => undefined;

export interface ControlHintSettings {
  controlHintsEnabled: boolean;
  controlHintsPlayCount: number;
}

export function shouldShowControlHints(settings: ControlHintSettings): boolean {
  return settings.controlHintsEnabled && settings.controlHintsPlayCount < CONTROL_HINT_MAX_SESSIONS;
}

export function isTouchCapable(input: {
  maxTouchPoints?: number;
  hasTouchEvent?: boolean;
}): boolean {
  return (input.maxTouchPoints ?? 0) > 0 || input.hasTouchEvent === true;
}

function hasTouchInput(): boolean {
  return isTouchCapable({
    maxTouchPoints: typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints,
    hasTouchEvent: typeof window !== 'undefined' && 'ontouchstart' in window,
  });
}

function appendText(parent: HTMLElement, className: string, text: string): HTMLElement {
  const element = document.createElement('div');
  element.className = className;
  element.textContent = text;
  parent.appendChild(element);
  return element;
}

function appendHintItem(list: HTMLOListElement, text: string): void {
  const item = document.createElement('li');
  item.dataset['controlHint'] = 'item';
  item.textContent = text;
  list.appendChild(item);
}

function consumeSession(): boolean {
  const settings = loadSettings();
  if (!hasTouchInput() || !shouldShowControlHints(settings)) return false;
  updateSettings({
    controlHintsPlayCount: Math.min(CONTROL_HINT_MAX_SESSIONS, settings.controlHintsPlayCount + 1),
  });
  return true;
}

export function showControlHintsForSession(): () => void {
  const shell = document.getElementById('game-shell');
  const modalRoot = document.body ?? shell;
  if (!shell || !modalRoot || document.querySelector('.control-hints-card')) return noop;
  if (!consumeSession()) return noop;

  const overlay = document.createElement('div');
  overlay.className = 'control-hints-overlay';
  overlay.dataset['controlHints'] = 'overlay';

  const card = document.createElement('section');
  card.className = 'control-hints-card';
  card.dataset['controlHints'] = 'card';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-label', '觸控操作小提示');

  let focusTrap: FocusTrap | null = null;

  const art = document.createElement('img');
  art.className = 'control-hints-art';
  art.src = CONTROL_HINTS_ILLUSTRATION_URL;
  art.alt = '噗噗吸入星星、吐出星星與跳躍，旁邊有殼殼和操作按鈕';
  art.decoding = 'async';
  card.appendChild(art);

  appendText(card, 'control-hints-title', '第一次上手小貼士');
  appendText(card, 'control-hints-desc', '先記住手指分工，讀招與走位就能靠技巧通關。');

  const list = document.createElement('ol');
  list.className = 'control-hints-list';
  appendHintItem(list, '左手大拇指：搖桿控制左右走位');
  appendHintItem(list, '右手大拇指：A 鍵跳躍');
  appendHintItem(list, '右手食指：B 鍵長按吸入；放開或短按吐出');
  appendHintItem(list, 'B 鍵長按可以連續吸取多隻星星');
  appendHintItem(list, '設定可永久關閉提示，也能進入按鈕配置調整位置');
  card.appendChild(list);

  const actions = document.createElement('div');
  actions.className = 'control-hints-actions';
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'install-btn install-btn-primary';
  closeButton.dataset['controlHints'] = 'close';
  closeButton.textContent = '開始玩';
  const disableButton = document.createElement('button');
  disableButton.type = 'button';
  disableButton.className = 'install-btn';
  disableButton.dataset['controlHints'] = 'disable';
  disableButton.textContent = '不再提示';
  actions.append(closeButton, disableButton);
  card.appendChild(actions);

  let closed = false;
  const close = (): void => {
    if (closed) return;
    closed = true;
    card.removeEventListener('keydown', onKeyDown);
    focusTrap?.release();
    focusTrap = null;
    overlay.remove();
  };
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') close();
  };
  card.addEventListener('keydown', onKeyDown);
  bindButtonActivation(closeButton, close);
  bindButtonActivation(disableButton, () => {
    updateSettings({ controlHintsEnabled: false });
    close();
  });

  overlay.appendChild(card);
  // 與設定頁一致掛在 viewport root；若留在旋轉殼內，直持時教學文字會跟著殼
  // 旋轉，且卡片內捲動方向與玩家看到的上下方向相反。
  modalRoot.appendChild(overlay);
  // aria-modal 必須與實際互動一致：教學卡可在矮橫式視窗內捲動，但未按「開始玩」前
  // 不讓搖桿／按鍵穿透卡片，避免玩家一邊讀提示一邊誤觸遊戲；焦點也限制在卡內。
  focusTrap = createFocusTrap(card);
  return close;
}

// 供測試／場景邊界確認保存狀態形狀；不暴露 DOM 細節。
export function controlHintSettingsOf(settings: UserSettings): ControlHintSettings {
  return {
    controlHintsEnabled: settings.controlHintsEnabled,
    controlHintsPlayCount: settings.controlHintsPlayCount,
  };
}
