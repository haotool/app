// 殼層卡片基建（GAME_DESIGN §90/§92）：安裝、方向、恢復與儲存狀態提示共用。
// 卡片僅在「殼層安靜時刻」顯示——遊戲進行中／配置中／暫停選單開啟／已有他卡時延後，
// 杜絕戰鬥中彈窗攔截操作（審查 B1 根修）。

export interface ShellCardButton {
  label: string;
  primary?: boolean;
  onPress: (close: () => void) => void;
}

export interface ShellCardOptions {
  variant?: 'pwa-install' | 'embedded-browser';
  title: string;
  description: string;
  illustration?: {
    src: string;
    alt: string;
  };
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
// one-shot 守衛（#839 e2e 曝露）：interval 與 delay timeout 共用 attempt——先顯卡
// 又在 timeout 前被關閉時，overlay 忙碌訊號消失會讓 timeout 再執行一次 callback
// 出現第二張卡；callback 至多執行一次。
export function whenShellIdle(callback: () => void, delayMs: number): void {
  let fired = false;
  const attempt = (): void => {
    if (fired || !isAtTitle() || isShellBusy()) return;
    fired = true;
    clearInterval(timer);
    callback();
  };
  const timer = setInterval(attempt, 1000);
  setTimeout(attempt, delayMs);
}

// 建立非模態殼層提示卡：保留 dialog landmark、Escape 可關閉，但不鎖焦點或攔截底層
// 開始鈕；真正會阻擋遊戲操作的提示／設定卡由各自的 modal focus trap 負責。
// 遊戲開始（controls is-active）即自動收卡（不記憶忽略，下次回 Title 再顯示），
// 防 e2e 直發事件或時序邊角讓卡片殘留到遊戲中。
const noop = (): void => undefined;

export function showShellCard(options: ShellCardOptions, onClose?: () => void): () => void {
  const shell = document.getElementById('game-shell');
  const modalRoot = document.body ?? shell;
  if (!shell || !modalRoot) return noop;

  const overlay = document.createElement('div');
  overlay.className = 'install-overlay';

  const card = document.createElement('div');
  card.className = `install-card${options.variant ? ` install-card-${options.variant}` : ''}`;
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'false');
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

  if (options.illustration) {
    const illustration = document.createElement('img');
    illustration.className = 'install-illustration';
    illustration.src = options.illustration.src;
    illustration.alt = options.illustration.alt;
    illustration.loading = 'lazy';
    illustration.decoding = 'async';
    card.appendChild(illustration);
  }

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
  // 方向、PWA 與錯誤提示不能掛在旋轉殼內：直持時祖先 rotate 會把文字與捲動軸
  // 一起轉 90 度。改掛 body 仍保留殼層安靜時刻與 controls watcher，但座標永遠以
  // 使用者實際看到的 viewport 為準；單測若沒有 body 則回退到 shell。
  modalRoot.appendChild(overlay);
  return close;
}

// 「進度無法保存」提示單點（#868）：boot 探測與實際寫入失敗共用同一份文案，
// 每工作階段至多一張——寫入失敗常連續發生，不得每次落盤都彈卡。
// 仍走 whenShellIdle：遊戲進行中一律延後到 Title 安靜時刻，不攔截操作。
let saveUnavailableNotified = false;

export function notifySaveUnavailable(): void {
  if (saveUnavailableNotified) return;
  saveUnavailableNotified = true;
  whenShellIdle(
    () =>
      showShellCard({
        title: '進度無法保存',
        description:
          '偵測不到可用的瀏覽器儲存空間（可能為私密瀏覽模式或空間不足）。遊戲仍可正常遊玩，但通關進度與偏好設定將不會保存。清出空間後重新整理即可恢復保存。',
        buttons: [{ label: '我知道了', primary: true, onPress: (close) => close() }],
      }),
    2500,
  );
}

// 測試用旗標重置（審查 nit）：模組級單次守衛會跨案污染，同檔多案需顯式歸零。
// 僅供單測呼叫，執行期無呼叫點。
export function __resetSaveUnavailableForTests(): void {
  saveUnavailableNotified = false;
}
