import { beforeEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { nextLevelId } from '../logic/levels';
import { SceneKeys } from '../core/types';
import { createLevelGate, type LevelGateHooks } from './levelGate';
import type { FxSystem } from './fx';
import type { PlayerHandle } from './player';

// characterization（W2 前置債務車）：鎖住自 GameScene 抽出的星星門流程現行為——
// 生成幾何/演出參數、逐幀掃掠背擋、過關演出順序與轉場資料；行為零改變的守門測試。

vi.mock('../audio/sfx', () => ({ playSfx: vi.fn(), stopSfx: vi.fn() }));

const { playSfx, stopSfx } = await import('../audio/sfx');

// groundTop 為注入參數（GameScene 傳 VIEW.height - GROUND_HEIGHT = 400）。
const GROUND_TOP = 400;
const GATE_Y = GROUND_TOP - 90;

interface TweenConfig {
  targets: unknown;
  [key: string]: unknown;
}

interface FakeImage {
  scale: number;
  setDisplaySize: (w: number, h: number) => FakeImage;
  setAlpha: (a: number) => FakeImage;
}

function makeScene(): {
  scene: Phaser.Scene;
  tweens: TweenConfig[];
  delayed: { delay: number; cb: () => void }[];
  overlaps: { a: unknown; b: unknown; cb: () => void }[];
  containers: { x: number; y: number; scale: number }[];
  zones: { x: number; y: number; w: number; h: number }[];
  started: { key: string; data: unknown }[];
} {
  const tweens: TweenConfig[] = [];
  const delayed: { delay: number; cb: () => void }[] = [];
  const overlaps: { a: unknown; b: unknown; cb: () => void }[] = [];
  const containers: { x: number; y: number; scale: number }[] = [];
  const zones: { x: number; y: number; w: number; h: number }[] = [];
  const started: { key: string; data: unknown }[] = [];
  const makeImage = (): FakeImage => {
    const img: FakeImage = {
      scale: 1,
      setDisplaySize: () => img,
      setAlpha: () => img,
    };
    return img;
  };
  const scene = {
    add: {
      image: () => makeImage(),
      container: (x: number, y: number) => {
        const container = {
          x,
          y,
          scale: 1,
          setScale(value: number) {
            this.scale = value;
            return this;
          },
        };
        containers.push(container);
        return container;
      },
      zone: (x: number, y: number, w: number, h: number) => {
        const zone = { x, y, w, h };
        zones.push(zone);
        return zone;
      },
    },
    physics: {
      add: {
        existing: vi.fn(),
        overlap: (a: unknown, b: unknown, cb: () => void) => {
          overlaps.push({ a, b, cb });
        },
      },
    },
    tweens: {
      add: (config: TweenConfig) => {
        tweens.push(config);
      },
    },
    time: {
      delayedCall: (delay: number, cb: () => void) => {
        delayed.push({ delay, cb });
      },
    },
    scene: {
      start: (key: string, data: unknown) => {
        started.push({ key, data });
      },
    },
  } as unknown as Phaser.Scene;
  return { scene, tweens, delayed, overlaps, containers, zones, started };
}

interface HarnessConfig {
  worldWidth?: number;
  playerX?: number;
  bossLevel?: boolean;
  settled?: boolean;
}

function makeHarness(config: HarnessConfig = {}): {
  scene: ReturnType<typeof makeScene>['scene'];
  fakes: Omit<ReturnType<typeof makeScene>, 'scene'>;
  hooks: LevelGateHooks;
  gate: ReturnType<typeof createLevelGate>;
  playerSprite: {
    x: number;
    y: number;
    body: {
      left: number;
      right: number;
      top: number;
      bottom: number;
      stop: ReturnType<typeof vi.fn>;
      enable: boolean;
    };
  };
  spies: {
    beginTransition: ReturnType<typeof vi.fn>;
    noteClear: ReturnType<typeof vi.fn>;
    persistClear: ReturnType<typeof vi.fn>;
    stopInhale: ReturnType<typeof vi.fn>;
    starBurst: ReturnType<typeof vi.fn>;
  };
  setPlayerX: (x: number) => void;
} {
  const { scene, ...fakes } = makeScene();
  const playerX = config.playerX ?? 100;
  const playerSprite = {
    x: playerX,
    y: GROUND_TOP - 40,
    body: {
      left: playerX - 15,
      right: playerX + 15,
      top: GROUND_TOP - 60,
      bottom: GROUND_TOP,
      stop: vi.fn(),
      enable: true,
    },
  };
  const setPlayerX = (x: number): void => {
    playerSprite.x = x;
    playerSprite.body.left = x - 15;
    playerSprite.body.right = x + 15;
  };
  const beginTransition = vi.fn(() => {
    settled = true;
  });
  const noteClear = vi.fn();
  const persistClear = vi.fn();
  const stopInhale = vi.fn();
  const starBurst = vi.fn();
  let settled = config.settled ?? false;
  const hooks: LevelGateHooks = {
    player: () => ({ sprite: playerSprite }) as unknown as PlayerHandle,
    fx: () => ({ stopInhale, starBurst }) as unknown as FxSystem,
    isBossLevel: () => config.bossLevel ?? false,
    isSettled: () => settled,
    beginTransition,
    worldWidth: () => config.worldWidth ?? 900,
    levelId: () => 2,
    noteClear,
    persistClear,
  };
  const gate = createLevelGate(scene, GROUND_TOP, hooks);
  return {
    scene,
    fakes,
    hooks,
    gate,
    playerSprite,
    spies: { beginTransition, noteClear, persistClear, stopInhale, starBurst },
    setPlayerX,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('levelGate spawn（§26/§43 幾何與演出）', () => {
  it('於世界右端 GATE_MARGIN_X=120 生成門，y = 地表上方 90', () => {
    const h = makeHarness({ worldWidth: 900 });
    h.gate.spawn();
    expect(h.fakes.containers).toHaveLength(1);
    expect(h.fakes.containers[0]).toMatchObject({ x: 780, y: GATE_Y });
  });

  it('掛三組 tween：scale-in 400ms Back.easeOut、光暈脈動 700ms yoyo 無限、浮動 1100ms', () => {
    const h = makeHarness();
    h.gate.spawn();
    expect(h.fakes.tweens).toHaveLength(3);
    expect(h.fakes.tweens[0]).toMatchObject({ scale: 1, duration: 400, ease: 'Back.easeOut' });
    expect(h.fakes.tweens[1]).toMatchObject({
      scale: 1.25,
      alpha: 0.15,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });
    expect(h.fakes.tweens[2]).toMatchObject({
      y: GATE_Y - 14,
      duration: 1100,
      yoyo: true,
      repeat: -1,
    });
  });

  it('建立 90x150 判定 zone、靜態物理體並與玩家接 overlap', () => {
    const h = makeHarness({ worldWidth: 900 });
    h.gate.spawn();
    expect(h.fakes.zones[0]).toMatchObject({ x: 780, y: GATE_Y, w: 90, h: 150 });
    expect(h.fakes.overlaps).toHaveLength(1);
    expect(h.fakes.overlaps[0]?.a).toBe(h.playerSprite);
  });

  it('gateX：生成前 null、生成後為門心 x（advanceMeteors 排除帶消費）', () => {
    const h = makeHarness({ worldWidth: 900 });
    expect(h.gate.gateX()).toBeNull();
    h.gate.spawn();
    expect(h.gate.gateX()).toBe(780);
  });

  it('重複 spawn 不再建門', () => {
    const h = makeHarness();
    h.gate.spawn();
    h.gate.spawn();
    expect(h.fakes.containers).toHaveLength(1);
  });

  it('boss 關與勝敗轉場窗內不生成', () => {
    const boss = makeHarness({ bossLevel: true });
    boss.gate.spawn();
    expect(boss.fakes.containers).toHaveLength(0);
    const settled = makeHarness({ settled: true });
    settled.gate.spawn();
    expect(settled.fakes.containers).toHaveLength(0);
  });

  it('門生在身後（§43）：開門瞬間玩家已在門心右側直接判入門', () => {
    const h = makeHarness({ worldWidth: 900, playerX: 800 });
    h.gate.spawn();
    expect(h.spies.beginTransition).toHaveBeenCalledTimes(1);
    expect(h.spies.persistClear).toHaveBeenCalledTimes(1);
  });
});

describe('levelGate sweep（§26/§43 逐幀幾何背擋）', () => {
  it('無門時 sweep 為 noop', () => {
    const h = makeHarness();
    h.gate.sweep();
    expect(h.spies.beginTransition).not.toHaveBeenCalled();
  });

  it('前後幀跨越門心即補判過關（pair overlap 漏檢背擋）', () => {
    const h = makeHarness({ worldWidth: 900, playerX: 700 });
    h.gate.spawn();
    expect(h.spies.beginTransition).not.toHaveBeenCalled();
    h.setPlayerX(790);
    h.gate.sweep();
    expect(h.spies.beginTransition).toHaveBeenCalledTimes(1);
  });

  it('未越門不觸發', () => {
    const h = makeHarness({ worldWidth: 900, playerX: 600 });
    h.gate.spawn();
    h.setPlayerX(650);
    h.gate.sweep();
    expect(h.spies.beginTransition).not.toHaveBeenCalled();
  });

  it('noteWarp 重置掃掠基準：折躍落點停於門前不誤判', () => {
    const h = makeHarness({ worldWidth: 900, playerX: 100 });
    h.gate.spawn();
    h.setPlayerX(700);
    h.gate.noteWarp(700);
    h.gate.sweep();
    expect(h.spies.beginTransition).not.toHaveBeenCalled();
  });
});

describe('levelGate completeLevel（§39 過關演出）', () => {
  it('zone overlap 回調走同一過關入口', () => {
    const h = makeHarness({ worldWidth: 900, playerX: 700 });
    h.gate.spawn();
    h.fakes.overlaps[0]?.cb();
    expect(h.spies.beginTransition).toHaveBeenCalledTimes(1);
  });

  it('演出順序：轉場鎖 → 吸入止音 → swallow 音 → 停體/關碰撞 → 蓄能快照 → 存檔', () => {
    const h = makeHarness({ worldWidth: 900, playerX: 700 });
    h.gate.spawn();
    h.fakes.overlaps[0]?.cb();
    expect(stopSfx).toHaveBeenCalledWith('inhale');
    expect(h.spies.stopInhale).toHaveBeenCalledTimes(1);
    expect(playSfx).toHaveBeenCalledWith('swallow');
    expect(h.playerSprite.body.stop).toHaveBeenCalledTimes(1);
    expect(h.playerSprite.body.enable).toBe(false);
    expect(h.spies.noteClear).toHaveBeenCalledTimes(1);
    expect(h.spies.persistClear).toHaveBeenCalledTimes(1);
    expect(h.spies.beginTransition.mock.invocationCallOrder[0]).toBeLessThan(
      h.spies.persistClear.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('玩家飛入門 tween：門心座標、縮小至 0、旋轉 720 度、700ms Cubic.easeIn', () => {
    const h = makeHarness({ worldWidth: 900, playerX: 700 });
    h.gate.spawn();
    h.fakes.overlaps[0]?.cb();
    const absorb = h.fakes.tweens[h.fakes.tweens.length - 1];
    expect(absorb).toMatchObject({
      targets: h.playerSprite,
      x: 780,
      y: GATE_Y,
      scale: 0,
      angle: 720,
      duration: 700,
      ease: 'Cubic.easeIn',
    });
  });

  it('onComplete：星爆＋win 音＋500ms 後進世界地圖並揭示下一關', () => {
    const h = makeHarness({ worldWidth: 900, playerX: 700 });
    h.gate.spawn();
    h.fakes.overlaps[0]?.cb();
    const absorb = h.fakes.tweens[h.fakes.tweens.length - 1] as { onComplete?: () => void };
    absorb.onComplete?.();
    expect(h.spies.starBurst).toHaveBeenCalledWith(780, GATE_Y);
    expect(playSfx).toHaveBeenCalledWith('win');
    expect(h.fakes.delayed[0]?.delay).toBe(500);
    h.fakes.delayed[0]?.cb();
    expect(h.fakes.started[0]).toEqual({
      key: SceneKeys.Map,
      data: { reveal: nextLevelId(2) },
    });
  });

  it('轉場窗內重複觸發被單次化（transitioning 閘）', () => {
    const h = makeHarness({ worldWidth: 900, playerX: 700 });
    h.gate.spawn();
    h.fakes.overlaps[0]?.cb();
    h.fakes.overlaps[0]?.cb();
    h.gate.sweep();
    expect(h.spies.beginTransition).toHaveBeenCalledTimes(1);
    expect(h.spies.persistClear).toHaveBeenCalledTimes(1);
  });
});
