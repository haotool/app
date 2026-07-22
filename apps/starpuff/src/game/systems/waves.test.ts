import { afterEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { ENEMY_SIZE, VIEW } from '../core/config';
import type { EnemyKind } from '../core/types';
import type { EnemySystem } from './enemies';
import { createWaveRunner } from './waves';

// bubbla 補生錨點回歸（#821）：bubbla 重力關閉、生成 y 即永久潛伏錨點（baseY），
// 沿用重力怪高空落入值 330 會令個體懸空漂浮約 70px；錨點必須由實際地面派生落地。

function chainable(): Record<string, ReturnType<typeof vi.fn>> {
  const target: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const key of ['setOrigin', 'setScrollFactor', 'destroy']) {
    target[key] = vi.fn(() => target);
  }
  return target;
}

function makeHarness(): {
  runner: ReturnType<typeof createWaveRunner>;
  spawns: { kind: EnemyKind; x: number; y: number }[];
} {
  const spawns: { kind: EnemyKind; x: number; y: number }[] = [];
  const scene = {
    events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
    cameras: { main: { scrollX: 0 } },
    scale: { width: 854, height: 480 },
    add: { text: () => chainable() },
    tweens: { add: vi.fn(), killTweensOf: vi.fn() },
  } as unknown as Phaser.Scene;
  const enemies = {
    spawn: (kind: EnemyKind, x: number, y: number) => {
      spawns.push({ kind, x, y });
      return null;
    },
    aliveCount: () => 0,
    // 場上有可吸怪 → 非飢荒 → 走一般加權抽選（rand 可控抽中目標品種）。
    aliveInhalableCount: () => 1,
    targetX: () => null,
  } as unknown as EnemySystem;
  // L13 焙糖丘陵：enemyMix 首項 bubbla 0.25、次項 splatta 0.2（§73 入編）。
  return { runner: createWaveRunner(scene, enemies, 13), spawns };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('#812 救援個體近域豁免（審查收斂）', () => {
  // 無 safe 候選關（L14 全 ranged mix）：救援怪被近域飢荒口徑的 ranged 排除，
  // 生成後不解除飢荒 → 4s 再觸發單席重定位循環。豁免律：救援個體存活且近域
  // 即視為供給恢復候補；被消化後追蹤釋放、飢荒計時恢復（anti-softlock 不回退）。
  it('救援生成後不再重複觸發；救援被消化後飢荒計時恢復', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const spawns: { kind: EnemyKind; x: number; y: number }[] = [];
    const rescueStub = { active: true, x: 0 };
    const scene = {
      events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
      cameras: { main: { scrollX: 600 } },
      scale: { width: 854, height: 480 },
      add: { text: () => chainable() },
      tweens: { add: vi.fn(), killTweensOf: vi.fn() },
    } as unknown as Phaser.Scene;
    const enemies = {
      spawn: (kind: EnemyKind, x: number, y: number) => {
        spawns.push({ kind, x, y });
        rescueStub.active = true;
        rescueStub.x = x;
        return rescueStub;
      },
      aliveCount: () => 99,
      // 近域可吸恆 0（ranged 被口徑排除的重現條件）。
      aliveInhalableCount: () => 0,
      targetX: () => 1000,
    } as unknown as EnemySystem;
    const runner = createWaveRunner(scene, enemies, 14);
    runner.start();
    // 飢荒 4s：觸發第一次救援（玩家前方 100–150px 吸入錐內）。
    runner.update(4000);
    expect(spawns).toHaveLength(1);
    expect(spawns[0]?.x ?? 0).toBeGreaterThanOrEqual(1100);
    expect(spawns[0]?.x ?? 0).toBeLessThanOrEqual(1150);
    // 救援存活且近域：飢荒被豁免，再過 4s 不得重複觸發（重定位循環根因）。
    runner.update(4000);
    expect(spawns).toHaveLength(1);
    // 救援被消化（吞/殺）：追蹤釋放、飢荒計時恢復，4s 後再救援。
    rescueStub.active = false;
    runner.update(4000);
    expect(spawns).toHaveLength(2);
    runner.destroy();
  });
});

describe('bubbla 自然補生錨點（#821）', () => {
  it('補生 y 為地面派生錨點：身底貼齊主地面頂（非懸空 330）', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { runner, spawns } = makeHarness();
    runner.start();
    runner.update(1400);
    expect(spawns).toHaveLength(1);
    expect(spawns[0]?.kind).toBe('bubbla');
    // 身底（y + 半身高）貼齊主地面頂 VIEW.height - 80，禁止懸空錨點。
    expect((spawns[0]?.y ?? 0) + ENEMY_SIZE / 2).toBe(VIEW.height - 80);
    runner.destroy();
  });

  it('其他地面重力怪維持高空落入值 330（零行為改變）', () => {
    // rand 0.7 落入 L13 mix splatta 區間（累計 0.65–0.80）。
    vi.spyOn(Math, 'random').mockReturnValue(0.7);
    const { runner, spawns } = makeHarness();
    runner.start();
    runner.update(1400);
    expect(spawns).toHaveLength(1);
    expect(spawns[0]?.kind).toBe('splatta');
    expect(spawns[0]?.y).toBe(330);
    runner.destroy();
  });
});
