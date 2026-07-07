/**
 * 刷卡估算模式 feature flag（讀取端 SSOT，ADR-002 Phase 1）。
 *
 * 優先序（比照 converter-v2-flag）：
 * 1. URL override `?cardRate=on|off`——QA／支援直達用，僅影響本次瀏覽，不持久化。
 * 2. 使用者設定——converterStore `cardRateEnabled`（`ratewise-converter` 持久化）。
 * 3. 預設 off——與 server snapshot 一致（flag off 前端零暴露，SSG 紅線）。
 *
 * @see .claude/decisions/ADR-002-card-rates-pipeline.md
 */

import { useConverterStore } from '../stores/converterStore';

export function isCardRateEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  const cardRateParam = params.get('cardRate');
  if (cardRateParam === 'on') return true;
  if (cardRateParam === 'off') return false;

  return useConverterStore.getState().cardRateEnabled;
}

/** 寫入使用者設定（持久化進 converterStore；URL override 不受影響）。 */
export function setCardRateEnabled(enabled: boolean): void {
  useConverterStore.getState().setCardRateEnabled(enabled);
}

/** useSyncExternalStore subscribe：使用者設定變更時觸發重繪。 */
export function subscribeCardRateFlag(onStoreChange: () => void): () => void {
  return useConverterStore.subscribe(onStoreChange);
}

/** server snapshot：SSG 一律 off，保證 flag off 時預渲染輸出不變。 */
export function getCardRateServerSnapshot(): boolean {
  return false;
}
