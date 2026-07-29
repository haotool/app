// PWA 更新套用時機閘（v19 #819 卡 8）：新版 SW ready 只標記 pending，僅在明確的
// 安全場景自動套用 reload，遊戲進行中絕不 reload，杜絕更新吃掉進行中關卡。
//
// 判定自「非忙碌即安全」改為場景白名單（#869）：`isShellBusy` 綁 controls
// is-active 生命週期（等同 GameScene）與殼卡存在與否，語意上不涵蓋「非遊戲但不宜
// 中斷」的場景——Credits 謝幕（約 14.7s）與 Codex 瀏覽皆非 GameScene 且無殼卡，
// 舊判定會在寬限 1.5s 後直接 reload 打斷。兩者現為 AND：白名單內 **且** 殼層安靜。

import { activeScene } from './game/core/sceneSignal';
import { SceneKeys, type SceneKey } from './game/core/types';
import { isShellBusy } from './shellCards';

// 安全場景白名單：靜態選單面，被 reload 打斷不損失進行中的內容或演出。
// 這不是第三份場景清單——鍵取自 `SceneKeys` SSOT，型別確保場景重新命名時編譯即紅。
// 刻意排除：Game（進行中關卡）、Credits（謝幕演出）、Codex（瀏覽中）、Boot（初始化中）。
const APPLY_SAFE_SCENES: readonly SceneKey[] = [
  SceneKeys.Title,
  SceneKeys.Map,
  SceneKeys.Result,
] as const;

// 場景訊號未建立（Phaser boot 之前）一律視為不安全——fail-closed，寧可延後套用
// 也不冒險打斷；retry 管線會在訊號就緒後重試。
function isSafeScene(): boolean {
  const scene = activeScene();
  return scene !== null && APPLY_SAFE_SCENES.includes(scene);
}

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
  if (pending === null || !isSafeScene() || isShellBusy() || graceTimer !== null) return;
  graceTimer = setTimeout(() => {
    graceTimer = null;
    // 寬限期滿重驗：期間可能已離開安全場景（例如 Result 按下一關進 Game，
    // 或 Title 開啟圖鑑進 Codex），此時放棄本次套用交還重試管線。
    if (pending === null || !isSafeScene() || isShellBusy()) return;
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

// 兩個觀察點：
// - controls class 變化＝遊戲進出場邊界：離開 GameScene 當下即嘗試套用。
// - data-scene 變化＝場景切換（#869）：Credits→Title 這類轉場 controls class 全程
//   不變（兩者皆非 active），僅靠 controls 觀察者會漏接，只能等 5s retry 兜底。
export function initPwaUpdateGate(): void {
  new MutationObserver(attemptPwaUpdate).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-scene'],
  });
  const controls = document.getElementById('controls');
  if (!controls) return;
  new MutationObserver(attemptPwaUpdate).observe(controls, {
    attributes: true,
    attributeFilter: ['class'],
  });
}
