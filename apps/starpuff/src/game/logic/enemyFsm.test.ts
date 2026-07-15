import { describe, expect, it } from 'vitest';
import {
  SHELLY_FSM,
  ZAPPY_FSM,
  resolveShellyHit,
  tickShelly,
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
