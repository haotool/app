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
  it('P1 盤旋投彈＋俯衝；P2 俯衝＋召喚（難度根修單 dive）；P3 彈幕＋俯掠＋投彈', () => {
    expect(noctraAttackCycle('p1')).toEqual(['bomb', 'dive']);
    expect(noctraAttackCycle('p2')).toEqual(['bomb', 'dive', 'summon']);
    expect(noctraAttackCycle('p3')).toEqual(['barrage', 'sweep', 'bomb']);
  });

  it('nextAction 依循環游標推進且環回', () => {
    let cursor = noctraNextAction('p2', null, 0);
    expect(cursor.action).toBe('bomb');
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
      if (commands.length >= 3) break;
    }
    expect(commands.map((c) => c.kind)).toEqual(['bomb', 'dive', 'summon']);
    const summon = commands[2];
    if (summon?.kind !== 'summon') throw new Error('第三招應為召喚');
    expect(summon.cap).toBe(NOCTRA.summonCap);
  });
});

describe('createNoctraFsm takeDamage（事件流）', () => {
  it('受擊發 damaged；跨門檻發 phase；每損 8 發 minionDrop', () => {
    const fsm = createNoctraFsm();
    const events = fsm.takeDamage(10);
    expect(events).toContainEqual({ kind: 'damaged', hp: 42 });
    expect(events).toContainEqual({ kind: 'minionDrop' });
    expect(events.find((e) => e.kind === 'phase')).toBeUndefined();
    // 42 → 31 跨 p2 門檻（52×0.6=31.2）。
    const phaseEvents = fsm.takeDamage(11);
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

describe('EX 變體（§58）', () => {
  it('HP ×1.5（78）、節奏 ×1.15；P3 循環追加 eclipse', () => {
    const fsm = createNoctraFsm({ ex: true });
    expect(fsm.maxHp).toBe(78);
    expect(fsm.speedFactor).toBeCloseTo(1.15, 5);
    expect(noctraAttackCycle('p3', true)).toEqual(['barrage', 'sweep', 'bomb', 'eclipse']);
    expect(noctraAttackCycle('p3')).toEqual(['barrage', 'sweep', 'bomb']);
  });

  it('EX P3 走完循環會發出 eclipse 指令（含矩陣參數）', () => {
    const fsm = createNoctraFsm({ ex: true });
    fsm.takeDamage(56);
    expect(fsm.phase).toBe('p3');
    const kinds: string[] = [];
    for (let i = 0; i < 2000 && !kinds.includes('eclipse'); i += 1) {
      const command = fsm.tick(50);
      if (command && command.kind !== 'hover') kinds.push(command.kind);
    }
    expect(kinds).toContain('eclipse');
  });
});

describe('雷化中斷召喚與俯衝長暈（§58）', () => {
  const driveTo = (fsm: ReturnType<typeof createNoctraFsm>, kind: string): boolean => {
    for (let i = 0; i < 2000; i += 1) {
      const command = fsm.tick(50);
      if (command?.kind === kind) return true;
    }
    return false;
  };

  it('interruptSummon 僅於召喚態成立：成功回 hover 並回 true', () => {
    const fsm = createNoctraFsm();
    expect(fsm.interruptSummon()).toBe(false);
    fsm.takeDamage(30);
    expect(driveTo(fsm, 'summon')).toBe(true);
    expect(fsm.state).toBe('summon');
    expect(fsm.interruptSummon()).toBe(true);
    expect(fsm.state).toBe('hover');
  });

  it('stun 停拍 diveStunMs：期間無指令、期滿恢復', () => {
    const fsm = createNoctraFsm();
    fsm.stun(NOCTRA.diveStunMs);
    expect(fsm.tick(NOCTRA.diveStunMs - 1)).toBeNull();
    expect(fsm.tick(1)).not.toBeNull();
  });
});

describe('難度根修基準值（§54 實測席稽核）', () => {
  it('彈幕壓力：bomb 2/3、barrage 7；招式間隙 1600ms、HP 52（bot 勝率門檻收斂值）', () => {
    expect(NOCTRA.bombCountP1).toBe(2);
    expect(NOCTRA.bombCountP2).toBe(3);
    expect(NOCTRA.barrageCount).toBe(7);
    expect(NOCTRA.idleMs).toBe(1600);
    expect(NOCTRA.maxHp).toBe(52);
    expect(NOCTRA.enrageSpeedMultiplier).toBeCloseTo(1.15, 5);
  });

  it('俯衝輸出窗：落地滯留 300ms、暈眩窗涵蓋滯留、全程時長容納 EX 最高速率', () => {
    expect(NOCTRA.diveHoldMs).toBe(300);
    expect(NOCTRA.diveStunWindowMs).toBeGreaterThanOrEqual(NOCTRA.diveHoldMs);
    // EX P2/P3 最高速率 1.25×1.15：telegraph 720（不縮放）＋演出段仍須落在招式時長內。
    const maxSpeed = NOCTRA.enrageSpeedMultiplier * 1.15;
    const presentation = 720 + (320 + NOCTRA.diveHoldMs + 420) / maxSpeed;
    expect(NOCTRA.diveDurationMs / maxSpeed).toBeGreaterThanOrEqual(presentation);
  });
});
