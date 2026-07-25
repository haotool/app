// PWA 更新套用時機閘（v19 #819 卡 8）：新版 SW ready 只標記 pending，僅在殼層
// 安靜（非 GameScene／非配置中／無殼卡＝Title/Map/Result 選單面）自動套用 reload，
// 遊戲進行中絕不 reload，杜絕更新吃掉進行中關卡。忙碌訊號沿 shellCards.isShellBusy
// SSOT（controls is-active 生命週期即 GameScene）。

import { isShellBusy } from './shellCards';

// 邊界事件漏接保險：pending 期間低頻重試，殼層轉靜最遲 5s 內套用。
const RETRY_INTERVAL_MS = 5000;

let pending: (() => void) | null = null;
let retryTimer: ReturnType<typeof setInterval> | null = null;

export function hasPendingPwaUpdate(): boolean {
  return pending !== null;
}

// 套用嘗試：pending 先清再執行（單次防重入）；apply 內部 reload 由
// vite-plugin-pwa updateSW(true) 負責（SKIP_WAITING → controllerchange → reload）。
export function attemptPwaUpdate(): void {
  if (pending === null || isShellBusy()) return;
  const apply = pending;
  pending = null;
  if (retryTimer !== null) {
    clearInterval(retryTimer);
    retryTimer = null;
  }
  apply();
}

export function queuePwaUpdate(apply: () => void): void {
  pending = apply;
  attemptPwaUpdate();
  if (pending !== null && retryTimer === null) {
    retryTimer = setInterval(attemptPwaUpdate, RETRY_INTERVAL_MS);
  }
}

// controls class 變化＝遊戲進出場邊界：離開 GameScene（Result/Title/Map）當下即嘗試套用。
export function initPwaUpdateGate(): void {
  const controls = document.getElementById('controls');
  if (!controls) return;
  new MutationObserver(attemptPwaUpdate).observe(controls, {
    attributes: true,
    attributeFilter: ['class'],
  });
}
