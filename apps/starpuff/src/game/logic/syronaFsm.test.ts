import { describe, expect, it } from 'vitest';
import { EX_MODS } from './bossFsm';
import { EX_SYRONA, SYRONA, createSyronaFsm, isCrownHit, syronaAttackCycle } from './syronaFsm';

// 熔糖窯后 Syrona FSM（GAME_DESIGN §74）：場控型三階段——本體半定點，威脅來自
// 地形改寫（潮汐/噴泉/滴落）；hit window = 招式後 idle 僵直（散熱/吟唱/波後）。

const drain = (fsm: ReturnType<typeof createSyronaFsm>, ms: number) => {
  const commands = [];
  let left = ms;
  while (left > 0) {
    const step = Math.min(50, left);
    const command = fsm.tick(step);
    if (command) commands.push(command);
    left -= step;
  }
  return commands;
};

describe('Syrona 三階段循環（§74）', () => {
  it('HP 90 階梯（60→52→80→90）；P1 循環為噴泉→射彈', () => {
    const fsm = createSyronaFsm();
    expect(fsm.maxHp).toBe(90);
    expect(SYRONA.maxHp).toBeGreaterThan(80);
    expect(syronaAttackCycle('p1')).toEqual(['fountain', 'lob']);
    expect(syronaAttackCycle('p2')).toEqual(['drip', 'summon', 'fountain']);
    expect(syronaAttackCycle('p3')).toEqual(['wave', 'overload']);
  });

  it('P1 首循環：idle 期滿出噴泉指令（固定升序），再 idle 後出射彈', () => {
    const fsm = createSyronaFsm();
    const commands = drain(fsm, 10000);
    const kinds = commands.map((c) => c.kind);
    expect(kinds[0]).toBe('fountain');
    const fountain = commands[0];
    if (fountain?.kind === 'fountain') {
      expect(fountain.order).toEqual([0, 1, 2]);
    }
    expect(kinds).toContain('lob');
  });

  it('傷害驅動 P1→P2（≤66%）與 P2→P3（≤33%）；phase 事件依序帶出', () => {
    const fsm = createSyronaFsm();
    let events = fsm.takeDamage(31);
    expect(fsm.phase).toBe('p2');
    expect(events.some((e) => e.kind === 'phase' && e.phase === 'p2')).toBe(true);
    events = fsm.takeDamage(30);
    expect(fsm.phase).toBe('p3');
    expect(events.some((e) => e.kind === 'phase' && e.phase === 'p3')).toBe(true);
  });

  it('P2 循環出滴落→召喚→加密噴泉；召喚上限 2', () => {
    const fsm = createSyronaFsm();
    fsm.takeDamage(31);
    const commands = drain(fsm, 14000);
    const kinds = commands.map((c) => c.kind);
    expect(kinds).toContain('drip');
    expect(kinds).toContain('summon');
    const summon = commands.find((c) => c.kind === 'summon');
    if (summon?.kind === 'summon') expect(summon.cap).toBe(SYRONA.summonCap);
    const fountain = commands.find((c) => c.kind === 'fountain');
    if (fountain?.kind === 'fountain') {
      expect(fountain.order.length).toBe(SYRONA.fountainDenseCount);
    }
  });

  it('擊破：hp 歸零鎖存 defeated，之後 tick 無指令且再受擊無事件（冪等）', () => {
    const fsm = createSyronaFsm();
    const events = fsm.takeDamage(90);
    expect(events.some((e) => e.kind === 'defeated')).toBe(true);
    expect(fsm.defeated).toBe(true);
    expect(fsm.tick(5000)).toBeNull();
    expect(fsm.takeDamage(10)).toEqual([]);
  });

  it('供彈保證律（§26）：每損 10 HP 掉補給小怪事件', () => {
    const fsm = createSyronaFsm();
    const events = fsm.takeDamage(25);
    expect(events.filter((e) => e.kind === 'minionDrop').length).toBe(2);
  });

  it('狂暴節奏：P2/P3 speedFactor ×1.15', () => {
    const fsm = createSyronaFsm();
    expect(fsm.speedFactor).toBe(1);
    fsm.takeDamage(31);
    expect(fsm.speedFactor).toBeCloseTo(SYRONA.enrageSpeedMultiplier, 5);
  });

  it('hit window（僵直窗）：P1 散熱 2.5s、P2 吟唱 2.0s、P3 波後 2.0s 均 ≥2s', () => {
    expect(SYRONA.idleMs.p1).toBeGreaterThanOrEqual(2000);
    expect(SYRONA.idleMs.p2).toBeGreaterThanOrEqual(2000);
    expect(SYRONA.idleMs.p3).toBeGreaterThanOrEqual(2000);
  });

  it('僵直窗＝固定輸出窗：P2 狂暴下 idle 實長仍為 2000ms 不縮短（審查修復）', () => {
    const fsm = createSyronaFsm();
    fsm.takeDamage(31);
    expect(fsm.phase).toBe('p2');
    // 進 P2 後首個指令出現時間＝idle 實長；狂暴若誤縮會落在 ≈1739ms。
    let elapsed = 0;
    let firstCommandAt = -1;
    while (elapsed < 3000 && firstCommandAt < 0) {
      const command = fsm.tick(50);
      elapsed += 50;
      if (command) firstCommandAt = elapsed;
    }
    expect(firstCommandAt).toBeGreaterThanOrEqual(SYRONA.idleMs.p2);
    expect(firstCommandAt).toBeLessThanOrEqual(SYRONA.idleMs.p2 + 100);
  });

  it('P3 自然循環：糖漿波與噴口超載依序出現（審查修復）', () => {
    const fsm = createSyronaFsm();
    fsm.takeDamage(31);
    fsm.takeDamage(30);
    expect(fsm.phase).toBe('p3');
    const commands = drain(fsm, 16000);
    const kinds = commands.map((c) => c.kind);
    expect(kinds).toContain('wave');
    expect(kinds).toContain('overload');
    const overload = commands.find((c) => c.kind === 'overload');
    if (overload?.kind === 'overload') expect(overload.durationMs).toBeGreaterThan(0);
  });
});

describe('皇冠弱點帶（§74 isCrownHit，審查修復）', () => {
  it('頂帶內命中為皇冠（×2 傷由呈現層結算），帶下為常規', () => {
    const bodyTop = 255;
    expect(isCrownHit(bodyTop, bodyTop)).toBe(true);
    expect(isCrownHit(bodyTop + 34, bodyTop)).toBe(true);
    expect(isCrownHit(bodyTop + 35, bodyTop)).toBe(false);
    expect(isCrownHit(bodyTop - 10, bodyTop)).toBe(true);
  });
});

describe('噴泉洗牌 seed 注入（§74 EX 質性差分）', () => {
  it('一般模式噴泉恆為固定升序（讀招可背板）', () => {
    const fsm = createSyronaFsm({ rng: () => 0.99 });
    const commands = drain(fsm, 10000);
    const fountain = commands.find((c) => c.kind === 'fountain');
    if (fountain?.kind === 'fountain') expect(fountain.order).toEqual([0, 1, 2]);
  });

  it('EX 模式每循環洗牌出序（同 seed 可重現、非恆升序）', () => {
    let calls = 0;
    const rng = () => {
      calls += 1;
      return (calls * 0.37) % 1;
    };
    const fsm = createSyronaFsm({ ex: true, rng });
    const commands = drain(fsm, 12000);
    const fountain = commands.find((c) => c.kind === 'fountain');
    expect(fountain?.kind).toBe('fountain');
    if (fountain?.kind === 'fountain') {
      // EX 噴泉 ×5；洗牌序為 0..4 的全排列。
      expect(fountain.order.length).toBe(EX_SYRONA.fountainCount);
      expect([...fountain.order].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
    }
  });

  it('EX 差分：HP ×1.5（135）、Bubbla 上限 3、滴落點 6、大沸騰潮汐再 -25%', () => {
    const fsm = createSyronaFsm({ ex: true });
    expect(fsm.maxHp).toBe(Math.round(SYRONA.maxHp * EX_MODS.hpMul));
    expect(EX_SYRONA.summonCap).toBe(3);
    expect(EX_SYRONA.dripCount).toBe(6);
    expect(EX_SYRONA.boilPeriodMul).toBeCloseTo(SYRONA.boilPeriodMul * 0.75, 5);
  });
});

describe('場控保底位不變式（§74：每循環必留 ≥1 保底位）', () => {
  it('P2 漲頂下全部浮台可站；大沸騰後至少一座高台仍為保底位', () => {
    // 浮台中心 y 幾何：頂 = y - 8（平台高 16）；台頂需高於水面 ≥24px。
    for (const platformY of SYRONA.arenaPlatformYs) {
      expect(platformY - 8).toBeLessThanOrEqual(SYRONA.tideMaxY - 24);
    }
    const boiledMaxY = SYRONA.tideMaxY + SYRONA.boilMaxYDeltaPx;
    const highest = Math.min(...SYRONA.arenaPlatformYs);
    expect(highest - 8).toBeLessThanOrEqual(boiledMaxY - 24);
  });

  it('大沸騰潮汐 dry-window 仍 ≥40%（EX 含 -25% 後亦成立）', () => {
    // dutyPct 不變、僅週期縮短：dry 佔比恆 = 1 - dutyPct ≥ 0.4。
    expect(SYRONA.tideDutyPct).toBeLessThanOrEqual(0.6);
    expect(SYRONA.boilPeriodMul).toBeGreaterThan(0);
    expect(EX_SYRONA.boilPeriodMul).toBeGreaterThan(0);
  });

  it('皇冠弱點倍傷 ×2（乘噴口升空打頭頂）', () => {
    expect(SYRONA.crownDamageMul).toBe(2);
  });
});
