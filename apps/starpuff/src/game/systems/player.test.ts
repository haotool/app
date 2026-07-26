import { beforeEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { STAR_FLAVORS, FORGIVENESS, STAR, STARSTORM, STAR_MIXES, getMix } from '../core/config';
import { GameEvents } from '../core/events';
import { MAX_CONCURRENT_WIND_BLADES, STAR_POOL_MAX } from '../logic/skills';
import { TRANSFORM_FORMS, unlockedTransformForms } from '../logic/transform';
import type { ControlsState } from './controls';
import { createPlayer } from './player';

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
    'strokeCircle',
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
    sourceWidth: number;
    sourceHeight: number;
    setSize(w: number, h: number, center?: boolean): void;
    setOffset: ReturnType<typeof vi.fn>;
  };
  setDisplaySize(w: number, h: number): FakePlayerSprite;
  setCollideWorldBounds(): FakePlayerSprite;
  setVelocity(vx: number, vy: number): FakePlayerSprite;
  setVelocityX(vx: number): FakePlayerSprite;
  setVelocityY(vy: number): FakePlayerSprite;
  setFlipX(): FakePlayerSprite;
  setAlpha(): FakePlayerSprite;
  setRotation(): FakePlayerSprite;
  setScale(sx: number, sy?: number): FakePlayerSprite;
  setTexture(key: string): FakePlayerSprite;
  destroy(): void;
}

// 立繪源尺寸替身（R7 破圖回歸鎖）：模擬 #857 素材源尺寸不一——換圖後 frame
// 尺寸改變，displaySize 未重算即體感暴增。
const FAKE_TEXTURE_SIZE: Record<string, number> = {
  'hero-ember': 768,
  'hero-tide': 1254,
  'hero-prism': 1254,
  'hero-gravity': 1254,
};

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
    texture: { key: 'hero-idle' },
    frame: { realWidth: 512, realHeight: 512 },
    body: {
      velocity: { x: 0, y: 0 },
      blocked: { down: true },
      touching: { down: false },
      // Phaser Body.updateBounds 語意替身：世界尺寸 = source 尺寸 × scale。
      sourceWidth: 0,
      sourceHeight: 0,
      setSize(w: number, h: number) {
        sprite.body.sourceWidth = w;
        sprite.body.sourceHeight = h;
      },
      setOffset: vi.fn(),
    },
    setDisplaySize(w: number, h: number) {
      sprite.scaleX = w / sprite.frame.realWidth;
      sprite.scaleY = h / sprite.frame.realHeight;
      return sprite;
    },
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
    setTexture(key: string) {
      sprite.texture.key = key;
      const size = FAKE_TEXTURE_SIZE[key] ?? 512;
      sprite.frame.realWidth = size;
      sprite.frame.realHeight = size;
      return sprite;
    },
    destroy: vi.fn(),
  };
  return sprite;
}

function makeHarness(texturesExist = false): {
  player: ReturnType<typeof createPlayer>;
  groups: { maxSize: number }[];
  emit: ReturnType<typeof vi.fn>;
} {
  const groups: { maxSize: number }[] = [];
  const emit = vi.fn();
  const scene = {
    textures: { exists: () => texturesExist },
    add: {
      image: () => chainable(),
      zone: () => ({ setPosition: vi.fn(), destroy: vi.fn() }),
      graphics: () => chainable(),
      ellipse: () => chainable(),
      circle: () => chainable(),
      // 鏈式方法回傳同一 target：start/stop/explode 直接掛上，避免 setDepth 鏈斷丟失。
      particles: () => {
        const emitter = chainable();
        emitter['start'] = vi.fn();
        emitter['stop'] = vi.fn();
        emitter['explode'] = vi.fn();
        return emitter;
      },
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
    events: { on: vi.fn(), once: vi.fn(), off: vi.fn(), emit },
    tweens: { add: vi.fn(), killTweensOf: vi.fn(), isTweening: () => false },
    time: { now: 0 },
    cameras: { main: { worldView: { x: 0, right: 854 } } },
  } as unknown as Phaser.Scene;
  // 解鎖集（§119）：單測給全形態，資格裁決守門案在 transform.test.ts。
  return { player: createPlayer(scene, 100, 300, unlockedTransformForms(30)), groups, emit };
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

  // #831：風刃走 stars 共用池——池上限必須同時涵蓋滿匣散射與風刃最大併發，
  // 兩者疊加（變身前在飛星彈＋變身後連發風刃）不得互擠致靜默生成失敗。
  it('池上限 ≥ 滿匣散射 ＋ 風刃最大併發（#831 共用池疊加需求）', () => {
    const maxScatter = Math.max(1, ...STAR_MIXES.map((mix) => mix.scatterCount));
    expect(MAX_CONCURRENT_WIND_BLADES).toBeGreaterThanOrEqual(1);
    expect(STAR_POOL_MAX).toBeGreaterThanOrEqual(
      STAR.maxAmmo * maxScatter + MAX_CONCURRENT_WIND_BLADES,
    );
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

  // #831 極端併發：滿匣散射全數在飛（fake 星彈不移動、永不出視野）疊加風化連發，
  // 每發風刃都必須成功生成——共用池不得讓風刃因池滿靜默消失（輸出必有回饋）。
  it('滿匣散射在飛＋風化連發：風刃全數生成不因池滿靜默失敗', () => {
    const { player } = makeHarness();
    // 先結晶消耗（§109）再滿匣碎鑽星，發射 5 輪 → 15 發在飛。
    for (let i = 0; i < 12 && player.getStarburst().phase === 'none'; i += 1) {
      player.grantStar('jelly');
    }
    for (let i = 0; i < STAR.maxAmmo; i += 1) {
      player.grantStar('shelly');
      player.grantStar('drilly');
    }
    for (let i = 0; i < STAR.maxAmmo; i += 1) {
      player.update(PRESS, 16);
      player.update(IDLE, 16);
    }
    const scatter = getMix('shardrill').scatterCount;
    const activeCount = () =>
      (player.getStars().getChildren() as unknown as FakeStar[]).filter((star) => star.active)
        .length;
    expect(activeCount()).toBe(STAR.maxAmmo * scatter);
    // 清蓄能星使 SP 語意回到變身（detonate 優先序高於 transform）。
    player.clearStarburst();
    // 疾風星 ×3（連吞升級佔 2 發）→ 風化資格成立，SP 點按地面即變身。
    for (let i = 0; i < 3; i += 1) player.grantStar('floaty');
    player.update({ ...IDLE, spPressed: true }, 16);
    expect(player.getTransformState().form).toBe('gale');
    // 以發射 CD 節拍連發至理論同屏上界：每發都成功生成。
    for (let i = 0; i < MAX_CONCURRENT_WIND_BLADES; i += 1) {
      player.update({ ...IDLE, actionPressed: true, actionHeld: true }, 16);
      expect(activeCount()).toBe(STAR.maxAmmo * scatter + i + 1);
      player.update(IDLE, 400);
    }
    expect(activeCount()).toBe(STAR.maxAmmo * scatter + MAX_CONCURRENT_WIND_BLADES);
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

describe('星光虹吸被抽（§113 stealTopStar）', () => {
  it('頂槽出匣不發射、HUD ammo 事件同步；空匣回 false 不發事件', () => {
    const { player, emit } = makeHarness();
    player.grantStar('shelly');
    player.grantStar('glowy');
    emit.mockClear();
    expect(player.stealTopStar()).toBe(true);
    expect(player.getMagazine()).toHaveLength(1);
    expect(player.getMagazine()[0]?.flavor).toBe('shelly');
    expect(emit).toHaveBeenCalledWith(
      GameEvents.AMMO_CHANGED,
      expect.objectContaining({ ammo: 1 }),
    );
    expect(player.stealTopStar()).toBe(true);
    emit.mockClear();
    expect(player.stealTopStar()).toBe(false);
    expect(emit).not.toHaveBeenCalledWith(GameEvents.AMMO_CHANGED, expect.anything());
  });
});

describe('§119 焰彈 burn 標記池重用（PR #886 收斂）', () => {
  it('焰彈後復用同一池物件發射一般星：burn 殘留必須清除', () => {
    const { player } = makeHarness();
    // 重鑽味 ×3（連吞升級佔 2 發）→ 焰化資格成立，SP 點按地面即變身。
    for (let i = 0; i < 3; i += 1) player.grantStar('drilly');
    player.update({ ...IDLE, spPressed: true }, 16);
    expect(player.getTransformState().form).toBe('ember');
    // B 點按發焰彈：burn 標記為真。
    player.update(PRESS, 16);
    const stars = player.getStars().getChildren() as unknown as FakeStar[];
    const emberShot = stars.find((star) => star.active);
    expect(emberShot?.getData('burn')).toBe(true);
    // 模擬回收（recycleStar 語意）→ 解除變身 → 一般星發射復用同一池物件。
    emberShot?.setActive(false);
    player.update(IDLE, 16);
    player.update({ ...IDLE, spPressed: true }, 16);
    expect(player.getTransformState().form).toBeNull();
    player.grantStar('jelly');
    player.update(PRESS, 16);
    const reused = stars.find((star) => star.active);
    expect(reused).toBe(emberShot);
    expect(reused?.getData('burn')).toBe(false);
  });
});

describe('§119 形態彈池瞬時旗標循環（PR #886 R3：launchShot 取出必全歸位）', () => {
  it('殘留 tideDeflected/reflected/inhalable 的池星彈被焰彈復用後必為 false', () => {
    const { player } = makeHarness();
    // 先發一發一般星建立池物件，模擬互動旗標殘留後回收。
    player.grantStar('jelly');
    player.update(PRESS, 16);
    player.update(IDLE, 16);
    const stars = player.getStars().getChildren() as unknown as FakeStar[];
    const pooled = stars.find((star) => star.active);
    if (!pooled) throw new Error('星彈未生成');
    pooled.setData('tideDeflected', true);
    pooled.setData('reflected', true);
    pooled.setData('inhalable', true);
    pooled.setActive(false);
    // 焰化後 B 點按經 formSkills.launchShot 復用同一物件：旗標必須歸位。
    for (let i = 0; i < 3; i += 1) player.grantStar('drilly');
    player.update({ ...IDLE, spPressed: true }, 16);
    expect(player.getTransformState().form).toBe('ember');
    player.update(PRESS, 16);
    const reused = stars.find((star) => star.active);
    expect(reused).toBe(pooled);
    expect(reused?.getData('tideDeflected')).toBe(false);
    expect(reused?.getData('reflected')).toBe(false);
    expect(reused?.getData('inhalable')).toBe(false);
    expect(reused?.getData('burn')).toBe(true);
  });
});

// 星彈四鍵必寫回歸鎖（PR #886 R5/R6）：damage/pierce/flavor/mix 的排除理由是
// 「兩發射器每發必寫」——本案把該事實升級為機制（拿掉任一鍵寫入即紅）。
// R6 修假信心：形態彈復用一般星的池物件時，殘留四鍵會讓斷言空過（Grok mutation
// 實證刪 launchShot 四鍵寫入仍綠——防池殘留的測試被池殘留騙過）。修法＝發射前
// 對候選池物件把四鍵清為 undefined sentinel，斷言只能由本發寫入滿足。
describe('星彈四鍵必寫（launchStar/launchShot，PR #886 R5/R6）', () => {
  const FOUR_KEYS = ['damage', 'pierce', 'flavor', 'mix'] as const;

  it('一般星發射後四鍵為本發正確值（發射前寫毒值，殘值頂替即紅）', () => {
    const { player } = makeHarness();
    player.grantStar('jelly');
    player.update(PRESS, 16);
    player.update(IDLE, 16);
    const stars = player.getStars().getChildren() as unknown as FakeStar[];
    const normal = stars.find((star) => star.active);
    if (!normal) throw new Error('一般星未生成');
    // R8：sentinel 改毒值——若生產改用 ?? fallback，undefined sentinel 仍會綠；
    // 毒值配具體期望值，殘值或 fallback 頂替一律紅。
    for (const key of FOUR_KEYS) normal.setData(key, -999);
    normal.setActive(false);
    player.grantStar('jelly');
    player.update(PRESS, 16);
    player.update(IDLE, 16);
    const reused = stars.find((star) => star.active);
    expect(reused).toBe(normal);
    expect(reused?.getData('damage')).toBe(STAR_FLAVORS.jelly.damage);
    expect(reused?.getData('pierce')).toBe(STAR_FLAVORS.jelly.pierceCount);
    expect(reused?.getData('flavor')).toBe('jelly');
    expect(reused?.getData('mix')).toBeNull();
  });

  it('形態彈（launchShot 管線）四鍵為本發正確值（毒值禁殘值/fallback 頂替）', () => {
    const { player } = makeHarness();
    // 先發一發一般星建立池物件（製造殘值現場）。
    player.grantStar('jelly');
    player.update(PRESS, 16);
    player.update(IDLE, 16);
    const stars = player.getStars().getChildren() as unknown as FakeStar[];
    const pooled = stars.find((star) => star.active);
    if (!pooled) throw new Error('一般星未生成');
    // 毒值＋回收：復用時四鍵只能由 launchShot 本發寫入的正確值滿足。
    for (const key of FOUR_KEYS) pooled.setData(key, -999);
    pooled.setActive(false);
    for (let i = 0; i < 3; i += 1) player.grantStar('drilly');
    player.update({ ...IDLE, spPressed: true }, 16);
    expect(player.getTransformState().form).toBe('ember');
    player.update(PRESS, 16);
    const formShot = stars.find((star) => star.active);
    if (!formShot) throw new Error('形態彈未生成');
    expect(formShot).toBe(pooled);
    const emberShot = TRANSFORM_FORMS.ember.shot;
    if (!emberShot) throw new Error('焰化 shot 規格缺失');
    expect(formShot?.getData('damage')).toBe(emberShot.damage);
    expect(formShot?.getData('pierce')).toBe(emberShot.pierceCount);
    expect(formShot?.getData('flavor')).toBe(emberShot.flavor);
    expect(formShot?.getData('mix')).toBeNull();
  });
});

// 變身破圖回歸鎖（PR #886 R7）：#857 形態立繪源尺寸不一（ember 768、tide/prism/
// gravity 1254 vs 基準 512），換圖若不重算 displaySize，變身瞬間視覺暴增近 2.5 倍
// 且與生成時錨定的物理箱脫鉤。wearTexture 統一入口必須讓「顯示 px = 48」恆成立。
describe('變身換裝尺寸解耦（PR #886 R7）', () => {
  // R8 判定箱斷言：Body.updateBounds 每步以 sourceWidth×|scaleX| 重算世界尺寸——
  // hurtbox 若凍結生成時 512 基準，換 768/1254 源後會縮水 33%~59%（視覺不動）。
  const bodyWorldW = (sprite: FakePlayerSprite) => sprite.body.sourceWidth * sprite.scaleX;
  const bodyWorldH = (sprite: FakePlayerSprite) => sprite.body.sourceHeight * sprite.scaleY;
  const HURT_W = 48 * FORGIVENESS.hurtboxWidthRatio;
  const HURT_H = 48 * FORGIVENESS.hurtboxHeightRatio;

  it('穿上超尺寸形態立繪與返回姿勢立繪：顯示尺寸恆為 PLAYER_SIZE', () => {
    const { player } = makeHarness(true);
    const sprite = player.sprite as unknown as FakePlayerSprite;
    // 生成基準：hero-idle 512 源 → 48px；世界判定箱 36×38.4。
    expect(sprite.scaleX * sprite.frame.realWidth).toBeCloseTo(48);
    expect(bodyWorldW(sprite)).toBeCloseTo(HURT_W);
    expect(bodyWorldH(sprite)).toBeCloseTo(HURT_H);
    // 焰化（768 源）：顯示 px 必須仍為 48（未重算會是 72）。
    for (let i = 0; i < 3; i += 1) player.grantStar('drilly');
    player.update({ ...IDLE, spPressed: true }, 16);
    expect(player.getTransformState().form).toBe('ember');
    player.update(IDLE, 16);
    expect(sprite.texture.key).toBe('hero-ember');
    expect(sprite.frame.realWidth).toBe(768);
    expect(sprite.scaleX * sprite.frame.realWidth).toBeCloseTo(48);
    expect(bodyWorldW(sprite)).toBeCloseTo(HURT_W);
    expect(bodyWorldH(sprite)).toBeCloseTo(HURT_H);
    // 解除返回姿勢立繪（512 源）：同樣恆為 48。
    player.update({ ...IDLE, spPressed: true }, 16);
    expect(player.getTransformState().form).toBeNull();
    player.update(IDLE, 16);
    expect(sprite.frame.realWidth).toBe(512);
    expect(sprite.scaleX * sprite.frame.realWidth).toBeCloseTo(48);
    expect(bodyWorldW(sprite)).toBeCloseTo(HURT_W);
  });

  it('潮化（1254 源）同鎖：顯示尺寸恆為 PLAYER_SIZE', () => {
    const { player } = makeHarness(true);
    const sprite = player.sprite as unknown as FakePlayerSprite;
    for (let i = 0; i < 3; i += 1) player.grantStar('spora');
    player.update({ ...IDLE, spPressed: true }, 16);
    expect(player.getTransformState().form).toBe('tide');
    player.update(IDLE, 16);
    expect(sprite.frame.realWidth).toBe(1254);
    expect(sprite.scaleX * sprite.frame.realWidth).toBeCloseTo(48);
    // 修復前此處為 14.7（−59%）：判定箱與源解析度解耦的核心斷言。
    expect(bodyWorldW(sprite)).toBeCloseTo(HURT_W);
    expect(bodyWorldH(sprite)).toBeCloseTo(HURT_H);
  });
});
