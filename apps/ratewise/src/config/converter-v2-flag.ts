/**
 * E3 單幣別換算 v2「等值雙列」feature flag（讀取端 SSOT）。
 *
 * 優先序（wave-B 起與 converterStore 整合為單一 SSOT）：
 * 1. URL override `?converter=v2|legacy`——QA／支援直達用，僅影響本次瀏覽，不持久化。
 * 2. 使用者設定——設定頁「單幣別模式」寫入 converterStore（`ratewise-converter` 持久化，
 *    與 lastConverterView 同域；wave-A 獨立 key 由 store 遷移一次性併入）。
 * 3. 預設 off（legacy）——converterStore 預設值，與 server snapshot 一致（SSG 紅線）。
 *
 * @see .claude/prds/ratewise-e3-converter-v2-design.md
 */

import { useConverterStore } from '../stores/converterStore';
import { DEFAULT_CONVERTER_V2_VARIANT } from '../features/ratewise/constants';
import type { ConverterV2Variant } from '../features/ratewise/types';

export type { ConverterV2Variant };
export { DEFAULT_CONVERTER_V2_VARIANT };

export function getConverterV2Variant(): ConverterV2Variant {
  if (typeof window === 'undefined') {
    return DEFAULT_CONVERTER_V2_VARIANT;
  }

  const params = new URLSearchParams(window.location.search);
  const converterParam = params.get('converter');
  if (converterParam === 'legacy' || converterParam === 'v2') {
    return converterParam;
  }

  return useConverterStore.getState().singleConverterVariant;
}

/** 寫入使用者設定（持久化進 converterStore；URL override 不受影響）。 */
export function setConverterV2Variant(variant: ConverterV2Variant): void {
  useConverterStore.getState().setSingleConverterVariant(variant);
}

/** useSyncExternalStore subscribe：使用者設定變更時觸發重繪（snapshot 未變不會 re-render）。 */
export function subscribeConverterV2Variant(onStoreChange: () => void): () => void {
  return useConverterStore.subscribe(onStoreChange);
}

/** client snapshot：是否啟用 v2。 */
export function getConverterV2Snapshot(): boolean {
  return getConverterV2Variant() === 'v2';
}

/** server snapshot：SSG 一律 legacy，保證 flag off 時預渲染輸出不變。 */
export function getConverterV2ServerSnapshot(): boolean {
  return false;
}

/** server snapshot（variant 版）：SSG 一律預設 legacy，供設定頁 override 提示等 variant 級讀取。 */
export function getConverterV2VariantServerSnapshot(): ConverterV2Variant {
  return DEFAULT_CONVERTER_V2_VARIANT;
}
