import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { GameEvents } from '../core/events';
import { EX_PRISMIX } from '../logic/prismixFsm';
import { createPrismix, type PrismixHooks } from './prismix';

// 折返彈旗標殘留（PR#852 審查修復）：鏡界折返彈標 inhalable 後 sprite 回收進池，
// spawnShot 只重設 reflected 未清 inhalable——P3 晶雨/彈幕復用同 sprite 會被
// overlaps 誤判可吸入（吸入直接給 jelly 免傷）。本測以池復用語意鎖定旗標重設。

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

interface FakeSprite {
  x: number;
  y: number;
  angle: number;
  alpha: number;
  scaleX: number;
  scaleY: number;
  width: number;
  height: number;
  visible: boolean;
  active: boolean;
  body: {
    enable: boolean;
    setAllowGravity: (value: boolean) => void;
    setImmovable: (value: boolean) => void;
    setSize: (w: number, h: number) => void;
    setVelocity: (vx: number, vy: number) => void;
  };
  setPosition(x: number, y: number): FakeSprite;
  setVisible(value: boolean): FakeSprite;
  setAlpha(value: number): FakeSprite;
  setAngle(value: number): FakeSprite;
  setDisplaySize(): FakeSprite;
  setScale(): FakeSprite;
  setTint(): FakeSprite;
  clearTint(): FakeSprite;
  setTintMode(): FakeSprite;
  setFlipX(): FakeSprite;
  setRotation(): FakeSprite;
  setTexture(): FakeSprite;
  setVelocity(): FakeSprite;
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
    angle: 0,
    alpha: 1,
    scaleX: 1,
    scaleY: 1,
    width: 170,
    height: 150,
    visible: true,
    active: false,
    body: {
      enable: true,
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
    setVisible(value: boolean) {
      sprite.visible = value;
      return sprite;
    },
    setAlpha(value: number) {
      sprite.alpha = value;
      return sprite;
    },
    setAngle(value: number) {
      sprite.angle = value;
      return sprite;
    },
    setDisplaySize: () => sprite,
    setScale: () => sprite,
    setTint: () => sprite,
    clearTint: () => sprite,
    setTintMode: () => sprite,
    setFlipX: () => sprite,
    setRotation: () => sprite,
    setTexture: () => sprite,
    setVelocity: () => sprite,
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

// Arcade Group 池語意（沿 player.test.ts 慣例）：優先復用 inactive，達上限回 null。
function makeGroup(maxSize: number): {
  get(x: number, y: number): FakeSprite | null;
  getMatching(key: string, value: boolean): FakeSprite[];
  add: (sprite: FakeSprite) => void;
  children: FakeSprite[];
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
      children.push(sprite);
    },
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

// emit 可注入（W1.6）：段檢查點測試需斷言 HUD 事件載荷——以外部 spy 注入
// 免方法提取（@typescript-eslint/unbound-method）。
function makeScene(
  groups: ReturnType<typeof makeGroup>[],
  emit: ReturnType<typeof vi.fn> = vi.fn(),
): Phaser.Scene {
  return {
    textures: { exists: () => true },
    scale: { width: 854 },
    events: { emit },
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
          const group = makeGroup(20);
          groups.push(group);
          return group;
        },
      },
      moveTo: vi.fn(),
    },
    tweens: { add: applyTween, addCounter: vi.fn(), killTweensOf: vi.fn() },
    add: {
      rectangle: () => {
        const rect = {
          setStrokeStyle: () => rect,
          setDepth: () => rect,
          setPosition: () => rect,
          destroy: vi.fn(),
        };
        return rect;
      },
    },
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

function makeHooks(): PrismixHooks {
  return { summonMirri: vi.fn(), onTwinFinish: vi.fn() };
}

describe('Prismix 呈現層：折返彈池回收旗標（§5 W2）', () => {
  beforeEach(() => {
    // 加權選招走 Math.random：注入 LCG 種子讓 mirror/rain 進招序列可重放。
    let seed = 11;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('折返彈回收後被晶雨/彈幕復用時 inhalable 必須重設', () => {
    const groups: ReturnType<typeof makeGroup>[] = [];
    const scene = makeScene(groups);
    const handle = createPrismix(scene, makeHooks(), { ex: false, arenaLeft: () => 0 });
    handle.spawn();
    // 建立順序：projectiles → shockwaves → shields（與 createPrismix 一致）。
    const projectiles = groups[0];
    if (!projectiles) throw new Error('projectiles group 未建立');

    const step = (predicate: () => boolean, maxTicks = 8000): boolean => {
      for (let i = 0; i < maxTicks; i += 1) {
        handle.update(100);
        if (predicate()) return true;
      }
      return false;
    };
    const state = () => handle.getDebugState?.()?.state ?? '';

    // P1→P2：打至 66% 以下觸發分裂（80→52）。
    handle.applyDamage(28);
    expect(handle.getDebugState?.()?.phase).toBe('p2');

    // 進鏡界反射窗：窗內打兩側，開鏡側零傷折返——產生帶 inhalable 的折返彈。
    expect(step(() => state() === 'mirror')).toBe(true);
    handle.applyDamageAt?.(1, 0, 352);
    handle.applyDamageAt?.(1, 854, 352);
    const reflectShot = projectiles.children[0];
    if (!reflectShot) throw new Error('折返彈未生成');
    expect(reflectShot.getData('inhalable')).toBe(true);

    // 模擬吸入/出界回收：sprite 停用進池等待復用（旗標殘留現場）。
    reflectShot.disableBody();

    // 窗外擊破單側→掙扎窗滿合體入 P3。
    expect(step(() => state() !== 'mirror')).toBe(true);
    handle.applyDamageAt?.(999, 0, 352);
    expect(step(() => handle.getDebugState?.()?.phase === 'p3')).toBe(true);

    // P3 晶雨/彈幕自池復用同一 sprite：inhalable 不得殘留（reflected 同步歸位）。
    expect(step(() => reflectShot.active)).toBe(true);
    expect(reflectShot.getData('reflected')).toBe(false);
    expect(reflectShot.getData('inhalable')).not.toBe(true);
  });
});

describe('Prismix 呈現層：EX 段檢查點（§114 W1.6）', () => {
  beforeEach(() => {
    let seed = 11;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const stepper =
    (handle: ReturnType<typeof createPrismix>) =>
    (predicate: () => boolean, maxTicks = 8000): boolean => {
      for (let i = 0; i < maxTicks; i += 1) {
        handle.update(100);
        if (predicate()) return true;
      }
      return false;
    };

  it('EX：P1/P2 回 false、P3 段重試回 true 且 HUD 同步段門檻血量', () => {
    const emit = vi.fn();
    const scene = makeScene([], emit);
    const handle = createPrismix(scene, makeHooks(), { ex: true, arenaLeft: () => 0 });
    handle.spawn();
    const step = stepper(handle);
    // P1：不具段檢查點。
    expect(handle.trySegmentRespawn?.()).toBe(false);
    // 120×0.75=90：傷 30 即分裂入 P2——仍回 false。
    handle.applyDamage(30);
    expect(handle.getDebugState?.()?.phase).toBe('p2');
    expect(handle.trySegmentRespawn?.()).toBe(false);
    // 窗外擊破單側 → 掙扎窗滿合體入 P3。
    expect(step(() => handle.getDebugState?.()?.state !== 'mirror')).toBe(true);
    handle.applyDamageAt?.(999, 0, 352);
    expect(step(() => handle.getDebugState?.()?.phase === 'p3')).toBe(true);
    emit.mockClear();
    expect(handle.trySegmentRespawn?.()).toBe(true);
    // 段門檻血量＝分裂閾值半值（120×0.75/2=45），HUD damage 0 刷新讀值。
    const damaged = emit.mock.calls.find((call) => call[0] === GameEvents.BOSS_DAMAGED);
    expect(damaged?.[1]).toEqual({ hp: 45, maxHp: 120, damage: 0 });
    expect(handle.getDebugState?.()?.phase).toBe('p3');
  });

  it('EX：P4 段重試回 true、第二血條滿灌（maxHp 換刻度）', () => {
    const emit = vi.fn();
    const scene = makeScene([], emit);
    const handle = createPrismix(scene, makeHooks(), { ex: true, arenaLeft: () => 0 });
    handle.spawn();
    const step = stepper(handle);
    handle.applyDamage(30);
    expect(step(() => handle.getDebugState?.()?.state !== 'mirror')).toBe(true);
    handle.applyDamageAt?.(999, 0, 352);
    expect(step(() => handle.getDebugState?.()?.phase === 'p3')).toBe(true);
    handle.applyDamage(999);
    expect(handle.getDebugState?.()?.phase).toBe('p4');
    emit.mockClear();
    expect(handle.trySegmentRespawn?.()).toBe(true);
    const rebirthHp = Math.round(120 * EX_PRISMIX.rebirthHpRatio);
    const damaged = emit.mock.calls.find((call) => call[0] === GameEvents.BOSS_DAMAGED);
    expect(damaged?.[1]).toEqual({ hp: rebirthHp, maxHp: rebirthHp, damage: 0 });
  });

  it('非 EX：P3 亦回 false（段檢查點 EX 限定，非 EX 行為零改變）', () => {
    const scene = makeScene([]);
    const handle = createPrismix(scene, makeHooks(), { ex: false, arenaLeft: () => 0 });
    handle.spawn();
    const step = stepper(handle);
    handle.applyDamage(28);
    expect(step(() => handle.getDebugState?.()?.state !== 'mirror')).toBe(true);
    handle.applyDamageAt?.(999, 0, 352);
    expect(step(() => handle.getDebugState?.()?.phase === 'p3')).toBe(true);
    expect(handle.trySegmentRespawn?.()).toBe(false);
  });
});
