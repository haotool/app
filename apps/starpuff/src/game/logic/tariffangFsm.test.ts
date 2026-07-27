import { describe, expect, it } from 'vitest';
import { EX_MODS } from './bossFsm';
import { AUDIT_THRESHOLDS, sequenceEntropyBits } from './difficulty';
import { createSeededRng } from './moveTable';
import {
  EX_TARIFFANG,
  TARIFFANG,
  createTariffangFsm,
  tariffangMoveTable,
  type TariffangCommand,
} from './tariffangFsm';

// 關稅巨獸 Tariffang FSM（GAME_DESIGN §122）：星港海關三階段——P1 貨物稽查、
// P2 加收費用（命中即生追蹤稅票）、P3 全面封關（閘門＋衝撞）；hit window = idle 僵直。

const driveTo = (
  fsm: ReturnType<typeof createTariffangFsm>,
  kind: TariffangCommand['kind'],
): TariffangCommand | null => {
  for (let i = 0; i < 5000; i += 1) {
    const command = fsm.tick(50);
    if (command?.kind === kind) return command;
  }
  return null;
};

const collectAttacks = (fsm: ReturnType<typeof createTariffangFsm>, count: number) => {
  const commands: TariffangCommand[] = [];
  for (let i = 0; i < 8000 && commands.length < count; i += 1) {
    const command = fsm.tick(50);
    if (command && command.kind !== 'idle') commands.push(command);
  }
  return commands;
};

describe('Tariffang 三階段加權表（§122）', () => {
  it('HP 112 接續終局章階梯（>110）；三階段招池對表', () => {
    const fsm = createTariffangFsm();
    expect(fsm.maxHp).toBe(112);
    expect(TARIFFANG.maxHp).toBeGreaterThan(110);
    expect(tariffangMoveTable('p1').map((m) => m.action)).toEqual(['cargo', 'stamp']);
    expect(tariffangMoveTable('p2').map((m) => m.action)).toEqual(['cargo', 'stamp', 'levy']);
    expect(tariffangMoveTable('p3').map((m) => m.action)).toEqual(['gate', 'ram', 'levy']);
  });

  it('衝撞限遠距帶（§111.1 條件欄：貼身衝撞不可讀）；近距帶不出 ram', () => {
    const ram = tariffangMoveTable('p3').find((m) => m.action === 'ram');
    expect(ram?.condition).toEqual({ band: 'far' });
    const fsm = createTariffangFsm({ rng: createSeededRng(1) });
    fsm.takeDamage(76);
    expect(fsm.phase).toBe('p3');
    fsm.setTargetDistance(120);
    const kinds = collectAttacks(fsm, 10).map((c) => c.kind);
    expect(kinds).not.toContain('ram');
    // 未餵送距離視為 far：ram 可入池。
    const farFsm = createTariffangFsm({ rng: createSeededRng(1) });
    farFsm.takeDamage(76);
    const farKinds = collectAttacks(farFsm, 14).map((c) => c.kind);
    expect(farKinds).toContain('ram');
  });

  it('P1 貨櫃單側 ×1、P2 起 ×2；一般模式恆單側（bothSides false 可背板）', () => {
    const fsm = createTariffangFsm({ rng: createSeededRng(2) });
    const p1Cargo = driveTo(fsm, 'cargo');
    expect(p1Cargo?.kind).toBe('cargo');
    if (p1Cargo?.kind === 'cargo') {
      expect(p1Cargo.count).toBe(TARIFFANG.cargoCountP1);
      expect(p1Cargo.bothSides).toBe(false);
    }
    fsm.takeDamage(39);
    expect(fsm.phase).toBe('p2');
    const p2Cargo = driveTo(fsm, 'cargo');
    if (p2Cargo?.kind === 'cargo') expect(p2Cargo.count).toBe(TARIFFANG.cargoCountP2);
  });

  it('傷害驅動 P1→P2（≤66%）與 P2→P3（≤33%）；phase 事件依序帶出', () => {
    const fsm = createTariffangFsm();
    let events = fsm.takeDamage(39);
    expect(fsm.phase).toBe('p2');
    expect(events.some((e) => e.kind === 'phase' && e.phase === 'p2')).toBe(true);
    events = fsm.takeDamage(37);
    expect(fsm.phase).toBe('p3');
    expect(events.some((e) => e.kind === 'phase' && e.phase === 'p3')).toBe(true);
  });

  it('P3 封關指令帶駐留時長；查帳指令帶稅票數', () => {
    const fsm = createTariffangFsm({ rng: createSeededRng(3) });
    fsm.takeDamage(76);
    const gate = driveTo(fsm, 'gate');
    expect(gate).not.toBeNull();
    if (gate?.kind === 'gate') expect(gate.holdMs).toBe(TARIFFANG.gateHoldMs);
    const levy = driveTo(fsm, 'levy');
    expect(levy).not.toBeNull();
    if (levy?.kind === 'levy') expect(levy.count).toBe(TARIFFANG.levyTicketCount);
  });

  it('擊破：hp 歸零鎖存 defeated，之後 tick 無指令且再受擊無事件（冪等）', () => {
    const fsm = createTariffangFsm();
    const events = fsm.takeDamage(112);
    expect(events.some((e) => e.kind === 'defeated')).toBe(true);
    expect(fsm.defeated).toBe(true);
    expect(fsm.tick(5000)).toBeNull();
    expect(fsm.takeDamage(10)).toEqual([]);
  });

  it('供彈保證律（§26）：每損 10 HP 掉補給小怪事件', () => {
    const fsm = createTariffangFsm();
    const events = fsm.takeDamage(25);
    expect(events.filter((e) => e.kind === 'minionDrop').length).toBe(2);
  });

  it('狂暴節奏：P2/P3 speedFactor ×1.15；僵直窗固定不縮短', () => {
    const fsm = createTariffangFsm();
    expect(fsm.speedFactor).toBe(1);
    fsm.takeDamage(39);
    expect(fsm.speedFactor).toBeCloseTo(TARIFFANG.enrageSpeedMultiplier, 5);
    // 進 P2 後首個指令出現時間＝idle 實長；狂暴若誤縮會落在 ≈1565ms。
    let elapsed = 0;
    let firstCommandAt = -1;
    while (elapsed < 3000 && firstCommandAt < 0) {
      const command = fsm.tick(50);
      elapsed += 50;
      if (command) firstCommandAt = elapsed;
    }
    expect(firstCommandAt).toBeGreaterThanOrEqual(TARIFFANG.idleMs.p2);
    expect(firstCommandAt).toBeLessThanOrEqual(TARIFFANG.idleMs.p2 + 100);
  });
});

describe('P2 被動加收（§122 主題機制：命中即生追蹤稅票）', () => {
  it('P1/P3 不加收；P2 期加收且冷卻節流', () => {
    const fsm = createTariffangFsm();
    expect(fsm.tryTax()).toBe(false);
    fsm.takeDamage(39);
    expect(fsm.phase).toBe('p2');
    expect(fsm.tryTax()).toBe(true);
    // 冷卻內連續命中不重複加收（連射不刷屏）。
    expect(fsm.tryTax()).toBe(false);
    fsm.tick(TARIFFANG.reactiveTicketCooldownMs + 50);
    expect(fsm.tryTax()).toBe(true);
    // P3 起被動加收停用（封關段主軸換閘門/衝撞）。
    fsm.takeDamage(37);
    expect(fsm.phase).toBe('p3');
    fsm.tick(TARIFFANG.reactiveTicketCooldownMs + 50);
    expect(fsm.tryTax()).toBe(false);
  });

  it('稅票 anti-softlock 紅線：壽命有界、場上上限有界、EX 上限 +2', () => {
    expect(TARIFFANG.ticketLifeMs).toBeLessThanOrEqual(8000);
    expect(TARIFFANG.ticketCap).toBeLessThanOrEqual(6);
    expect(EX_TARIFFANG.ticketCap).toBe(TARIFFANG.ticketCap + 2);
    const fsm = createTariffangFsm({ ex: true });
    expect(fsm.ticketCap).toBe(EX_TARIFFANG.ticketCap);
  });
});

describe('頭頂短暈（§58 hit window）', () => {
  it('待機/出招期可暈（回待機停拍）；衝撞中不可暈', () => {
    const fsm = createTariffangFsm({ rng: createSeededRng(4) });
    expect(fsm.stun(TARIFFANG.slamStunMs)).toBe(true);
    expect(fsm.state).toBe('idle');
    // 驅動至 ram 態：暈眩應被拒絕（高速位移期強行停拍會凍在半途）。
    fsm.takeDamage(76);
    const ram = driveTo(fsm, 'ram');
    expect(ram).not.toBeNull();
    expect(fsm.state).toBe('ram');
    expect(fsm.stun(TARIFFANG.slamStunMs)).toBe(false);
  });
});

describe('加權選招治理（§111.1 去背板）', () => {
  it('同 seed 可完整重放；連續同招上限 2', () => {
    const run = (seed: number): string[] => {
      const fsm = createTariffangFsm({ rng: createSeededRng(seed) });
      return collectAttacks(fsm, 16).map((c) => c.kind);
    };
    expect(run(9)).toEqual(run(9));
    const kinds = run(6);
    for (let i = 2; i < kinds.length; i += 1) {
      expect(new Set(kinds.slice(i - 2, i + 1)).size).toBeGreaterThan(1);
    }
  });

  it('招式序列條件熵 ≥ 門檻（#813；AUDIT_THRESHOLDS.moveEntropyMinBits 口徑）', () => {
    const fsm = createTariffangFsm({ rng: createSeededRng(13) });
    const kinds = collectAttacks(fsm, 60).map((c) => c.kind);
    expect(kinds.length).toBeGreaterThanOrEqual(40);
    expect(sequenceEntropyBits(kinds)).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.moveEntropyMinBits);
  });
});

describe('可讀性與 EX 差分紅線', () => {
  it('全招式 telegraph ≥600ms（可讀性紅線）', () => {
    for (const ms of [
      TARIFFANG.cargoTelegraphMs,
      TARIFFANG.stampTelegraphMs,
      TARIFFANG.levyTelegraphMs,
      TARIFFANG.gateTelegraphMs,
      TARIFFANG.ramTelegraphMs,
    ]) {
      expect(ms).toBeGreaterThanOrEqual(600);
    }
  });

  it('EX 差分：HP ×1.5（168）、貨櫃雙向同時、telegraph 不縮', () => {
    const fsm = createTariffangFsm({ ex: true, rng: createSeededRng(8) });
    expect(fsm.maxHp).toBe(Math.round(TARIFFANG.maxHp * EX_MODS.hpMul));
    const cargo = driveTo(fsm, 'cargo');
    expect(cargo?.kind).toBe('cargo');
    if (cargo?.kind === 'cargo') expect(cargo.bothSides).toBe(true);
  });

  it('封關 anti-softlock：閘門駐留有界（≤2.5s，中央走廊恆開由呈現層幾何保證）', () => {
    expect(TARIFFANG.gateHoldMs).toBeLessThanOrEqual(2500);
  });
});
