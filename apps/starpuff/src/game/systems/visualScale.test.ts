import { beforeEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { getVisualScale, type ScalableSprite } from './visualScale';

// §77 缺陷家族行為錨（v19 #819 子項 3）：squash/wobble/popIn 等瞬態縮放動畫期間，
// 物理步（PRE_UPDATE 還原後、Body.updateBounds 讀取窗）所見 scale 必須恆為基準——
// 碰撞箱不隨美術縮放，落地/站台/overlap 判定在動畫期間穩定不漂。

vi.mock('phaser', () => ({
  default: {
    Scenes: {
      Events: { PRE_UPDATE: 'preupdate', POST_UPDATE: 'postupdate', SHUTDOWN: 'shutdown' },
    },
  },
}));

interface FakeScene {
  scene: Phaser.Scene;
  // 模擬 Systems.step 順序：PRE_UPDATE →（物理讀取窗）→ scene.update → POST_UPDATE。
  emit(event: string): void;
  tweenTargets: object[];
  killed: object[];
}

function makeScene(): FakeScene {
  const listeners = new Map<string, ((...args: unknown[]) => void)[]>();
  const tweenTargets: object[] = [];
  const killed: object[] = [];
  const on = (event: string, handler: (...args: unknown[]) => void) => {
    listeners.set(event, [...(listeners.get(event) ?? []), handler]);
  };
  const scene = {
    events: {
      on,
      once: on,
      off: (event: string, handler: (...args: unknown[]) => void) => {
        listeners.set(
          event,
          (listeners.get(event) ?? []).filter((h) => h !== handler),
        );
      },
    },
    tweens: {
      add: (config: { targets: object }) => {
        tweenTargets.push(config.targets);
        return {};
      },
      killTweensOf: (target: object) => {
        killed.push(target);
      },
      isTweening: (target: object) => tweenTargets.includes(target) && !killed.includes(target),
    },
  } as unknown as Phaser.Scene;
  return {
    scene,
    emit(event: string) {
      for (const handler of listeners.get(event) ?? []) handler();
    },
    tweenTargets,
    killed,
  };
}

function makeSprite(scaleX = 1, scaleY = 1): ScalableSprite {
  const sprite: ScalableSprite = {
    scaleX,
    scaleY,
    scene: {},
    setScale(x: number, y?: number) {
      sprite.scaleX = x;
      sprite.scaleY = y ?? x;
      return sprite;
    },
  };
  return sprite;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('visualScale 物理/視覺解耦通道', () => {
  it('squash 動畫期間物理讀取窗所見 scale 恆為基準（§77 落地擠壓迴圈斷根錨）', () => {
    const world = makeScene();
    const channel = getVisualScale(world.scene);
    const sprite = makeSprite(0.5, 0.5);
    channel.register(sprite);

    // 模擬落地擠壓：fx 瞬間形變（tween 只寫代理，不碰 sprite）。
    const fx = channel.fx(sprite);
    fx.sx = 1.25;
    fx.sy = 0.75;

    // 幀序：PRE_UPDATE 還原 → 物理讀取（updateBounds 以此 scale 算 body）。
    world.emit('preupdate');
    expect(sprite.scaleX).toBe(0.5);
    expect(sprite.scaleY).toBe(0.5);

    // POST_UPDATE 才套視覺形變（渲染見擠壓）。
    world.emit('postupdate');
    expect(sprite.scaleX).toBeCloseTo(0.5 * 1.25);
    expect(sprite.scaleY).toBeCloseTo(0.5 * 0.75);

    // 次幀物理讀取窗仍是基準：站台/overlap 判定在整段動畫期間穩定。
    world.emit('preupdate');
    expect(sprite.scaleX).toBe(0.5);
    expect(sprite.scaleY).toBe(0.5);
  });

  it('mod 逐幀直寫（呼吸/蹲姿）與 fx 乘算疊加，物理窗一樣不見', () => {
    const world = makeScene();
    const channel = getVisualScale(world.scene);
    const sprite = makeSprite(2, 2);
    channel.register(sprite);
    channel.fx(sprite).sy = 0.8;
    channel.mod(sprite).sy = 1.018;

    world.emit('postupdate');
    expect(sprite.scaleY).toBeCloseTo(2 * 0.8 * 1.018);
    world.emit('preupdate');
    expect(sprite.scaleY).toBe(2);
  });

  it('setBase/rebase：狀態性造型（鑽地鰭/精英/phase 縮體）進物理基準', () => {
    const world = makeScene();
    const channel = getVisualScale(world.scene);
    const sprite = makeSprite(1, 1);
    channel.register(sprite);

    // 狀態機直接指定基準（鑽地鰭壓扁）：物理窗所見＝新基準。
    channel.setBase(sprite, 1.4, 0.3);
    world.emit('preupdate');
    expect(sprite.scaleX).toBe(1.4);
    expect(sprite.scaleY).toBe(0.3);

    // rebase：setDisplaySize 後以 sprite 當前 scale 重錨。
    sprite.setScale(0.6, 0.6);
    channel.rebase(sprite);
    world.emit('preupdate');
    expect(sprite.scaleX).toBe(0.6);
  });

  it('register 冪等（物件池重用）：重錨基準並復位 fx/mod 與殘留 tween', () => {
    const world = makeScene();
    const channel = getVisualScale(world.scene);
    const sprite = makeSprite(1, 1);
    channel.register(sprite);
    const fx = channel.fx(sprite);
    fx.sx = 1.5;
    fx.sy = 0;
    channel.mod(sprite).sx = 1.1;

    sprite.setScale(0.9, 0.9);
    channel.register(sprite);
    expect(channel.fx(sprite)).toBe(fx);
    expect(fx.sx).toBe(1);
    expect(fx.sy).toBe(1);
    expect(channel.mod(sprite).sx).toBe(1);
    expect(world.killed).toContain(fx);
    world.emit('preupdate');
    expect(sprite.scaleX).toBe(0.9);
  });

  it('resetFx 終止 tween 並復位；killFxTweens 保留當前形變（死亡壓縮接續）', () => {
    const world = makeScene();
    const channel = getVisualScale(world.scene);
    const sprite = makeSprite(1, 1);
    channel.register(sprite);
    const fx = channel.fx(sprite);
    fx.sx = 1.08;
    channel.killFxTweens(sprite);
    expect(fx.sx).toBe(1.08);
    channel.resetFx(sprite);
    expect(fx.sx).toBe(1);
    expect(world.killed.filter((t) => t === fx)).toHaveLength(2);
  });

  it('isFxTweening 以 fx 代理判定（idle 呼吸讓位 squash 的依據）', () => {
    const world = makeScene();
    const channel = getVisualScale(world.scene);
    const sprite = makeSprite(1, 1);
    channel.register(sprite);
    expect(channel.isFxTweening(sprite)).toBe(false);
    world.tweenTargets.push(channel.fx(sprite));
    expect(channel.isFxTweening(sprite)).toBe(true);
  });

  it('scene 鍵入單例：同 scene 回傳同通道；shutdown 清理後重建', () => {
    const world = makeScene();
    const first = getVisualScale(world.scene);
    expect(getVisualScale(world.scene)).toBe(first);
    world.emit('shutdown');
    expect(getVisualScale(world.scene)).not.toBe(first);
  });

  it('已銷毀 sprite（scene 為空）跳過套用，不噴錯', () => {
    const world = makeScene();
    const channel = getVisualScale(world.scene);
    const sprite = makeSprite(1, 1);
    channel.register(sprite);
    sprite.scene = undefined;
    expect(() => {
      world.emit('preupdate');
      world.emit('postupdate');
    }).not.toThrow();
  });

  it('unregister 後不再管理該 sprite', () => {
    const world = makeScene();
    const channel = getVisualScale(world.scene);
    const sprite = makeSprite(1, 1);
    channel.register(sprite);
    channel.fx(sprite).sx = 2;
    channel.unregister(sprite);
    sprite.setScale(3, 3);
    world.emit('preupdate');
    expect(sprite.scaleX).toBe(3);
    expect(() => channel.fx(sprite)).toThrow();
  });
});
