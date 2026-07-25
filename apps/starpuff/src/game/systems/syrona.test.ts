import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { GameEvents } from '../core/events';
import { createSyrona, type SyronaHooks } from './syrona';

// 窯心暴走呈現層守門（W3 Should-fix）：P4 紅化為段位相色——受擊白閃回落
// 必須復原（restore-tint）而非 clearTint 洗掉；血條深紅經 BOSS_PHASE barTint
// 泛化管線帶出。以最小 scene stub 驅動 EX 至暴走段鎖定兩契約。

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
vi.mock('./fx', () => ({
  ensureFxTextures: vi.fn(),
  spawnTelegraph: vi.fn(),
  FX_TEXTURES: { dot: 'fx-dot', star: 'fx-star' },
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
    'setOrigin',
    'setScrollFactor',
    'stop',
    'start',
    'setEmitting',
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

// 本體替身記錄 tint 呼叫史（restore-tint 斷言用）。
function makeBodySprite() {
  const sprite = {
    x: 0,
    y: 0,
    width: 170,
    height: 150,
    scaleX: 1,
    scaleY: 1,
    tintHistory: [] as (number | null)[],
    body: {
      enable: true,
      setAllowGravity: vi.fn(),
      setImmovable: vi.fn(),
      setSize: vi.fn(),
    },
    setDisplaySize: () => sprite,
    setPosition(x: number, y: number) {
      sprite.x = x;
      sprite.y = y;
      return sprite;
    },
    setTint(tint: number) {
      sprite.tintHistory.push(tint);
      return sprite;
    },
    clearTint() {
      sprite.tintHistory.push(null);
      return sprite;
    },
    setTintMode: () => sprite,
    setFlipX: () => sprite,
    destroy: vi.fn(),
  };
  return sprite;
}

interface CounterConfig {
  onUpdate?: (tween: { getValue: () => number }) => void;
}

function makeScene(
  body: ReturnType<typeof makeBodySprite>,
  emit = vi.fn(),
  counters: CounterConfig[] = [],
): Phaser.Scene {
  const group = () => ({
    get: () => null,
    getMatching: () => [],
    getChildren: () => [],
    destroy: vi.fn(),
  });
  return {
    textures: { exists: () => true },
    scale: { width: 854 },
    events: { emit },
    physics: {
      add: {
        sprite: () => body,
        group,
        existing: (obj: unknown) => obj,
      },
    },
    time: {
      now: 0,
      delayedCall: (_ms: number, fn: () => void) => (fn(), { remove: vi.fn() }),
    },
    tweens: {
      add: (config: TweenConfig) => {
        config.onComplete?.({
          targets: Array.isArray(config.targets) ? config.targets : [config.targets],
        });
        return {};
      },
      chain: (config: TweenConfig) => {
        config.onComplete?.({ targets: [] });
        return {};
      },
      // EX 呼吸循環為時間驅動：僅捕捉 onUpdate 供測試顯式觸發，不同步執行。
      addCounter: (config: CounterConfig) => (
        counters.push(config),
        { remove: vi.fn(), stop: vi.fn() }
      ),
      killTweensOf: vi.fn(),
    },
    add: {
      image: () => chainable(),
      circle: () => chainable(),
      // 浮台 rectangle 經 physics.add.existing 掛 body（checkCollision/immovable）。
      rectangle: () => {
        const rect = chainable();
        (rect as { body?: unknown }).body = {
          checkCollision: { up: true, down: false, left: false, right: false },
          setAllowGravity: vi.fn(),
          setImmovable: vi.fn(),
          enable: true,
        };
        return rect;
      },
      particles: () => chainable(),
      text: () => chainable(),
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

// 逐鍵帶簽名泛型：保留 Mock 斷言 API 且結構相容 SyronaHooks（免 unbound-method cast）。
function makeHooks() {
  return {
    summonBubbla: vi.fn<SyronaHooks['summonBubbla']>(),
    onVentEgg: vi.fn<SyronaHooks['onVentEgg']>(),
    startTide: vi.fn<SyronaHooks['startTide']>(),
    boilTide: vi.fn<SyronaHooks['boilTide']>(),
  };
}

describe('Syrona 呈現層：窯心暴走 tint／HUD（W3）', () => {
  const toRampage = () => {
    const body = makeBodySprite();
    const emit = vi.fn();
    const counters: CounterConfig[] = [];
    const scene = makeScene(body, emit, counters);
    const hooks = makeHooks();
    const handle = createSyrona(scene, hooks, { ex: true, arenaLeft: () => 0 });
    handle.spawn();
    // EX 135：體傷至 hp 20（≤135×0.15）入暴走。
    handle.applyDamage(115);
    return { body, emit, counters, hooks, handle };
  };

  it('P4 暴走：BOSS_PHASE 帶深紅 barTint（HUD 泛化管線）', () => {
    const { emit } = toRampage();
    const phaseCall = emit.mock.calls.find(
      (call) => call[0] === GameEvents.BOSS_PHASE && (call[1] as { phase: string }).phase === 'p4',
    );
    expect(phaseCall).toBeDefined();
    expect((phaseCall?.[1] as { barTint?: number }).barTint).toBeTypeOf('number');
  });

  it('P4 受擊白閃 restore-tint：回落復原暴走紅化而非 clearTint', () => {
    const { body, handle } = toRampage();
    body.tintHistory.length = 0;
    // 皇冠命中（頂帶 y ≤ 本體頂緣＋34）：白閃（FILL 白）→ 即時回落。
    handle.applyDamageAt?.(2, body.x, body.y - 80);
    // delayedCall 即時執行：序列尾必為紅化復原值（非 null=clearTint）。
    expect(body.tintHistory.length).toBeGreaterThan(0);
    const lastTint = body.tintHistory[body.tintHistory.length - 1];
    expect(lastTint).not.toBeNull();
    expect(lastTint).not.toBe(0xffffff);
  });

  it('P4 EX 緋紅呼吸循環讓位暴走紅化（不再每幀覆寫，鏡 prismix guard）', () => {
    const { body, counters } = toRampage();
    expect(counters.length).toBeGreaterThan(0);
    body.tintHistory.length = 0;
    counters.forEach((counter) => counter.onUpdate?.({ getValue: () => 0.5 }));
    expect(body.tintHistory).toHaveLength(0);
  });

  it('P4 乘流登頂（W3 PM 裁決）：噴口窯壓恆噴＋皇冠帶氣墊懸停', () => {
    const VENT_X = 854 * 0.3;
    // 懸停線＝THRONE_Y(325) - BODY_H/2 + CROWN_BAND_PX - 12 = 272。
    const HOVER_Y = 272;
    // 非 P4 對照：elapsed 0 為噴口週期 idle 相位——不供力（週期閘既有行為）。
    const idleBody = makeBodySprite();
    const idleHandle = createSyrona(makeScene(idleBody), makeHooks(), {
      ex: true,
      arenaLeft: () => 0,
    });
    idleHandle.spawn();
    expect(idleHandle.getVentLift?.(VENT_X, 380, 0, 16, false)).toBeNull();
    // P4：同一時刻恆噴——帶下方升托（負值）、懸停線速度歸零、線上方回落（正值）。
    const { handle } = toRampage();
    expect(handle.getVentLift?.(VENT_X, 380, 0, 16, false) ?? 0).toBeLessThan(0);
    expect(handle.getVentLift?.(VENT_X, HOVER_Y, -100, 16, false)).toBe(0);
    expect(handle.getVentLift?.(VENT_X, HOVER_Y - 40, 0, 16, false) ?? 0).toBeGreaterThan(0);
    // 柱域外不供力：水平離柱交還重力（無滯留軟鎖）。
    expect(handle.getVentLift?.(VENT_X + 60, 380, 0, 16, false)).toBeNull();
  });

  it('P4 段重試（W3 v2 收斂）：進度保留 kept＋沸騰週期重置＋共鳴窗歸零', () => {
    const { body, emit, hooks, handle } = toRampage();
    // 段內進度：皇冠 glance ×2 → hp 20-2=18。
    handle.applyDamageAt?.(5, body.x, body.y - 80);
    handle.applyDamageAt?.(5, body.x, body.y - 80);
    emit.mockClear();
    hooks.boilTide.mockClear();
    expect(handle.trySegmentRespawn?.()).toBe(true);
    // kept 語意事件（toasts 雙語意管線）。
    const retry = emit.mock.calls.find((call) => call[0] === GameEvents.BOSS_SEGMENT_RETRY);
    expect(retry?.[1]).toEqual({ semantics: 'kept' });
    // 全場沸騰以同 spec 重置（重生喘息窗）。
    expect(hooks.boilTide).toHaveBeenCalledTimes(1);
    // 進度保留：重試後首中回 glance → damaged hp = 18-1=17（不回灌 20）。
    handle.applyDamageAt?.(5, body.x, body.y - 80);
    const damagedCalls = emit.mock.calls.filter((call) => call[0] === GameEvents.BOSS_DAMAGED);
    const damaged = damagedCalls[damagedCalls.length - 1];
    expect((damaged?.[1] as { hp: number }).hp).toBe(17);
  });
});
