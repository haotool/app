import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { createMercyDirector, type MercyDirectorHooks } from './mercyDirector';
import type { FxSystem } from './fx';
import type { PlayerHandle } from './player';

// characterization（W2 前置債務車）：鎖住自 GameScene 抽出的慈悲補血導演現行為——
// advanceMercyHeal 參數接線（boss/EX 分流）、生成錨點幾何（RNG 位置/前室夾限）、
// 每命重置與 e2e 時間快轉；決策邏輯本體由 logic/mercyHeal.test.ts 覆蓋。

vi.mock('../audio/sfx', () => ({ playSfx: vi.fn(), stopSfx: vi.fn() }));
vi.mock('./pickups', () => ({ spawnHealPickup: vi.fn() }));

const { playSfx } = await import('../audio/sfx');
const { spawnHealPickup } = await import('./pickups');

// groundTop 為注入參數（GameScene 傳 VIEW.height - GROUND_HEIGHT = 400）。
const GROUND_TOP = 400;

interface HarnessConfig {
  playerX?: number;
  hp?: number;
  bossLevel?: boolean;
  exMode?: boolean;
  bossRoomEntered?: boolean;
  arenaLeft?: number;
  worldWidth?: number;
}

function makeHarness(config: HarnessConfig = {}): {
  director: ReturnType<typeof createMercyDirector>;
  scene: Phaser.Scene;
  burstSmall: ReturnType<typeof vi.fn>;
  setHp: (hp: number) => void;
  setElapsed: (ms: number) => void;
} {
  const scene = { name: 'scene' } as unknown as Phaser.Scene;
  const burstSmall = vi.fn();
  let hp = config.hp ?? 1;
  let elapsed = 0;
  const hooks: MercyDirectorHooks = {
    player: () => ({ sprite: { x: config.playerX ?? 100 } }) as unknown as PlayerHandle,
    playerHp: () => hp,
    fx: () => ({ burstSmall }) as unknown as FxSystem,
    isBossLevel: () => config.bossLevel ?? false,
    exMode: config.exMode ?? false,
    elapsedMs: () => elapsed,
    bossRoomEntered: () => config.bossRoomEntered ?? false,
    arenaLeft: () => config.arenaLeft ?? 0,
    worldWidth: () => config.worldWidth ?? 900,
  };
  const director = createMercyDirector(scene, GROUND_TOP, hooks);
  return {
    director,
    scene,
    burstSmall,
    setHp: (next) => (hp = next),
    setElapsed: (ms) => (elapsed = ms),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('mercyDirector 生成決策接線（§62／v19 pity）', () => {
  it('低血久戰（warp 60s）於下一次 5s 評估生成愛心', () => {
    const h = makeHarness({ hp: 1 });
    h.director.warp(60_000);
    h.director.update(5000);
    expect(h.director.spawnedCount()).toBe(1);
    expect(spawnHealPickup).toHaveBeenCalledTimes(1);
  });

  it('血量健康不生成', () => {
    const h = makeHarness({ hp: 5 });
    h.director.warp(60_000);
    h.director.update(5000);
    expect(h.director.spawnedCount()).toBe(0);
    expect(spawnHealPickup).not.toHaveBeenCalled();
  });

  it('魔王房 override（§54）：絕對血量 ≤2 且 12s 起評即生成', () => {
    const h = makeHarness({ hp: 2, bossLevel: true });
    h.director.warp(12_000);
    h.director.update(5000);
    expect(h.director.spawnedCount()).toBe(1);
  });

  it('EX 每命上限 1（§7.4）：第二顆即使保底達標也不生成；一般關可到第 2 顆', () => {
    const runScenario = (exMode: boolean): number => {
      const h = makeHarness({ hp: 3, exMode });
      h.director.warp(60_000);
      h.setHp(1);
      h.director.update(5000);
      expect(h.director.spawnedCount()).toBe(1);
      // 保底計量：受傷 2 次（3→2→1）＋冷卻 45s 後再評估。
      h.setHp(3);
      h.director.update(1);
      h.setHp(2);
      h.director.update(1);
      h.setHp(1);
      h.director.update(1);
      h.director.warp(45_000);
      h.director.update(5000);
      return h.director.spawnedCount();
    };
    expect(runScenario(true)).toBe(1);
    expect(runScenario(false)).toBe(2);
  });

  it('resetLife（§67 卡點重生）：每命狀態歸零後可再次首顆生成', () => {
    const h = makeHarness({ hp: 1 });
    h.director.warp(60_000);
    h.director.update(5000);
    expect(h.director.spawnedCount()).toBe(1);
    h.director.resetLife();
    expect(h.director.spawnedCount()).toBe(0);
    h.director.update(5000);
    expect(h.director.spawnedCount()).toBe(1);
  });

  it('warp 時間快轉可累加（e2e 鉤子語意）', () => {
    const h = makeHarness({ hp: 1 });
    h.director.warp(30_000);
    h.director.update(5000);
    expect(h.director.spawnedCount()).toBe(0);
    h.director.warp(30_000);
    h.director.update(5000);
    expect(h.director.spawnedCount()).toBe(1);
  });
});

describe('mercyDirector 生成錨點幾何（§62/§69）', () => {
  it('warp 後 RNG 固定 0：玩家左側 120px 地面錨點、夾限下界 50', () => {
    const h = makeHarness({ hp: 1, playerX: 100, worldWidth: 900 });
    h.director.warp(60_000);
    h.director.update(5000);
    expect(playSfx).toHaveBeenCalledWith('reveal');
    expect(h.burstSmall).toHaveBeenCalledWith(50, GROUND_TOP - 22, 0xff9ec4);
    expect(spawnHealPickup).toHaveBeenCalledWith(
      expect.anything(),
      50,
      GROUND_TOP - 22,
      expect.anything(),
      { healHp: 1 },
    );
  });

  it('RNG ≥0.5 走空中緩降型：y=150、driftToY=地面錨點', () => {
    // 未 warp 時 mercyRng 預設 Math.random（生成位置唯一隨機來源）。
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    const h = makeHarness({ hp: 1, playerX: 100, worldWidth: 900 });
    h.setElapsed(60_000);
    h.director.update(5000);
    expect(spawnHealPickup).toHaveBeenCalledWith(
      expect.anything(),
      // side=+1、offset=120+0.9*120=228 → x=328。
      328,
      150,
      expect.anything(),
      { healHp: 1, driftToY: GROUND_TOP - 22 },
    );
  });

  it('前室魔王關入 arena 後（§69）：錨點下界改 arena 左緣 +50 防落於門後', () => {
    const h = makeHarness({
      hp: 2,
      bossLevel: true,
      bossRoomEntered: true,
      arenaLeft: 300,
      playerX: 350,
      worldWidth: 1200,
    });
    h.director.warp(12_000);
    h.director.update(5000);
    expect(spawnHealPickup).toHaveBeenCalledWith(
      expect.anything(),
      350,
      GROUND_TOP - 22,
      expect.anything(),
      { healHp: 1 },
    );
  });

  it('生成錨點上界夾限世界右緣 -50', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.6);
    const h = makeHarness({ hp: 1, playerX: 880, worldWidth: 900 });
    h.setElapsed(60_000);
    h.director.update(5000);
    const call = vi.mocked(spawnHealPickup).mock.calls[0];
    expect(call?.[1]).toBe(850);
  });
});
