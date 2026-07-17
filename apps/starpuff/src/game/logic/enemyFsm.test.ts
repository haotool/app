import { describe, expect, it } from 'vitest';
import { canInhale } from './combat';
import {
  BOOMY_FSM,
  DRILLY_FSM,
  GLOWY_FSM,
  GUSTY_FSM,
  SHELLY_FSM,
  SPORA_FSM,
  ZAPPY_FSM,
  boomerangVelocity,
  gustWindPush,
  resolveDrillyHit,
  resolveShellyHit,
  tickBoomy,
  tickDrilly,
  tickGlowy,
  tickGusty,
  tickShelly,
  tickSpora,
  tickZappy,
  type ShellyState,
  type ZappyPhase,
} from './enemyFsm';

describe('Shelly 三態時序（§30）', () => {
  it('巡邏恆持：walk 不自行轉移，計時持續累加', () => {
    expect(tickShelly('walk', 500, 16)).toEqual({ state: 'walk', stateMs: 516, entered: null });
  });

  it('受擊決策：巡邏首發轉縮殼（不扣血）、旋轉期無敵、暈眩期正常結算', () => {
    expect(resolveShellyHit('walk')).toBe('enter-spin');
    expect(resolveShellyHit('spin')).toBe('immune');
    expect(resolveShellyHit('stun')).toBe('vulnerable');
  });

  it('縮殼旋轉 1.5s：期內維持 spin（無敵窗），期滿當 tick 轉暈眩', () => {
    expect(tickShelly('spin', SHELLY_FSM.spinMs - 17, 16).state).toBe('spin');
    expect(resolveShellyHit(tickShelly('spin', SHELLY_FSM.spinMs - 17, 16).state)).toBe('immune');
    expect(tickShelly('spin', SHELLY_FSM.spinMs - 16, 16)).toEqual({
      state: 'stun',
      stateMs: 0,
      entered: 'stun',
    });
  });

  it('暈眩 1s：期內可吸可殺（vulnerable），期滿復原巡邏', () => {
    expect(tickShelly('stun', SHELLY_FSM.stunMs - 17, 16).state).toBe('stun');
    expect(resolveShellyHit('stun')).toBe('vulnerable');
    expect(tickShelly('stun', SHELLY_FSM.stunMs - 16, 16)).toEqual({
      state: 'walk',
      stateMs: 0,
      entered: 'walk',
    });
  });

  it('全旅程步進：巡邏受擊 → 縮殼 1.5s → 暈眩 1s → 復原巡邏', () => {
    expect(resolveShellyHit('walk')).toBe('enter-spin');
    let state: ShellyState = 'spin';
    let stateMs = 0;
    const trace: ShellyState[] = [];
    for (let i = 0; i < 26; i++) {
      const tick = tickShelly(state, stateMs, 100);
      state = tick.state;
      stateMs = tick.stateMs;
      trace.push(state);
    }
    // 100ms 步進：第 15 步（1.5s）轉 stun、第 25 步（再 1s）復原 walk。
    expect(trace[13]).toBe('spin');
    expect(trace[14]).toBe('stun');
    expect(trace[23]).toBe('stun');
    expect(trace[24]).toBe('walk');
  });
});

describe('Zappy 放電週期（§30）', () => {
  it('前 2.5s 追蹤：3s 週期扣除 0.5s 前搖皆為 chase', () => {
    expect(tickZappy(0, 16).phase).toBe('chase');
    expect(tickZappy(ZAPPY_FSM.intervalMs - ZAPPY_FSM.windupMs - 17, 16).phase).toBe('chase');
  });

  it('末段 0.5s 前搖：2.5s 起進 windup，80ms 明暗交替閃爍', () => {
    expect(tickZappy(ZAPPY_FSM.intervalMs - ZAPPY_FSM.windupMs - 16, 16).phase).toBe('windup');
    // 2500ms：floor(2500/80)=31 奇數 → 暗；2560ms：floor(2560/80)=32 偶數 → 亮。
    expect(tickZappy(2484, 16).flickerBright).toBe(false);
    expect(tickZappy(2544, 16).flickerBright).toBe(true);
  });

  it('3s 期滿放電且計時歸零，下一 tick 重啟追蹤週期', () => {
    const tick = tickZappy(ZAPPY_FSM.intervalMs - 16, 16);
    expect(tick).toEqual({ zapMs: 0, phase: 'discharge', flickerBright: false });
    expect(tickZappy(tick.zapMs, 16).phase).toBe('chase');
  });

  it('完整週期步進：chase → windup → discharge → chase 循環', () => {
    let zapMs = 0;
    const phases: ZappyPhase[] = [];
    for (let i = 0; i < 62; i++) {
      const tick = tickZappy(zapMs, 50);
      zapMs = tick.zapMs;
      phases.push(tick.phase);
    }
    // 50ms 步進：2450ms 仍 chase、2500ms 進 windup、3000ms 放電、隨後新週期。
    expect(phases[48]).toBe('chase');
    expect(phases[49]).toBe('windup');
    expect(phases[58]).toBe('windup');
    expect(phases[59]).toBe('discharge');
    expect(phases[60]).toBe('chase');
  });
});

describe('Drilly 三態時序（§47）', () => {
  it('潛地 2.2s → 前搖 0.5s → 破土 1.4s → 回潛，entered 逐段回報', () => {
    expect(tickDrilly('burrow', DRILLY_FSM.burrowMs - 17, 16).state).toBe('burrow');
    expect(tickDrilly('burrow', DRILLY_FSM.burrowMs - 16, 16)).toEqual({
      state: 'windup',
      stateMs: 0,
      entered: 'windup',
    });
    expect(tickDrilly('windup', DRILLY_FSM.windupMs - 16, 16)).toEqual({
      state: 'surfaced',
      stateMs: 0,
      entered: 'surfaced',
    });
    expect(tickDrilly('surfaced', DRILLY_FSM.surfacedMs - 16, 16)).toEqual({
      state: 'burrow',
      stateMs: 0,
      entered: 'burrow',
    });
  });

  it('受擊決策：潛地/前搖免傷（半入地），破土窗正常結算', () => {
    expect(resolveDrillyHit('burrow')).toBe('immune');
    expect(resolveDrillyHit('windup')).toBe('immune');
    expect(resolveDrillyHit('surfaced')).toBe('vulnerable');
  });

  it('可吸窗與 FSM 對齊：僅 surfaced 暴露窗可吸（canInhale 保守值 false）', () => {
    expect(canInhale('drilly')).toBe(false);
    expect(canInhale('drilly', true)).toBe(true);
    expect(canInhale('glowy')).toBe(true);
  });
});

describe('Glowy 週期（§47）', () => {
  it('drift 段不預警；末段 0.9s windup 進度 0..1 遞增；週期滿釋放脈衝並歸零', () => {
    expect(tickGlowy(1000, 16).phase).toBe('drift');
    expect(tickGlowy(1000, 16).progress).toBe(0);
    const start = GLOWY_FSM.intervalMs - GLOWY_FSM.windupMs;
    const early = tickGlowy(start, 16);
    expect(early.phase).toBe('windup');
    expect(early.progress).toBeGreaterThan(0);
    expect(early.progress).toBeLessThan(0.1);
    const late = tickGlowy(GLOWY_FSM.intervalMs - 32, 16);
    expect(late.phase).toBe('windup');
    expect(late.progress).toBeGreaterThan(0.9);
    expect(tickGlowy(GLOWY_FSM.intervalMs - 16, 16)).toEqual({
      glowMs: 0,
      phase: 'pulse',
      progress: 0,
    });
  });

  it('脈衝半徑 80（§47 定值）', () => {
    expect(GLOWY_FSM.pulseRadiusPx).toBe(80);
  });
});

describe('Spora 週期（§52）', () => {
  it('idle → 末段 windup 預警擴張 → 週期滿 burst 且歸零重啟', () => {
    expect(tickSpora(1000, 16).phase).toBe('idle');
    const windupStart = SPORA_FSM.intervalMs - SPORA_FSM.windupMs;
    const early = tickSpora(windupStart, 16);
    expect(early.phase).toBe('windup');
    expect(early.progress).toBeGreaterThan(0);
    expect(early.progress).toBeLessThan(0.1);
    expect(tickSpora(SPORA_FSM.intervalMs - 16, 16)).toEqual({
      sporaMs: 0,
      phase: 'burst',
      progress: 0,
    });
  });

  it('孢子雲規格（§52 定值）：半徑 66、滯留 1.6s、噴發位於頭頂上方', () => {
    expect(SPORA_FSM.cloudRadiusPx).toBe(66);
    expect(SPORA_FSM.cloudMs).toBe(1600);
    expect(SPORA_FSM.cloudOffsetY).toBeLessThan(0);
  });

  it('孢子菇恆可吸（吞下得孢子星）', () => {
    expect(canInhale('spora')).toBe(true);
  });
});

describe('Gusty 四態時序（§52）', () => {
  it('drift 觸發俯衝條件成立當 tick 轉 windup', () => {
    expect(tickGusty('drift', 500, 16, false)).toEqual({
      state: 'drift',
      stateMs: 516,
      entered: null,
    });
    expect(tickGusty('drift', 500, 16, true)).toEqual({
      state: 'windup',
      stateMs: 0,
      entered: 'windup',
    });
  });

  it('windup 0.5s → dive 0.6s → recover 0.9s → drift 完整循環', () => {
    expect(tickGusty('windup', GUSTY_FSM.windupMs - 16, 16, false).entered).toBe('dive');
    expect(tickGusty('dive', GUSTY_FSM.diveMs - 16, 16, false).entered).toBe('recover');
    expect(tickGusty('recover', GUSTY_FSM.recoverMs - 16, 16, false).entered).toBe('drift');
  });

  it('側風方向（§52）：域內推離 gusty、域外為 0', () => {
    expect(gustWindPush(900, 240, 1000, 240)).toBe(-1);
    expect(gustWindPush(1100, 240, 1000, 240)).toBe(1);
    expect(gustWindPush(1200, 240, 1000, 240)).toBe(0);
    expect(gustWindPush(1000, 400, 1000, 240)).toBe(0);
  });

  it('風飄鳥恆可吸且歸入疾風味（避免味數爆炸）', () => {
    expect(canInhale('gusty')).toBe(true);
  });
});

describe('Boomy 四態時序與迴旋彈道（§52）', () => {
  it('walk 2.2s → windup 0.5s → throw（單幀事件態）→ cool 1.4s → walk', () => {
    expect(tickBoomy('walk', BOOMY_FSM.walkMs - 16, 16).entered).toBe('windup');
    expect(tickBoomy('windup', BOOMY_FSM.windupMs - 16, 16).entered).toBe('throw');
    expect(tickBoomy('throw', 0, 16)).toEqual({ state: 'cool', stateMs: 0, entered: 'cool' });
    expect(tickBoomy('cool', BOOMY_FSM.coolMs - 16, 16).entered).toBe('walk');
  });

  it('boomerangVelocity：去程勻減速、turnMs 歸零、2×turnMs 反向等速且不再加速', () => {
    expect(boomerangVelocity(0, 1, 360, 800)).toBe(360);
    expect(boomerangVelocity(400, 1, 360, 800)).toBeCloseTo(180, 5);
    expect(boomerangVelocity(800, 1, 360, 800)).toBe(0);
    expect(boomerangVelocity(1600, 1, 360, 800)).toBe(-360);
    expect(boomerangVelocity(2400, 1, 360, 800)).toBe(-360);
    expect(boomerangVelocity(0, -1, 360, 800)).toBe(-360);
  });

  it('殼刃壽命上限涵蓋雙程（anti-softlock §56）：lifeMs ≥ 2×turnMs', () => {
    expect(BOOMY_FSM.shellLifeMs).toBeGreaterThanOrEqual(BOOMY_FSM.shellTurnMs * 2);
  });

  it('迴力殼恆可吸（吞下得迴旋星）', () => {
    expect(canInhale('boomy')).toBe(true);
  });
});
