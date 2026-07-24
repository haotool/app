import { describe, expect, it } from 'vitest';
import { EX_MODS } from './bossFsm';
import { AUDIT_THRESHOLDS, sequenceEntropyBits } from './difficulty';
import { createSeededRng } from './moveTable';
import {
  EX_SYRONA,
  SYRONA,
  createSyronaFsm,
  isCrownHit,
  syronaMoveTable,
  type SyronaCommand,
} from './syronaFsm';

// 熔糖窯后 Syrona FSM（GAME_DESIGN §74/§112）：場控型三階段——本體半定點，威脅來自
// 地形改寫（潮汐/噴泉/滴落）；hit window = 招式後 idle 僵直（散熱/吟唱/波後）。

// 驅動至指定指令出現，回傳該指令；逾迭代上限回 null。
const driveTo = (
  fsm: ReturnType<typeof createSyronaFsm>,
  kind: SyronaCommand['kind'],
): SyronaCommand | null => {
  for (let i = 0; i < 5000; i += 1) {
    const command = fsm.tick(50);
    if (command?.kind === kind) return command;
  }
  return null;
};

// 收集非 idle 指令直到數量滿足。
const collectAttacks = (fsm: ReturnType<typeof createSyronaFsm>, count: number) => {
  const commands: SyronaCommand[] = [];
  for (let i = 0; i < 8000 && commands.length < count; i += 1) {
    const command = fsm.tick(50);
    if (command && command.kind !== 'idle') commands.push(command);
  }
  return commands;
};

describe('Syrona 三階段加權表（§74/§112）', () => {
  it('HP 90 階梯（60→52→80→90）；三階段招池對表', () => {
    const fsm = createSyronaFsm();
    expect(fsm.maxHp).toBe(90);
    expect(SYRONA.maxHp).toBeGreaterThan(80);
    expect(syronaMoveTable('p1').map((m) => m.action)).toEqual(['fountain', 'lob']);
    expect(syronaMoveTable('p2').map((m) => m.action)).toEqual(['drip', 'fountain', 'summon']);
    expect(syronaMoveTable('p3').map((m) => m.action)).toEqual(['wave', 'overload']);
  });

  it('射彈限遠距帶（§5 條件欄：貼身拋物不可讀）；近距帶只出噴泉', () => {
    const lob = syronaMoveTable('p1').find((m) => m.action === 'lob');
    expect(lob?.condition).toEqual({ band: 'far' });
    // 近距帶：lob 被條件剔除，序列僅剩噴泉。
    const fsm = createSyronaFsm({ rng: createSeededRng(1) });
    fsm.setTargetDistance(120);
    const kinds = collectAttacks(fsm, 8).map((c) => c.kind);
    expect(kinds).not.toContain('lob');
    // 未餵送距離視為 far：lob 可入池。
    const farFsm = createSyronaFsm({ rng: createSeededRng(1) });
    const farKinds = collectAttacks(farFsm, 12).map((c) => c.kind);
    expect(farKinds).toContain('lob');
  });

  it('P1 招池指令：噴泉固定升序（可背板）、射彈帶 count', () => {
    const fsm = createSyronaFsm({ rng: createSeededRng(2) });
    const fountain = driveTo(fsm, 'fountain');
    if (fountain?.kind === 'fountain') expect(fountain.order).toEqual([0, 1, 2]);
    const lob = driveTo(fsm, 'lob');
    if (lob?.kind === 'lob') expect(lob.count).toBe(SYRONA.lobCount);
    expect(fountain).not.toBeNull();
    expect(lob).not.toBeNull();
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

  it('P2 招池出滴落/召喚/加密噴泉；召喚上限 2', () => {
    const fsm = createSyronaFsm({ rng: createSeededRng(3) });
    fsm.takeDamage(31);
    const kinds = collectAttacks(fsm, 30).map((c) => c.kind);
    expect(kinds).toContain('drip');
    expect(kinds).toContain('summon');
    expect(kinds).toContain('fountain');
    const fsm2 = createSyronaFsm({ rng: createSeededRng(3) });
    fsm2.takeDamage(31);
    const summon = driveTo(fsm2, 'summon');
    if (summon?.kind === 'summon') expect(summon.cap).toBe(SYRONA.summonCap);
    const fsm3 = createSyronaFsm({ rng: createSeededRng(3) });
    fsm3.takeDamage(31);
    const fountain = driveTo(fsm3, 'fountain');
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

  it('P3 招池：糖漿波（焦糖化載體）與噴口超載均可抽出（審查修復）', () => {
    const fsm = createSyronaFsm({ rng: createSeededRng(4) });
    fsm.takeDamage(31);
    fsm.takeDamage(30);
    expect(fsm.phase).toBe('p3');
    expect(driveTo(fsm, 'wave')).not.toBeNull();
    const overload = driveTo(fsm, 'overload');
    expect(overload).not.toBeNull();
    if (overload?.kind === 'overload') expect(overload.durationMs).toBeGreaterThan(0);
  });
});

describe('加權選招治理（§5 去背板）', () => {
  it('同 seed 可完整重放；不同於舊固定循環', () => {
    const run = (seed: number): string[] => {
      const fsm = createSyronaFsm({ rng: createSeededRng(seed) });
      return collectAttacks(fsm, 16).map((c) => c.kind);
    };
    expect(run(9)).toEqual(run(9));
    // 舊固定循環：P1 fountain→lob 交替。
    const legacy = Array.from({ length: 16 }, (_, i) => (i % 2 === 0 ? 'fountain' : 'lob'));
    expect(run(9)).not.toEqual(legacy);
  });

  it('連續同招上限 2：長時序列無三連同招', () => {
    const fsm = createSyronaFsm({ rng: createSeededRng(6) });
    const kinds = collectAttacks(fsm, 40).map((c) => c.kind);
    for (let i = 2; i < kinds.length; i += 1) {
      expect(new Set(kinds.slice(i - 2, i + 1)).size).toBeGreaterThan(1);
    }
  });

  it('招式序列條件熵 ≥ 門檻（#813；AUDIT_THRESHOLDS.moveEntropyMinBits 口徑）', () => {
    const fsm = createSyronaFsm({ rng: createSeededRng(13) });
    const kinds = collectAttacks(fsm, 60).map((c) => c.kind);
    expect(kinds.length).toBeGreaterThanOrEqual(40);
    expect(sequenceEntropyBits(kinds)).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.moveEntropyMinBits);
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
    const fsm = createSyronaFsm({ rng: createSeededRng(2) });
    const fountain = driveTo(fsm, 'fountain');
    expect(fountain?.kind).toBe('fountain');
    if (fountain?.kind === 'fountain') expect(fountain.order).toEqual([0, 1, 2]);
  });

  it('EX 模式每循環洗牌出序（同 seed 可重現、非恆升序）', () => {
    const fsm = createSyronaFsm({ ex: true, rng: createSeededRng(8) });
    const fountain = driveTo(fsm, 'fountain');
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

describe('EX P4 窯心暴走（§8.2 #814 W2）', () => {
  // EX 135：打至 hp 21（>135×0.15=20.25）停在 P3 暴走前緣。
  const toRampageEdge = (): ReturnType<typeof createSyronaFsm> => {
    const fsm = createSyronaFsm({ ex: true, rng: createSeededRng(5) });
    fsm.takeDamage(114);
    expect(fsm.phase).toBe('p3');
    expect(fsm.hp).toBe(21);
    return fsm;
  };

  it('EX：P3 血量跌破 15% 入 P4 暴走（phase 事件帶出）', () => {
    const fsm = toRampageEdge();
    const events = fsm.takeDamage(1);
    expect(events.some((e) => e.kind === 'phase' && e.phase === 'p4')).toBe(true);
    expect(fsm.phase).toBe('p4');
    expect(fsm.defeated).toBe(false);
  });

  it('P4 皇冠唯一可傷點：體傷歸零無事件、皇冠傷照常結算', () => {
    const fsm = toRampageEdge();
    fsm.takeDamage(1);
    const before = fsm.hp;
    expect(fsm.takeDamage(5, false)).toEqual([]);
    expect(fsm.hp).toBe(before);
    const events = fsm.takeDamage(5, true);
    expect(events.some((e) => e.kind === 'damaged')).toBe(true);
    expect(fsm.hp).toBe(before - 5);
  });

  it('P4 皇冠傷歸零真擊破；供彈保證律於暴走段延續', () => {
    const fsm = toRampageEdge();
    fsm.takeDamage(1);
    const drops = fsm.takeDamage(10, true);
    expect(drops.some((e) => e.kind === 'minionDrop')).toBe(true);
    const events = fsm.takeDamage(999, true);
    expect(events.some((e) => e.kind === 'defeated')).toBe(true);
    expect(fsm.defeated).toBe(true);
  });

  it('非 EX 迴歸：跌破 15% 不入 P4、體傷可正常擊破', () => {
    const fsm = createSyronaFsm({ rng: createSeededRng(6) });
    fsm.takeDamage(80);
    expect(fsm.phase).toBe('p3');
    expect(fsm.hp).toBeLessThanOrEqual(Math.round(90 * 0.15));
    expect(fsm.phase).toBe('p3');
    const events = fsm.takeDamage(999);
    expect(events.some((e) => e.kind === 'defeated')).toBe(true);
  });

  it('暴走沸騰紅線：閾值 15%、沸騰漲頂不淹沒高台保底位（anti-softlock）', () => {
    expect(EX_SYRONA.rampageHpRatio).toBe(0.15);
    // 漲頂（y 越小越高）必須低於最高浮台（304）——恆留一格立足保底。
    const rampageTopY = SYRONA.tideMaxY + EX_SYRONA.rampageBoilMaxYDeltaPx;
    expect(rampageTopY).toBeGreaterThan(Math.min(...SYRONA.arenaPlatformYs));
    // 暴走週期較 P3 大沸騰更急（EX boil 之下再收短）。
    expect(EX_SYRONA.rampageBoilPeriodMul).toBeLessThan(EX_SYRONA.boilPeriodMul);
  });
});
