import { describe, expect, it } from 'vitest';
import {
  NOCTRA,
  createNoctraFsm,
  noctraBombCount,
  noctraMoveTable,
  noctraPhaseForHp,
  type NoctraCommand,
} from './noctraFsm';
import { createSeededRng } from './moveTable';

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

describe('noctraMoveTable（§5 加權表）', () => {
  it('P1 投彈＋俯衝；P2 追加召喚與低頻斗篷；P3 彈幕＋俯掠＋投彈＋斗篷', () => {
    expect(noctraMoveTable('p1').map((m) => m.action)).toEqual(['bomb', 'dive']);
    expect(noctraMoveTable('p2').map((m) => m.action)).toEqual(['bomb', 'dive', 'summon', 'cloak']);
    expect(noctraMoveTable('p3').map((m) => m.action)).toEqual([
      'barrage',
      'sweep',
      'bomb',
      'cloak',
    ]);
  });

  it('蝕月斗篷為低頻：P2/P3 表內 cloak 權重最低且 P1 無', () => {
    for (const phase of ['p2', 'p3'] as const) {
      const table = noctraMoveTable(phase);
      const cloak = table.find((m) => m.action === 'cloak');
      expect(cloak).toBeDefined();
      for (const move of table) {
        if (move.action !== 'cloak') expect(move.weight).toBeGreaterThan(cloak?.weight ?? 0);
      }
    }
    expect(noctraMoveTable('p1').map((m) => m.action)).not.toContain('cloak');
  });

  it('投彈數依階段增量', () => {
    expect(noctraBombCount('p1')).toBe(NOCTRA.bombCountP1);
    expect(noctraBombCount('p2')).toBe(NOCTRA.bombCountP2);
    expect(noctraBombCount('p3')).toBe(NOCTRA.bombCountP2);
  });
});

// 收集非 hover 指令直到數量滿足。
function collectAttacks(fsm: ReturnType<typeof createNoctraFsm>, count: number): NoctraCommand[] {
  const commands: NoctraCommand[] = [];
  for (let i = 0; i < 5000 && commands.length < count; i += 1) {
    const command = fsm.tick(50);
    if (command && command.kind !== 'hover') commands.push(command);
  }
  return commands;
}

describe('createNoctraFsm tick（節奏與指令）', () => {
  it('idle 期滿發首招（P1 招池 bomb/dive），攻擊期滿回 hover', () => {
    const fsm = createNoctraFsm({ rng: createSeededRng(1) });
    expect(fsm.tick(NOCTRA.idleMs - 1)).toBeNull();
    const first = fsm.tick(1);
    expect(first).not.toBeNull();
    if (first?.kind === 'bomb') expect(first.count).toBe(NOCTRA.bombCountP1);
    else expect(first?.kind).toBe('dive');
    const duration = first?.kind === 'bomb' ? NOCTRA.bombDurationMs : NOCTRA.diveDurationMs;
    expect(fsm.tick(duration)).toEqual({ kind: 'hover' });
  });

  it('P2 招池含召喚令（帶上限 cap）與低頻蝕月斗篷（帶 1.2s 時長）', () => {
    const fsm = createNoctraFsm({ rng: createSeededRng(2) });
    fsm.takeDamage(30);
    expect(fsm.phase).toBe('p2');
    const commands = collectAttacks(fsm, 40);
    const summon = commands.find((c) => c.kind === 'summon');
    expect(summon).toEqual({ kind: 'summon', cap: NOCTRA.summonCap });
    const cloak = commands.find((c) => c.kind === 'cloak');
    expect(cloak).toEqual({ kind: 'cloak', durationMs: NOCTRA.cloakDurationMs });
  });

  it('蝕月斗篷時長固定 1.2s 不隨狂暴速率縮放（可讀性紅線）', () => {
    const fsm = createNoctraFsm({ rng: createSeededRng(2) });
    fsm.takeDamage(30);
    // 抽到 cloak 後：cloakDurationMs - 1 內不回 hover，期滿回 hover。
    for (let i = 0; i < 5000; i += 1) {
      const command = fsm.tick(50);
      if (command?.kind === 'cloak') break;
    }
    expect(fsm.state).toBe('cloak');
    expect(fsm.tick(NOCTRA.cloakDurationMs - 51)).toBeNull();
    expect(fsm.tick(60)).toEqual({ kind: 'hover' });
  });

  it('加權選招同 seed 可完整重放；不同 seed 20 招內偏離（§5 去背板）', () => {
    const run = (seed: number): string[] => {
      const fsm = createNoctraFsm({ rng: createSeededRng(seed) });
      return collectAttacks(fsm, 20).map((c) => c.kind);
    };
    expect(run(9)).toEqual(run(9));
    // 舊固定循環：P1 bomb→dive 交替。
    const legacy = Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? 'bomb' : 'dive'));
    expect(run(9)).not.toEqual(legacy);
  });

  it('連續同招上限 2：長時序列無三連同招', () => {
    const fsm = createNoctraFsm({ rng: createSeededRng(4) });
    const kinds = collectAttacks(fsm, 60).map((c) => c.kind);
    for (let i = 2; i < kinds.length; i += 1) {
      expect(new Set(kinds.slice(i - 2, i + 1)).size).toBeGreaterThan(1);
    }
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

  it('換階段後出招屬於新階段招池（P3）', () => {
    const fsm = createNoctraFsm({ rng: createSeededRng(6) });
    // P1 先走完一招。
    fsm.tick(NOCTRA.idleMs);
    fsm.takeDamage(50);
    expect(fsm.phase).toBe('p3');
    const pool = noctraMoveTable('p3').map((m) => m.action);
    const kinds = collectAttacks(fsm, 10).map((c) => c.kind);
    for (const kind of kinds) expect(pool).toContain(kind);
  });
});

describe('EX 變體（§58）', () => {
  it('HP ×1.5（78）、節奏 ×1.15；P3 招池追加 eclipse', () => {
    const fsm = createNoctraFsm({ ex: true });
    expect(fsm.maxHp).toBe(78);
    expect(fsm.speedFactor).toBeCloseTo(1.15, 5);
    expect(noctraMoveTable('p3', true).map((m) => m.action)).toContain('eclipse');
    expect(noctraMoveTable('p3').map((m) => m.action)).not.toContain('eclipse');
  });

  it('EX P3 會發出 eclipse 指令（含矩陣參數）', () => {
    const fsm = createNoctraFsm({ ex: true, rng: createSeededRng(8) });
    fsm.takeDamage(56);
    expect(fsm.phase).toBe('p3');
    const kinds: string[] = [];
    for (let i = 0; i < 5000 && !kinds.includes('eclipse'); i += 1) {
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
