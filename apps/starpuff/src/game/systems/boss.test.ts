import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { createBoss } from './boss';

// 彈幕池瞬時旗標循環（§119 潮環，PR #886 R3）：jellord 追蹤彈被潮環撥開／殼化
// 反彈後回池，復用時旗標必須歸位（acquirePooled 取出即復位），否則潮化對回收
// 彈幕靜默免疫。本檔 harness 僅承載池循環守門，完整 FSM 行為由 bossFsm 單測覆蓋。

vi.mock('phaser', () => ({
  default: {
    Math: {
      Clamp: (value: number, low: number, high: number) => Math.min(high, Math.max(low, value)),
      Between: (low: number, high: number) => Math.floor(low + Math.random() * (high - low + 1)),
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
    'fillStyle',
    'fillEllipse',
    'fillRoundedRect',
    'generateTexture',
    'destroy',
  ]) {
    target[key] = () => target;
  }
  return target;
}

interface FakeShot {
  active: boolean;
  x: number;
  y: number;
  getData(key: string): unknown;
  setData(key: string, value: unknown): FakeShot;
  [key: string]: unknown;
}

function makeFakeShot(): FakeShot {
  const data = new Map<string, unknown>();
  const shot: FakeShot = {
    active: false,
    x: 0,
    y: 0,
    getData: (key: string) => data.get(key),
    setData(key: string, value: unknown) {
      data.set(key, value);
      return shot;
    },
    enableBody(_reset: boolean, x: number, y: number) {
      shot.active = true;
      shot.x = x;
      shot.y = y;
      return shot;
    },
    disableBody() {
      shot.active = false;
      return shot;
    },
    setActive(value: boolean) {
      shot.active = value;
      return shot;
    },
    setVelocity: () => shot,
    setVelocityX: () => shot,
    setVelocityY: () => shot,
    body: {
      enable: true,
      velocity: { x: 0, y: 0 },
      setAllowGravity: vi.fn(),
      setVelocity: vi.fn(),
      setVelocityX: vi.fn(),
      setVelocityY: vi.fn(),
      setSize: vi.fn(),
      stop: vi.fn(),
      reset: vi.fn(),
    },
  };
  for (const key of [
    'setVisible',
    'setDisplaySize',
    'setTint',
    'clearTint',
    'setTintMode',
    'setAlpha',
    'setDepth',
    'setRotation',
    'setScale',
    'setOrigin',
    'setFlipX',
  ]) {
    shot[key] = () => shot;
  }
  return shot;
}

function makePooledGroup(): {
  children: FakeShot[];
  get(): FakeShot;
  getMatching(key: string, value: unknown): FakeShot[];
  getChildren(): FakeShot[];
  destroy: ReturnType<typeof vi.fn>;
} {
  const children: FakeShot[] = [];
  return {
    children,
    get() {
      const idle = children.find((child) => !child.active);
      if (idle) return idle;
      const shot = makeFakeShot();
      children.push(shot);
      return shot;
    },
    getMatching: (_key: string, value: unknown) =>
      children.filter((child) => child.active === value),
    getChildren: () => children,
    destroy: vi.fn(),
  };
}

function makeBodySprite() {
  const bodySprite = {
    x: 420,
    y: 300,
    width: 140,
    height: 140,
    scaleX: 1,
    scaleY: 1,
    active: true,
    body: {
      enable: true,
      setAllowGravity: vi.fn(),
      setImmovable: vi.fn(),
      setSize: vi.fn(),
      setVelocity: vi.fn(),
      setVelocityX: vi.fn(),
      setVelocityY: vi.fn(),
      velocity: { x: 0, y: 0 },
      blocked: { down: true },
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

function makeScene(pooledGroups: ReturnType<typeof makePooledGroup>[]): Phaser.Scene {
  let now = 0;
  return {
    textures: { exists: () => true },
    scale: { width: 854 },
    events: { emit: vi.fn() },
    make: { graphics: () => chainable() },
    physics: {
      add: {
        sprite: () => makeBodySprite(),
        existing: (obj: unknown) => obj,
        group: () => {
          const group = makePooledGroup();
          pooledGroups.push(group);
          return group;
        },
      },
      moveTo: vi.fn(),
    },
    get time() {
      return {
        get now() {
          return (now += 16);
        },
        delayedCall: (_ms: number, fn: () => void) => (fn(), { remove: vi.fn() }),
      };
    },
    tweens: {
      add: (config: { targets?: unknown; onComplete?: (t: { targets: unknown[] }) => void }) => {
        config.onComplete?.({
          targets: Array.isArray(config.targets) ? config.targets : [config.targets],
        });
        return {
          play: vi.fn(),
          stop: vi.fn(),
          remove: vi.fn(),
          pause: vi.fn(),
          resume: vi.fn(),
          restart: vi.fn(),
        };
      },
      chain: (config: { onComplete?: (t: { targets: unknown[] }) => void }) => {
        config.onComplete?.({ targets: [] });
        return {
          play: vi.fn(),
          stop: vi.fn(),
          remove: vi.fn(),
          pause: vi.fn(),
          resume: vi.fn(),
          restart: vi.fn(),
        };
      },
      addCounter: () => ({ remove: vi.fn(), stop: vi.fn() }),
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
        worldView: { x: 0, y: 0, width: 854, height: 480 },
        once: (_event: string, callback: () => void) => callback(),
      },
    },
  } as unknown as Phaser.Scene;
}

describe('Jellord 彈幕池瞬時旗標循環（§119 潮環，PR #886 R3）', () => {
  beforeEach(() => {
    let seed = 7;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('撥開/反彈旗標殘留的追蹤彈回池復用後必為 false', () => {
    const pooledGroups: ReturnType<typeof makePooledGroup>[] = [];
    const scene = makeScene(pooledGroups);
    const handle = createBoss(scene, { ex: false });
    handle.spawn();
    handle.setTarget({ x: 200, y: 380 });
    // 建立順序：projectiles → shockwaves（createBoss 一致）。
    const projectiles = pooledGroups[0];
    if (!projectiles) throw new Error('projectiles group 未建立');

    const step = (predicate: () => boolean, maxTicks = 8000): boolean => {
      for (let i = 0; i < maxTicks; i += 1) {
        handle.update(100);
        if (predicate()) return true;
      }
      return false;
    };

    expect(step(() => projectiles.children.length > 0)).toBe(true);
    const ball = projectiles.children[0];
    if (!ball) throw new Error('彈體未生成');

    // 潮環撥開＋殼化反彈殘留現場 → 彈體出界回池。
    ball.setData('tideDeflected', true);
    ball.setData('reflected', true);
    ball.active = false;

    // 下一輪投彈復用同一物件：旗標必須歸位，否則潮化對回收彈幕靜默免疫。
    expect(step(() => ball.active)).toBe(true);
    expect(ball.getData('tideDeflected')).toBe(false);
    expect(ball.getData('reflected')).toBe(false);
  });
});
