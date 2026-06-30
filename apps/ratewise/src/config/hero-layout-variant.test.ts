import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_HERO_LAYOUT_VARIANT,
  getHeroLayoutVariant,
  setHeroLayoutVariant,
} from './hero-layout-variant';

describe('hero-layout-variant', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('預設為 hero-v2', () => {
    expect(DEFAULT_HERO_LAYOUT_VARIANT).toBe('hero-v2');
    expect(getHeroLayoutVariant()).toBe('hero-v2');
  });

  it('?ux=legacy 覆寫為 legacy', () => {
    window.history.replaceState({}, '', '/?ux=legacy');
    expect(getHeroLayoutVariant()).toBe('legacy');
  });

  it('?ux=hero-v2 維持 hero-v2', () => {
    window.history.replaceState({}, '', '/?ux=hero-v2');
    expect(getHeroLayoutVariant()).toBe('hero-v2');
  });

  it('localStorage 可持久化 legacy', () => {
    setHeroLayoutVariant('legacy');
    expect(getHeroLayoutVariant()).toBe('legacy');
  });
});
