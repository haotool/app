// 當前場景的生產可觀測訊號（#869）：`__sp.scene()` 只在 dev/test 掛載，生產路徑
// 沒有任何可讀的場景狀態——PWA 更新閘因此只能用「殼層非忙碌即安全」近似判斷，
// 而 Credits／Codex 既非 GameScene 也無殼卡，會被誤判為可 reload（謝幕演出約 14.7s
// 會在寬限 1.5s 後被打斷）。此模組把場景鍵寫進 root 的 data 屬性，供殼層邏輯讀取。
//
// 寫入端單點接於 main.ts 的 Phaser scene START 事件，各 Scene 不需各自回報，
// 也就不會出現「新增場景忘了接線」的漏洞。

import type { SceneKey } from './types';

const SCENE_ATTR = 'data-scene';

export function markActiveScene(scene: SceneKey): void {
  document.documentElement.setAttribute(SCENE_ATTR, scene);
}

// 回傳 null 代表訊號尚未建立（Phaser boot 之前）。呼叫端須把 null 視為
// 「無法確認安全」而非「安全」——fail-closed，寧可延後套用也不打斷演出。
export function activeScene(): SceneKey | null {
  return (document.documentElement.getAttribute(SCENE_ATTR) as SceneKey | null) ?? null;
}
