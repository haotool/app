import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { createBossStagecraft, preloadBossStagecraft } from './bossStagecraft';

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

// 可推進時鐘替身：delayedCall 依到期時間序觸發，驗分鏡時序與代際打斷語意。
function makeStage(missingKeys: readonly string[] = []) {
  let now = 0;
  const pending: { at: number; fn: () => void; removed: boolean }[] = [];
  const frames: string[] = [];
  const loadImage = vi.fn();
  const loadStart = vi.fn();
  const body = {
    setTexture: (key: string) => {
      frames.push(key);
      return body;
    },
    setDisplaySize: () => body,
  } as unknown as Phaser.Physics.Arcade.Sprite;
  const scene = {
    time: {
      get now() {
        return now;
      },
      delayedCall(ms: number, fn: () => void) {
        const task = { at: now + ms, fn, removed: false };
        pending.push(task);
        return {
          remove: () => {
            task.removed = true;
          },
        };
      },
    },
    textures: { exists: (key: string) => !missingKeys.includes(key) },
    load: { image: loadImage, start: loadStart, isLoading: () => false },
    sys: {},
  } as unknown as Phaser.Scene;
  const advance = (ms: number): void => {
    const target = now + ms;
    for (;;) {
      const due = pending
        .filter((task) => !task.removed && task.at <= target)
        .sort((a, b) => a.at - b.at)[0];
      if (!due) break;
      pending.splice(pending.indexOf(due), 1);
      now = due.at;
      due.fn();
    }
    now = target;
  };
  return { scene, body, frames, advance, loadImage, loadStart };
}

describe('bossStagecraft 四王演出共用件', () => {
  it('三招分鏡沿 telegraph 窗鋪幀：windup→charge→burst→recover→回段落立繪', () => {
    const { scene, body, frames, advance } = makeStage();
    const craft = createBossStagecraft(scene, body, { kind: 'tariffang', bodyW: 170, bodyH: 150 });
    craft.moveCinematic(1, 800);
    expect(frames).toEqual(['boss-tariffang-move1-windup']);
    advance(450);
    expect(frames[frames.length - 1]).toBe('boss-tariffang-move1-charge');
    advance(350);
    expect(frames[frames.length - 1]).toBe('boss-tariffang-move1-burst');
    advance(320);
    expect(frames[frames.length - 1]).toBe('boss-tariffang-move1-recover');
    advance(360);
    expect(frames[frames.length - 1]).toBe('boss-tariffang');
  });

  it('缺圖幀靜默跳過（anti-softlock 降級）：未載入鍵不觸碰 setTexture', () => {
    const missing = ['boss-maridella-move2-charge', 'boss-maridella-move2-burst'];
    const { scene, body, frames, advance } = makeStage(missing);
    const craft = createBossStagecraft(scene, body, { kind: 'maridella', bodyW: 160, bodyH: 140 });
    craft.moveCinematic(2, 650);
    advance(2000);
    expect(frames).not.toContain('boss-maridella-move2-charge');
    expect(frames).not.toContain('boss-maridella-move2-burst');
    expect(frames[frames.length - 1]).toBe('boss-maridella');
  });

  it('P2 轉段：段落錨先行鎖 enraged，過場被招式分鏡打斷也不殘留轉段幀', () => {
    const { scene, body, frames, advance } = makeStage();
    const craft = createBossStagecraft(scene, body, { kind: 'reflector', bodyW: 160, bodyH: 140 });
    craft.phaseTransition('p2');
    advance(260);
    expect(frames[frames.length - 1]).toBe('boss-reflector-p2trans-3');
    // 過場中段被新招打斷：舊代際 pending 幀作廢，分鏡結束落 enraged 錨。
    craft.moveCinematic(1, 900);
    advance(2000);
    expect(frames.filter((key) => key.includes('p2trans'))).toHaveLength(3);
    expect(frames[frames.length - 1]).toBe('boss-reflector-enraged');
  });

  it('受擊短閃節流且排他演出期間讓位；死亡後全演出凍結於 death 幀序', () => {
    const { scene, body, frames, advance } = makeStage();
    const craft = createBossStagecraft(scene, body, { kind: 'gravion', bodyW: 165, bodyH: 150 });
    craft.hitFlash();
    expect(frames[frames.length - 1]).toBe('boss-gravion-hit-1');
    advance(110);
    expect(frames[frames.length - 1]).toBe('boss-gravion');
    // 節流窗內重複受擊不切幀。
    craft.hitFlash();
    expect(frames[frames.length - 1]).toBe('boss-gravion');
    advance(400);
    // 排他演出期間讓位。
    craft.moveCinematic(3, 650);
    craft.hitFlash();
    expect(frames[frames.length - 1]).toBe('boss-gravion-move3-windup');
    // 死亡幀序覆蓋一切後續演出。
    craft.playDeath();
    advance(1020);
    expect(frames[frames.length - 1]).toBe('boss-gravion-death-6');
    craft.hitFlash();
    craft.moveCinematic(1, 900);
    craft.phaseTransition('p3');
    advance(3000);
    expect(frames[frames.length - 1]).toBe('boss-gravion-death-6');
  });

  it('idle 呼吸輪播 P1 限定：base→idle-2→idle-3 循環，enraged 後定格', () => {
    const { scene, body, frames, advance } = makeStage();
    const craft = createBossStagecraft(scene, body, { kind: 'tariffang', bodyW: 170, bodyH: 150 });
    craft.endEntry();
    craft.idleBreath(460);
    expect(frames[frames.length - 1]).toBe('boss-tariffang-idle-2');
    craft.idleBreath(460);
    expect(frames[frames.length - 1]).toBe('boss-tariffang-idle-3');
    craft.idleBreath(460);
    expect(frames[frames.length - 1]).toBe('boss-tariffang');
    // enraged 換段後停輪播（定格兇相）。
    craft.phaseTransition('p2');
    advance(780);
    expect(frames[frames.length - 1]).toBe('boss-tariffang-enraged');
    craft.idleBreath(460);
    craft.idleBreath(460);
    expect(frames[frames.length - 1]).toBe('boss-tariffang-enraged');
  });

  it('背景補載：未載鍵逐條排入 loader 並 start；已載鍵零成本略過', async () => {
    const cold = makeStage();
    (cold.scene.textures as { exists: (key: string) => boolean }).exists = () => false;
    preloadBossStagecraft(cold.scene, 'tariffang');
    await vi.waitFor(() => {
      expect(cold.loadStart).toHaveBeenCalledTimes(1);
    });
    expect(cold.loadImage).toHaveBeenCalledTimes(39);

    // 全部已載（textures.exists 恆真）：零排入零 start。
    const warm = makeStage();
    preloadBossStagecraft(warm.scene, 'gravion');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(warm.loadImage).not.toHaveBeenCalled();
    expect(warm.loadStart).not.toHaveBeenCalled();
  });
});
