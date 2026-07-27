import { describe, expect, it } from 'vitest';
import type Phaser from 'phaser';
import type { EnemyUpdateContext } from './enemyUpdates';
import { clearWindupRing, updateWindupRing, type WindupRingSpec } from './enemyWindupRing';

// windup 預警圈 characterization（W3 前置分檔）：鎖住「首幀單次建立、逐幀重定位、
// 進度驅動縮放、回收清 data」契約——搬移自 enemyUpdates.ts，行為零改變。

interface FakeArc {
  x: number;
  y: number;
  scale: number;
  destroyed: boolean;
  setStrokeStyle(width: number, color: number, alpha: number): FakeArc;
  setDepth(depth: number): FakeArc;
  setPosition(x: number, y: number): FakeArc;
  setScale(scale: number): FakeArc;
  destroy(): void;
}

function makeArc(x: number, y: number): FakeArc {
  const arc: FakeArc = {
    x,
    y,
    scale: 1,
    destroyed: false,
    setStrokeStyle: () => arc,
    setDepth: () => arc,
    setPosition(nx, ny) {
      arc.x = nx;
      arc.y = ny;
      return arc;
    },
    setScale(scale) {
      arc.scale = scale;
      return arc;
    },
    destroy() {
      arc.destroyed = true;
    },
  };
  return arc;
}

function makeHarness() {
  const data = new Map<string, unknown>();
  const created: FakeArc[] = [];
  const sprite = {
    getData: (key: string) => data.get(key),
    setData(key: string, value: unknown) {
      data.set(key, value);
      return sprite;
    },
  } as unknown as Phaser.Physics.Arcade.Sprite;
  const ctx = {
    scene: {
      add: {
        circle: (x: number, y: number) => {
          const arc = makeArc(x, y);
          created.push(arc);
          return arc;
        },
      },
    },
  } as unknown as EnemyUpdateContext;
  return { sprite, ctx, created };
}

const SPEC: WindupRingSpec = {
  radius: 80,
  fill: 0xfff7d6,
  fillAlpha: 0.08,
  stroke: 0xffe9a8,
  strokeAlpha: 0.8,
};

describe('windup 預警圈生命週期', () => {
  it('首幀建立一次並掛 warnRing data；後續幀重用同實例重定位', () => {
    const { sprite, ctx, created } = makeHarness();
    updateWindupRing(ctx, sprite, 100, 200, SPEC, 0);
    expect(created).toHaveLength(1);
    expect(sprite.getData('warnRing')).toBe(created[0]);

    updateWindupRing(ctx, sprite, 140, 260, SPEC, 0.5);
    expect(created).toHaveLength(1);
    expect(created[0]?.x).toBe(140);
    expect(created[0]?.y).toBe(260);
  });

  it('縮放隨進度擴張：progress 0 → 0.2、1 → 滿張 1.0', () => {
    const { sprite, ctx, created } = makeHarness();
    updateWindupRing(ctx, sprite, 0, 0, SPEC, 0);
    expect(created[0]?.scale).toBeCloseTo(0.2);
    updateWindupRing(ctx, sprite, 0, 0, SPEC, 1);
    expect(created[0]?.scale).toBeCloseTo(1);
  });

  it('clearWindupRing 銷毀實例並清 data；再次 update 重建新實例', () => {
    const { sprite, ctx, created } = makeHarness();
    updateWindupRing(ctx, sprite, 0, 0, SPEC, 0.3);
    clearWindupRing(sprite);
    expect(created[0]?.destroyed).toBe(true);
    expect(sprite.getData('warnRing')).toBeUndefined();

    updateWindupRing(ctx, sprite, 0, 0, SPEC, 0.3);
    expect(created).toHaveLength(2);
  });

  it('未建立過 ring 時 clear 為安全 no-op', () => {
    const { sprite } = makeHarness();
    expect(() => clearWindupRing(sprite)).not.toThrow();
    expect(sprite.getData('warnRing')).toBeUndefined();
  });
});
