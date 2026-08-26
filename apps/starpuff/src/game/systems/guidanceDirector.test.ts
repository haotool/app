// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateSettings } from '../core/settings';
import { createGuidanceDirector } from './guidanceDirector';

function makeHooks() {
  const controls = {
    state: {
      left: false,
      right: false,
      down: false,
      jumpPressed: false,
      actionPressed: false,
    },
  };
  const player = {
    sprite: {
      x: 100,
      body: { blocked: { down: true }, touching: { down: true } },
    },
    getAmmoState: () => ({ ammo: 0 }),
    getTransformState: () => ({ form: null }),
  };
  const events = { on: vi.fn(), off: vi.fn(), emit: vi.fn() };
  const scene = { events };
  return {
    scene,
    hooks: {
      player: () => player,
      controls: () => controls,
      enemies: () => ({}) as never,
      level: () => ({ id: 1 }) as never,
      stage: () => ({ activeGuidanceFeature: () => null }) as never,
      tide: () => null,
      meteor: () => null,
    },
  };
}

describe('guidanceDirector 設定即時切換', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    document.documentElement.className = '';
  });

  it('目前場景關閉提示會立即隱藏，重新開啟會恢復目前 lesson', () => {
    updateSettings({ guidanceEnabled: true });
    const { scene, hooks } = makeHooks();
    const director = createGuidanceDirector(scene as never, hooks as never);

    director.update(1000);
    const layer = document.querySelector<HTMLElement>('[data-guidance-layer="true"]');
    expect(layer).not.toBeNull();
    expect(layer?.hidden).toBe(false);
    expect(layer?.querySelector('[data-learning-card]')).not.toBeNull();

    updateSettings({ guidanceEnabled: false });
    expect(layer?.hidden).toBe(true);
    expect(layer?.innerHTML).toBe('');

    updateSettings({ guidanceEnabled: true });
    expect(layer?.hidden).toBe(false);
    expect(layer?.querySelector('[data-learning-card]')).not.toBeNull();

    director.destroy();
  });
});
