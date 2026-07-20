import { beforeEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { createToasts, type ToastHooks } from './toasts';
import type { FxSystem } from './fx';

// characterization（v17 債務列車審查補遺）：鎖住自 GameScene 抽出的成就 toast
// 佇列現行為——同批合併單張、跨批序列播放、觀測點文案；tween 呈現由 e2e 覆蓋。

vi.mock('../audio/sfx', () => ({ playSfx: vi.fn(), stopSfx: vi.fn() }));

interface TweenCapture {
  onComplete?: () => void;
}

function makeHarness(): {
  toasts: ReturnType<typeof createToasts>;
  chains: TweenCapture[];
  texts: { destroy: ReturnType<typeof vi.fn> }[];
  starBurst: ReturnType<typeof vi.fn>;
} {
  const chains: TweenCapture[] = [];
  const texts: { destroy: ReturnType<typeof vi.fn> }[] = [];
  const starBurst = vi.fn();
  const chainable = (): Record<string, unknown> => {
    const target: Record<string, unknown> = { destroy: vi.fn() };
    for (const key of [
      'setOrigin',
      'setDepth',
      'setScrollFactor',
      'setAlpha',
      'setDisplaySize',
      'setTint',
    ]) {
      target[key] = vi.fn(() => target);
    }
    texts.push(target as { destroy: ReturnType<typeof vi.fn> });
    return target;
  };
  const scene = {
    add: { text: chainable, image: chainable },
    scale: { width: 854, height: 480 },
    cameras: { main: { worldView: { x: 0, right: 854 } } },
    tweens: {
      chain: vi.fn((config: TweenCapture) => chains.push(config)),
      add: vi.fn(),
    },
  } as unknown as Phaser.Scene;
  const hooks: ToastHooks = {
    fx: () => ({ starBurst }) as unknown as FxSystem,
    playerPos: () => ({ x: 400, y: 300 }),
  };
  return { toasts: createToasts(scene, hooks), chains, texts, starBurst };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('成就 toast 佇列（§94）', () => {
  it('單批入列即播、觀測點回報最近文案', () => {
    const { toasts, chains } = makeHarness();
    expect(toasts.lastAchievementToast()).toBe('');
    toasts.queueAchievements('初戰告捷');
    expect(chains.length).toBe(1);
    expect(toasts.lastAchievementToast()).toBe('初戰告捷');
  });

  it('播放中再入列不重疊；播畢自動接續下一張（跨批序列）', () => {
    const { toasts, chains } = makeHarness();
    toasts.queueAchievements('第一批');
    toasts.queueAchievements('第二批');
    // 第一張播放中：第二張等待、觀測點仍為第一張。
    expect(chains.length).toBe(1);
    expect(toasts.lastAchievementToast()).toBe('第一批');
    // 第一張播畢（onComplete）：自動 drain 第二張。
    chains[0]?.onComplete?.();
    expect(chains.length).toBe(2);
    expect(toasts.lastAchievementToast()).toBe('第二批');
    // 全部播畢不再有殘留播放。
    chains[1]?.onComplete?.();
    expect(chains.length).toBe(2);
  });
});

describe('彩蛋慶祝與星味提示（§24/§46）', () => {
  it('celebrate：星爆錨定玩家位置上方、浮字與金光經 tween 播放', () => {
    const { toasts, starBurst } = makeHarness();
    toasts.celebrate('彩虹果凍 +1 HP');
    expect(starBurst).toHaveBeenCalledWith(400, 280);
  });

  it('celebrate 浮字座標夾限於鏡頭視野內（左緣 +110）', () => {
    const starBurst = vi.fn();
    const hooks = {
      fx: () => ({ starBurst }) as unknown as FxSystem,
      playerPos: () => ({ x: 5, y: 300 }),
    };
    const scene = {
      add: {
        text: () => makeChain(),
        image: () => makeChain(),
      },
      scale: { width: 854, height: 480 },
      cameras: { main: { worldView: { x: 0, right: 854 } } },
      tweens: { chain: vi.fn(), add: vi.fn() },
    } as unknown as Phaser.Scene;
    const clamped = createToasts(scene, hooks);
    clamped.celebrate('測試');
    expect(starBurst).toHaveBeenCalledWith(110, 280);
  });

  it('flavor：入場即播、不進成就佇列、不影響觀測點', () => {
    const { toasts, chains } = makeHarness();
    toasts.flavor('疾風星！穿透 2 隻');
    expect(chains.length).toBe(1);
    expect(toasts.lastAchievementToast()).toBe('');
  });
});

function makeChain(): Record<string, unknown> {
  const target: Record<string, unknown> = { destroy: vi.fn(), scale: 1 };
  for (const key of [
    'setOrigin',
    'setDepth',
    'setScrollFactor',
    'setAlpha',
    'setDisplaySize',
    'setTint',
  ]) {
    target[key] = vi.fn(() => target);
  }
  return target;
}
