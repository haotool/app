/**
 * E3 單幣別換算 v2「等值雙列」feature flag。
 * 範式對齊 hero-layout-variant：URL override → localStorage → 預設值，變更以 CustomEvent 廣播。
 * @see .claude/prds/ratewise-e3-converter-v2-design.md
 */

export type ConverterV2Variant = 'legacy' | 'v2';

const STORAGE_KEY = 'ratewise:converterV2';
export const CONVERTER_V2_CHANGE_EVENT = 'ratewise:converter-v2-change';

/** SSG 與 hydration 首屏預設；須與 SingleConverter server snapshot 一致（wave-A 預設 off）。 */
export const DEFAULT_CONVERTER_V2_VARIANT: ConverterV2Variant = 'legacy';

export function getConverterV2Variant(): ConverterV2Variant {
  if (typeof window === 'undefined') {
    return DEFAULT_CONVERTER_V2_VARIANT;
  }

  const params = new URLSearchParams(window.location.search);
  const converterParam = params.get('converter');
  if (converterParam === 'legacy') {
    return 'legacy';
  }
  if (converterParam === 'v2') {
    return 'v2';
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'v2' || stored === 'legacy') {
      return stored;
    }
  } catch {
    // localStorage 不可用時維持預設。
  }

  return DEFAULT_CONVERTER_V2_VARIANT;
}

export function setConverterV2Variant(variant: ConverterV2Variant): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, variant);
    window.dispatchEvent(new CustomEvent(CONVERTER_V2_CHANGE_EVENT, { detail: variant }));
  } catch {
    // 忽略 private mode 寫入失敗。
  }
}

/** useSyncExternalStore subscribe：flag 變更時觸發重繪。 */
export function subscribeConverterV2Variant(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handler = () => onStoreChange();
  window.addEventListener(CONVERTER_V2_CHANGE_EVENT, handler);
  return () => window.removeEventListener(CONVERTER_V2_CHANGE_EVENT, handler);
}

/** client snapshot：是否啟用 v2。 */
export function getConverterV2Snapshot(): boolean {
  return getConverterV2Variant() === 'v2';
}

/** server snapshot：SSG 一律 legacy，保證 flag off 時預渲染輸出不變。 */
export function getConverterV2ServerSnapshot(): boolean {
  return false;
}
