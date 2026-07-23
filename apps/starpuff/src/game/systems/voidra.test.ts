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

function makeScene(): Phaser.Scene {
  const bodySprite = {
    x: 0,
    y: 0,
    width: 140,
    height: 140,
    scaleX: 1,
    scaleY: 1,
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
    setTint: () => bodySprite,
    clearTint: () => bodySprite,
    setTintMode: () => bodySprite,
    destroy: vi.fn(),
  };
  const group = () => ({ get: () => null, getMatching: () => [], destroy: vi.fn() });
  return {
    textures: { exists: () => true },
    scale: { width: 854 },
    events: { emit: vi.fn() },
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
