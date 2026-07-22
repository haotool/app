// 方向解鎖引導＋桌機操作提示（GAME_DESIGN §87／#817）：
// (a) 直持（旋轉殼態）一次性建議開啟系統方向解鎖、橫持遊玩（鏡頭朝右）；
// (b) 桌機（旋轉殼旁路）首次顯示鍵盤鍵位卡；Title「操作說明」入口可隨時重看。
// 兩卡皆走 shellCards 殼層安靜時刻管線，記憶不重複打擾。

import { isDesktopMode, isPortrait } from './game/core/rotation';
import { showShellCard, whenShellIdle } from './shellCards';

export const ORIENTATION_HINT_KEY = 'sp-orientation-hint';
export const DESKTOP_KEYS_KEY = 'sp-desktop-keys';
const SHOW_DELAY_MS = 2000;

function hasSeen(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function remember(key: string): void {
  try {
    localStorage.setItem(key, '1');
  } catch {
    /* noop */
  }
}

// 桌機鍵位卡：Title 常駐入口與首次自動顯示共用（單一文案來源）。
export function showDesktopKeysCard(onClose?: () => void): void {
  showShellCard(
    {
      title: '鍵盤操作',
      description: '星噗噗支援鍵盤遊玩，隨時可在標題畫面的「操作說明」重看。',
      steps: [
        '← → 移動',
        'Z 跳躍（連按拍翅）',
        'X 點按發射・長按吸入',
        'C 特殊技（引爆星暴／星化變身）',
      ],
      buttons: [{ label: '知道了', primary: true, onPress: (close) => close() }],
    },
    onClose,
  );
}

export function initOrientationGuide(): void {
  // 桌機：首次鍵位卡（一次性）；旋轉殼旁路與虛擬鍵隱藏由 sp-desktop class＋CSS 承擔。
  if (isDesktopMode()) {
    if (hasSeen(DESKTOP_KEYS_KEY)) return;
    whenShellIdle(() => {
      remember(DESKTOP_KEYS_KEY);
      showDesktopKeysCard();
    }, SHOW_DELAY_MS);
    return;
  }
  // 直持：卡片顯示當下仍為 portrait（延遲期間未曾轉橫＝方向鎖定啟發式）才提示。
  if (!isPortrait() || hasSeen(ORIENTATION_HINT_KEY)) return;
  whenShellIdle(() => {
    if (!isPortrait()) return;
    remember(ORIENTATION_HINT_KEY);
    showShellCard({
      title: '橫持遊玩體驗更佳',
      description:
        '建議開啟手機的方向解鎖（關閉直向鎖定），將手機轉橫遊玩——鏡頭朝右即正立。直持也能玩，畫面會自動轉向。',
      buttons: [{ label: '知道了', primary: true, onPress: (close) => close() }],
    });
  }, SHOW_DELAY_MS);
}
