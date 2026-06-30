export type HeroLayoutVariant = 'legacy' | 'hero-v2';

const STORAGE_KEY = 'ratewise:heroLayoutVariant';
export const HERO_LAYOUT_VARIANT_CHANGE_EVENT = 'ratewise:hero-layout-variant-change';

/** SSG 與 hydration 首屏預設；須與 SingleConverter server snapshot 一致。 */
export const DEFAULT_HERO_LAYOUT_VARIANT: HeroLayoutVariant = 'hero-v2';

export function getHeroLayoutVariant(): HeroLayoutVariant {
  if (typeof window === 'undefined') {
    return DEFAULT_HERO_LAYOUT_VARIANT;
  }

  const params = new URLSearchParams(window.location.search);
  const uxParam = params.get('ux');
  if (uxParam === 'legacy') {
    return 'legacy';
  }
  if (uxParam === 'hero-v2') {
    return 'hero-v2';
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'hero-v2' || stored === 'legacy') {
      return stored;
    }
  } catch {
    // localStorage 不可用時維持 hero-v2 預設。
  }

  return DEFAULT_HERO_LAYOUT_VARIANT;
}

export function setHeroLayoutVariant(variant: HeroLayoutVariant): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, variant);
    window.dispatchEvent(new CustomEvent(HERO_LAYOUT_VARIANT_CHANGE_EVENT, { detail: variant }));
  } catch {
    // 忽略 private mode 寫入失敗。
  }
}
