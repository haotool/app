// PWA 更新套用時機閘（v19 #819 卡 8）：新版 SW ready 只標記 pending，僅在殼層
// 安靜（非 GameScene／非配置中／無殼卡＝Title/Map/Result 選單面）自動套用 reload，
// 遊戲進行中絕不 reload，杜絕更新吃掉進行中關卡。忙碌訊號沿 shellCards.isShellBusy
// SSOT（controls is-active 生命週期即 GameScene）。

import { isShellBusy } from './shellCards';

// 邊界事件漏接保險：pending 期間低頻重試，殼層轉靜最遲 5s 內啟動套用寬限。
const RETRY_INTERVAL_MS = 5000;
// 套用寬限期（審查 Should-fix）：場景切換瞬間立即 reload 會吃掉使用者正要按下的
// 點擊（Result 下一關 CTA 競態）——條件成立後再等 1.5s，寬限內殼層轉忙（再入遊戲）
// 即放棄本次套用，交還重試管線。
const APPLY_GRACE_MS = 1500;

let pending: (() => void) | null = null;
let retryTimer: ReturnType<typeof setInterval> | null = null;
let graceTimer: ReturnType<typeof setTimeout> | null = null;

export function hasPendingPwaUpdate(): boolean {
  return pending !== null;
}

// 套用嘗試：條件成立先排寬限，期滿重驗仍安靜才套用；pending 先清再執行
//（單次防重入）；apply 內部 reload 由 vite-plugin-pwa updateSW(true) 負責
//（SKIP_WAITING → controllerchange → reload）。
export function attemptPwaUpdate(): void {
  if (pending === null || isShellBusy() || graceTimer !== null) return;
  graceTimer = setTimeout(() => {
    graceTimer = null;
    if (pending === null || isShellBusy()) return;
    const apply = pending;
    pending = null;
    if (retryTimer !== null) {
      clearInterval(retryTimer);
      retryTimer = null;
    }
    apply();
  }, APPLY_GRACE_MS);
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
