export type HeroLayoutVariant = 'legacy' | 'hero-v2';

const STORAGE_KEY = 'ratewise:heroLayoutVariant';

export function getHeroLayoutVariant(): HeroLayoutVariant {
  if (typeof window === 'undefined') {
    return 'legacy';
  }

  const params = new URLSearchParams(window.location.search);
  const uxParam = params.get('ux');
  if (uxParam === 'hero-v2') {
    return 'hero-v2';
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'hero-v2' || stored === 'legacy') {
      return stored;
    }
  } catch {
    // localStorage 不可用時維持 legacy。
  }

  return 'legacy';
}

export function setHeroLayoutVariant(variant: HeroLayoutVariant): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, variant);
  } catch {
    // 忽略 private mode 寫入失敗。
  }
}
