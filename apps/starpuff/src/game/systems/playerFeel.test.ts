import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PLAYER } from '../core/config';
import { createPlayerFeel, resetPlayerFeelSession, type PlayerFeelHooks } from './playerFeel';
import type { ControlsSystem } from './controls';
import type { FxSystem } from './fx';
import type { PlayerHandle } from './player';
import type { ToastSystem } from './toasts';
import type { WaveRunner } from './waves';

// characterization（W2 前置債務車）：鎖住自 GameScene 抽出的玩家體感同步現行為——
// 嘴部錨點/吸入音效邊緣觸發、跳躍配音速度轉變判定、SP 變身首次教學（session 旗標）、
// 低幀率沉地防護與教學輸入偵測。

vi.mock('../audio/sfx', () => ({ playSfx: vi.fn(), stopSfx: vi.fn() }));

const { playSfx, stopSfx } = await import('../audio/sfx');

// groundTop 為注入參數（GameScene 傳 VIEW.height - GROUND_HEIGHT = 400）。
const GROUND_TOP = 400;

interface HarnessState {
  x: number;
  y: number;
  facing: 1 | -1;
  inhaling: boolean;
  spMode: string;
  tfMode: string;
  vy: number;
  bodyTop: number;
  bodyBottom: number;
  vx: number;
  controlsState: { left: boolean; right: boolean; jumpHeld: boolean; actionHeld: boolean };
}

function makeHarness(): {
  feel: ReturnType<typeof createPlayerFeel>;
  state: HarnessState;
  spies: {
    startInhale: ReturnType<typeof vi.fn>;
    stopInhale: ReturnType<typeof vi.fn>;
    setSpMode: ReturnType<typeof vi.fn>;
    setTransformKeyMode: ReturnType<typeof vi.fn>;
    flavor: ReturnType<typeof vi.fn>;
    noteInput: ReturnType<typeof vi.fn>;
    bodyReset: ReturnType<typeof vi.fn>;
    setVelocity: ReturnType<typeof vi.fn>;
  };
} {
  const state: HarnessState = {
    x: 100,
    y: 300,
    facing: 1,
    inhaling: false,
    spMode: 'hidden',
    tfMode: 'hidden',
    vy: 0,
    bodyTop: 260,
    bodyBottom: 300,
    vx: 0,
    controlsState: { left: false, right: false, jumpHeld: false, actionHeld: false },
  };
  const startInhale = vi.fn();
  const stopInhale = vi.fn();
  const setSpMode = vi.fn();
  const setTransformKeyMode = vi.fn();
  const flavor = vi.fn();
  const noteInput = vi.fn();
  const bodyReset = vi.fn();
  const setVelocity = vi.fn();
  const player = {
    sprite: {
      get x() {
        return state.x;
      },
      get y() {
        return state.y;
      },
      body: {
        get top() {
          return state.bodyTop;
        },
        get bottom() {
          return state.bodyBottom;
        },
        get velocity() {
          return { x: state.vx, y: state.vy };
        },
        reset: bodyReset,
        setVelocity,
      },
    },
    getFacing: () => state.facing,
    isInhaling: () => state.inhaling,
    getSpMode: () => state.spMode,
    getTransformKeyMode: () => state.tfMode,
    // 變身技能圖示同步（§124 W5a）：syncSpMode 逐幀讀當前形態。
    getTransformState: () => ({ form: null, remainingMs: 0, dischargeLeft: 0, tuckLeft: 0 }),
  } as unknown as PlayerHandle;
  const setFormSkill = vi.fn();
  const hooks: PlayerFeelHooks = {
    player: () => player,
    controls: () =>
      ({
        state: state.controlsState,
        setSpMode,
        setTransformKeyMode,
        setFormSkill,
      }) as unknown as ControlsSystem,
    fx: () => ({ startInhale, stopInhale }) as unknown as FxSystem,
    toasts: () => ({ flavor }) as unknown as ToastSystem,
    waves: () => ({ noteInput }) as unknown as WaveRunner,
  };
  const feel = createPlayerFeel(GROUND_TOP, hooks);
  return {
    feel,
    state,
    spies: {
      startInhale,
      stopInhale,
      setSpMode,
      setTransformKeyMode,
      flavor,
      noteInput,
      bodyReset,
      setVelocity,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  resetPlayerFeelSession();
});

describe('playerFeel 吸入同步（§30）', () => {
  it('嘴部錨點＝玩家位置＋面向×26；跨幀為同一物件參照（fx 持有引用逐幀跟隨）', () => {
    const h = makeHarness();
    h.feel.syncInhale();
    const mouth = h.feel.mouth();
    expect(mouth).toEqual({ x: 126, y: 300 });
    h.state.x = 200;
    h.state.facing = -1;
    h.feel.syncInhale();
    expect(h.feel.mouth()).toBe(mouth);
    expect(mouth).toEqual({ x: 174, y: 300 });
  });

  it('吸入上升沿：startInhale(嘴部錨點) + inhale 音；持續吸入不重複', () => {
    const h = makeHarness();
    h.state.inhaling = true;
    h.feel.syncInhale();
    expect(h.spies.startInhale).toHaveBeenCalledWith(h.feel.mouth());
    expect(playSfx).toHaveBeenCalledWith('inhale');
    expect(h.spies.flavor).toHaveBeenCalledWith('長按 B／X 可連續吸入；A／Z 也能同時按');
    h.feel.syncInhale();
    expect(h.spies.startInhale).toHaveBeenCalledTimes(1);
    expect(h.spies.flavor).toHaveBeenCalledTimes(1);
  });

  it('吸入下降沿：stopInhale + 止音；未吸入穩態無呼叫', () => {
    const h = makeHarness();
    h.state.inhaling = true;
    h.feel.syncInhale();
    h.state.inhaling = false;
    h.feel.syncInhale();
    expect(h.spies.stopInhale).toHaveBeenCalledTimes(1);
    expect(stopSfx).toHaveBeenCalledWith('inhale');
    h.feel.syncInhale();
    expect(h.spies.stopInhale).toHaveBeenCalledTimes(1);
  });
});

describe('playerFeel 跳躍配音（速度轉變判定）', () => {
  it('vy 轉為 jumpVelocity 播 jump、轉為 floatLift 播 flap', () => {
    const h = makeHarness();
    h.state.vy = PLAYER.jumpVelocity;
    h.feel.syncJumpSfx();
    expect(playSfx).toHaveBeenCalledWith('jump');
    h.state.vy = PLAYER.floatLift;
    h.feel.syncJumpSfx();
    expect(playSfx).toHaveBeenCalledWith('flap');
  });

  it('同值連續幀不重複；其他速度轉變無音效', () => {
    const h = makeHarness();
    h.state.vy = PLAYER.jumpVelocity;
    h.feel.syncJumpSfx();
    h.feel.syncJumpSfx();
    expect(playSfx).toHaveBeenCalledTimes(1);
    h.state.vy = -123;
    h.feel.syncJumpSfx();
    expect(playSfx).toHaveBeenCalledTimes(1);
  });
});

describe('playerFeel 沉地防護（§45）', () => {
  it('完整沒入地面帶且下墜：回貼地表並保留水平速度', () => {
    const h = makeHarness();
    h.state.bodyTop = GROUND_TOP + 5;
    h.state.bodyBottom = GROUND_TOP + 45;
    h.state.vy = 10;
    h.state.vx = 50;
    h.state.x = 100;
    h.state.y = 425;
    h.feel.clampAboveGround();
    expect(h.spies.bodyReset).toHaveBeenCalledWith(100, 380);
    expect(h.spies.setVelocity).toHaveBeenCalledWith(50, 0);
  });

  it('正常著地（頂部在地表帶內）或上升中永不觸發', () => {
    const h = makeHarness();
    h.state.bodyTop = GROUND_TOP - 40;
    h.state.vy = 10;
    h.feel.clampAboveGround();
    h.state.bodyTop = GROUND_TOP + 5;
    h.state.vy = -10;
    h.feel.clampAboveGround();
    expect(h.spies.bodyReset).not.toHaveBeenCalled();
  });
});

describe('playerFeel 變身教學（§110/§119；#952 拆鍵後改讀 TF 鍵）', () => {
  it('每幀同步兩鍵模式至 controls；形態資格首次浮現教一次（session 旗標）', () => {
    const h = makeHarness();
    h.feel.syncSpMode();
    expect(h.spies.setSpMode).toHaveBeenCalledWith('hidden');
    expect(h.spies.setTransformKeyMode).toHaveBeenCalledWith('hidden');
    expect(h.spies.flavor).not.toHaveBeenCalled();
    h.state.tfMode = 'volt';
    h.feel.syncSpMode();
    expect(h.spies.flavor).toHaveBeenCalledWith('同系星彈 ×3！按變身鍵立即變身');
    h.feel.syncSpMode();
    expect(h.spies.flavor).toHaveBeenCalledTimes(1);
  });

  it('SP 側語意（crystallize/detonate）與 TF dismiss 皆不觸發變身教學', () => {
    const h = makeHarness();
    h.state.spMode = 'crystallize';
    h.feel.syncSpMode();
    h.state.spMode = 'detonate';
    h.feel.syncSpMode();
    h.state.tfMode = 'dismiss';
    h.feel.syncSpMode();
    expect(h.spies.flavor).not.toHaveBeenCalled();
  });
});

describe('playerFeel 教學輸入偵測', () => {
  it('任一操作輸入通知 waves 排程教學淡出；無輸入不通知', () => {
    const h = makeHarness();
    h.feel.syncTutorialInput();
    expect(h.spies.noteInput).not.toHaveBeenCalled();
    h.state.controlsState.jumpHeld = true;
    h.feel.syncTutorialInput();
    expect(h.spies.noteInput).toHaveBeenCalledTimes(1);
  });
});
