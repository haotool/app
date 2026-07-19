// 殼層一次性卡片基建（GAME_DESIGN §93/§95）：安裝指引與方向變更告知共用。
// 卡片僅在「殼層安靜時刻」顯示——遊戲進行中／配置中／暫停選單開啟／已有他卡時延後，
// 杜絕戰鬥中彈窗攔截操作（審查 B1 根修）。

export interface ShellCardButton {
  label: string;
  primary?: boolean;
  onPress: (close: () => void) => void;
}

export interface ShellCardOptions {
  title: string;
  description: string;
  steps?: string[];
  buttons: ShellCardButton[];
}

// 殼層互動鎖：controls is-active＝GameScene 進行中（controls 生命週期即遊戲場景）；
// is-configuring＝按鍵配置中；.pause-overlay＝暫停選單；.install-overlay＝已有卡片。
export function isShellBusy(): boolean {
  const controls = document.getElementById('controls');
  const shell = document.getElementById('game-shell');
  return (
    controls?.classList.contains('is-active') === true ||
    shell?.classList.contains('is-configuring') === true ||
    document.querySelector('.pause-overlay, .install-overlay') !== null
  );
}

// Title 判定：主選單開始鈕（data-menu="start"）僅存在於 TitleScene（DOM 鈕隨場景掛卸）。
function isAtTitle(): boolean {
  return document.querySelector('[data-menu="start"]') !== null;
}

// 等待 Title 安靜時刻（1s 輪詢）：卡片僅在標題畫面顯示——遊戲／地圖／結算／配置中
// 一律延後，杜絕彈窗攔截操作（審查 B1 根修）。
export function whenShellIdle(callback: () => void, delayMs: number): void {
  const attempt = (): void => {
    if (!isAtTitle() || isShellBusy()) return;
    clearInterval(timer);
    callback();
  };
  const timer = setInterval(attempt, 1000);
  setTimeout(attempt, delayMs);
}

// 建立殼內置頂卡片：aria-modal 對話框、Escape 可關閉；回傳 close 供外部收卡。
// 遊戲開始（controls is-active）即自動收卡（不記憶忽略，下次回 Title 再顯示），
// 防 e2e 直發事件或時序邊角讓卡片殘留到遊戲中。
const noop = (): void => undefined;

export function showShellCard(options: ShellCardOptions, onClose?: () => void): () => void {
  const shell = document.getElementById('game-shell');
  if (!shell) return noop;

  const overlay = document.createElement('div');
  overlay.className = 'install-overlay';

  const card = document.createElement('div');
  card.className = 'install-card';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-label', options.title);

  let gameStartWatcher: MutationObserver | null = null;
  const close = (): void => {
    gameStartWatcher?.disconnect();
    gameStartWatcher = null;
    document.removeEventListener('keydown', onKeyDown);
    overlay.remove();
    onClose?.();
  };
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') close();
  };
  document.addEventListener('keydown', onKeyDown);

  const controls = document.getElementById('controls');
  if (controls) {
    gameStartWatcher = new MutationObserver(() => {
      if (controls.classList.contains('is-active')) close();
    });
    gameStartWatcher.observe(controls, { attributes: true, attributeFilter: ['class'] });
  }

  const title = document.createElement('div');
  title.className = 'install-title';
  title.textContent = options.title;
  card.appendChild(title);

  const description = document.createElement('div');
  description.className = 'install-desc';
  description.textContent = options.description;
  card.appendChild(description);

  if (options.steps && options.steps.length > 0) {
    const list = document.createElement('ol');
    list.className = 'install-steps';
    for (const step of options.steps) {
      const item = document.createElement('li');
      item.textContent = step;
      list.appendChild(item);
    }
    card.appendChild(list);
  }

  for (const spec of options.buttons) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = spec.primary === true ? 'install-btn install-btn-primary' : 'install-btn';
    button.textContent = spec.label;
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      spec.onPress(close);
    });
    card.appendChild(button);
  }

  overlay.appendChild(card);
  shell.appendChild(overlay);
  return close;
}
