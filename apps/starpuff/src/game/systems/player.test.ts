import { beforeEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { STAR, STARSTORM, STAR_MIXES, getMix } from '../core/config';
import { GameEvents } from '../core/events';
import type { ControlsState } from './controls';
import { STAR_POOL_MAX, createPlayer } from './player';

// 星彈池回歸（#820）：滿匣（maxAmmo）連續散射（碎鑽星 ×3）理論同時需求 9 發，
// 池上限低於此值時第 9 發被靜默吞掉、彈藥照扣。fake group 忠實模擬 Arcade Group
// maxSize 語意（先取 inactive、總數達上限回 null），鎖住全數生成與彈藥計數一致。

vi.mock('phaser', () => ({
  default: {
    Scenes: { Events: { PRE_UPDATE: 'preupdate', POST_UPDATE: 'postupdate' } },
    TintModes: { FILL: 1 },
  },
}));
vi.mock('../audio/sfx', () => ({ playSfx: vi.fn(), stopSfx: vi.fn() }));
vi.mock('./fx', () => ({
  FX_TEXTURES: { dot: 'fx-dot', star: 'fx-star' },
  ensureFxTextures: vi.fn(),
  burstSmall: vi.fn(),
  attachTrail: vi.fn(() => ({ stop: vi.fn() })),
}));

interface FakeStar {
  x: number;
  y: number;
  active: boolean;
  rotation: number;
  body: { enable: boolean; reset: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> };
  setActive(value: boolean): FakeStar;
  setVisible(value: boolean): FakeStar;
  setDisplaySize(): FakeStar;
  setTint(): FakeStar;
  clearTint(): FakeStar;
  setRotation(): FakeStar;
  setData(key: string, value: unknown): FakeStar;
  getData(key: string): unknown;
  setVelocity(): FakeStar;
}

function makeFakeStar(x: number, y: number): FakeStar {
  const data = new Map<string, unknown>();
  const star: FakeStar = {
    x,
    y,
    active: false,
    rotation: 0,
    body: { enable: false, reset: vi.fn(), stop: vi.fn() },
    setActive(value: boolean) {
      star.active = value;
      return star;
    },
    setVisible: () => star,
    setDisplaySize: () => star,
    setTint: () => star,
    clearTint: () => star,
    setRotation: () => star,
    setData(key: string, value: unknown) {
      data.set(key, value);
      return star;
    },
    getData: (key: string) => data.get(key),
    setVelocity: () => star,
  };
  return star;
}

// Arcade Group 池語意：優先復用 inactive，總數達 maxSize 且無 inactive 時回 null。
function makeFakeGroup(config: { maxSize: number }): {
  get(x: number, y: number): FakeStar | null;
  getChildren(): FakeStar[];
  destroy: ReturnType<typeof vi.fn>;
} {
  const children: FakeStar[] = [];
  return {
    get(x: number, y: number) {
      const idle = children.find((child) => !child.active);
      if (idle) {
        idle.x = x;
        idle.y = y;
        return idle;
      }
      if (children.length >= config.maxSize) return null;
      const star = makeFakeStar(x, y);
      children.push(star);
      return star;
    },
    getChildren: () => children,
    destroy: vi.fn(),
  };
}

function chainable(): Record<string, ReturnType<typeof vi.fn>> {
  const target: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const key of [
    'setDisplaySize',
    'setTint',
    'setTintMode',
    'setPosition',
    'setRotation',
    'setFlipX',
    'setScale',
    'setAlpha',
    'setVisible',
    'setDepth',
    'setStrokeStyle',
    'clear',
    'lineStyle',
    'beginPath',
    'arc',
    'strokePath',
    'fillStyle',
    'slice',
    'fillPath',
    'destroy',
  ]) {
    target[key] = vi.fn(() => target);
  }
  return target;
}

interface FakePlayerSprite {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  alpha: number;
  visible: boolean;
  flipX: boolean;
  depth: number;
  texture: { key: string };
  frame: { realWidth: number; realHeight: number };
  body: {
    velocity: { x: number; y: number };
    blocked: { down: boolean };
    touching: { down: boolean };
    setSize: ReturnType<typeof vi.fn>;
    setOffset: ReturnType<typeof vi.fn>;
  };
  setDisplaySize(): FakePlayerSprite;
  setCollideWorldBounds(): FakePlayerSprite;
  setVelocity(vx: number, vy: number): FakePlayerSprite;
  setVelocityX(vx: number): FakePlayerSprite;
  setVelocityY(vy: number): FakePlayerSprite;
  setFlipX(): FakePlayerSprite;
  setAlpha(): FakePlayerSprite;
  setRotation(): FakePlayerSprite;
  setScale(sx: number, sy?: number): FakePlayerSprite;
  setTexture(): FakePlayerSprite;
  destroy(): void;
}

function makePlayerSprite(x: number, y: number): FakePlayerSprite {
  const sprite: FakePlayerSprite = {
    x,
    y,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    alpha: 1,
    visible: true,
    flipX: false,
    depth: 0,
    texture: { key: '__WHITE' },
    frame: { realWidth: 48, realHeight: 48 },
    body: {
      velocity: { x: 0, y: 0 },
      blocked: { down: true },
      touching: { down: false },
      setSize: vi.fn(),
      setOffset: vi.fn(),
    },
    setDisplaySize: () => sprite,
    setCollideWorldBounds: () => sprite,
    setVelocity(vx: number, vy: number) {
      sprite.body.velocity.x = vx;
      sprite.body.velocity.y = vy;
      return sprite;
    },
    setVelocityX(vx: number) {
      sprite.body.velocity.x = vx;
      return sprite;
    },
    setVelocityY(vy: number) {
      sprite.body.velocity.y = vy;
      return sprite;
    },
    setFlipX: () => sprite,
    setAlpha: () => sprite,
    setRotation: () => sprite,
    setScale(sx: number, sy?: number) {
      sprite.scaleX = sx;
      sprite.scaleY = sy ?? sx;
      return sprite;
    },
    setTexture: () => sprite,
    destroy: vi.fn(),
  };
  return sprite;
}

function makeHarness(): {
  player: ReturnType<typeof createPlayer>;
  groups: { maxSize: number }[];
  emit: ReturnType<typeof vi.fn>;
} {
  const groups: { maxSize: number }[] = [];
  const emit = vi.fn();
  const scene = {
    textures: { exists: () => false },
    add: {
      image: () => chainable(),
      zone: () => ({ setPosition: vi.fn(), destroy: vi.fn() }),
      graphics: () => chainable(),
      ellipse: () => chainable(),
      circle: () => chainable(),
      particles: () => ({
        ...chainable(),
        start: vi.fn(),
        stop: vi.fn(),
        explode: vi.fn(),
      }),
    },
    physics: {
      add: {
        sprite: (x: number, y: number) => makePlayerSprite(x, y),
        existing: (zone: { body?: unknown }) => {
          zone.body = { setAllowGravity: vi.fn(), enable: false };
          return zone;
        },
        group: (config: { maxSize: number }) => {
          groups.push(config);
          return makeFakeGroup(config);
        },
      },
    },
    events: { on: vi.fn(), off: vi.fn(), emit },
    tweens: { add: vi.fn(), killTweensOf: vi.fn(), isTweening: () => false },
    time: { now: 0 },
    cameras: { main: { worldView: { x: 0, right: 854 } } },
  } as unknown as Phaser.Scene;
  return { player: createPlayer(scene, 100, 300), groups, emit };
}

const IDLE: ControlsState = {
  left: false,
  right: false,
  down: false,
  downBuffered: false,
  jumpPressed: false,
  jumpHeld: false,
  actionPressed: false,
  actionHeld: false,
  spPressed: false,
};
const PRESS: ControlsState = { ...IDLE, actionPressed: true, actionHeld: true };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('星彈池上限（#820）', () => {
  it('池上限 ≥ maxAmmo × 最大散射數（config 派生，禁止低於理論同時需求）', () => {
    const maxScatter = Math.max(1, ...STAR_MIXES.map((mix) => mix.scatterCount));
    expect(STAR_POOL_MAX).toBeGreaterThanOrEqual(STAR.maxAmmo * maxScatter);
  });

  it('滿匣碎鑽星連續散射：全數生成且彈藥計數一致（§109 蓄能星存在時滿匣不再結晶）', () => {
    const { player, groups } = makeHarness();
    // 星彈池以派生上限建池（非硬編 8）。
    expect(groups[0]?.maxSize).toBe(STAR_POOL_MAX);
    // 先以 jelly 填滿觸發自動結晶（§109）：彈匣清空、蓄能星生成——之後滿匣狀態
    // 才可持續（不疊加），供本測試建立滿匣散射情境。
    for (let i = 0; i < 12 && player.getStarburst().phase === 'none'; i += 1) {
      player.grantStar('jelly');
    }
    expect(player.getStarburst().phase).toBe('charged');
    expect(player.getAmmoState().ammo).toBe(0);
    // 吞入 殼盾星+鑽頭星 ×5 → 五槽碎鑽星（scatterCount 3）滿匣。
    for (let i = 0; i < STAR.maxAmmo; i += 1) {
      player.grantStar('shelly');
      player.grantStar('drilly');
    }
    expect(player.getMagazine().every((slot) => slot.mix === 'shardrill')).toBe(true);
    expect(player.getMagazine()).toHaveLength(STAR.maxAmmo);
    // 頂槽殼盾星走延遲發射：點按（<150ms）放開結算，共 maxAmmo 個發射循環。
    for (let i = 0; i < STAR.maxAmmo; i += 1) {
      player.update(PRESS, 16);
      player.update(IDLE, 16);
    }
    const scatter = getMix('shardrill').scatterCount;
    const activeStars = (player.getStars().getChildren() as unknown as FakeStar[]).filter(
      (star) => star.active,
    );
    // 滿匣 × 散射全數生成：第 15 發不得因池滿被靜默吞掉。
    expect(activeStars.length).toBe(STAR.maxAmmo * scatter);
    expect(player.getAmmoState().ammo).toBe(0);
  });
});

describe('星暴 2.0 蓄爆生命週期（§109 回歸鎖）', () => {
  // jelly 連授至滿匣結晶（連吞升級佔 2 發，10 發內必達 5 槽）。
  const chargeUp = (player: ReturnType<typeof createPlayer>): void => {
    for (let i = 0; i < 12 && player.getStarburst().phase === 'none'; i += 1) {
      player.grantStar('jelly');
    }
    expect(player.getStarburst().phase).toBe('charged');
  };
  const SP_TAP: ControlsState = { ...IDLE, spPressed: true };
  // 蓄爆窗全程覆蓋（含餘裕）的 update tick 數。
  const DETONATE_TICKS = Math.ceil(STARSTORM.chargeMs / 50) + 3;

  it('蓄爆中死亡清除（clearStarburst）：取消引爆——期滿不發 SKILL_STARSTORM、相位歸 none', () => {
    const { player, emit } = makeHarness();
    chargeUp(player);
    player.update(SP_TAP, 16);
    expect(player.getStarburst().phase).toBe('detonating');
    player.clearStarburst();
    expect(player.getStarburst().phase).toBe('none');
    emit.mockClear();
    for (let i = 0; i < DETONATE_TICKS; i += 1) player.update(IDLE, 50);
    expect(emit).not.toHaveBeenCalledWith(GameEvents.SKILL_STARSTORM, expect.anything());
    expect(player.getStarburst().phase).toBe('none');
  });

  it('蓄爆僅由 update 推進（completeLevel 凍結語意）：停幀相位凍結不引爆，恢復推進才引爆', () => {
    const { player, emit } = makeHarness();
    chargeUp(player);
    player.update(SP_TAP, 16);
    expect(player.getStarburst().phase).toBe('detonating');
    emit.mockClear();
    // 過關轉場（finished/transitioning）停止 player.update：蓄爆不得由 wall-clock
    // 或 scene timer 旁路推進（harness 無 delayedCall——存在此路徑即 crash 守門）。
    expect(player.getStarburst().phase).toBe('detonating');
    expect(emit).not.toHaveBeenCalledWith(GameEvents.SKILL_STARSTORM, expect.anything());
    // 對照組：恢復 update 推進期滿才引爆（鎖「凍結」而非「壞掉」）。
    for (let i = 0; i < DETONATE_TICKS; i += 1) player.update(IDLE, 50);
    expect(emit).toHaveBeenCalledWith(GameEvents.SKILL_STARSTORM, expect.anything());
    expect(player.getStarburst().phase).toBe('none');
  });
});
