// 直持方向變更一次性告知（GAME_DESIGN §87／審查 M1）：v14 翻轉預設方向，
// 回訪玩家（有存檔進度且未曾設定持向偏好）首次進站告知並提供一鍵切回，
// 保護肌肉記憶；全新玩家無感知不打擾。

import { ROTATION_STORAGE_KEY, applyRotationClass, saveRotationPref } from './game/core/rotation';
import { loadSave } from './game/core/save';
import { showShellCard, whenShellIdle } from './shellCards';

export const ROTATION_NOTICE_KEY = 'sp-rotation-notice';
const SHOW_DELAY_MS = 1600;

function hasShownNotice(): boolean {
  try {
    return localStorage.getItem(ROTATION_NOTICE_KEY) === '1';
  } catch {
    return false;
  }
}

function rememberShownNotice(): void {
  try {
    localStorage.setItem(ROTATION_NOTICE_KEY, '1');
  } catch {
    /* noop */
  }
}

function hasStoredRotationPref(): boolean {
  try {
    return localStorage.getItem(ROTATION_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

function isReturningPlayer(): boolean {
  const save = loadSave();
  return save.lastPlayedAt > 0 || save.highestClearedLevel > 0;
}

export function initRotationNotice(): void {
  if (hasShownNotice() || hasStoredRotationPref() || !isReturningPlayer()) return;

  whenShellIdle(() => {
    rememberShownNotice();
    showShellCard({
      title: '直持方向更新了',
      description:
        '直立拿手機時，畫面改為向右轉（鏡頭朝右）。若習慣原本的方向，可立即切回，之後也能在「按鈕配置」調整。',
      buttons: [
        {
          label: '使用新方向',
          primary: true,
          onPress: (close) => close(),
        },
        {
          label: '切回舊方向',
          onPress: (close) => {
            saveRotationPref('cw');
            applyRotationClass('cw');
            close();
          },
        },
      ],
    });
  }, SHOW_DELAY_MS);
}
