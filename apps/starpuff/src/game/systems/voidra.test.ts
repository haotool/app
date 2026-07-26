import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { createVoidra, type VoidraHooks } from './voidra';

// 滿盾虹吸抽彈守門（PR#855 審查修復）：Voidra 護盾已達上限 2 層時，吸流窗滿
// 不得再呼叫 drainTopStar 扣玩家頂槽——absorbSiphonStar 必回 absorbed:false，
// 先抽後判會讓玩家白丟彈藥。以最小 scene stub 驅動完整 siphon 循環鎖定契約。

vi.mock('phaser', () => ({
  default: {
    Math: {
      Clamp: (value: number, low: number, high: number) => Math.min(high, Math.max(low, value)),
      Distance: { Between: () => 0 },
    },
    TintModes: { FILL: 1, MULTIPLY: 0 },
    Cameras: { Scene2D: { Events: { FADE_OUT_COMPLETE: 'camerafadeoutcomplete' } } },
  },
}));
vi.mock('../audio/sfx', () => ({ playSfx: vi.fn(), stopSfx: vi.fn() }));
vi.mock('./fx', () => ({ ensureFxTextures: vi.fn(), spawnTelegraph: vi.fn() }));
// visualScale 通道替身：本檔驗 FSM 接線與彈幕邏輯，不需要真實 scene 事件。
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

// 顯示物件替身：鏈式 setter 回傳自身，destroy 為 no-op。
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
    'destroy',
  ]) {
    target[key] = () => target;
  }
  return target;
}

interface TweenConfig {
  targets?: unknown;
  onComplete?: (tween: { targets: unknown[] }) => void;
}

// 本體替身記錄 tint 呼叫史（restore-tint 斷言用，沿 syrona harness 慣例）。
function makeBodySprite() {
  const bodySprite = {
    x: 0,
    y: 0,
    width: 140,
    height: 140,
    scaleX: 1,
    scaleY: 1,
    tintHistory: [] as (number | null)[],
    body: {
      enable: true,
      setAllowGravity: vi.fn(),
      setImmovable: vi.fn(),
      setSize: vi.fn(),
    },
    setDisplaySize: () => bodySprite,
    setPosition(x: number, y: number) {
      bodySprite.x = x;
      bodySprite.y = y;
      return bodySprite;
    },
    setTint(tint: number) {
      bodySprite.tintHistory.push(tint);
      return bodySprite;
    },
    clearTint() {
      bodySprite.tintHistory.push(null);
      return bodySprite;
    },
    setTintMode: () => bodySprite,
    destroy: vi.fn(),
  };
  return bodySprite;
}

interface CounterConfig {
  onUpdate?: (tween: { getValue: () => number }) => void;
}

function makeScene(
  emit: ReturnType<typeof vi.fn> = vi.fn(),
  bodySprite: ReturnType<typeof makeBodySprite> = makeBodySprite(),
  counters: CounterConfig[] = [],
): Phaser.Scene {
  const group = () => ({ get: () => null, getMatching: () => [], destroy: vi.fn() });
  return {
    textures: { exists: () => true },
    scale: { width: 854 },
    events: { emit },
    physics: { add: { sprite: () => bodySprite, group } },
    // 計時器即時執行：入場運鏡與吸流窗排程同步完成，測試免推進虛擬時鐘。
    time: { delayedCall: (_ms: number, fn: () => void) => (fn(), { remove: vi.fn() }) },
    tweens: {
      add: (config: TweenConfig) => {
        config.onComplete?.({
          targets: Array.isArray(config.targets) ? config.targets : [config.targets],
        });
        return {};
      },
      // EX 呼吸循環為時間驅動：僅捕捉 onUpdate 供測試顯式觸發，不同步執行。
      addCounter: (config: CounterConfig) => (
        counters.push(config),
        { remove: vi.fn(), stop: vi.fn() }
      ),
      killTweensOf: vi.fn(),
    },
    add: { image: () => chainable(), circle: () => chainable() },
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

function makeHooks(): VoidraHooks & { drainTopStar: ReturnType<typeof vi.fn> } {
  return {
    onShardEgg: vi.fn(),
    drainTopStar: vi.fn(() => true),
    setBombardment: vi.fn(),
    setGravityScale: vi.fn(),
    dropSurvivalHeart: vi.fn(),
  };
}

describe('Voidra 呈現層：星光虹吸抽彈守門（§113）', () => {
  beforeEach(() => {
    // 加權選招走 Math.random：注入 LCG 種子讓 siphon 進窗序列可重放。
    let seed = 7;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('滿盾（2 層）後吸流窗滿不得再抽玩家頂槽（彈藥不減）', () => {
    const hooks = makeHooks();
    const handle = createVoidra(makeScene(), hooks, { ex: false, arenaLeft: () => 0 });
    handle.spawn();

    // 逐 tick 驅動 FSM 至第 3 次吸流窗完整結束（無人反制，窗滿必發 siphonDrain）。
    let siphonEntries = 0;
    let prevState = '';
    for (let i = 0; i < 6000 && siphonEntries < 4; i += 1) {
      handle.update(100);
      const state = handle.getDebugState?.()?.state ?? '';
      if (state === 'siphon' && prevState !== 'siphon') siphonEntries += 1;
      prevState = state;
    }
    expect(siphonEntries).toBeGreaterThanOrEqual(3);

    // 前兩窗抽彈化盾（0→1→2 層）；滿盾後窗滿必須跳過抽彈，玩家彈藥不得再減。
    expect(hooks.drainTopStar).toHaveBeenCalledTimes(2);
  });
});

describe('Voidra 呈現層：段重試語意提示（W3 HUD/toast 管線）', () => {
  it('P2 段重試發 BOSS_SEGMENT_RETRY refill（回灌語意，同王雙語意區分）', async () => {
    const { GameEvents } = await import('../core/events');
    const emit = vi.fn();
    const handle = createVoidra(makeScene(emit), makeHooks(), { ex: false, arenaLeft: () => 0 });
    handle.spawn();
    // 110×0.7=77：傷 34 入 P2 生存段。
    handle.applyDamage(34);
    expect(handle.getDebugState?.()?.phase).toBe('p2');
    emit.mockClear();
    expect(handle.trySegmentRespawn?.()).toBe(true);
    const call = emit.mock.calls.find((entry) => entry[0] === GameEvents.BOSS_SEGMENT_RETRY);
    expect(call?.[1]).toEqual({ semantics: 'refill' });
  });
});

describe('Voidra 呈現層：P4 段位相色持續（W3 Should-fix，鏡像 syrona/prismix）', () => {
  const toInnerCore = () => {
    const body = makeBodySprite();
    const counters: CounterConfig[] = [];
    const handle = createVoidra(makeScene(vi.fn(), body, counters), makeHooks(), {
      ex: true,
      arenaLeft: () => 0,
    });
    handle.spawn();
    // EX 外核（165）單發打穿：hp 歸零不死→內核裸奔 P4（voidraFsm §8.2）。
    handle.applyDamage(400);
    expect(handle.getDebugState?.()?.phase).toBe('p4');
    return { body, counters, handle };
  };

  it('P4 受擊白閃回落復原裸奔亮紫而非 clearTint', () => {
    const { body, handle } = toInnerCore();
    body.tintHistory.length = 0;
    handle.applyDamage(2);
    // delayedCall 即時執行：序列尾必為亮紫復原值（非 null=clearTint、非白閃殘留）。
    expect(body.tintHistory.length).toBeGreaterThan(0);
    const lastTint = body.tintHistory[body.tintHistory.length - 1];
    expect(lastTint).not.toBeNull();
    expect(lastTint).not.toBe(0xffffff);
  });

  it('P4 EX 緋紅呼吸循環讓位段位相色（不再每幀覆寫，鏡 prismix guard）', () => {
    const { body, counters } = toInnerCore();
    expect(counters.length).toBeGreaterThan(0);
    body.tintHistory.length = 0;
    counters.forEach((counter) => counter.onUpdate?.({ getValue: () => 0.5 }));
    expect(body.tintHistory).toHaveLength(0);
  });

  it('P4 段重試後段位相色重申（clearTint 不得洗掉裸奔亮紫）', () => {
    const { body, handle } = toInnerCore();
    body.tintHistory.length = 0;
    expect(handle.trySegmentRespawn?.()).toBe(true);
    // 白閃延時已清、呼吸循環讓位——重試路徑必須就地重申亮紫（非 null=clearTint）。
    const lastTint = body.tintHistory[body.tintHistory.length - 1];
    expect(lastTint).not.toBeNull();
    expect(lastTint).not.toBe(0xffffff);
  });
});

// 彈幕池瞬時旗標循環（§119 潮環，PR #886 Blocking）：潮環對魔王彈幕全量撥開並寫入
// tideDeflected；彈體出界回池後復用，殘留旗標會讓潮化對回收彈幕靜默免疫。
// spawnShot 必經 poolFlags 單點復位（voidra 原本連 reflected 都未清），本測鎖完整循環。
describe('Voidra 彈幕池瞬時旗標循環（§119 潮環，PR #886）', () => {
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
      body: { setAllowGravity: vi.fn(), setVelocity: vi.fn(), setSize: vi.fn() },
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
    ]) {
      shot[key] = () => shot;
    }
    return shot;
  }

  function makePooledGroup(): {
    children: FakeShot[];
    get(): FakeShot;
    getMatching(key: string, value: unknown): FakeShot[];
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
      destroy: vi.fn(),
    };
  }

  it('撥開/反彈旗標殘留的彈體回池復用後必為 false', () => {
    const bodySprite = makeBodySprite();
    const pooledGroups: ReturnType<typeof makePooledGroup>[] = [];
    const base = makeScene(vi.fn(), bodySprite) as unknown as Record<string, unknown>;
    const scene = {
      ...base,
      physics: {
        add: {
          sprite: () => bodySprite,
          group: () => {
            const group = makePooledGroup();
            pooledGroups.push(group);
            return group;
          },
        },
      },
    } as unknown as Phaser.Scene;
    const handle = createVoidra(scene, makeHooks(), { ex: false, arenaLeft: () => 0 });
    handle.spawn();
    // 建立順序：projectiles → shockwaves（createVoidra 一致）。
    const projectiles = pooledGroups[0];
    if (!projectiles) throw new Error('projectiles group 未建立');

    const step = (predicate: () => boolean, maxTicks = 8000): boolean => {
      for (let i = 0; i < maxTicks; i += 1) {
        handle.update(100);
        if (predicate()) return true;
      }
      return false;
    };

    // P1 星屑彈環（weight 3）：步進至首發彈幕生成。
    expect(step(() => projectiles.children.length > 0)).toBe(true);
    const shot = projectiles.children[0];
    if (!shot) throw new Error('彈體未生成');

    // 潮環撥開＋殼化反彈殘留現場 → 彈體出界回池。
    shot.setData('tideDeflected', true);
    shot.setData('reflected', true);
    shot.active = false;

    // 下一輪彈環復用同一物件：旗標必須歸位，否則潮化對回收彈幕靜默免疫。
    expect(step(() => shot.active)).toBe(true);
    expect(shot.getData('tideDeflected')).toBe(false);
    expect(shot.getData('reflected')).toBe(false);
  });
});
