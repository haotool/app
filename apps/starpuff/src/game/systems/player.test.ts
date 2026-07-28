import { beforeEach, describe, expect, it, vi } from 'vitest';
import Phaser from 'phaser';
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
// 分層素材特效（§124 W5a）：純顯示層，player 邏輯測試以 mock 隔離。
vi.mock('./fxLayers', () => ({
  burstLayers: vi.fn(),
  flashSprite: vi.fn(),
  flashStarImpact: vi.fn(),
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
  setTexture(key: string): FakeStar;
  setFlipX(value: boolean): FakeStar;
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
    setTexture: () => star,
    setFlipX: () => star,
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

// texture/setTexture（R9）：幀鉤真正觸發後，POST_UPDATE 的剪影鏡像會讀
// silhouette.texture.key——chainable 替身必須可駛完整幀序。
function chainable(): Record<string, ReturnType<typeof vi.fn>> & { texture: { key: string } } {
  const target: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const key of [
    'setDisplaySize',
    'setTexture',
    'setTint',
    'setTintMode',
    'setPosition',
    'setRotation',
    'setFlipX',
    'setScale',
    'setAlpha',
    'setVisible',
    'setDepth',
    'setBlendMode',
    'setStrokeStyle',
    'clear',
    'lineStyle',
    'strokeCircle',
    'beginPath',
    'arc',
    'strokePath',
    'fillStyle',
    'fillCircle',
    'slice',
    'fillPath',
    'destroy',
  ]) {
    target[key] = vi.fn(() => target);
  }
  // frame（§124 W5a）：badge／光環素材以 frame.realWidth 換算縮放，替身回 512 基準。
  return Object.assign(target, { texture: { key: '' }, frame: { realWidth: 512 } });
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
  // visualScale 幀鉤以 sprite.scene 判活體（銷毀即跳過）；替身恆掛場景（R9）。
  scene: unknown;
  texture: { key: string };
  frame: { realWidth: number; realHeight: number };
  body: {
    velocity: { x: number; y: number };
    blocked: { down: boolean };
    touching: { down: boolean };
    sourceWidth: number;
    sourceHeight: number;
    // Phaser Body 快取語意（#896）：setSize 以上次 updateBounds 快取的 _sx/_sy
    // 換算世界尺寸（width/height），而非即時 scaleX——換裝當幀不同步即暫態誤差。
    _sx: number;
    _sy: number;
    width: number;
    height: number;
    setSize(w: number, h: number, center?: boolean): void;
    setOffset: ReturnType<typeof vi.fn>;
    updateBounds(): void;
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
    scene: {},
    texture: { key: 'hero-idle' },
    frame: { realWidth: 512, realHeight: 512 },
    body: {
      velocity: { x: 0, y: 0 },
      blocked: { down: true },
      touching: { down: false },
      // Phaser Body 快取語意替身（#896，貼 Body.js）：setSize 用上次 updateBounds
      // 快取的 _sx/_sy 換算世界尺寸；updateBounds 才把即時 scale 寫回快取——
      // 舊替身以「sourceWidth × 即時 scaleX」直算，鎖不住換裝首幀的 _sx 快取縫。
      sourceWidth: 0,
      sourceHeight: 0,
      _sx: 1,
      _sy: 1,
      width: 0,
      height: 0,
      setSize(w: number, h: number) {
        sprite.body.sourceWidth = w;
        sprite.body.sourceHeight = h;
        sprite.body.width = w * sprite.body._sx;
        sprite.body.height = h * sprite.body._sy;
      },
      setOffset: vi.fn(),
      updateBounds() {
        sprite.body._sx = sprite.scaleX;
        sprite.body._sy = sprite.scaleY;
        sprite.body.width = sprite.body.sourceWidth * sprite.body._sx;
        sprite.body.height = sprite.body.sourceHeight * sprite.body._sy;
      },
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
      // 變身分鏡幀（§124 W5a）：素材產線 1024 源——同屬超尺寸解耦鎖範圍。
      const size = FAKE_TEXTURE_SIZE[key] ?? (key.includes('-morph-') ? 1024 : 512);
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
  frame: { preUpdate(): void; postUpdate(): void };
} {
  const groups: { maxSize: number }[] = [];
  const emit = vi.fn();
  // 幀鉤替身（R9）：on/off 真實記錄 handler，frame 依註冊序觸發 PRE/POST_UPDATE
  // 模擬跨幀——vi.fn() 版永不觸發回呼，「移除 wearTexture 的 vscale.rebase」單測
  // 仍綠（產線下一幀被舊基準沖掉）＝假信心；emit 維持 spy 供遊戲事件斷言。
  const sceneHandlers = new Map<string, ((...args: unknown[]) => void)[]>();
  const fireScene = (event: string) => {
    for (const handler of sceneHandlers.get(event) ?? []) handler();
  };
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
    events: {
      on: (event: string, handler: (...args: unknown[]) => void) => {
        sceneHandlers.set(event, [...(sceneHandlers.get(event) ?? []), handler]);
      },
      once: vi.fn(),
      off: (event: string, handler: (...args: unknown[]) => void) => {
        sceneHandlers.set(
          event,
          (sceneHandlers.get(event) ?? []).filter((entry) => entry !== handler),
        );
      },
      emit,
    },
    tweens: { add: vi.fn(), killTweensOf: vi.fn(), isTweening: () => false },
    time: { now: 0 },
    cameras: { main: { worldView: { x: 0, right: 854 } } },
  } as unknown as Phaser.Scene;
  // 解鎖集（§119）：單測給全形態，資格裁決守門案在 transform.test.ts。
  return {
    player: createPlayer(scene, 100, 300, unlockedTransformForms(30)),
    groups,
    emit,
    frame: {
      preUpdate: () => fireScene(Phaser.Scenes.Events.PRE_UPDATE),
      postUpdate: () => fireScene(Phaser.Scenes.Events.POST_UPDATE),
    },
  };
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

  // R9 跨幀鎖（Grok MEDIUM）：PRE_UPDATE 以 vscale 基準覆寫 scale——wearTexture 若漏
  // rebase，換裝當幀綠、下一幀被舊基準沖掉。斷言落在 PRE 後（Body.updateBounds 的
  // 物理讀取點），再走 POST 完成真實幀序（視覺 base×fx×mod 不入斷言）。
  const expectStableAcrossFrame = (
    frame: { preUpdate(): void; postUpdate(): void },
    sprite: FakePlayerSprite,
  ) => {
    frame.preUpdate();
    expect(sprite.scaleX * sprite.frame.realWidth).toBeCloseTo(48);
    expect(bodyWorldW(sprite)).toBeCloseTo(HURT_W);
    expect(bodyWorldH(sprite)).toBeCloseTo(HURT_H);
    frame.postUpdate();
  };

  it('穿上超尺寸形態立繪與返回姿勢立繪：顯示尺寸恆為 PLAYER_SIZE', () => {
    const { player, frame } = makeHarness(true);
    const sprite = player.sprite as unknown as FakePlayerSprite;
    // 生成基準：hero-idle 512 源 → 48px；世界判定箱 36×38.4。
    expect(sprite.scaleX * sprite.frame.realWidth).toBeCloseTo(48);
    expect(bodyWorldW(sprite)).toBeCloseTo(HURT_W);
    expect(bodyWorldH(sprite)).toBeCloseTo(HURT_H);
    // 焰化：變身當幀先穿分鏡幀（§124 W5a，1024 源）——同鎖顯示尺寸恆定。
    for (let i = 0; i < 3; i += 1) player.grantStar('drilly');
    player.update({ ...IDLE, spPressed: true }, 16);
    expect(player.getTransformState().form).toBe('ember');
    player.update(IDLE, 16);
    expect(sprite.texture.key).toBe('hero-ember-morph-gather');
    expect(sprite.frame.realWidth).toBe(1024);
    expect(sprite.scaleX * sprite.frame.realWidth).toBeCloseTo(48);
    expect(bodyWorldW(sprite)).toBeCloseTo(HURT_W);
    // 分鏡播畢落形態立繪（768 源）：顯示 px 必須仍為 48（未重算會是 72）。
    player.update(IDLE, 500);
    expect(sprite.texture.key).toBe('hero-ember');
    expect(sprite.frame.realWidth).toBe(768);
    expect(sprite.scaleX * sprite.frame.realWidth).toBeCloseTo(48);
    expect(bodyWorldW(sprite)).toBeCloseTo(HURT_W);
    expect(bodyWorldH(sprite)).toBeCloseTo(HURT_H);
    // 跨幀後恆定（R9）：漏 rebase 時此處 72（顯示）／54×57.6（判定箱）必紅。
    expectStableAcrossFrame(frame, sprite);
    // 解除返回姿勢立繪（512 源）：同樣恆為 48。
    player.update({ ...IDLE, spPressed: true }, 16);
    expect(player.getTransformState().form).toBeNull();
    player.update(IDLE, 16);
    expect(sprite.frame.realWidth).toBe(512);
    expect(sprite.scaleX * sprite.frame.realWidth).toBeCloseTo(48);
    expect(bodyWorldW(sprite)).toBeCloseTo(HURT_W);
    expectStableAcrossFrame(frame, sprite);
  });

  it('潮化（1254 源）同鎖：顯示尺寸恆為 PLAYER_SIZE', () => {
    const { player, frame } = makeHarness(true);
    const sprite = player.sprite as unknown as FakePlayerSprite;
    for (let i = 0; i < 3; i += 1) player.grantStar('spora');
    player.update({ ...IDLE, spPressed: true }, 16);
    expect(player.getTransformState().form).toBe('tide');
    // 分鏡播畢（§124）落形態立繪後斷言（分鏡幀恆 48 由焰化案鎖住）。
    player.update(IDLE, 500);
    expect(sprite.frame.realWidth).toBe(1254);
    expect(sprite.scaleX * sprite.frame.realWidth).toBeCloseTo(48);
    // 修復前此處為 14.7（−59%）：判定箱與源解析度解耦的核心斷言。
    expect(bodyWorldW(sprite)).toBeCloseTo(HURT_W);
    expect(bodyWorldH(sprite)).toBeCloseTo(HURT_H);
    // 跨幀後恆定（R9）：漏 rebase 時顯示 117.56、判定箱 88.17 必紅。
    expectStableAcrossFrame(frame, sprite);
  });

  // #897 防禦深度：prism／gravity 與 ember／tide 共用 wearTexture 唯一入口，
  // 但缺對等跨幀案——vscale.rebase／fitHurtbox 回歸時會晚於 ember／tide 被發現。
  it('稜化（1254 源）同鎖：顯示尺寸恆為 PLAYER_SIZE（#897）', () => {
    const { player, frame } = makeHarness(true);
    const sprite = player.sprite as unknown as FakePlayerSprite;
    for (let i = 0; i < 3; i += 1) player.grantStar('glowy');
    player.update({ ...IDLE, spPressed: true }, 16);
    expect(player.getTransformState().form).toBe('prism');
    player.update(IDLE, 500);
    expect(sprite.frame.realWidth).toBe(1254);
    expect(sprite.scaleX * sprite.frame.realWidth).toBeCloseTo(48);
    expect(bodyWorldW(sprite)).toBeCloseTo(HURT_W);
    expect(bodyWorldH(sprite)).toBeCloseTo(HURT_H);
    expectStableAcrossFrame(frame, sprite);
  });

  it('引力化（1254 源）同鎖：顯示尺寸恆為 PLAYER_SIZE（#897）', () => {
    const { player, frame } = makeHarness(true);
    const sprite = player.sprite as unknown as FakePlayerSprite;
    for (let i = 0; i < 3; i += 1) player.grantStar('boomy');
    player.update({ ...IDLE, spPressed: true }, 16);
    expect(player.getTransformState().form).toBe('gravity');
    player.update(IDLE, 500);
    expect(sprite.frame.realWidth).toBe(1254);
    expect(sprite.scaleX * sprite.frame.realWidth).toBeCloseTo(48);
    expect(bodyWorldW(sprite)).toBeCloseTo(HURT_W);
    expect(bodyWorldH(sprite)).toBeCloseTo(HURT_H);
    expectStableAcrossFrame(frame, sprite);
  });

  // 變身分鏡播放（§124 W5a）：五幀依序穿戴→落形態立繪；提前解除清序列不殘留。
  it('變身分鏡五幀依序穿戴後落形態立繪；提前解除立即回姿勢', () => {
    const { player } = makeHarness(true);
    const sprite = player.sprite as unknown as FakePlayerSprite;
    for (let i = 0; i < 3; i += 1) player.grantStar('drilly');
    player.update({ ...IDLE, spPressed: true }, 16);
    expect(sprite.texture.key).toBe('hero-ember-morph-gather');
    const seen: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      player.update(IDLE, 90);
      seen.push(sprite.texture.key);
    }
    expect(seen).toContain('hero-ember-morph-shrink');
    expect(seen).toContain('hero-ember-morph-burst');
    expect(seen).toContain('hero-ember-morph-complete');
    expect(seen[seen.length - 1]).toBe('hero-ember');
    // 提前解除：分鏡序列清除、立即回姿勢貼圖（不殘留分鏡幀）。
    player.update({ ...IDLE, spPressed: true }, 16);
    expect(player.getTransformState().form).toBeNull();
    expect(sprite.texture.key).toBe('hero-idle');
  });

  // 換裝首幀判定箱同步（#896）：Phaser Body.setSize 以上次 updateBounds 快取的
  // _sx 換算世界尺寸——fitHurtbox 若不主動 updateBounds，換裝當幀 hurtbox 為
  // 舊 scale 換算值（實測 ember 54／tide 88.17，基準 36；解除回 512 暫縮 24），
  // 下一物理步才自動修正。本案直讀 body.width（快取語意欄位），與既有
  // bodyWorldW（sourceWidth × 即時 scaleX＝穩定後語意）互補；移除 fitHurtbox
  // 末尾 updateBounds 時本案必紅（快取停在生成前 _sx=1，width=576/940.5/384）。
  it('換裝當幀 body 世界寬立即同步：ember／tide 首幀無暫態誤差（#896）', () => {
    const { player } = makeHarness(true);
    const sprite = player.sprite as unknown as FakePlayerSprite;
    // 生成當幀即同步（未同步時 width＝384×1＝384）。
    expect(sprite.body.width).toBeCloseTo(HURT_W);
    expect(sprite.body.height).toBeCloseTo(HURT_H);
    // 焰化（768 源）換裝當幀（未同步時 576×舊 _sx）。
    for (let i = 0; i < 3; i += 1) player.grantStar('drilly');
    player.update({ ...IDLE, spPressed: true }, 16);
    expect(player.getTransformState().form).toBe('ember');
    expect(sprite.body.width).toBeCloseTo(HURT_W);
    expect(sprite.body.height).toBeCloseTo(HURT_H);
    // 解除回姿勢立繪（512 源）當幀（未同步時暫縮）。
    player.update({ ...IDLE, spPressed: true }, 16);
    expect(player.getTransformState().form).toBeNull();
    player.update(IDLE, 16);
    expect(sprite.body.width).toBeCloseTo(HURT_W);
    // 潮化（1254 源）換裝當幀（未同步時 940.5×舊 _sx）。
    for (let i = 0; i < 3; i += 1) player.grantStar('spora');
    player.update({ ...IDLE, spPressed: true }, 16);
    expect(player.getTransformState().form).toBe('tide');
    expect(sprite.body.width).toBeCloseTo(HURT_W);
    expect(sprite.body.height).toBeCloseTo(HURT_H);
  });
});

// 已銷毀 sprite 護欄（#898）：Phaser destroy() 會清 sprite.scene；visualScale
// 幀鉤以 scene 判活體。既有替身 scene:{} 恆為 truthy，護欄路徑從未被測到——
// 本案模擬 destroy 後幀鉤不得覆寫 scale；移除 visualScale 活體檢查必紅。
describe('visualScale 銷毀護欄（#898）', () => {
  it('sprite.scene 清空後 PRE／POST 幀鉤不再覆寫 scale', () => {
    const { player, frame } = makeHarness(true);
    const sprite = player.sprite as unknown as FakePlayerSprite;
    // 對照組：活體時幀鉤覆寫毒值回基準（證明本案警戒的覆寫路徑真實存在）。
    sprite.scaleX = 0.5;
    sprite.scaleY = 0.5;
    frame.preUpdate();
    expect(sprite.scaleX).toBeCloseTo(48 / 512);
    // 模擬 Phaser destroy() 清 scene 後寫入毒值：幀鉤必須跳過不覆寫。
    sprite.scene = undefined;
    sprite.scaleX = 0.5;
    sprite.scaleY = 0.5;
    frame.preUpdate();
    expect(sprite.scaleX).toBe(0.5);
    frame.postUpdate();
    expect(sprite.scaleX).toBe(0.5);
    expect(sprite.scaleY).toBe(0.5);
  });
});
