import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { createReflector, type ReflectorHooks } from './reflector';

// 假噗噗分身池現況鎖定（W3 審查尾修）：分身為局部單用途 sprite 陣列（clones[]），
// 雙掛 shields/shockwaves 僅供 overlaps 結算、本檔內無任何 `.get()`/acquirePooled
// 對這兩池取用——「分身死亡→停用滯池→下次 clone 指令重生自己的槽位」為安全現況；
// 擴充共用池化效果前先讀 prismix.ts 殘影離池對帳紀律（PR #886 R4/R5）。

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

interface FakeSprite {
  x: number;
  y: number;
  alpha: number;
  active: boolean;
  width: number;
  height: number;
  rotation: number;
  body: {
    enable: boolean;
    velocity: { x: number; y: number };
    setAllowGravity: (value: boolean) => void;
    setImmovable: (value: boolean) => void;
    setSize: (w: number, h: number) => void;
    setVelocity: (vx: number, vy: number) => void;
  };
  setPosition(x: number, y: number): FakeSprite;
  setVisible(): FakeSprite;
  setAlpha(value: number): FakeSprite;
  setDepth(): FakeSprite;
  setDisplaySize(): FakeSprite;
  setTint(): FakeSprite;
  clearTint(): FakeSprite;
  setTintMode(): FakeSprite;
  setFlipX(): FakeSprite;
  setRotation(): FakeSprite;
  setTexture(): FakeSprite;
  setData(key: string, value: unknown): FakeSprite;
  getData(key: string): unknown;
  enableBody(reset: boolean, x: number, y: number): FakeSprite;
  disableBody(): FakeSprite;
  destroy(): void;
}

function makeSprite(x: number, y: number): FakeSprite {
  const data = new Map<string, unknown>();
  const sprite: FakeSprite = {
    x,
    y,
    alpha: 1,
    active: false,
    width: 160,
    height: 140,
    rotation: 0,
    body: {
      enable: true,
      velocity: { x: 0, y: 0 },
      setAllowGravity: vi.fn(),
      setImmovable: vi.fn(),
      setSize: vi.fn(),
      setVelocity: vi.fn(),
    },
    setPosition(nx: number, ny: number) {
      sprite.x = nx;
      sprite.y = ny;
      return sprite;
    },
    setVisible: () => sprite,
    setAlpha(value: number) {
      sprite.alpha = value;
      return sprite;
    },
    setDepth: () => sprite,
    setDisplaySize: () => sprite,
    setTint: () => sprite,
    clearTint: () => sprite,
    setTintMode: () => sprite,
    setFlipX: () => sprite,
    setRotation: () => sprite,
    setTexture: () => sprite,
    setData(key: string, value: unknown) {
      data.set(key, value);
      return sprite;
    },
    getData: (key: string) => data.get(key),
    enableBody(_reset: boolean, nx: number, ny: number) {
      sprite.active = true;
      sprite.x = nx;
      sprite.y = ny;
      sprite.body.enable = true;
      return sprite;
    },
    disableBody() {
      sprite.active = false;
      sprite.body.enable = false;
      return sprite;
    },
    destroy: vi.fn(),
  };
  return sprite;
}

// Arcade Group 池語意（沿 prismix.test.ts 慣例）：優先復用 inactive，達上限回 null。
function makeGroup(maxSize: number): {
  get(x: number, y: number): FakeSprite | null;
  getMatching(key: string, value: boolean): FakeSprite[];
  add: (sprite: FakeSprite) => void;
  contains: (sprite: FakeSprite) => boolean;
  remove: (sprite: FakeSprite) => void;
  children: FakeSprite[];
  countActive: (value: boolean) => number;
  getChildren: () => FakeSprite[];
  destroy: ReturnType<typeof vi.fn>;
} {
  const children: FakeSprite[] = [];
  return {
    children,
    get(x: number, y: number) {
      const idle = children.find((child) => !child.active);
      if (idle) {
        idle.x = x;
        idle.y = y;
        return idle;
      }
      if (children.length >= maxSize) return null;
      const sprite = makeSprite(x, y);
      children.push(sprite);
      return sprite;
    },
    getMatching: (_key: string, value: boolean) =>
      children.filter((child) => child.active === value),
    add: (sprite: FakeSprite) => {
      if (!children.includes(sprite)) children.push(sprite);
    },
    contains: (sprite: FakeSprite) => children.includes(sprite),
    remove: (sprite: FakeSprite) => {
      const index = children.indexOf(sprite);
      if (index >= 0) children.splice(index, 1);
    },
    countActive: (value: boolean) => children.filter((child) => child.active === value).length,
    getChildren: () => children,
    destroy: vi.fn(),
  };
}

interface TweenConfig {
  targets?: unknown;
  onComplete?: (tween: { targets: unknown[] }) => void;
  [key: string]: unknown;
}

// tween 替身：數值屬性直接套終值（{from,to} 取 to）後同步觸發 onComplete。
function applyTween(config: TweenConfig): object {
  const targets = Array.isArray(config.targets) ? config.targets : [config.targets];
  for (const target of targets) {
    if (!target || typeof target !== 'object') continue;
    for (const key of ['x', 'y', 'alpha', 'angle', 'scaleX', 'scaleY']) {
      const value = config[key];
      if (typeof value === 'number') (target as Record<string, number>)[key] = value;
      else if (value && typeof value === 'object' && 'to' in value) {
        (target as Record<string, number>)[key] = (value as { to: number }).to;
      }
    }
  }
  config.onComplete?.({ targets });
  return {};
}

function makeScene(groups: ReturnType<typeof makeGroup>[]): Phaser.Scene {
  const graphics = () => {
    const gfx = {
      lineStyle: () => gfx,
      lineBetween: () => gfx,
      fillStyle: () => gfx,
      fillRect: () => gfx,
      setDepth: () => gfx,
      destroy: vi.fn(),
    };
    return gfx;
  };
  return {
    textures: { exists: () => true },
    scale: { width: 854 },
    events: { emit: vi.fn() },
    time: {
      now: 0,
      delayedCall: (_ms: number, fn: () => void) => (fn(), { remove: vi.fn() }),
    },
    physics: {
      add: {
        sprite: (x: number, y: number) => {
          const sprite = makeSprite(x, y);
          sprite.active = true;
          return sprite;
        },
        group: () => {
          const group = makeGroup(28);
          groups.push(group);
          return group;
        },
      },
    },
    tweens: { add: applyTween, addCounter: vi.fn(), killTweensOf: vi.fn() },
    add: { graphics },
    cameras: {
      main: {
        fadeOut: vi.fn(),
        fadeIn: vi.fn(),
        pan: vi.fn(),
        zoomTo: vi.fn(),
        shake: vi.fn(),
        flash: vi.fn(),
        once: (_event: string, callback: () => void) => callback(),
      },
    },
  } as unknown as Phaser.Scene;
}

function makeHooks(): ReflectorHooks {
  return { playerPos: () => ({ x: 200, y: 360 }) };
}

describe('Reflector 呈現層：假噗噗分身池現況鎖定（W3 審查尾修）', () => {
  beforeEach(() => {
    // 加權選招走 Math.random：注入 LCG 種子讓 clone 進招序列可重放。
    let seed = 11;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('分身死亡→停用滯池不被誤拿（projectiles 取池拿不到分身）→下次召喚重生自己的槽位', () => {
    const groups: ReturnType<typeof makeGroup>[] = [];
    const scene = makeScene(groups);
    const handle = createReflector(scene, makeHooks(), { ex: false, arenaLeft: () => 0 });
    handle.setTarget({ x: 200, y: 360 });
    handle.spawn();
    // 建立順序：projectiles → shockwaves → shields（與 createReflector 一致）。
    const [projectiles, shockwaves, shields] = groups;
    if (!projectiles || !shockwaves || !shields) throw new Error('pooled groups 未建立');

    const step = (predicate: () => boolean, maxTicks = 8000): boolean => {
      for (let i = 0; i < maxTicks; i += 1) {
        handle.update(100);
        if (predicate()) return true;
      }
      return false;
    };

    // P1→P2（120×0.66=79.2：傷 41 → hp 79）解鎖 clone 招。
    handle.applyDamage(41);
    expect(handle.getDebugState?.()?.phase).toBe('p2');

    // 驅動至分身召喚：雙掛 shields/shockwaves、帶 shadow 標記、存活。
    const shadowClones = () =>
      shockwaves.children.filter((child) => child.getData('shadow') === true);
    expect(step(() => shadowClones().length >= 2)).toBe(true);
    const [cloneA, cloneB] = shadowClones();
    if (!cloneA || !cloneB) throw new Error('分身未生成');
    expect(shields.contains(cloneA)).toBe(true);
    expect(shields.contains(cloneB)).toBe(true);
    expect(cloneA.active).toBe(true);

    // 星彈 1 發即破（overlaps shields 語意）：兩具分身外部 disableBody。
    cloneA.disableBody();
    cloneB.disableBody();
    handle.update(100);
    // 現況行為：分身停用後滯留兩池（本池無 .get() 共用取出點，滯池安全）。
    expect(shockwaves.contains(cloneA)).toBe(true);
    expect(shields.contains(cloneA)).toBe(true);
    expect(cloneA.active).toBe(false);

    // 誤拿守門：驅動出招（beam/shard/mirror 走 projectiles acquirePooled）——
    // 分身不在 projectiles 池，任何取出都不可能復活分身本體。
    expect(step(() => projectiles.children.length > 0)).toBe(true);
    for (const child of projectiles.children) {
      expect(child).not.toBe(cloneA);
      expect(child).not.toBe(cloneB);
      expect(child.getData('shadow')).not.toBe(true);
    }
    // 出招流程不得順帶復活分身。
    if (!cloneA.active && !cloneB.active) {
      expect(shockwaves.countActive(true)).toBe(0);
    }

    // 下次 clone 指令：重生「自己的槽位 sprite」（同一實例 re-enable，非新建非誤拿）。
    expect(step(() => cloneA.active && cloneB.active)).toBe(true);
    expect(shadowClones()).toHaveLength(2);
    expect(shields.contains(cloneA)).toBe(true);
    expect(shields.contains(cloneB)).toBe(true);
  });
});
