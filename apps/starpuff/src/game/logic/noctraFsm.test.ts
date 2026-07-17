import { describe, expect, it } from 'vitest';
import {
  NOCTRA,
  createNoctraFsm,
  noctraAttackCycle,
  noctraBombCount,
  noctraNextAction,
  noctraPhaseForHp,
  type NoctraCommand,
} from './noctraFsm';

describe('noctraPhaseForHp（§54 三階段門檻）', () => {
  it('HP 比例對應 p1/p2/p3', () => {
    expect(noctraPhaseForHp(70, 70)).toBe('p1');
    expect(noctraPhaseForHp(43, 70)).toBe('p1');
    expect(noctraPhaseForHp(42, 70)).toBe('p2');
    expect(noctraPhaseForHp(22, 70)).toBe('p2');
    expect(noctraPhaseForHp(21, 70)).toBe('p3');
    expect(noctraPhaseForHp(0, 70)).toBe('p3');
  });
});

describe('noctraAttackCycle（表驅動招式循環）', () => {
  it('P1 盤旋投彈＋俯衝；P2 俯衝連擊＋召喚；P3 彈幕＋俯掠＋投彈', () => {
    expect(noctraAttackCycle('p1')).toEqual(['bomb', 'dive']);
    expect(noctraAttackCycle('p2')).toEqual(['bomb', 'dive', 'dive', 'summon']);
    expect(noctraAttackCycle('p3')).toEqual(['barrage', 'sweep', 'bomb']);
  });

  it('nextAction 依循環游標推進且環回', () => {
    let cursor = noctraNextAction('p2', null, 0);
    expect(cursor.action).toBe('bomb');
    cursor = noctraNextAction('p2', cursor.action, cursor.cycleIndex);
    expect(cursor.action).toBe('dive');
    cursor = noctraNextAction('p2', cursor.action, cursor.cycleIndex);
    expect(cursor.action).toBe('dive');
    cursor = noctraNextAction('p2', cursor.action, cursor.cycleIndex);
    expect(cursor.action).toBe('summon');
    cursor = noctraNextAction('p2', cursor.action, cursor.cycleIndex);
    expect(cursor.action).toBe('bomb');
  });

  it('投彈數依階段增量', () => {
    expect(noctraBombCount('p1')).toBe(NOCTRA.bombCountP1);
    expect(noctraBombCount('p2')).toBe(NOCTRA.bombCountP2);
    expect(noctraBombCount('p3')).toBe(NOCTRA.bombCountP2);
  });
});

describe('createNoctraFsm tick（節奏與指令）', () => {
  it('idle 期滿發首招 bomb，再回 hover 交替', () => {
    const fsm = createNoctraFsm();
    expect(fsm.tick(NOCTRA.idleMs - 1)).toBeNull();
    const first = fsm.tick(1);
    expect(first).toEqual({ kind: 'bomb', count: NOCTRA.bombCountP1 });
    expect(fsm.state).toBe('bomb');
    // 攻擊時長期滿回 hover。
    const back = fsm.tick(NOCTRA.bombDurationMs);
    expect(back).toEqual({ kind: 'hover' });
  });

  it('P2 循環含召喚令且帶上限 cap', () => {
    const fsm = createNoctraFsm();
    fsm.takeDamage(30);
    expect(fsm.phase).toBe('p2');
    const commands: NoctraCommand[] = [];
    // 推進足量時間收集一輪循環指令。
    for (let i = 0; i < 400; i += 1) {
      const command = fsm.tick(50);
      if (command && command.kind !== 'hover') commands.push(command);
      if (commands.length >= 4) break;
    }
    expect(commands.map((c) => c.kind)).toEqual(['bomb', 'dive', 'dive', 'summon']);
    const summon = commands[3];
    if (summon?.kind !== 'summon') throw new Error('第四招應為召喚');
    expect(summon.cap).toBe(NOCTRA.summonCap);
  });
});

describe('createNoctraFsm takeDamage（事件流）', () => {
  it('受擊發 damaged；跨門檻發 phase；每損 10 發 minionDrop', () => {
    const fsm = createNoctraFsm();
    const events = fsm.takeDamage(10);
    expect(events).toContainEqual({ kind: 'damaged', hp: 60 });
    expect(events).toContainEqual({ kind: 'minionDrop' });
    expect(events.find((e) => e.kind === 'phase')).toBeUndefined();
    // 60 → 42 跨 p2 門檻（70×0.6=42）。
    const phaseEvents = fsm.takeDamage(18);
    expect(phaseEvents).toContainEqual({ kind: 'phase', phase: 'p2' });
  });

  it('歸零發 defeated 且冪等（再傷害無事件）', () => {
    const fsm = createNoctraFsm();
    const events = fsm.takeDamage(70);
    expect(events[events.length - 1]).toEqual({ kind: 'defeated' });
    expect(fsm.defeated).toBe(true);
    expect(fsm.takeDamage(10)).toEqual([]);
    expect(fsm.tick(10000)).toBeNull();
  });

  it('狂暴速度倍率：P2/P3 節奏 ×1.25', () => {
    const fsm = createNoctraFsm();
    expect(fsm.speedFactor).toBe(1);
    fsm.takeDamage(30);
    expect(fsm.speedFactor).toBe(NOCTRA.enrageSpeedMultiplier);
  });

  it('換階段重置循環游標：P3 首招必為 barrage', () => {
    const fsm = createNoctraFsm();
    // P1 先走完一招（游標非 0）。
    fsm.tick(NOCTRA.idleMs);
    fsm.takeDamage(50);
    expect(fsm.phase).toBe('p3');
    // 回 hover 後下一招應為 P3 循環首位 barrage。
    let command: NoctraCommand | null = null;
    for (let i = 0; i < 400; i += 1) {
      command = fsm.tick(50);
      if (command && command.kind !== 'hover') break;
    }
    expect(command?.kind).toBe('barrage');
  });
});
