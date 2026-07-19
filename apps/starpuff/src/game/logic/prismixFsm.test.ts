import { describe, expect, it } from 'vitest';
import {
  EX_PRISMIX,
  PRISMIX,
  createPrismixFsm,
  prismixAttackCycle,
  type PrismixCommand,
  type PrismixHitEvent,
} from './prismixFsm';

// 逐拍推進：吃掉當前計時並回收非 null 指令。
function drain(fsm: ReturnType<typeof createPrismixFsm>, steps: number): PrismixCommand[] {
  const commands: PrismixCommand[] = [];
  for (let i = 0; i < steps; i += 1) {
    const command = fsm.tick(10_000);
    if (command) commands.push(command);
  }
  return commands;
}

function eventKinds(events: PrismixHitEvent[]): string[] {
  return events.map((event) => event.kind);
}

// 造出 P2：自滿血打到分裂閾值以下。
function splitFsm(): ReturnType<typeof createPrismixFsm> {
  const fsm = createPrismixFsm();
  fsm.takeDamage(28);
  expect(fsm.phase).toBe('p2');
  return fsm;
}

describe('PRISMIX 常數與循環表（§68）', () => {
  it('HP 階梯 80、telegraph 全數 ≥500ms、三階段循環表對表', () => {
    expect(PRISMIX.maxHp).toBe(80);
    expect(PRISMIX.pillarTelegraphMs).toBeGreaterThanOrEqual(500);
    expect(PRISMIX.beamTelegraphMs).toBeGreaterThanOrEqual(500);
    expect(PRISMIX.pincerTelegraphMs).toBeGreaterThanOrEqual(500);
    expect(PRISMIX.rainTelegraphMs).toBeGreaterThanOrEqual(500);
    expect(prismixAttackCycle('p1')).toEqual(['pillar', 'beam']);
    expect(prismixAttackCycle('p2')).toEqual(['pincer', 'crossbeam', 'summon']);
    expect(prismixAttackCycle('p3')).toEqual(['barrage', 'rain']);
  });
});

describe('P1 單體（§68）', () => {
  it('招式沿 pillar → idle → beam → idle 輪替且帶正確參數', () => {
    const fsm = createPrismixFsm();
    const commands = drain(fsm, 8);
    expect(commands.map((c) => c.kind)).toEqual([
      'pillar',
      'idle',
      'beam',
      'idle',
      'pillar',
      'idle',
      'beam',
      'idle',
    ]);
    const pillar = commands[0];
    if (pillar?.kind !== 'pillar') throw new Error('首招應為晶柱');
    expect(pillar.count).toBe(PRISMIX.pillarCount);
  });

  it('每損 10 HP 掉補給小怪（§26 飢荒保證律）', () => {
    const fsm = createPrismixFsm();
    expect(eventKinds(fsm.takeDamage(5))).toEqual(['damaged']);
    expect(eventKinds(fsm.takeDamage(5))).toEqual(['damaged', 'minionDrop']);
  });

  it('總血 ≤66% 觸發分裂：剩餘均分為雙獨立血條、循環切 P2', () => {
    const fsm = createPrismixFsm();
    const events = fsm.takeDamage(28);
    expect(eventKinds(events)).toEqual(['damaged', 'minionDrop', 'minionDrop', 'phase', 'split']);
    const split = events.find((e) => e.kind === 'split');
    if (split?.kind !== 'split') throw new Error('缺 split 事件');
    expect(split.hpA + split.hpB).toBe(52);
    expect(Math.abs(split.hpA - split.hpB)).toBeLessThanOrEqual(1);
    expect(fsm.twins).toEqual({ a: 26, b: 26 });
    expect(fsm.hp).toBe(52);
    expect(drain(fsm, 1)[0]?.kind).toBe('pincer');
  });
});

describe('P2 鏡像雙子（§68 獨立血條）', () => {
  it('受擊側各自扣血，另一側不動', () => {
    const fsm = splitFsm();
    fsm.takeDamage(5, 'b');
    expect(fsm.twins).toEqual({ a: 26, b: 21 });
    fsm.takeDamage(5, 'a');
    expect(fsm.twins).toEqual({ a: 21, b: 21 });
  });

  it('單具擊破入殘核掙扎窗：事件帶存活側與窗長', () => {
    const fsm = splitFsm();
    const events = fsm.takeDamage(26, 'a');
    expect(eventKinds(events)).toContain('struggle');
    const struggle = events.find((e) => e.kind === 'struggle');
    if (struggle?.kind !== 'struggle') throw new Error('缺 struggle 事件');
    expect(struggle.survivor).toBe('b');
    expect(struggle.windowMs).toBe(PRISMIX.struggleMs);
    expect(fsm.state).toBe('struggle');
  });

  it('掙扎窗期滿合體入 P3：merge 指令帶裂核血量與碎晶盾數', () => {
    const fsm = splitFsm();
    fsm.takeDamage(6, 'b');
    fsm.takeDamage(26, 'a');
    const command = fsm.tick(PRISMIX.struggleMs);
    expect(command).toEqual({ kind: 'merge', coreHp: 20, shards: PRISMIX.shardOrbitCount });
    expect(fsm.phase).toBe('p3');
    expect(fsm.hp).toBe(20);
    expect(fsm.twins).toBeNull();
    expect(drain(fsm, 4).map((c) => c.kind)).toEqual(['barrage', 'idle', 'rain', 'idle']);
  });

  it('掙扎窗內補殺第二具＝雙子連破：跳過 P3 直接擊破', () => {
    const fsm = splitFsm();
    fsm.takeDamage(26, 'a');
    fsm.tick(PRISMIX.struggleMs - 50);
    const events = fsm.takeDamage(26, 'b');
    expect(eventKinds(events)).toContain('twinFinish');
    expect(eventKinds(events)).toContain('defeated');
    expect(fsm.defeated).toBe(true);
    expect(fsm.tick(5000)).toBeNull();
    expect(fsm.takeDamage(5)).toEqual([]);
  });

  it('掙扎窗內傷害一律結算至存活具（死側指定防呆）', () => {
    const fsm = splitFsm();
    fsm.takeDamage(26, 'a');
    const events = fsm.takeDamage(5, 'a');
    expect(eventKinds(events)).toContain('damaged');
    expect(fsm.twins).toEqual({ a: 0, b: 21 });
  });

  it('同幀波及雙具（AoE/鏈電）：第一擊入掙扎、第二擊即雙子連破', () => {
    const fsm = splitFsm();
    const first = fsm.takeDamage(26, 'a');
    expect(eventKinds(first)).toContain('struggle');
    const second = fsm.takeDamage(26, 'b');
    expect(eventKinds(second)).toContain('twinFinish');
  });

  it('interruptSummon 僅召喚態可中斷（§58 雷化斷召慣例）', () => {
    const fsm = splitFsm();
    expect(fsm.interruptSummon()).toBe(false);
    drain(fsm, 5); // pincer idle crossbeam idle summon
    expect(fsm.state).toBe('summon');
    expect(fsm.interruptSummon()).toBe(true);
    expect(fsm.state).toBe('idle');
  });
});

describe('P3 裂核與擊破（§68）', () => {
  it('裂核血量歸零擊破；每 10 傷補給沿跨階段累計', () => {
    const fsm = splitFsm();
    fsm.takeDamage(26, 'a');
    fsm.tick(PRISMIX.struggleMs);
    expect(fsm.phase).toBe('p3');
    const events = fsm.takeDamage(26);
    expect(eventKinds(events)).toContain('defeated');
    expect(fsm.defeated).toBe(true);
  });
});

describe('EX 差分（§68）', () => {
  it('HP 120、分裂閾值 75%、掙扎窗 700ms、碎晶盾 6', () => {
    const fsm = createPrismixFsm({ ex: true });
    expect(fsm.maxHp).toBe(120);
    // 120×0.75 = 90：傷 30 即分裂。
    const events = fsm.takeDamage(30);
    expect(eventKinds(events)).toContain('split');
    expect(fsm.twins).toEqual({ a: 45, b: 45 });
    fsm.takeDamage(45, 'a');
    expect(fsm.state).toBe('struggle');
    const command = fsm.tick(EX_PRISMIX.struggleMs);
    expect(command).toEqual({ kind: 'merge', coreHp: 45, shards: EX_PRISMIX.shardOrbitCount });
  });

  it('EX 公平性下限（§86）：掙扎窗 ≥600ms、去同步錯拍 ≥200ms 且 < 最短 telegraph', () => {
    // 掙扎窗：EX 收短後仍高於普通反應下限（250-400ms）＋輸出裕度。
    expect(EX_PRISMIX.struggleMs).toBeGreaterThanOrEqual(600);
    // 去同步（呈現層相位差）：錯拍幅度有感（≥200ms）但不得吞掉整段 telegraph——
    // 第二拍攻擊的預警起點仍完整可讀。
    expect(EX_PRISMIX.desyncMs).toBeGreaterThanOrEqual(200);
    const minTelegraphMs = Math.min(
      PRISMIX.pillarTelegraphMs,
      PRISMIX.beamTelegraphMs,
      PRISMIX.pincerTelegraphMs,
      PRISMIX.rainTelegraphMs,
    );
    expect(EX_PRISMIX.desyncMs).toBeLessThan(minTelegraphMs);
  });
});
