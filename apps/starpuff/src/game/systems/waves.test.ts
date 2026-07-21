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
