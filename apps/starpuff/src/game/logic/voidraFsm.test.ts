import { describe, expect, it } from 'vitest';
import { STARSTORM } from '../core/config';
import { EX_MODS } from './bossFsm';
import { AUDIT_THRESHOLDS, sequenceEntropyBits } from './difficulty';
import { createSeededRng } from './moveTable';
import { STAR_SIPHON } from './starSiphon';
import {
  EX_VOIDRA,
  VOIDRA,
  VOIDRA_SURVIVAL,
  createVoidraFsm,
  voidraMoveTable,
  type VoidraCommand,
} from './voidraFsm';

// 推進至指定招式指令出現（上限步數防無限迴圈）。
function tickUntil(
  fsm: ReturnType<typeof createVoidraFsm>,
  kind: VoidraCommand['kind'],
  stepMs = 100,
  maxSteps = 2000,
): VoidraCommand | null {
  for (let i = 0; i < maxSteps; i += 1) {
    const command = fsm.tick(stepMs);
    if (command?.kind === kind) return command;
  }
  return null;
}

// 收集非 idle 攻擊指令直到數量滿足（含 siphonDrain 以外的實招）。
function collectAttacks(fsm: ReturnType<typeof createVoidraFsm>, count: number): VoidraCommand[] {
  const commands: VoidraCommand[] = [];
  for (let i = 0; i < 8000 && commands.length < count; i += 1) {
    const command = fsm.tick(50);
    if (command && command.kind !== 'idle' && command.kind !== 'siphonDrain') {
      commands.push(command);
    }
  }
  return commands;
}

describe('Voidra 常數與波次表（§82，主計畫 §6.3/§10.2-8）', () => {
  it('HP 階梯 110 > Syrona 90；閾值 70%/40%；裂核大窗 ≥3.5s', () => {
    expect(VOIDRA.maxHp).toBe(110);
    expect(VOIDRA.p2HpRatio).toBe(0.7);
    expect(VOIDRA.p3HpRatio).toBe(0.4);
    expect(VOIDRA.idleMs.p3).toBeGreaterThanOrEqual(3500);
    // 黑洞潮汐牽引上限低於玩家全速（交叉不變式 16）。
    expect(VOIDRA.crushPullPxPerSec).toBeLessThan(220);
  });

  it('波次表：40s 內時序遞增、過熱窗恰 3 次、星屑恰 5 枚、窗間不重疊', () => {
    expect(VOIDRA_SURVIVAL.durationMs).toBe(40_000);
    let prev = 0;
    for (const wave of VOIDRA_SURVIVAL.waves) {
      expect(wave.atMs).toBeGreaterThan(prev);
      expect(wave.atMs).toBeLessThan(VOIDRA_SURVIVAL.durationMs);
      prev = wave.atMs;
    }
    const overheats = VOIDRA_SURVIVAL.waves.filter((w) => w.kind === 'overheat');
    expect(overheats).toHaveLength(VOIDRA_SURVIVAL.outputWindows);
    expect(overheats).toHaveLength(3);
    expect(VOIDRA_SURVIVAL.waves.filter((w) => w.kind === 'shard')).toHaveLength(5);
    // 過熱窗彼此間隔大於窗長（輸出窗不重疊）；末窗於 40s 內完整收束。
    for (let i = 1; i < overheats.length; i += 1) {
      const prevWave = overheats[i - 1];
      const currWave = overheats[i];
      expect((currWave?.atMs ?? 0) - (prevWave?.atMs ?? 0)).toBeGreaterThan(
        VOIDRA_SURVIVAL.overheatWindowMs,
      );
    }
    const lastOverheat = overheats[overheats.length - 1];
    expect((lastOverheat?.atMs ?? 0) + VOIDRA_SURVIVAL.overheatWindowMs).toBeLessThanOrEqual(
      VOIDRA_SURVIVAL.durationMs,
    );
  });

  it('加權表招池：P1 牽引/彈環/爪擊/虹吸、P2 波次表、P3 彈幕/潮汐/虹吸（§113）', () => {
    expect(voidraMoveTable('p1').map((m) => m.action)).toEqual(['pull', 'ring', 'claw', 'siphon']);
    expect(voidraMoveTable('p2').map((m) => m.action)).toEqual(['survival']);
    expect(voidraMoveTable('p3').map((m) => m.action)).toEqual(['barrage', 'crush', 'siphon']);
    // 虹吸為低頻主題招：權重低於各階段常規招。
    for (const phase of ['p1', 'p3'] as const) {
      const table = voidraMoveTable(phase);
      const siphon = table.find((m) => m.action === 'siphon');
      expect(siphon).toBeDefined();
      for (const move of table) {
        if (move.action !== 'siphon') expect(move.weight).toBeGreaterThan(siphon?.weight ?? 0);
      }
    }
  });
});

describe('Voidra FSM：P1 王座戰', () => {
  it('攻擊全數屬 P1 招池、與 idle 僵直窗交替（加權選招 §113）', () => {
    const fsm = createVoidraFsm({ rng: createSeededRng(1) });
    const pool = ['pull', 'ring', 'claw', 'siphon'];
    const attacks = collectAttacks(fsm, 8).map((c) => c.kind);
    expect(attacks).toHaveLength(8);
    for (const kind of attacks) expect(pool).toContain(kind);
  });

  it('同 seed 完整重放；連續同招上限 2（無三連同招）', () => {
    const sequence = (seed: number): string[] =>
      collectAttacks(createVoidraFsm({ rng: createSeededRng(seed) }), 30).map((c) => c.kind);
    expect(sequence(7)).toEqual(sequence(7));
    const kinds = sequence(3);
    for (let i = 2; i < kinds.length; i += 1) {
      expect(new Set(kinds.slice(i - 2, i + 1)).size).toBeGreaterThan(1);
    }
  });

  it('招式序列條件熵 ≥ 門檻（#813 去背板；AUDIT_THRESHOLDS.moveEntropyMinBits 口徑）', () => {
    const fsm = createVoidraFsm({ rng: createSeededRng(13) });
    const kinds = collectAttacks(fsm, 60).map((c) => c.kind);
    expect(kinds.length).toBeGreaterThanOrEqual(40);
    expect(sequenceEntropyBits(kinds)).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.moveEntropyMinBits);
  });

  it('P3 招式序列條件熵 ≥ 門檻（§113.1 記載口徑：seed 13 × 60 招 ≈ 1.38 bits）', () => {
    const fsm = createVoidraFsm({ rng: createSeededRng(13) });
    fsm.takeDamage(33);
    tickUntil(fsm, 'overheat', 100);
    fsm.takeDamage(40);
    expect(fsm.phase).toBe('p3');
    const kinds = collectAttacks(fsm, 60).map((c) => c.kind);
    expect(kinds.length).toBeGreaterThanOrEqual(40);
    const bits = sequenceEntropyBits(kinds);
    expect(bits).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.moveEntropyMinBits);
    // 鎖 §113.1 記載數字（同 seed 完整重放，漂移即文檔失真）。
    expect(bits).toBeCloseTo(1.38, 2);
  });

  it('每損 10 HP 掉補給小怪；P1→P2 於 ≤70% 觸發並進入生存段', () => {
    const fsm = createVoidraFsm();
    const events = fsm.takeDamage(10);
    expect(events.some((e) => e.kind === 'minionDrop')).toBe(true);
    const phaseEvents = fsm.takeDamage(23);
    expect(fsm.hp).toBe(77);
    expect(phaseEvents.some((e) => e.kind === 'phase' && e.phase === 'p2')).toBe(true);
    expect(fsm.phase).toBe('p2');
    expect(fsm.state).toBe('survival');
    expect(fsm.survivalMs).toBe(0);
  });
});

describe('Voidra FSM：P2 生存段（anti-softlock §10.2-8）', () => {
  const toSurvival = (): ReturnType<typeof createVoidraFsm> => {
    const fsm = createVoidraFsm();
    fsm.takeDamage(33);
    return fsm;
  };

  it('波次表依時序發令：pillar/shard 波與 overheat 窗全數釋出', () => {
    const fsm = toSurvival();
    const commands: VoidraCommand[] = [];
    for (let i = 0; i < 900; i += 1) {
      const command = fsm.tick(50);
      if (command && command.kind !== 'idle') commands.push(command);
    }
    const pillars = commands.filter((c) => c.kind === 'wave' && c.wave === 'pillar');
    const shardDrops = commands.filter((c) => c.kind === 'wave' && c.wave === 'shard');
    const overheats = commands.filter((c) => c.kind === 'overheat');
    expect(pillars.length).toBe(7);
    expect(shardDrops.length).toBe(5);
    expect(overheats.length).toBe(3);
    // 40s 播完時間驅動入 P3（不設計時失敗）。
    expect(commands.some((c) => c.kind === 'survivalEnd')).toBe(true);
    expect(fsm.phase).toBe('p3');
  });

  it('過熱窗外免傷（唯一輸出窗）；窗內傷害正常結算', () => {
    const fsm = toSurvival();
    // 窗外：核心升頂不可及。
    fsm.tick(1000);
    expect(fsm.takeDamage(5)).toEqual([]);
    expect(fsm.hp).toBe(77);
    // 推進至首個過熱窗（9000ms）。
    const overheat = tickUntil(fsm, 'overheat', 100);
    expect(overheat).not.toBeNull();
    expect(fsm.overheatActive).toBe(true);
    const events = fsm.takeDamage(5);
    expect(events.some((e) => e.kind === 'damaged')).toBe(true);
    expect(fsm.hp).toBe(72);
    // 窗滿後回免傷。
    for (let i = 0; i < 40; i += 1) fsm.tick(100);
    expect(fsm.overheatActive).toBe(false);
    expect(fsm.takeDamage(5)).toEqual([]);
  });

  it('過熱窗內打穿 40% 閾值提前入 P3（傷害驅動轉換）', () => {
    const fsm = toSurvival();
    tickUntil(fsm, 'overheat', 100);
    const events = fsm.takeDamage(40);
    expect(fsm.hp).toBe(37);
    expect(events.some((e) => e.kind === 'phase' && e.phase === 'p3')).toBe(true);
    expect(fsm.phase).toBe('p3');
  });

  it('星屑收集單一真值：滿 5 枚回 complete 一次，超收不再觸發', () => {
    const fsm = toSurvival();
    for (let i = 1; i <= 4; i += 1) {
      expect(fsm.collectShard()).toEqual({ collected: i, complete: false });
    }
    expect(fsm.collectShard()).toEqual({ collected: 5, complete: true });
    expect(fsm.collectShard()).toEqual({ collected: 5, complete: false });
  });

  it('零擊殺可過：全程不輸出仍於 40s 後進 P3（保底規則）', () => {
    const fsm = toSurvival();
    for (let i = 0; i < 801; i += 1) fsm.tick(50);
    expect(fsm.phase).toBe('p3');
    expect(fsm.hp).toBe(77);
  });
});

describe('Voidra FSM：P3 核心決戰與擊破', () => {
  const toP3 = (seed = 1): ReturnType<typeof createVoidraFsm> => {
    const fsm = createVoidraFsm({ rng: createSeededRng(seed) });
    fsm.takeDamage(33);
    tickUntil(fsm, 'overheat', 100);
    fsm.takeDamage(40);
    return fsm;
  };

  it('P3 攻擊屬招池 barrage/crush/siphon；barrage 帶放射 8＋螺旋雙層', () => {
    const fsm = toP3();
    const pool = ['barrage', 'crush', 'siphon'];
    for (const kind of collectAttacks(fsm, 8).map((c) => c.kind)) {
      expect(pool).toContain(kind);
    }
    const barrage = tickUntil(fsm, 'barrage', 100);
    expect(barrage).toEqual({ kind: 'barrage', radial: 8, spiralLayers: 2 });
    const crush = tickUntil(fsm, 'crush', 100);
    expect(crush?.kind).toBe('crush');
  });

  it('defeated 單向鎖存冪等：擊破後 tick 回 null、再傷害無事件', () => {
    const fsm = toP3();
    const events = fsm.takeDamage(999);
    expect(events.some((e) => e.kind === 'defeated')).toBe(true);
    expect(fsm.defeated).toBe(true);
    expect(fsm.tick(100)).toBeNull();
    expect(fsm.takeDamage(5)).toEqual([]);
  });
});

describe('Voidra 星光虹吸（§113 #813 W3）', () => {
  // 驅動至虹吸窗開啟（P1 招池內加權抽中）。
  const toSiphon = (seed = 2): ReturnType<typeof createVoidraFsm> => {
    const fsm = createVoidraFsm({ rng: createSeededRng(seed) });
    const command = tickUntil(fsm, 'siphon', 100, 4000);
    expect(command).toEqual({ kind: 'siphon', windowMs: STAR_SIPHON.windowMs });
    return fsm;
  };

  it('窗滿未反制發 siphonDrain；抽取回餵化盾、夾限上限 2 層', () => {
    const fsm = toSiphon();
    const drain = tickUntil(fsm, 'siphonDrain', 100, 20);
    expect(drain).toEqual({ kind: 'siphonDrain' });
    expect(fsm.absorbSiphonStar()).toEqual({ shields: 1, absorbed: true });
    expect(fsm.absorbSiphonStar()).toEqual({ shields: 2, absorbed: true });
    expect(fsm.absorbSiphonStar()).toEqual({ shields: 2, absorbed: false });
    expect(fsm.shieldLayers).toBe(2);
  });

  it('護盾層抵銷：非虹吸窗受擊零傷、層數遞減、不掉補給；耗盡後恢復正常結算', () => {
    const fsm = toSiphon();
    tickUntil(fsm, 'siphonDrain', 100, 20);
    fsm.absorbSiphonStar();
    fsm.absorbSiphonStar();
    const hpBefore = fsm.hp;
    expect(fsm.takeDamage(10)).toEqual([{ kind: 'shieldBlock', remaining: 1 }]);
    expect(fsm.takeDamage(10)).toEqual([{ kind: 'shieldBlock', remaining: 0 }]);
    expect(fsm.hp).toBe(hpBefore);
    const events = fsm.takeDamage(1);
    expect(events.some((e) => e.kind === 'damaged')).toBe(true);
    expect(fsm.hp).toBe(hpBefore - 1);
  });

  it('窗內星彈命中＝逆流爆盾：護盾全清＋回傷 4＋取消本次抽取', () => {
    const fsm = toSiphon(4);
    // 先造 1 層護盾，再進下一次虹吸窗。
    tickUntil(fsm, 'siphonDrain', 100, 20);
    fsm.absorbSiphonStar();
    expect(tickUntil(fsm, 'siphon', 100, 4000)).not.toBeNull();
    const hpBefore = fsm.hp;
    const events = fsm.takeDamage(1, true);
    expect(events[0]).toEqual({ kind: 'siphonBurst' });
    expect(events.some((e) => e.kind === 'damaged')).toBe(true);
    expect(fsm.hp).toBe(hpBefore - STAR_SIPHON.backfireDamage);
    expect(fsm.shieldLayers).toBe(0);
    expect(fsm.state).toBe('idle');
    // 窗已取消：原窗剩餘時間內不再發 siphonDrain。
    for (let i = 0; i < 8; i += 1) expect(fsm.tick(100)?.kind).not.toBe('siphonDrain');
  });

  it('窗內非星彈來源不爆盾（審查修復）：護盾照常抵銷、窗不取消、星彈仍可反制', () => {
    const fsm = toSiphon(4);
    // 先造 1 層護盾，再進下一次虹吸窗。
    tickUntil(fsm, 'siphonDrain', 100, 20);
    fsm.absorbSiphonStar();
    expect(tickUntil(fsm, 'siphon', 100, 4000)).not.toBeNull();
    // 非星彈來源（雷化鏈電/反射彈）：走護盾抵銷，不得觸發 siphonBurst。
    expect(fsm.takeDamage(1)).toEqual([{ kind: 'shieldBlock', remaining: 0 }]);
    expect(fsm.state).toBe('siphon');
    // 護盾耗盡後非星彈來源：正常實扣，仍不爆盾、窗持續。
    const hpBefore = fsm.hp;
    const events = fsm.takeDamage(2);
    expect(events.some((e) => e.kind === 'siphonBurst')).toBe(false);
    expect(fsm.hp).toBe(hpBefore - 2);
    expect(fsm.state).toBe('siphon');
    // 窗內星彈命中仍可爆盾（反制通道未被非星彈關閉）。
    expect(fsm.takeDamage(1, true)[0]).toEqual({ kind: 'siphonBurst' });
  });

  it('滿盾＋窗內星彈命中（星暴 12 傷）：走爆盾實扣，不得被護盾吸收為 0 傷', () => {
    const fsm = toSiphon(4);
    // 兩窗抽彈化盾至上限 2 層（滿盾）。
    tickUntil(fsm, 'siphonDrain', 100, 20);
    fsm.absorbSiphonStar();
    fsm.absorbSiphonStar();
    expect(fsm.shieldLayers).toBe(2);
    // 再進虹吸窗：星暴屬星彈來源——必須爆盾實扣 max(12, 4)=12，禁走護盾吸收。
    expect(tickUntil(fsm, 'siphon', 100, 4000)).not.toBeNull();
    const hpBefore = fsm.hp;
    const events = fsm.takeDamage(STARSTORM.bossDamage, true);
    expect(events[0]).toEqual({ kind: 'siphonBurst' });
    expect(events.some((e) => e.kind === 'shieldBlock')).toBe(false);
    expect(fsm.hp).toBe(hpBefore - STARSTORM.bossDamage);
    expect(fsm.shieldLayers).toBe(0);
  });

  it('爆盾回傷與來彈傷害取較大值（不懲罰重彈）', () => {
    const fsm = toSiphon(5);
    const hpBefore = fsm.hp;
    fsm.takeDamage(9, true);
    expect(fsm.hp).toBe(hpBefore - 9);
  });

  it('段起點重試清空護盾層（比照整場重啟語義）', () => {
    const fsm = toSiphon(6);
    tickUntil(fsm, 'siphonDrain', 100, 20);
    fsm.absorbSiphonStar();
    expect(fsm.shieldLayers).toBe(1);
    fsm.resetToPhase('p2');
    expect(fsm.shieldLayers).toBe(0);
    expect(fsm.phase).toBe('p2');
  });
});

describe('Voidra FSM：段起點重試（resetToPhase）', () => {
  it('P2 段起點：血量回 70%、時鐘/波次/星屑歸零', () => {
    const fsm = createVoidraFsm();
    fsm.takeDamage(33);
    for (let i = 0; i < 100; i += 1) fsm.tick(100);
    fsm.collectShard();
    fsm.resetToPhase('p2');
    expect(fsm.hp).toBe(77);
    expect(fsm.phase).toBe('p2');
    expect(fsm.survivalMs).toBe(0);
    expect(fsm.shardsCollected).toBe(0);
    // 重試後波次表自頭播放。
    const command = tickUntil(fsm, 'wave', 100, 40);
    expect(command).toEqual({ kind: 'wave', wave: 'pillar' });
  });

  it('P3 段起點：血量回 40%、循環自 barrage 起', () => {
    const fsm = createVoidraFsm();
    fsm.takeDamage(33);
    fsm.resetToPhase('p3');
    expect(fsm.hp).toBe(44);
    expect(fsm.phase).toBe('p3');
    const barrage = tickUntil(fsm, 'barrage', 100);
    expect(barrage).not.toBeNull();
  });

  it('擊破後重試無效（defeated 鎖存優先）', () => {
    const fsm = createVoidraFsm();
    fsm.takeDamage(999);
    fsm.resetToPhase('p2');
    expect(fsm.defeated).toBe(true);
  });
});

describe('Voidra EX 差分（§82）', () => {
  it('HP 沿 EX_MODS ×1.5＝165；螺旋三層；P2 密度倍率 1.25', () => {
    const fsm = createVoidraFsm({ ex: true });
    expect(fsm.maxHp).toBe(Math.round(110 * EX_MODS.hpMul));
    fsm.takeDamage(Math.ceil(165 * 0.31));
    expect(fsm.phase).toBe('p2');
    tickUntil(fsm, 'overheat', 100);
    fsm.takeDamage(60);
    expect(fsm.phase).toBe('p3');
    const barrage = tickUntil(fsm, 'barrage', 100);
    expect(barrage).toEqual({ kind: 'barrage', radial: 8, spiralLayers: 3 });
    expect(EX_VOIDRA.bombardmentDensityMul).toBe(1.25);
  });
});

describe('EX P4 內核裸奔（§8.2 #814 W2）', () => {
  const toExP3 = (seed = 3): ReturnType<typeof createVoidraFsm> => {
    const fsm = createVoidraFsm({ ex: true, rng: createSeededRng(seed) });
    fsm.takeDamage(Math.ceil(165 * 0.31));
    expect(fsm.phase).toBe('p2');
    tickUntil(fsm, 'overheat', 100);
    fsm.takeDamage(60);
    expect(fsm.phase).toBe('p3');
    return fsm;
  };
  const innerMax = Math.round(165 * EX_VOIDRA.innerHpRatio);

  it('外核破裂：EX P3 歸零不死——入 P4、內核血池滿灌（maxHp 換刻度）', () => {
    const fsm = toExP3();
    const events = fsm.takeDamage(999);
    expect(events.some((e) => e.kind === 'phase' && e.phase === 'p4')).toBe(true);
    expect(events.some((e) => e.kind === 'defeated')).toBe(false);
    expect(fsm.defeated).toBe(false);
    expect(fsm.phase).toBe('p4');
    expect(fsm.hp).toBe(innerMax);
    expect(fsm.maxHp).toBe(innerMax);
  });

  it('雙血條配比：外核 60%／內核 40%（innerHpRatio 2/3 推導）', () => {
    const outer = Math.round(110 * EX_MODS.hpMul);
    expect(Math.abs(outer / (outer + innerMax) - 0.6)).toBeLessThan(0.005);
    expect(Math.abs(innerMax / (outer + innerMax) - 0.4)).toBeLessThan(0.005);
  });

  it('P4 歸零真擊破（內核僅此一池，不再重生）', () => {
    const fsm = toExP3();
    fsm.takeDamage(999);
    expect(fsm.phase).toBe('p4');
    const events = fsm.takeDamage(999);
    expect(events.some((e) => e.kind === 'defeated')).toBe(true);
    expect(events.some((e) => e.kind === 'phase')).toBe(false);
    expect(fsm.defeated).toBe(true);
  });

  it('裸奔節奏：招式間隔 ×0.8（p4 speedFactor＝p3 ÷ innerIntervalMul）', () => {
    const fsm = toExP3();
    const p3Speed = fsm.speedFactor;
    fsm.takeDamage(999);
    expect(fsm.phase).toBe('p4');
    expect(fsm.speedFactor).toBeCloseTo(p3Speed / EX_VOIDRA.innerIntervalMul, 5);
  });

  it('段重試擴 P4（進度保留語意，沿 Prismix PM 裁決 A）：血量不回灌', () => {
    const fsm = toExP3();
    fsm.takeDamage(999);
    fsm.takeDamage(30);
    expect(fsm.hp).toBe(innerMax - 30);
    fsm.resetToPhase('p4');
    // P4 無波次表重播需求（voidra p2/p3 回灌慣例的存在理由不適用）——
    // 死亡僅重置玩家，內核血保留。
    expect(fsm.hp).toBe(innerMax - 30);
    expect(fsm.phase).toBe('p4');
  });

  it('非 EX 迴歸：P3 歸零直接擊破（無內核）', () => {
    const fsm = createVoidraFsm({ rng: createSeededRng(4) });
    fsm.takeDamage(33);
    tickUntil(fsm, 'overheat', 100);
    fsm.takeDamage(40);
    expect(fsm.phase).toBe('p3');
    const events = fsm.takeDamage(999);
    expect(events.some((e) => e.kind === 'defeated')).toBe(true);
  });

  it('裸奔體積/速度常數紅線：×0.6／×1.4（呈現層 SSOT）', () => {
    expect(EX_VOIDRA.innerScaleMul).toBe(0.6);
    expect(EX_VOIDRA.innerSpeedMul).toBe(1.4);
  });
});
