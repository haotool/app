// 方向解鎖引導＋桌機操作提示（GAME_DESIGN §87／#817）：
// (a) 直持（旋轉殼態）在尚未觀測到橫持的造訪中建議開啟系統方向解鎖、橫持遊玩（鏡頭朝右）；
// (b) 桌機（旋轉殼旁路）首次顯示鍵盤鍵位卡；Title「操作說明」入口可隨時重看。
// 桌機鍵位卡走 shellCards 殼層安靜時刻管線；方向提示是 body-level 非模態 coachmark，直到真實
// 轉橫才停止。兩者都不把「看過卡片」誤當成已完成方向設定。

import { bindButtonActivation } from './game/core/domButton';
import { isDesktopMode, isHybridKeyboardEnvironment, isPortrait } from './game/core/rotation';
import { positionLearningCoachmark } from './game/systems/learningCoachmark';
import { hasDismissedInstallGuide, readPwaInstallEnvironmentFromBrowser } from './installGuide';
import { showShellCard, whenShellIdle } from './shellCards';

// 舊版此鍵在卡片「顯示」時就寫入，無法證明玩家真的轉過橫向；新鍵只代表已觀測到
// landscape。舊鍵不再作為免打擾依據，避免既有玩家被錯誤永久抑制方向提示。
export const ORIENTATION_HINT_KEY = 'sp-orientation-landscape-seen';
const LEGACY_ORIENTATION_HINT_KEY = 'sp-orientation-hint';
export const DESKTOP_KEYS_KEY = 'sp-desktop-keys';
const SHOW_DELAY_MS = 2000;
let orientationRoot: HTMLDivElement | null = null;
let orientationGuideInitialized = false;

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

function forgetLegacyOrientationHint(): void {
  try {
    localStorage.removeItem(LEGACY_ORIENTATION_HINT_KEY);
  } catch {
    /* noop */
  }
}

function canTryUnlockOrientation(): boolean {
  return (
    typeof screen !== 'undefined' &&
    'orientation' in screen &&
    typeof screen.orientation?.unlock === 'function'
  );
}

function showOrientationCoachmark(onClose?: () => void): () => void {
  if (orientationRoot) {
    const existingRoot = orientationRoot;
    return () => {
      if (orientationRoot === existingRoot) orientationRoot = null;
      existingRoot.remove();
      onClose?.();
    };
  }
  const root = document.createElement('div');
  root.className = 'orientation-coachmark-layer';
  root.dataset['orientationCoachmark'] = 'true';
  root.setAttribute('aria-live', 'polite');

  const card = document.createElement('aside');
  card.className = 'orientation-coachmark';
  card.setAttribute('role', 'status');
  card.dataset['orientationCard'] = 'true';

  const visual = document.createElement('div');
  visual.className = 'orientation-coachmark-visual';
  visual.setAttribute('aria-hidden', 'true');
  const phone = document.createElement('span');
  phone.className = 'orientation-phone';
  phone.dataset['orientationAnimation'] = 'rotate-phone';
  const phoneScreen = document.createElement('span');
  phoneScreen.className = 'orientation-phone-screen';
  phone.appendChild(phoneScreen);
  visual.appendChild(phone);
  card.appendChild(visual);

  const copy = document.createElement('div');
  copy.className = 'orientation-coachmark-copy';
  const title = document.createElement('strong');
  title.className = 'orientation-coachmark-title';
  title.textContent = '建議橫持遊玩';
  copy.appendChild(title);
  const description = document.createElement('p');
  description.className = 'orientation-coachmark-desc';
  description.textContent = canTryUnlockOrientation()
    ? '解除直向鎖定，將手機轉 90°。'
    : '到控制中心關閉直向鎖定，再將手機轉 90°。';
  copy.appendChild(description);
  card.appendChild(copy);

  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'orientation-coachmark-button';
  action.dataset['orientationAction'] = 'unlock';
  action.textContent = canTryUnlockOrientation() ? '嘗試解除' : '知道了';
  let closed = false;
  let gameStartWatcher: MutationObserver | null = null;
  const close = (): void => {
    if (closed) return;
    closed = true;
    gameStartWatcher?.disconnect();
    gameStartWatcher = null;
    orientationRoot = null;
    root.remove();
    onClose?.();
  };
  bindButtonActivation(action, () => {
    if (canTryUnlockOrientation()) {
      try {
        screen.orientation.unlock();
      } catch {
        // 部分瀏覽器只允許在 fullscreen／user gesture 中呼叫，失敗時保留手動說明。
      }
    }
    close();
  });
  card.appendChild(action);
  root.appendChild(card);
  document.body.appendChild(root);
  orientationRoot = root;
  // 方向卡只屬於殼層入口提示；玩家一旦開始遊戲就自動收起，避免和 guided
  // coachmark 疊在同一個視線區。若玩家仍維持直持，下一次重新載入／回訪再提示。
  const controls = document.getElementById('controls');
  if (controls) {
    gameStartWatcher = new MutationObserver(() => {
      if (controls.classList.contains('is-active')) close();
    });
    gameStartWatcher.observe(controls, { attributes: true, attributeFilter: ['class'] });
  }
  // 直持時避開瀏覽器頂端工具列與遊戲殼的視線焦點；不放在最上緣，讓提示在
  // 行動裝置可視區內穩定可見，同時由 learningCoachmark 的控制區避讓邏輯校正。
  positionLearningCoachmark(root, undefined, 'safe-top');
  return close;
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

export function initOrientationGuide(embeddedGuideConfirmedInSession = false): void {
  if (orientationGuideInitialized) return;

  const { inAppBrowser } = readPwaInstallEnvironmentFromBrowser();
  // 內建瀏覽器的第一優先任務是「外開」；不要同時先顯示方向卡，避免 LINE／Threads
  // 使用者必須先關掉不相關提示才能找到正確的右下角選單操作。外開卡被使用者關閉
  // 後則允許方向引導接續顯示，且以同一個 localStorage 記憶讓重新載入也能接續。
  if (inAppBrowser !== null && !hasDismissedInstallGuide() && !embeddedGuideConfirmedInSession)
    return;
  orientationGuideInitialized = true;

  // 桌機：首次鍵位卡（一次性）；旋轉殼旁路與虛擬鍵隱藏由 sp-desktop class＋CSS 承擔。
  // 觸控筆電（#839 雙模並存）：虛擬鍵照舊，僅補同一張鍵位卡告知可用鍵盤。
  if (isDesktopMode() || isHybridKeyboardEnvironment()) {
    if (hasSeen(DESKTOP_KEYS_KEY)) return;
    whenShellIdle(() => {
      remember(DESKTOP_KEYS_KEY);
      showDesktopKeysCard();
    }, SHOW_DELAY_MS);
    return;
  }

  // 直持：記錄真實旋轉事件。使用者已經轉過橫向時，代表他知道如何遊玩，
  // 後續不再用方向卡打斷；若卡片已出現，轉橫即收卡。
  let observedLandscape = !isPortrait();
  let closeCard: (() => void) | null = null;
  const onOrientationChange = (): void => {
    if (isPortrait()) return;
    observedLandscape = true;
    remember(ORIENTATION_HINT_KEY);
    closeCard?.();
    closeCard = null;
  };
  window.addEventListener('resize', onOrientationChange, { passive: true });
  window.addEventListener('orientationchange', onOrientationChange, { passive: true });
  const orientationMedia = window.matchMedia('(orientation: portrait)');
  if (typeof orientationMedia.addEventListener === 'function') {
    orientationMedia.addEventListener('change', onOrientationChange);
  } else {
    orientationMedia.addListener(onOrientationChange);
  }

  if (!isPortrait() || hasSeen(ORIENTATION_HINT_KEY)) return;
  // 舊版值只代表「曾看過提示」，不是「曾轉過橫向」；清掉後讓本次直持造訪
  // 重新收到一次可讀的方向建議。真正轉橫才會寫入新鍵並停止後續提示。
  forgetLegacyOrientationHint();
  whenShellIdle(() => {
    if (!isPortrait() || observedLandscape) return;
    closeCard = showOrientationCoachmark(() => {
      closeCard = null;
    });
  }, SHOW_DELAY_MS);
}
