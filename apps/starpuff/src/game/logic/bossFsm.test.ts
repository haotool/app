import { describe, expect, it } from 'vitest';
import {
  BOSS,
  attackCycle,
  createBossFsm,
  jellyRainCount,
  nextAction,
  phaseForHp,
  type BossCommand,
  type BossFsm,
} from './bossFsm';

function collectCommands(fsm: BossFsm, totalMs: number, stepMs = 16): BossCommand[] {
  const commands: BossCommand[] = [];
  for (let elapsed = 0; elapsed < totalMs; elapsed += stepMs) {
    const command = fsm.tick(stepMs);
    if (command) commands.push(command);
  }
  return commands;
}

describe('bossFsm 基礎規則', () => {
  it('HP 高於 50% 為 p1、低於等於 50% 為 p2、低於等於 25% 為 p3', () => {
    expect(phaseForHp(31, BOSS.maxHp)).toBe('p1');
    expect(phaseForHp(30, BOSS.maxHp)).toBe('p2');
    expect(phaseForHp(16, BOSS.maxHp)).toBe('p2');
    expect(phaseForHp(15, BOSS.maxHp)).toBe('p3');
    expect(phaseForHp(1, BOSS.maxHp)).toBe('p3');
  });

  it('jellyRain 顆數：p1 為 5、p2 為 7、p3 追蹤彈 5', () => {
    expect(jellyRainCount('p1')).toBe(5);
    expect(jellyRainCount('p2')).toBe(7);
    expect(jellyRainCount('p3')).toBe(5);
  });

  it('p2/p3 招式循環包含 dash，p1 不含', () => {
    expect(attackCycle('p1')).not.toContain('dash');
    expect(attackCycle('p2')).toContain('dash');
    expect(attackCycle('p3')).toContain('dash');
  });

  it('nextAction 依循環推進並回繞', () => {
    expect(nextAction('p1', null)).toBe('jellyRain');
    expect(nextAction('p1', 'jellyRain')).toBe('slam');
    expect(nextAction('p1', 'slam')).toBe('jellyRain');
    expect(nextAction('p2', 'slam')).toBe('dash');
    expect(nextAction('p2', 'dash')).toBe('jellyRain');
    expect(nextAction('p3', 'slam')).toBe('dash');
  });
});

describe('createBossFsm P1 循環', () => {
  it('初始為 idle、滿血 p1、速度係數 1', () => {
    const fsm = createBossFsm();
    expect(fsm.state).toBe('idle');
    expect(fsm.hp).toBe(BOSS.maxHp);
    expect(fsm.phase).toBe('p1');
    expect(fsm.speedFactor).toBe(1);
    expect(fsm.defeated).toBe(false);
  });

  it('idle 未滿 1.2s 不出招', () => {
    const fsm = createBossFsm();
    expect(collectCommands(fsm, BOSS.idleMs - 100)).toEqual([]);
  });

  it('循環順序：rain(5) → idle → slam → idle → rain(5)', () => {
    const fsm = createBossFsm();
    const kinds = collectCommands(fsm, 8000).map((c) =>
      c.kind === 'rain' ? `rain${c.count}` : c.kind,
    );
    expect(kinds.slice(0, 5)).toEqual(['rain5', 'idle', 'slam', 'idle', 'rain5']);
  });
});

describe('createBossFsm 階段切換', () => {
  it('損血跨 50% 閾值發 phase 事件並升速 1.3', () => {
    const fsm = createBossFsm();
    fsm.takeDamage(25);
    expect(fsm.phase).toBe('p1');
    const events = fsm.takeDamage(5);
    expect(events).toContainEqual({ kind: 'phase', phase: 'p2' });
    expect(fsm.phase).toBe('p2');
    expect(fsm.speedFactor).toBe(BOSS.enrageSpeedMultiplier);
  });

  it('p2 循環含 dash 且 rain 升為 7 顆（非追蹤）', () => {
    const fsm = createBossFsm();
    fsm.takeDamage(30);
    const commands = collectCommands(fsm, 10000);
    const kinds = commands.map((c) => c.kind);
    expect(kinds).toContain('dash');
    const rains = commands.filter((c) => c.kind === 'rain');
    expect(rains.length).toBeGreaterThan(0);
    for (const rain of rains) expect(rain).toEqual({ kind: 'rain', count: 7, homing: false });
  });

  it('p2 slam 不帶震落旗標', () => {
    const fsm = createBossFsm();
    fsm.takeDamage(30);
    const slams = collectCommands(fsm, 10000).filter((c) => c.kind === 'slam');
    expect(slams.length).toBeGreaterThan(0);
    for (const slam of slams) expect(slam).toEqual({ kind: 'slam', quake: false });
  });

  it('p2 節奏加速：idle 時長縮短為 1/1.3', () => {
    const fsm = createBossFsm();
    fsm.takeDamage(30);
    const enragedIdleMs = BOSS.idleMs / BOSS.enrageSpeedMultiplier;
    expect(collectCommands(fsm, enragedIdleMs - 50, 1)).toEqual([]);
    expect(fsm.tick(60)?.kind).toBe('rain');
  });

  it('損血跨 25% 閾值發 p3 phase 事件，速度維持 1.3', () => {
    const fsm = createBossFsm();
    fsm.takeDamage(30);
    expect(fsm.phase).toBe('p2');
    const events = fsm.takeDamage(15);
    expect(events).toContainEqual({ kind: 'phase', phase: 'p3' });
    expect(fsm.phase).toBe('p3');
    expect(fsm.speedFactor).toBe(BOSS.enrageSpeedMultiplier);
  });

  it('p1 直落 p3：單發 phase 事件即為 p3', () => {
    const fsm = createBossFsm();
    const events = fsm.takeDamage(45);
    expect(events.filter((e) => e.kind === 'phase')).toEqual([{ kind: 'phase', phase: 'p3' }]);
  });

  it('p3 循環：rain 為追蹤彈 ×5、slam 帶震落旗標、含 dash', () => {
    const fsm = createBossFsm();
    fsm.takeDamage(45);
    const commands = collectCommands(fsm, 12000);
    const rains = commands.filter((c) => c.kind === 'rain');
    expect(rains.length).toBeGreaterThan(0);
    for (const rain of rains) expect(rain).toEqual({ kind: 'rain', count: 5, homing: true });
    const slams = commands.filter((c) => c.kind === 'slam');
    expect(slams.length).toBeGreaterThan(0);
    for (const slam of slams) expect(slam).toEqual({ kind: 'slam', quake: true });
    expect(commands.map((c) => c.kind)).toContain('dash');
  });

  it('追蹤彈常數符合 §30：緩速跟蹤 2s', () => {
    expect(BOSS.homingRainCount).toBe(5);
    expect(BOSS.homingTrackMs).toBe(2000);
    expect(BOSS.phase3HpRatio).toBe(0.25);
  });
});

describe('createBossFsm 受擊與補生', () => {
  it('每次受擊回傳 damaged 事件與剩餘 HP', () => {
    const fsm = createBossFsm();
    expect(fsm.takeDamage(5)).toEqual([{ kind: 'damaged', hp: 55 }]);
    expect(fsm.hp).toBe(55);
  });

  it('每累積損 10 HP 輸出一次 minionDrop', () => {
    const fsm = createBossFsm();
    expect(fsm.takeDamage(5)).not.toContainEqual({ kind: 'minionDrop' });
    expect(fsm.takeDamage(5)).toContainEqual({ kind: 'minionDrop' });
    expect(fsm.takeDamage(5)).not.toContainEqual({ kind: 'minionDrop' });
    expect(fsm.takeDamage(5)).toContainEqual({ kind: 'minionDrop' });
  });

  it('單次大量傷害依 10 HP 級距補發多次 minionDrop', () => {
    const fsm = createBossFsm();
    const drops = fsm.takeDamage(25).filter((e) => e.kind === 'minionDrop');
    expect(drops).toHaveLength(2);
  });

  it('非正數傷害不產生事件', () => {
    const fsm = createBossFsm();
    expect(fsm.takeDamage(0)).toEqual([]);
    expect(fsm.takeDamage(-5)).toEqual([]);
    expect(fsm.hp).toBe(BOSS.maxHp);
  });
});

describe('createBossFsm 死亡', () => {
  it('HP 歸零發 defeated，之後 tick 與受擊皆靜默', () => {
    const fsm = createBossFsm();
    fsm.takeDamage(55);
    const events = fsm.takeDamage(10);
    expect(events).toContainEqual({ kind: 'damaged', hp: 0 });
    expect(events).toContainEqual({ kind: 'defeated' });
    expect(fsm.defeated).toBe(true);
    expect(fsm.hp).toBe(0);
    expect(fsm.tick(5000)).toBeNull();
    expect(fsm.takeDamage(5)).toEqual([]);
  });

  it('致死一擊同時跨閾值仍先發 phase 再 defeated', () => {
    const fsm = createBossFsm();
    fsm.takeDamage(29);
    const events = fsm.takeDamage(31);
    expect(events.map((e) => e.kind)).toEqual(['damaged', 'phase', 'defeated']);
  });
});

describe('EX 變體（§58）', () => {
  it('HP ×1.5（90）、節奏 ×1.15；階段門檻依 EX maxHp 計', () => {
    const fsm = createBossFsm({ ex: true });
    expect(fsm.maxHp).toBe(90);
    expect(fsm.speedFactor).toBeCloseTo(1.15, 5);
    // P2 門檻 ≤50%（45）：EX 血量下 46 不轉、45 轉。
    fsm.takeDamage(44);
    expect(fsm.phase).toBe('p1');
    fsm.takeDamage(1);
    expect(fsm.phase).toBe('p2');
    expect(fsm.speedFactor).toBeCloseTo(1.3 * 1.15, 5);
  });

  it('EX 擊破追加 split 事件（分裂 3 隻小果凍）；一般模式不分裂', () => {
    const exFsm = createBossFsm({ ex: true });
    const events = exFsm.takeDamage(90);
    expect(events).toContainEqual({ kind: 'split', count: 3 });
    const normal = createBossFsm();
    expect(normal.takeDamage(60)).not.toContainEqual({ kind: 'split', count: 3 });
  });
});

describe('頭頂命中短暈（§58 slamStun）', () => {
  it('stun 後停拍 slamStunMs：期間 tick 無指令，期滿恢復攻擊循環', () => {
    const fsm = createBossFsm();
    fsm.stun(BOSS.slamStunMs);
    expect(fsm.tick(BOSS.slamStunMs - 1)).toBeNull();
    const command = fsm.tick(1);
    expect(command).not.toBeNull();
    expect(command?.kind).not.toBe('idle');
  });

  it('死亡後 stun 靜默', () => {
    const fsm = createBossFsm();
    fsm.takeDamage(60);
    fsm.stun(900);
    expect(fsm.tick(2000)).toBeNull();
  });
});
