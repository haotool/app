import { describe, expect, it } from 'vitest';
import { AUDIT_THRESHOLDS, maxJumpClearancePx, sequenceEntropyBits } from './difficulty';
import { createSeededRng } from './moveTable';
import {
  EX_PRISMIX,
  PRISMIX,
  createPrismixFsm,
  prismixMoveTable,
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

// 收集非 idle 指令直到數量滿足。
function collectAttacks(fsm: ReturnType<typeof createPrismixFsm>, count: number): PrismixCommand[] {
  const commands: PrismixCommand[] = [];
  for (let i = 0; i < 5000 && commands.length < count; i += 1) {
    const command = fsm.tick(50);
    if (command && command.kind !== 'idle') commands.push(command);
  }
  return commands;
}

// 驅動至指定指令出現，回傳該指令；逾迭代上限回 null。
function driveTo(
  fsm: ReturnType<typeof createPrismixFsm>,
  kind: PrismixCommand['kind'],
): PrismixCommand | null {
  for (let i = 0; i < 5000; i += 1) {
    const command = fsm.tick(50);
    if (command?.kind === kind) return command;
  }
  return null;
}

function eventKinds(events: PrismixHitEvent[]): string[] {
  return events.map((event) => event.kind);
}

// 造出 P2：自滿血打到分裂閾值以下。
function splitFsm(seed = 1): ReturnType<typeof createPrismixFsm> {
  const fsm = createPrismixFsm({ rng: createSeededRng(seed) });
  fsm.takeDamage(28);
  expect(fsm.phase).toBe('p2');
  return fsm;
}

describe('PRISMIX 常數與加權表（§68/§112）', () => {
  it('HP 階梯 80、telegraph 全數 ≥500ms、三階段招池對表', () => {
    expect(PRISMIX.maxHp).toBe(80);
    // #810：地面尖刺前搖須容納 500ms 反應玩家（下限對齊 AUDIT_THRESHOLDS.spikeTelegraphMinMs）。
    expect(PRISMIX.pillarTelegraphMs).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.spikeTelegraphMinMs);
    expect(PRISMIX.beamTelegraphMs).toBeGreaterThanOrEqual(500);
    expect(PRISMIX.pincerTelegraphMs).toBeGreaterThanOrEqual(500);
    expect(PRISMIX.rainTelegraphMs).toBeGreaterThanOrEqual(500);
    expect(prismixMoveTable('p1').map((m) => m.action)).toEqual(['pillar', 'beam']);
    expect(prismixMoveTable('p2').map((m) => m.action)).toEqual([
      'pincer',
      'crossbeam',
      'summon',
      'mirror',
      'shadow',
    ]);
    expect(prismixMoveTable('p3').map((m) => m.action)).toEqual(['barrage', 'rain']);
  });

  it('鏡界反射開鏡窗 0.8s（≥600ms 可讀性紅線）；鏡像殘影為低頻＋HP 帶條件', () => {
    expect(PRISMIX.mirrorDurationMs).toBe(800);
    expect(PRISMIX.mirrorDurationMs).toBeGreaterThanOrEqual(600);
    const table = prismixMoveTable('p2');
    const shadow = table.find((m) => m.action === 'shadow');
    expect(shadow).toBeDefined();
    for (const move of table) {
      if (move.action !== 'shadow') expect(move.weight).toBeGreaterThan(shadow?.weight ?? 0);
    }
    expect(shadow?.condition).toEqual({ maxHpRatio: 0.5 });
  });
});

describe('P1 單體（§68）', () => {
  it('首招屬 P1 招池且帶正確參數；攻擊期滿回 idle', () => {
    const fsm = createPrismixFsm({ rng: createSeededRng(1) });
    const commands = drain(fsm, 6);
    const pool = ['pillar', 'beam'];
    const attacks = commands.filter((c) => c.kind !== 'idle');
    expect(attacks.length).toBeGreaterThan(0);
    for (const attack of attacks) expect(pool).toContain(attack.kind);
    const pillar = attacks.find((c) => c.kind === 'pillar');
    if (pillar?.kind === 'pillar') expect(pillar.count).toBe(PRISMIX.pillarCount);
    // 攻擊與 idle 交替：偶數位攻擊、奇數位 idle。
    expect(commands.filter((c) => c.kind === 'idle').length).toBeGreaterThan(0);
  });

  it('每損 10 HP 掉補給小怪（§26 飢荒保證律）', () => {
    const fsm = createPrismixFsm();
    expect(eventKinds(fsm.takeDamage(5))).toEqual(['damaged']);
    expect(eventKinds(fsm.takeDamage(5))).toEqual(['damaged', 'minionDrop']);
  });

  it('總血 ≤66% 觸發分裂：剩餘均分為雙獨立血條、循環切 P2', () => {
    const fsm = createPrismixFsm({ rng: createSeededRng(2) });
    const events = fsm.takeDamage(28);
    expect(eventKinds(events)).toEqual(['damaged', 'minionDrop', 'minionDrop', 'phase', 'split']);
    const split = events.find((e) => e.kind === 'split');
    if (split?.kind !== 'split') throw new Error('缺 split 事件');
    expect(split.hpA + split.hpB).toBe(52);
    expect(Math.abs(split.hpA - split.hpB)).toBeLessThanOrEqual(1);
    expect(fsm.twins).toEqual({ a: 26, b: 26 });
    expect(fsm.hp).toBe(52);
    const pool = prismixMoveTable('p2').map((m) => m.action);
    expect(pool).toContain(drain(fsm, 1)[0]?.kind);
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
    const pool = prismixMoveTable('p3').map((m) => m.action);
    for (const command2 of drain(fsm, 4)) {
      expect(['idle', ...pool]).toContain(command2.kind);
    }
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
    const fsm = splitFsm(3);
    expect(fsm.interruptSummon()).toBe(false);
    expect(driveTo(fsm, 'summon')).not.toBeNull();
    expect(fsm.state).toBe('summon');
    expect(fsm.interruptSummon()).toBe(true);
    expect(fsm.state).toBe('idle');
  });
});

describe('鏡界反射（§5 W2）', () => {
  it('開鏡側受擊零傷折返 reflect 事件；另一具照常結算（反制）', () => {
    const fsm = splitFsm(5);
    const mirror = driveTo(fsm, 'mirror');
    if (mirror?.kind !== 'mirror') throw new Error('未抽到開鏡');
    expect(mirror.durationMs).toBe(PRISMIX.mirrorDurationMs);
    expect(fsm.state).toBe('mirror');
    const before = fsm.twins;
    const reflected = fsm.takeDamage(5, mirror.side);
    expect(reflected).toEqual([{ kind: 'reflect', side: mirror.side }]);
    expect(fsm.twins).toEqual(before);
    // 反制：窗內打另一具照常扣血。
    const other = mirror.side === 'a' ? 'b' : 'a';
    const events = fsm.takeDamage(5, other);
    expect(eventKinds(events)).toContain('damaged');
  });

  it('開鏡窗期滿恢復可傷（0.8s 固定不隨狂暴縮放）', () => {
    const fsm = splitFsm(5);
    const mirror = driveTo(fsm, 'mirror');
    if (mirror?.kind !== 'mirror') throw new Error('未抽到開鏡');
    fsm.tick(PRISMIX.mirrorDurationMs);
    expect(fsm.state).toBe('idle');
    const events = fsm.takeDamage(5, mirror.side);
    expect(eventKinds(events)).toContain('damaged');
  });
});

describe('鏡像殘影（§5 W2 HP 帶條件）', () => {
  it('總血 >50% 不入池；≤50% 深段抽得到 shadow 指令', () => {
    // 分裂後 52/80 = 65% > 50%：長時序列不得出現 shadow。
    const high = splitFsm(7);
    const highKinds = collectAttacks(high, 40).map((c) => c.kind);
    expect(highKinds).not.toContain('shadow');
    // 打到 39/80 = 48.75% ≤ 50%：shadow 入池（低頻 w1，長序列必然出現）。
    const low = splitFsm(7);
    low.takeDamage(13, 'a');
    const lowKinds = collectAttacks(low, 60).map((c) => c.kind);
    expect(lowKinds).toContain('shadow');
  });
});

describe('加權選招治理（§5 去背板）', () => {
  it('同 seed 可完整重放；不同 seed 序列偏離', () => {
    const run = (seed: number): string[] => {
      const fsm = createPrismixFsm({ rng: createSeededRng(seed) });
      return collectAttacks(fsm, 20).map((c) => c.kind);
    };
    expect(run(11)).toEqual(run(11));
    // 舊固定循環：P1 pillar→beam 交替。
    const legacy = Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? 'pillar' : 'beam'));
    expect(run(11)).not.toEqual(legacy);
  });

  it('連續同招上限 2：長時序列無三連同招', () => {
    const fsm = createPrismixFsm({ rng: createSeededRng(4) });
    const kinds = collectAttacks(fsm, 60).map((c) => c.kind);
    for (let i = 2; i < kinds.length; i += 1) {
      expect(new Set(kinds.slice(i - 2, i + 1)).size).toBeGreaterThan(1);
    }
  });

  it('招式序列條件熵 ≥ 門檻（#813；AUDIT_THRESHOLDS.moveEntropyMinBits 口徑）', () => {
    const fsm = createPrismixFsm({ rng: createSeededRng(13) });
    const kinds = collectAttacks(fsm, 60).map((c) => c.kind);
    expect(kinds.length).toBeGreaterThanOrEqual(40);
    expect(sequenceEntropyBits(kinds)).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.moveEntropyMinBits);
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

  it('非 EX 迴歸：P3 歸零直接擊破、雙子連破直接擊破（無 P4）', () => {
    const fsm = splitFsm();
    fsm.takeDamage(26, 'a');
    fsm.tick(PRISMIX.struggleMs);
    expect(fsm.phase).toBe('p3');
    const events = fsm.takeDamage(999);
    expect(eventKinds(events)).toContain('defeated');
    expect(eventKinds(events)).not.toContain('rebirth');
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

// 造出 EX P3：分裂 → 單具擊破 → 掙扎窗期滿合體。
function exP3Fsm(seed = 1): ReturnType<typeof createPrismixFsm> {
  const fsm = createPrismixFsm({ ex: true, rng: createSeededRng(seed) });
  fsm.takeDamage(30);
  expect(fsm.phase).toBe('p2');
  fsm.takeDamage(45, 'a');
  fsm.tick(EX_PRISMIX.struggleMs);
  expect(fsm.phase).toBe('p3');
  return fsm;
}

describe('EX P4 裂核殘響（§114 #814）', () => {
  it('EX P3 歸零不死：rebirth 事件、入 P4、第二血條滿灌（maxHp 換刻度）', () => {
    const fsm = exP3Fsm();
    const events = fsm.takeDamage(999);
    expect(eventKinds(events)).toContain('rebirth');
    expect(eventKinds(events)).not.toContain('defeated');
    expect(fsm.defeated).toBe(false);
    expect(fsm.phase).toBe('p4');
    const rebirthHp = Math.round(120 * EX_PRISMIX.rebirthHpRatio);
    expect(fsm.hp).toBe(rebirthHp);
    expect(fsm.maxHp).toBe(rebirthHp);
    expect(fsm.twins).toBeNull();
  });

  it('P4 歸零才真擊破（僅可重生一次）', () => {
    const fsm = exP3Fsm();
    fsm.takeDamage(999);
    expect(fsm.phase).toBe('p4');
    const events = fsm.takeDamage(999);
    expect(eventKinds(events)).toContain('defeated');
    expect(eventKinds(events)).not.toContain('rebirth');
    expect(fsm.defeated).toBe(true);
  });

  it('EX 雙子連破：彩蛋保留、跳過 P3 直入 P4（跳段不跳王）', () => {
    const fsm = createPrismixFsm({ ex: true, rng: createSeededRng(2) });
    fsm.takeDamage(30);
    fsm.takeDamage(45, 'a');
    fsm.tick(EX_PRISMIX.struggleMs - 50);
    const events = fsm.takeDamage(45, 'b');
    expect(eventKinds(events)).toContain('twinFinish');
    expect(eventKinds(events)).toContain('rebirth');
    expect(eventKinds(events)).not.toContain('defeated');
    expect(fsm.phase).toBe('p4');
    expect(fsm.defeated).toBe(false);
  });

  it('P4 招池對表：sweep/barrage/rain；sweep 指令帶起掃側且同 seed 可重放', () => {
    expect(prismixMoveTable('p4').map((m) => m.action)).toEqual(['sweep', 'barrage', 'rain']);
    const run = (seed: number): string[] => {
      const fsm = exP3Fsm(seed);
      fsm.takeDamage(999);
      return collectAttacks(fsm, 20).map((c) => c.kind);
    };
    expect(run(7)).toEqual(run(7));
    const fsm = exP3Fsm(3);
    fsm.takeDamage(999);
    const sweep = driveTo(fsm, 'sweep');
    if (sweep?.kind !== 'sweep') throw new Error('未抽到行牆');
    expect([1, -1]).toContain(sweep.dir);
  });

  it('anti-softlock：P4 供彈保證律延續（每 10 傷 minionDrop）', () => {
    const fsm = exP3Fsm();
    fsm.takeDamage(999);
    const events = [...fsm.takeDamage(5), ...fsm.takeDamage(5)];
    expect(eventKinds(events)).toContain('minionDrop');
  });

  it('公平性下限：行牆 telegraph ≥600ms、牆高留跳越裕度（jump+拍翅可越）', () => {
    expect(EX_PRISMIX.sweepTelegraphMs).toBeGreaterThanOrEqual(600);
    // 牆高必須低於滿拍翅淨高並留 ≥60px 裕度（技巧required 但非死牆）。
    expect(EX_PRISMIX.sweepWallHeightPx).toBeLessThanOrEqual(maxJumpClearancePx() - 60);
  });
});
