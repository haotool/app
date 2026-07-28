import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { LIUDONG } from '../logic/liudongFsm';
import { createLiudong } from './liudong';

// 慈悲機制整合守門（§126.2 審查席 S Blocking 摺入）：notePlayerHurt 必須經
// BossHandle 公開面抵達內部 FSM——連續三次實傷後 speedFactor 確實 ×0.8。
// FSM 純邏輯行為由 liudongFsm 單測覆蓋，本檔 harness 只承載接線整合；
// 場景樁沿 noctra.test 慣例（delayedCall/tween 即發＝入場序列同步完成）。

vi.mock('phaser', () => ({
  default: {
    Math: {
      Clamp: (value: number, low: number, high: number) => Math.min(high, Math.max(low, value)),
      Distance: {
        Between: (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1),
      },
    },
    TintModes: { FILL: 1, MULTIPLY: 0 },
    Cameras: { Scene2D: { Events: { FADE_OUT_COMPLETE: 'camerafadeoutcomplete' } } },
  },
}));
vi.mock('../audio/sfx', () => ({ playSfx: vi.fn(), stopSfx: vi.fn() }));
vi.mock('./fx', () => ({ ensureFxTextures: vi.fn(), spawnTelegraph: vi.fn() }));
vi.mock('./bossStagecraft', () => ({ preloadBossStagecraft: vi.fn() }));
vi.mock('./visualScale', () => ({
  getVisualScale: () => ({
    register: vi.fn(),
    rebase: vi.fn(),
    setBase: vi.fn(),
    fx: () => ({ sx: 1, sy: 1 }),
    mod: () => ({ sx: 1, sy: 1 }),
    killFxTweens: vi.fn(),
    resetFx: vi.fn(),
    isFxTweening: () => false,
    unregister: vi.fn(),
  }),
}));

type Chainable = Record<string, (...args: unknown[]) => unknown>;

function chainable(): Chainable {
  const target: Chainable = {};
  for (const key of [
    'setDisplaySize',
    'setTint',
    'clearTint',
    'setTintMode',
    'setAlpha',
    'setDepth',
    'setPosition',
    'setStrokeStyle',
    'setScale',
    'setVisible',
    'setOrigin',
    'setRotation',
    'setScrollFactor',
    'setTexture',
    'setFlipX',
    'fillStyle',
    'fillEllipse',
    'fillRoundedRect',
    'fillTriangle',
    'fillCircle',
    'strokeCircle',
    'lineStyle',
    'generateTexture',
    'beginPath',
    'moveTo',
    'lineTo',
    'strokePath',
    'clear',
    'destroy',
  ]) {
    target[key] = () => target;
  }
  return target;
}

function makeBodySprite() {
  const bodySprite = {
    x: 900,
    y: 325,
    width: 170,
    height: 150,
    scaleX: 1,
    scaleY: 1,
    active: true,
    texture: { key: 'boss-liudong' },
    body: {
      enable: true,
      setAllowGravity: vi.fn(),
      setImmovable: vi.fn(),
      setSize: vi.fn(),
      setVelocity: vi.fn(),
      velocity: { x: 0, y: 0 },
    },
    setPosition(x: number, y: number) {
      bodySprite.x = x;
      bodySprite.y = y;
      return bodySprite;
    },
  } as Record<string, unknown> & { x: number; y: number };
  for (const key of [
    'setDisplaySize',
    'setTint',
    'clearTint',
    'setTintMode',
    'setAlpha',
    'setDepth',
    'setScale',
    'setVisible',
    'setOrigin',
    'setFlipX',
    'setTexture',
    'destroy',
  ]) {
    bodySprite[key] = () => bodySprite;
  }
  return bodySprite;
}

function makePooledGroup() {
  return {
    get: () => null,
    getMatching: () => [],
    getChildren: () => [],
    countActive: () => 0,
    destroy: vi.fn(),
  };
}

function makeScene(): Phaser.Scene {
  let now = 0;
  return {
    sys: {},
    load: { image: vi.fn(), start: vi.fn(), isLoading: () => false },
    textures: { exists: () => true },
    scale: { width: 854 },
    events: { emit: vi.fn() },
    make: { graphics: () => chainable() },
    physics: {
      add: {
        sprite: () => makeBodySprite(),
        group: () => makePooledGroup(),
        overlap: vi.fn(),
      },
    },
    get time() {
      return {
        get now() {
          return (now += 16);
        },
        delayedCall: (_ms: number, fn: () => void) => (fn(), { remove: vi.fn() }),
        addEvent: () => ({ remove: vi.fn() }),
      };
    },
    tweens: {
      add: (config: { targets?: unknown; onComplete?: (t: { targets: unknown[] }) => void }) => {
        config.onComplete?.({
          targets: Array.isArray(config.targets) ? config.targets : [config.targets],
        });
        return { play: vi.fn(), stop: vi.fn(), remove: vi.fn() };
      },
      addCounter: (config: {
        onUpdate?: (t: { getValue: () => number }) => void;
        onComplete?: () => void;
      }) => {
        config.onUpdate?.({ getValue: () => 1 });
        config.onComplete?.();
        return { remove: vi.fn(), stop: vi.fn() };
      },
      killTweensOf: vi.fn(),
    },
    add: {
      image: () => chainable(),
      circle: () => chainable(),
      rectangle: () => chainable(),
      graphics: () => chainable(),
      particles: () => chainable(),
      text: () => chainable(),
      ellipse: () => chainable(),
      container: () => chainable(),
      triangle: () => chainable(),
    },
    cameras: {
      main: {
        fadeOut: vi.fn(),
        fadeIn: vi.fn(),
        pan: vi.fn(),
        zoomTo: vi.fn(),
        shake: vi.fn(),
        flash: vi.fn(),
        scrollX: 0,
        once: (_event: string, callback: () => void) => callback(),
      },
    },
  } as unknown as Phaser.Scene;
}

function makeHandle() {
  return createLiudong(
    makeScene(),
    {
      summonMinion: vi.fn(),
      stealTopStar: vi.fn(() => true),
      playerSprite: () =>
        ({ x: 600, y: 360 }) as unknown as ReturnType<
          Parameters<typeof createLiudong>[1]['playerSprite']
        >,
      playerStars: () =>
        ({ getChildren: () => [] }) as unknown as ReturnType<
          Parameters<typeof createLiudong>[1]['playerStars']
        >,
      playerForm: () => null,
    },
    { arenaLeft: () => 400 },
  );
}

describe('劉董慈悲機制接線（§126.2／PRD §6.7）', () => {
  it('BossHandle.notePlayerHurt 連續三次實傷 → FSM speedFactor ×0.8（整合鏈全通）', () => {
    const handle = makeHandle();
    // 場景樁 delayedCall/tween 即發：spawn 的入金入場序列同步完成 → active。
    handle.spawn();
    const base = handle.getDebugState?.()?.speedFactor;
    expect(base).toBeDefined();
    handle.notePlayerHurt?.();
    handle.notePlayerHurt?.();
    expect(handle.getDebugState?.()?.speedFactor).toBeCloseTo(base ?? 1, 5);
    handle.notePlayerHurt?.();
    expect(handle.getDebugState?.()?.speedFactor).toBeCloseTo(
      (base ?? 1) * LIUDONG.mercySlowdownMul,
      5,
    );
  });
});
