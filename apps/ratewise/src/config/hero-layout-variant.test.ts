import { afterEach, describe, expect, it } from 'vitest';
import { getHeroLayoutVariant, setHeroLayoutVariant } from './hero-layout-variant';

describe('hero-layout-variant', () => {
  afterEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('預設為 legacy', () => {
    expect(getHeroLayoutVariant()).toBe('legacy');
  });

  it('?ux=hero-v2 覆寫為 hero-v2', () => {
    window.history.replaceState({}, '', '/?ux=hero-v2');
    expect(getHeroLayoutVariant()).toBe('hero-v2');
  });

  it('localStorage 可持久化 hero-v2', () => {
    setHeroLayoutVariant('hero-v2');
    expect(getHeroLayoutVariant()).toBe('hero-v2');
  });
});
