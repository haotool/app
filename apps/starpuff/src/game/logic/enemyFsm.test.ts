import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { PLAYER } from '../core/config';
import { canInhale, inhaleFlavor } from './combat';
import { AUDIT_THRESHOLDS } from './difficulty';
import type { EnemyUpdateContext } from '../systems/enemyUpdates';
import { TICKETA_SHIFT_TINT, TICKETA_WARN_MS, updateTicketa } from '../systems/finaleEnemies';
import {
  BOOMY_FSM,
  BUBBLA_FSM,
  COMETA_FSM,
  DRILLY_FSM,
  GLOWY_FSM,
  GUSTY_FSM,
  MAGNO_FSM,
  MIRRI_FSM,
  SHELLY_FSM,
  SPLATTA_FSM,
  SPORA_FSM,
  TWINKLA_FSM,
  ZAPPY_FSM,
  boomerangVelocity,
  bubblaLeapOffsetY,
  gustWindPush,
  magnetPull,
  resolveBubblaHit,
  resolveDrillyHit,
  resolveMagnoStarHit,
  resolveMirriStarHit,
  resolveShellyHit,
  resolveTwinklaHit,
  tickBoomy,
  tickBubbla,
  tickCometa,
  tickDrilly,
  tickGlowy,
  tickGusty,
  tickMagno,
  tickMirri,
  tickShelly,
  tickSplatta,
  tickSpora,
  tickTwinkla,
  tickZappy,
  type ShellyState,
  type ZappyPhase,
  CARGO_FSM,
  FOAMY_FSM,
  MANTA_FSM,
  SCANNA_FSM,
  TICKETA_FSM,
  cargoPatrolDirection,
  resolveFrostySplit,
  tickFoamy,
  tickManta,
  tickScanna,
  tickTicketa,
  BEARLET_FSM,
  COPYPUFF_FSM,
  GRAVITYBUB_FSM,
  ORBITON_FSM,
  PRISMBEE_FSM,
  RIFTLING_FSM,
  copypuffMirrorDx,
  gravityBubPull,
  resolvePrismbeeStarHit,
  riftlingBlinkX,
  tickBearlet,
  tickCopypuff,
  tickGravitybub,
  tickOrbiton,
  tickPrismbee,
  tickRiftling,
  BULLRUN_FSM,
  BEARMARKET_FSM,
  tickBullrun,
  tickBearmarket,
} from './enemyFsm';

// zzfx 於 import 期建 AudioContext（node 無此 API）；沿 finaleEnemies.test.ts 慣例替換。
vi.mock('../audio/sfx', () => ({ playSfx: vi.fn(), stopSfx: vi.fn() }));

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

  it('暈眩 1.6s（#811）：窗長定值 1600ms，期內可吸可殺（vulnerable），期滿復原巡邏', () => {
    expect(SHELLY_FSM.stunMs).toBe(1600);
    expect(tickShelly('stun', SHELLY_FSM.stunMs - 17, 16).state).toBe('stun');
    expect(resolveShellyHit('stun')).toBe('vulnerable');
    expect(tickShelly('stun', SHELLY_FSM.stunMs - 16, 16)).toEqual({
      state: 'walk',
      stateMs: 0,
      entered: 'walk',
    });
  });

  it('全旅程步進：巡邏受擊 → 縮殼 1.5s → 暈眩 1.6s → 復原巡邏', () => {
    expect(resolveShellyHit('walk')).toBe('enter-spin');
    let state: ShellyState = 'spin';
    let stateMs = 0;
    const trace: ShellyState[] = [];
    for (let i = 0; i < 33; i++) {
      const tick = tickShelly(state, stateMs, 100);
      state = tick.state;
      stateMs = tick.stateMs;
      trace.push(state);
    }
    // 100ms 步進：第 15 步（1.5s）轉 stun、第 31 步（再 1.6s）復原 walk。
    expect(trace[13]).toBe('spin');
    expect(trace[14]).toBe('stun');
    expect(trace[29]).toBe('stun');
    expect(trace[30]).toBe('walk');
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
    expect(tickGusty('drift', 500, 16, false, true)).toEqual({
      state: 'drift',
      stateMs: 516,
      entered: null,
    });
    expect(tickGusty('drift', 500, 16, true, true)).toEqual({
      state: 'windup',
      stateMs: 0,
      entered: 'windup',
    });
  });

  it('windup 0.5s → dive 0.6s → recover 0.9s → drift 完整循環', () => {
    expect(tickGusty('windup', GUSTY_FSM.windupMs - 16, 16, false, false).entered).toBe('dive');
    expect(tickGusty('dive', GUSTY_FSM.diveMs - 16, 16, false, false).entered).toBe('recover');
    expect(tickGusty('recover', GUSTY_FSM.recoverMs - 16, 16, false, true).entered).toBe('drift');
  });

  it('低空再漂移抑制（#832）：回升時滿但未回抵 baseY 不得切 drift', () => {
    // 時滿未回航高：停留 recover 持續爬升（比照 cometa #822），杜絕低空直接再漂移。
    const held = tickGusty('recover', GUSTY_FSM.recoverMs - 16, 16, false, false);
    expect(held).toEqual({ state: 'recover', stateMs: GUSTY_FSM.recoverMs, entered: null });
    // 深俯衝長時間爬升（時長遠超 recoverMs）仍未達航高：維持 recover。
    expect(tickGusty('recover', GUSTY_FSM.recoverMs * 3, 16, false, false).state).toBe('recover');
    // 回抵航高瞬間（時已滿）：切回 drift。
    expect(tickGusty('recover', GUSTY_FSM.recoverMs * 3, 16, false, true)).toEqual({
      state: 'drift',
      stateMs: 0,
      entered: 'drift',
    });
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

describe('磁極獸 Magno（§59）', () => {
  it('週期三相位：idle → windup（進度 0..1）→ field → 回 idle', () => {
    expect(tickMagno(0, 16).phase).toBe('idle');
    const windup = tickMagno(MAGNO_FSM.idleMs, 350);
    expect(windup.phase).toBe('windup');
    expect(windup.progress).toBeCloseTo(350 / MAGNO_FSM.windupMs, 5);
    const field = tickMagno(MAGNO_FSM.idleMs + MAGNO_FSM.windupMs, 16);
    expect(field.phase).toBe('field');
    const wrap = tickMagno(MAGNO_FSM.idleMs + MAGNO_FSM.windupMs + MAGNO_FSM.fieldMs - 1, 1);
    expect(wrap).toEqual({ magnoMs: 0, phase: 'idle', progress: 0 });
  });

  it('星彈受擊決策：field 免傷、其餘照常', () => {
    expect(resolveMagnoStarHit('field')).toBe('immune');
    expect(resolveMagnoStarHit('idle')).toBe('vulnerable');
    expect(resolveMagnoStarHit('windup')).toBe('vulnerable');
  });

  it('magnetPull：域內星彈速度向磁極獸彎折、域外不動、重合不動', () => {
    const pulled = magnetPull(100, 100, 500, 0, 200, 100, 100);
    expect(pulled.vx).toBeGreaterThan(500);
    expect(pulled.vy).toBe(0);
    const above = magnetPull(100, 100, 500, 0, 100, 200, 100);
    expect(above.vy).toBeGreaterThan(0);
    expect(magnetPull(0, 0, 500, 0, 500, 0, 100)).toEqual({ vx: 500, vy: 0 });
    expect(magnetPull(100, 100, 500, 0, 100, 100, 100)).toEqual({ vx: 500, vy: 0 });
  });

  it('磁極獸恆可吸（吞下得雷鏈味）', () => {
    expect(canInhale('magno')).toBe(true);
  });
});

describe('鏡面蟲 Mirri（§59）', () => {
  it('三態時序：roam 期滿入 mirror、mirror 期滿入 cool、cool 期滿回 roam', () => {
    expect(tickMirri('roam', MIRRI_FSM.roamMs - 16, 16).entered).toBe('mirror');
    expect(tickMirri('mirror', MIRRI_FSM.mirrorMs - 16, 16).entered).toBe('cool');
    expect(tickMirri('cool', MIRRI_FSM.coolMs - 16, 16).entered).toBe('roam');
    expect(tickMirri('roam', 0, 16).entered).toBeNull();
  });

  it('鏡面預告：roam 末段 preflicker 閃爍，前段恆暗', () => {
    const early = tickMirri('roam', 100, 16);
    expect(early.flickerBright).toBe(false);
    const late = tickMirri('roam', MIRRI_FSM.roamMs - MIRRI_FSM.preflickerMs, 10);
    // 末段進入明暗交替節奏（依 flickerMs 週期，至少存在亮幀）。
    let bright = late.flickerBright;
    let stateMs = late.stateMs;
    for (let i = 0; i < 6 && !bright; i += 1) {
      const next = tickMirri('roam', stateMs, MIRRI_FSM.flickerMs);
      bright = next.flickerBright;
      stateMs = next.stateMs;
    }
    expect(bright).toBe(true);
  });

  it('星彈受擊決策：mirror 反射、roam/cool 照常', () => {
    expect(resolveMirriStarHit('mirror')).toBe('reflect');
    expect(resolveMirriStarHit('roam')).toBe('vulnerable');
    expect(resolveMirriStarHit('cool')).toBe('vulnerable');
  });

  it('反射彈壽命有限（anti-softlock）：reflectLifeMs 有界且鏡面蟲恆可吸', () => {
    expect(MIRRI_FSM.reflectLifeMs).toBeGreaterThan(0);
    expect(MIRRI_FSM.reflectLifeMs).toBeLessThanOrEqual(3000);
    expect(canInhale('mirri')).toBe(true);
  });
});

describe('Bubbla 四態時序（§73 焦糖泡）', () => {
  it('潛伏期滿轉漣漪前搖，前搖期滿躍出', () => {
    expect(tickBubbla('submerged', BUBBLA_FSM.submergedMs - 17, 16).state).toBe('submerged');
    expect(tickBubbla('submerged', BUBBLA_FSM.submergedMs - 16, 16)).toEqual({
      state: 'ripple',
      stateMs: 0,
      entered: 'ripple',
    });
    expect(tickBubbla('ripple', BUBBLA_FSM.rippleMs - 16, 16)).toEqual({
      state: 'leap',
      stateMs: 0,
      entered: 'leap',
    });
  });

  it('躍出期滿回潛，回潛期滿再潛伏', () => {
    expect(tickBubbla('leap', BUBBLA_FSM.leapMs - 16, 16)).toEqual({
      state: 'dive',
      stateMs: 0,
      entered: 'dive',
    });
    expect(tickBubbla('dive', BUBBLA_FSM.diveMs - 16, 16)).toEqual({
      state: 'submerged',
      stateMs: 0,
      entered: 'submerged',
    });
  });

  it('受擊決策：僅躍出窗可吸可傷，潛伏/前搖/回潛免傷', () => {
    expect(resolveBubblaHit('leap')).toBe('vulnerable');
    expect(resolveBubblaHit('submerged')).toBe('immune');
    expect(resolveBubblaHit('ripple')).toBe('immune');
    expect(resolveBubblaHit('dive')).toBe('immune');
  });

  it('條件可吸（§73）：canInhale 未帶狀態取保守值 false、躍出窗 true', () => {
    expect(canInhale('bubbla')).toBe(false);
    expect(canInhale('bubbla', true)).toBe(true);
  });

  it('躍出拋物高度：起跳與落回為 0、頂點滯空段維持峰值', () => {
    expect(bubblaLeapOffsetY(0)).toBe(0);
    expect(bubblaLeapOffsetY(BUBBLA_FSM.leapMs)).toBe(0);
    const risenMs = BUBBLA_FSM.leapRiseMs;
    expect(bubblaLeapOffsetY(risenMs)).toBe(-BUBBLA_FSM.leapHeightPx);
    // 頂點滯空 0.4s（§73）：滯空段全程維持峰值高度。
    expect(bubblaLeapOffsetY(risenMs + BUBBLA_FSM.leapHangMs / 2)).toBe(-BUBBLA_FSM.leapHeightPx);
    expect(bubblaLeapOffsetY(risenMs + BUBBLA_FSM.leapHangMs)).toBe(-BUBBLA_FSM.leapHeightPx);
    // 中途上升為單調遞升（負向）。
    expect(bubblaLeapOffsetY(risenMs / 2)).toBeLessThan(0);
    expect(bubblaLeapOffsetY(risenMs / 2)).toBeGreaterThan(-BUBBLA_FSM.leapHeightPx);
  });
});

describe('Splatta 四態時序（§73 熔糖投手）', () => {
  it('緩走期滿轉舉勺瞄準，瞄準期滿投擲', () => {
    expect(tickSplatta('patrol', SPLATTA_FSM.patrolMs - 17, 16).state).toBe('patrol');
    expect(tickSplatta('patrol', SPLATTA_FSM.patrolMs - 16, 16)).toEqual({
      state: 'aim',
      stateMs: 0,
      entered: 'aim',
    });
    expect(tickSplatta('aim', SPLATTA_FSM.aimMs - 16, 16)).toEqual({
      state: 'lob',
      stateMs: 0,
      entered: 'lob',
    });
  });

  it('lob 為單幀事件態：下一 tick 即入冷卻，冷卻期滿回巡邏', () => {
    expect(tickSplatta('lob', 0, 16)).toEqual({ state: 'cool', stateMs: 0, entered: 'cool' });
    expect(tickSplatta('cool', SPLATTA_FSM.coolMs - 16, 16)).toEqual({
      state: 'patrol',
      stateMs: 0,
      entered: 'patrol',
    });
  });

  it('恆可吸歸孢子味（§73 黏緩語意一致）；糖斑壽命有界（anti-softlock §56）', () => {
    expect(canInhale('splatta')).toBe(true);
    expect(SPLATTA_FSM.blobLifeMs).toBeGreaterThan(0);
    expect(SPLATTA_FSM.blobLifeMs).toBeLessThanOrEqual(3000);
    expect(SPLATTA_FSM.spotMs).toBeGreaterThan(0);
    expect(SPLATTA_FSM.spotMs).toBeLessThanOrEqual(3000);
  });

  it('精英倍率（§48 審查修復）：潛伏/巡邏/冷卻縮時、telegraph 與可吸窗不縮', () => {
    // 焦糖泡霸 ×1.5：潛伏 2200/1.5≈1467 即轉漣漪；漣漪與躍出窗維持原長。
    expect(tickBubbla('submerged', 1466, 16, 1.5).state).toBe('ripple');
    expect(tickBubbla('submerged', 1400, 16, 1).state).toBe('submerged');
    expect(tickBubbla('ripple', BUBBLA_FSM.rippleMs - 32, 16, 1.5).state).toBe('ripple');
    expect(tickBubbla('leap', BUBBLA_FSM.leapMs - 32, 16, 1.5).state).toBe('leap');
    // 糖漿投擲隊長 ×1.5：巡邏 2400/1.5=1600、冷卻 1600/1.5≈1067 即轉；舉勺前搖不縮。
    expect(tickSplatta('patrol', 1600, 16, 1.5).state).toBe('aim');
    expect(tickSplatta('patrol', 1600, 16, 1).state).toBe('patrol');
    expect(tickSplatta('cool', 1067, 16, 1.5).state).toBe('patrol');
    expect(tickSplatta('aim', SPLATTA_FSM.aimMs - 32, 16, 1.5).state).toBe('aim');
  });
});

describe('Twinkla 三態時序（§80 星屑幽靈）', () => {
  it('虛化期滿轉星光前搖，前搖期滿實體化，實體期滿回虛化', () => {
    expect(tickTwinkla('phased', TWINKLA_FSM.phasedMs - 17, 16).state).toBe('phased');
    expect(tickTwinkla('phased', TWINKLA_FSM.phasedMs - 16, 16)).toEqual({
      state: 'shimmer',
      stateMs: 0,
      entered: 'shimmer',
    });
    expect(tickTwinkla('shimmer', TWINKLA_FSM.shimmerMs - 16, 16)).toEqual({
      state: 'solid',
      stateMs: 0,
      entered: 'solid',
    });
    expect(tickTwinkla('solid', TWINKLA_FSM.solidMs - 16, 16)).toEqual({
      state: 'phased',
      stateMs: 0,
      entered: 'phased',
    });
  });

  it('受擊決策：僅實體窗可吸可傷，虛化/前搖穿身免傷', () => {
    expect(resolveTwinklaHit('solid')).toBe('vulnerable');
    expect(resolveTwinklaHit('phased')).toBe('immune');
    expect(resolveTwinklaHit('shimmer')).toBe('immune');
  });

  it('條件可吸（§80）：canInhale 未帶狀態取保守值 false、實體窗 true；cometa 恆可吸', () => {
    expect(canInhale('twinkla')).toBe(false);
    expect(canInhale('twinkla', true)).toBe(true);
    expect(canInhale('cometa')).toBe(true);
  });

  it('精英倍率（§48）：星屑幽長 ×1.4 僅縮虛化期，前搖與實體窗不縮', () => {
    // 虛化 2000/1.4≈1429 即轉前搖。
    expect(tickTwinkla('phased', 1429, 16, 1.4).state).toBe('shimmer');
    expect(tickTwinkla('phased', 1429, 16, 1).state).toBe('phased');
    expect(tickTwinkla('shimmer', TWINKLA_FSM.shimmerMs - 32, 16, 1.4).state).toBe('shimmer');
    expect(tickTwinkla('solid', TWINKLA_FSM.solidMs - 32, 16, 1.4).state).toBe('solid');
  });
});

describe('Cometa 四態時序（§80 彗尾飛魚）', () => {
  it('巡游遇觸發轉鎖定，鎖定期滿俯衝，俯衝期滿回升再巡游', () => {
    expect(tickCometa('glide', 500, 16, false, true).state).toBe('glide');
    expect(tickCometa('glide', 500, 16, true, true)).toEqual({
      state: 'lock',
      stateMs: 0,
      entered: 'lock',
    });
    expect(tickCometa('lock', COMETA_FSM.lockMs - 16, 16, false, false)).toEqual({
      state: 'dash',
      stateMs: 0,
      entered: 'dash',
    });
    expect(tickCometa('dash', COMETA_FSM.dashMs - 16, 16, false, false)).toEqual({
      state: 'recover',
      stateMs: 0,
      entered: 'recover',
    });
    expect(tickCometa('recover', COMETA_FSM.recoverMs - 16, 16, false, true)).toEqual({
      state: 'glide',
      stateMs: 0,
      entered: 'glide',
    });
  });

  it('低空重俯衝抑制（#822）：回升時滿但未回抵 baseY 不得切 glide', () => {
    // 時滿未回航高：停留 recover 持續爬升，杜絕自低空直接再鎖定俯衝。
    const held = tickCometa('recover', COMETA_FSM.recoverMs - 16, 16, false, false);
    expect(held).toEqual({ state: 'recover', stateMs: COMETA_FSM.recoverMs, entered: null });
    // 深俯衝長時間爬升（時長遠超 recoverMs）仍未達航高：維持 recover。
    expect(tickCometa('recover', COMETA_FSM.recoverMs * 3, 16, false, false).state).toBe('recover');
    // 回抵航高瞬間（時已滿）：切回 glide。
    expect(tickCometa('recover', COMETA_FSM.recoverMs * 3, 16, false, true)).toEqual({
      state: 'glide',
      stateMs: 0,
      entered: 'glide',
    });
  });

  it('鎖定後不受觸發旗標干擾（鎖定即不修正）；彗尾參數逾時必回收帶', () => {
    expect(tickCometa('lock', 100, 16, true, true).state).toBe('lock');
    expect(tickCometa('dash', 100, 16, true, true).state).toBe('dash');
    expect(COMETA_FSM.lockMs).toBeGreaterThanOrEqual(500);
    expect(COMETA_FSM.tailLifeMs).toBeGreaterThan(0);
    expect(COMETA_FSM.tailLifeMs).toBeLessThanOrEqual(1000);
  });
});

describe('§120 星海終局篇新怪 FSM', () => {
  it('telegraph 紅線：ticketa/scanna/foamy/manta 可讀前搖窗一律 ≥ telegraphMinMs', () => {
    // 票券蝠可讀前搖＝fly 尾段 WARN 預警（呈現層 TICKETA_WARN_MS）；shiftMs 為俯掠
    // 位移時長而非前搖（#899/#904），其動力學釘點在 finaleEnemies.test.ts。
    expect(TICKETA_WARN_MS).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.telegraphMinMs);
    expect(SCANNA_FSM.aimMs).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.telegraphMinMs);
    expect(FOAMY_FSM.windupMs).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.telegraphMinMs);
    expect(MANTA_FSM.aimMs).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.telegraphMinMs);
  });

  it('WARN 預警分支存續守門（#904/#910）：WARN 窗內必亮 TICKETA_SHIFT_TINT 閃爍', () => {
    // 刻意跨層驅動呈現層 updateTicketa：票券蝠可讀前搖住在 finaleEnemies 的 WARN
    // 分支，若被移除或短路，僅釘常數的紅線仍綠——本案逐幀走完 fly 期，斷言至少
    // 一幀「落在 WARN 窗內」且「色值＝TICKETA_SHIFT_TINT（import 比對，禁硬編）」，
    // 防 #899 公平性缺陷靜默復活，亦防假 setTint 或窗外提早閃爍矇混過關。
    // 僅斷言 tint 訊號，不綁懸停速度細節（速度語彙與反應窗實測屬
    // finaleEnemies.test.ts），維持與 #905 類 vx 調參的正交性。
    const data = new Map<string, unknown>([
      ['state', 'fly'],
      ['stateMs', 0],
      ['band', 'high'],
      ['phase', 0],
      ['eliteMul', 1],
    ]);
    const frameTints: number[] = [];
    const sprite = {
      y: TICKETA_FSM.bandHighY,
      body: {
        velocity: { x: 0, y: 0 },
        setVelocity(vx: number, vy: number) {
          sprite.body.velocity.x = vx;
          sprite.body.velocity.y = vy;
        },
      },
      getData: (key: string) => data.get(key),
      setData(key: string, value: unknown) {
        data.set(key, value);
        return sprite;
      },
      setTint(tint: number) {
        frameTints.push(tint);
        return sprite;
      },
      clearTint: () => sprite,
      setFlipX: () => sprite,
    };
    const ctx = { elapsedMs: 0, target: null } as unknown as EnemyUpdateContext;
    let inWindowShiftTintFrames = 0;
    for (let i = 0; i < 200 && data.get('state') === 'fly'; i += 1) {
      frameTints.length = 0;
      updateTicketa(ctx, sprite as unknown as Phaser.Physics.Arcade.Sprite, 16);
      // 轉入 shift 幀不計：俯掠期亦閃爍，計入會稀釋「WARN 窗內」語意。
      if (data.get('state') !== 'fly') break;
      const stateMs = data.get('stateMs') as number;
      const inWarnWindow = TICKETA_FSM.flyMs - stateMs <= TICKETA_WARN_MS;
      if (inWarnWindow && frameTints.includes(TICKETA_SHIFT_TINT)) inWindowShiftTintFrames += 1;
    }
    expect(inWindowShiftTintFrames).toBeGreaterThan(0);
  });

  it('cargoPatrolDirection：週期折返（flipMs 交替 ±1）', () => {
    expect(cargoPatrolDirection(0)).toBe(1);
    expect(cargoPatrolDirection(CARGO_FSM.flipMs - 1)).toBe(1);
    expect(cargoPatrolDirection(CARGO_FSM.flipMs)).toBe(-1);
    expect(cargoPatrolDirection(CARGO_FSM.flipMs * 2)).toBe(1);
  });

  it('tickTicketa：fly 期滿入 shift（telegraph），shift 期滿回 fly（換軌由呈現層翻轉）', () => {
    const toShift = tickTicketa('fly', TICKETA_FSM.flyMs - 1, 1);
    expect(toShift.state).toBe('shift');
    expect(toShift.entered).toBe('shift');
    const backToFly = tickTicketa('shift', TICKETA_FSM.shiftMs - 1, 1);
    expect(backToFly.state).toBe('fly');
    expect(backToFly.entered).toBe('fly');
    expect(tickTicketa('fly', 0, 100).entered).toBeNull();
  });

  it('tickScanna：scan→aim→fire（單幀事件態）→cool→scan 完整循環', () => {
    expect(tickScanna('scan', SCANNA_FSM.scanMs - 1, 1).state).toBe('aim');
    expect(tickScanna('aim', SCANNA_FSM.aimMs - 1, 1).state).toBe('fire');
    const afterFire = tickScanna('fire', 0, 16);
    expect(afterFire.state).toBe('cool');
    expect(afterFire.entered).toBe('cool');
    expect(tickScanna('cool', SCANNA_FSM.coolMs - 1, 1).state).toBe('scan');
  });

  it('tickFoamy：idle→windup→spit（單幀事件態）→cool→idle 完整循環', () => {
    expect(tickFoamy('idle', FOAMY_FSM.idleMs - 1, 1).state).toBe('windup');
    expect(tickFoamy('windup', FOAMY_FSM.windupMs - 1, 1).state).toBe('spit');
    expect(tickFoamy('spit', 0, 16).state).toBe('cool');
    expect(tickFoamy('cool', FOAMY_FSM.coolMs - 1, 1).state).toBe('idle');
  });

  it('tickManta：cruise→aim→volley（單幀事件態）→cool→cruise 完整循環', () => {
    expect(tickManta('cruise', MANTA_FSM.cruiseMs - 1, 1).state).toBe('aim');
    expect(tickManta('aim', MANTA_FSM.aimMs - 1, 1).state).toBe('volley');
    expect(tickManta('volley', 0, 16).state).toBe('cool');
    expect(tickManta('cool', MANTA_FSM.coolMs - 1, 1).state).toBe('cruise');
  });

  it('resolveFrostySplit：本體一般擊殺分裂；burn 熔解與迷你體不分裂', () => {
    expect(resolveFrostySplit(false, false)).toBe(true);
    expect(resolveFrostySplit(true, false)).toBe(false);
    expect(resolveFrostySplit(false, true)).toBe(false);
    expect(resolveFrostySplit(true, true)).toBe(false);
  });

  it('foamy 泡泡為不傷人拒止：上浮參數為負（向上），壽命有界', () => {
    expect(FOAMY_FSM.bubbleLiftVy).toBeLessThan(0);
    expect(FOAMY_FSM.bubbleRiseVy).toBeLessThan(0);
    expect(FOAMY_FSM.bubbleLifeMs).toBeGreaterThan(0);
  });
});

describe('§123 星海終局篇 W3 新怪 FSM', () => {
  it('telegraph 紅線：prismbee/gravitybub/orbiton/riftling/bearlet 可讀前搖窗一律 ≥ telegraphMinMs', () => {
    expect(PRISMBEE_FSM.aimMs).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.telegraphMinMs);
    expect(GRAVITYBUB_FSM.windupMs).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.telegraphMinMs);
    expect(ORBITON_FSM.windupMs).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.telegraphMinMs);
    expect(RIFTLING_FSM.riftMs).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.telegraphMinMs);
    expect(BEARLET_FSM.windupMs).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.telegraphMinMs);
  });

  it('tickCopypuff：mimic 常駐；broken 期滿回 mimic（破鏡像窗有界）', () => {
    expect(tickCopypuff('mimic', 5000, 16).state).toBe('mimic');
    expect(tickCopypuff('broken', COPYPUFF_FSM.brokenMs - 1, 1)).toEqual({
      state: 'mimic',
      stateMs: 0,
      entered: 'mimic',
    });
    expect(tickCopypuff('broken', 0, 16).state).toBe('broken');
  });

  it('copypuffMirrorDx：玩家位移取反向 × 倍率、單幀夾限防瞬移', () => {
    expect(copypuffMirrorDx(4)).toBeCloseTo(-3.6, 5);
    expect(copypuffMirrorDx(-4)).toBeCloseTo(3.6, 5);
    expect(copypuffMirrorDx(0)).toBe(0);
    // 大位移（暫停恢復/瞬移）夾限至單幀上限。
    expect(copypuffMirrorDx(500)).toBe(-COPYPUFF_FSM.maxMirrorPxPerFrame);
    expect(copypuffMirrorDx(-500)).toBe(COPYPUFF_FSM.maxMirrorPxPerFrame);
  });

  it('tickPrismbee：hover→aim→dart→cool→hover 完整循環', () => {
    expect(tickPrismbee('hover', PRISMBEE_FSM.hoverMs - 1, 1).state).toBe('aim');
    expect(tickPrismbee('aim', PRISMBEE_FSM.aimMs - 1, 1).state).toBe('dart');
    expect(tickPrismbee('dart', PRISMBEE_FSM.dartMs - 1, 1).state).toBe('cool');
    expect(tickPrismbee('cool', PRISMBEE_FSM.coolMs - 1, 1).state).toBe('hover');
  });

  it('resolvePrismbeeStarHit：正面（面向側來彈）反射、側背面脆弱（側擊反制）', () => {
    // 面向右（facing 1）：右側來彈反射、左側來彈正常結算。
    expect(resolvePrismbeeStarHit(1, 40)).toBe('reflect');
    expect(resolvePrismbeeStarHit(1, -40)).toBe('vulnerable');
    expect(resolvePrismbeeStarHit(-1, -40)).toBe('reflect');
    expect(resolvePrismbeeStarHit(-1, 40)).toBe('vulnerable');
    // 重合（dx=0）視為非正面：正常結算（anti-softlock 保守向）。
    expect(resolvePrismbeeStarHit(1, 0)).toBe('vulnerable');
  });

  it('tickGravitybub：idle→windup（進度 0..1）→field→idle 單計時器循環（沿 magno 模式）', () => {
    expect(tickGravitybub(0, 16).phase).toBe('idle');
    const windup = tickGravitybub(GRAVITYBUB_FSM.idleMs, 16);
    expect(windup.phase).toBe('windup');
    expect(windup.progress).toBeGreaterThan(0);
    const field = tickGravitybub(GRAVITYBUB_FSM.idleMs + GRAVITYBUB_FSM.windupMs, 16);
    expect(field.phase).toBe('field');
    const total = GRAVITYBUB_FSM.idleMs + GRAVITYBUB_FSM.windupMs + GRAVITYBUB_FSM.fieldMs;
    expect(tickGravitybub(total - 1, 1).phase).toBe('idle');
  });

  it('gravityBubPull：域內拉向泡、域外為 0；拉力恆低於玩家全速（交叉不變式 16）', () => {
    expect(gravityBubPull(300, 100, 200, 100)).toBe(-1);
    expect(gravityBubPull(100, 100, 200, 100)).toBe(1);
    expect(gravityBubPull(200 + GRAVITYBUB_FSM.fieldRadiusPx + 10, 100, 200, 100)).toBe(0);
    expect(gravityBubPull(200, 100, 200, 100)).toBe(0);
    expect(GRAVITYBUB_FSM.pullPxPerSec).toBeLessThan(PLAYER.moveSpeed);
  });

  it('tickOrbiton：approach→（抵軌）→orbit 三圈→windup→dash→recover→approach', () => {
    expect(tickOrbiton('approach', 500, 16, false).state).toBe('approach');
    expect(tickOrbiton('approach', 500, 16, true)).toEqual({
      state: 'orbit',
      stateMs: 0,
      entered: 'orbit',
    });
    expect(tickOrbiton('orbit', ORBITON_FSM.orbitMs - 1, 1, true).state).toBe('windup');
    expect(tickOrbiton('windup', ORBITON_FSM.windupMs - 1, 1, true).state).toBe('dash');
    expect(tickOrbiton('dash', ORBITON_FSM.dashMs - 1, 1, false).state).toBe('recover');
    expect(tickOrbiton('recover', ORBITON_FSM.recoverMs - 1, 1, false).state).toBe('approach');
    // 繞行三圈幾何：orbitMs × angular ≈ 3×2π（±5% 容差）。
    const totalRad = ORBITON_FSM.orbitMs * ORBITON_FSM.orbitAngularPerMs;
    expect(totalRad).toBeGreaterThanOrEqual(Math.PI * 6 * 0.95);
    expect(totalRad).toBeLessThanOrEqual(Math.PI * 6 * 1.05);
  });

  it('tickRiftling：idle→rift（裂縫預告）→blink（單幀事件態）→cool→idle', () => {
    expect(tickRiftling('idle', RIFTLING_FSM.idleMs - 1, 1).state).toBe('rift');
    expect(tickRiftling('rift', RIFTLING_FSM.riftMs - 1, 1).state).toBe('blink');
    const afterBlink = tickRiftling('blink', 0, 16);
    expect(afterBlink.state).toBe('cool');
    expect(afterBlink.entered).toBe('cool');
    expect(tickRiftling('cool', RIFTLING_FSM.coolMs - 1, 1).state).toBe('idle');
  });

  it('riftlingBlinkX：朝玩家方向、步長夾限 blinkRangePx（讀裂縫即預判）', () => {
    expect(riftlingBlinkX(100, 150)).toBe(150);
    expect(riftlingBlinkX(100, 1000)).toBe(100 + RIFTLING_FSM.blinkRangePx);
    expect(riftlingBlinkX(1000, 100)).toBe(1000 - RIFTLING_FSM.blinkRangePx);
    expect(riftlingBlinkX(100, 100)).toBe(100);
  });

  it('tickBearlet：waddle→windup→toss（單幀事件態）→cool→waddle；箭頭壽命有界', () => {
    expect(tickBearlet('waddle', BEARLET_FSM.waddleMs - 1, 1).state).toBe('windup');
    expect(tickBearlet('windup', BEARLET_FSM.windupMs - 1, 1).state).toBe('toss');
    expect(tickBearlet('toss', 0, 16).state).toBe('cool');
    expect(tickBearlet('cool', BEARLET_FSM.coolMs - 1, 1).state).toBe('waddle');
    // 下跌箭頭逾時必回收（§56）。
    expect(BEARLET_FSM.arrowLifeMs).toBeGreaterThan(0);
    expect(BEARLET_FSM.arrowLifeMs).toBeLessThanOrEqual(3000);
  });

  it('可吸口徑（§123）：prismbee/datamote/gravitybub/orbiton/riftling 恆可吸；copypuff/bearlet 不可吸', () => {
    for (const kind of ['prismbee', 'datamote', 'gravitybub', 'orbiton', 'riftling'] as const) {
      expect(canInhale(kind)).toBe(true);
    }
    expect(canInhale('copypuff')).toBe(false);
    expect(canInhale('bearlet')).toBe(false);
    // 稜化供給＝流光味、引力化供給＝迴旋味（觸發密度契約星味面）。
    expect(inhaleFlavor('prismbee')).toBe('glowy');
    expect(inhaleFlavor('datamote')).toBe('glowy');
    expect(inhaleFlavor('gravitybub')).toBe('boomy');
    expect(inhaleFlavor('orbiton')).toBe('boomy');
    expect(inhaleFlavor('riftling')).toBe('boomy');
  });
});

describe('§125 星海終局篇 W4 牛熊怪 FSM', () => {
  it('telegraph 紅線：bullrun 蓄力／bearmarket 拍地前搖與冬眠一律 ≥ telegraphMinMs', () => {
    expect(BULLRUN_FSM.chargeMs).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.telegraphMinMs);
    expect(BEARMARKET_FSM.slamwindMs).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.telegraphMinMs);
    expect(BEARMARKET_FSM.hibernateMs).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.telegraphMinMs);
  });

  it('tickBullrun：prowl→charge→dash→（撞牆）redash→（再撞牆）recover→prowl', () => {
    expect(tickBullrun('prowl', BULLRUN_FSM.prowlMs - 1, 1, false).state).toBe('charge');
    expect(tickBullrun('charge', BULLRUN_FSM.chargeMs - 1, 1, false).state).toBe('dash');
    expect(tickBullrun('dash', 100, 16, true)).toEqual({
      state: 'redash',
      stateMs: 0,
      entered: 'redash',
    });
    expect(tickBullrun('redash', 100, 16, true).state).toBe('recover');
    expect(tickBullrun('recover', BULLRUN_FSM.recoverMs - 1, 1, false).state).toBe('prowl');
  });

  it('tickBullrun：dash/redash 未撞牆以 dashMaxMs 斷尾收回（§56 有界）', () => {
    expect(tickBullrun('dash', BULLRUN_FSM.dashMaxMs - 1, 1, false).state).toBe('recover');
    expect(tickBullrun('redash', BULLRUN_FSM.dashMaxMs - 1, 1, false).state).toBe('recover');
    expect(tickBullrun('dash', 100, 16, false).state).toBe('dash');
  });

  it('tickBearmarket：prowl→slamwind→slam（單幀事件態）→cool→prowl', () => {
    expect(tickBearmarket('prowl', BEARMARKET_FSM.prowlMs - 1, 1, false).state).toBe('slamwind');
    expect(tickBearmarket('slamwind', BEARMARKET_FSM.slamwindMs - 1, 1, false).state).toBe('slam');
    expect(tickBearmarket('slam', 0, 16, false).state).toBe('cool');
    expect(tickBearmarket('cool', BEARMARKET_FSM.coolMs - 1, 1, false).state).toBe('prowl');
  });

  it('tickBearmarket：低血旗標於 prowl/cool 觸發一次性冬眠→quake（單幀）→wake→prowl', () => {
    expect(tickBearmarket('prowl', 0, 16, true)).toEqual({
      state: 'hibernate',
      stateMs: 0,
      entered: 'hibernate',
    });
    expect(tickBearmarket('cool', 0, 16, true).state).toBe('hibernate');
    // 前搖中不被冬眠打斷（telegraph 完整性）。
    expect(tickBearmarket('slamwind', 100, 16, true).state).toBe('slamwind');
    expect(tickBearmarket('hibernate', BEARMARKET_FSM.hibernateMs - 1, 1, true).state).toBe(
      'quake',
    );
    expect(tickBearmarket('quake', 0, 16, false).state).toBe('wake');
    expect(tickBearmarket('wake', BEARMARKET_FSM.wakeMs - 1, 1, false).state).toBe('prowl');
  });

  it('可吸口徑與波列有界（§125）：牛熊怪均不可吸；震波壽命有界（§56）', () => {
    expect(canInhale('bullrun')).toBe(false);
    expect(canInhale('bearmarket')).toBe(false);
    expect(BEARMARKET_FSM.slamWaveLifeMs).toBeLessThanOrEqual(3000);
    expect(BEARMARKET_FSM.quakeWaveLifeMs).toBeLessThanOrEqual(3000);
  });
});
