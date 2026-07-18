import { describe, expect, it } from 'vitest';
import { EX_MODS } from './bossFsm';
import {
  EX_VOIDRA,
  VOIDRA,
  VOIDRA_SURVIVAL,
  createVoidraFsm,
  voidraAttackCycle,
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

describe('Voidra 常數與波次表（§81，主計畫 §6.3/§10.2-8）', () => {
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

  it('三階段招式循環：P1 牽引/彈環/爪擊、P2 波次表、P3 彈幕/潮汐', () => {
    expect(voidraAttackCycle('p1')).toEqual(['pull', 'ring', 'claw']);
    expect(voidraAttackCycle('p2')).toEqual(['survival']);
    expect(voidraAttackCycle('p3')).toEqual(['barrage', 'crush']);
  });
});

describe('Voidra FSM：P1 王座戰', () => {
  it('循環依序 pull → ring → claw，每招間插 idle 僵直窗', () => {
    const fsm = createVoidraFsm();
    const seen: string[] = [];
    for (let i = 0; i < 200 && seen.length < 6; i += 1) {
      const command = fsm.tick(100);
      if (command && command.kind !== 'idle') seen.push(command.kind);
    }
    expect(seen.slice(0, 3)).toEqual(['pull', 'ring', 'claw']);
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
  const toP3 = (): ReturnType<typeof createVoidraFsm> => {
    const fsm = createVoidraFsm();
    fsm.takeDamage(33);
    tickUntil(fsm, 'overheat', 100);
    fsm.takeDamage(40);
    return fsm;
  };

  it('P3 循環 barrage → crush；barrage 帶放射 8＋螺旋雙層', () => {
    const fsm = toP3();
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

describe('Voidra EX 差分（§81）', () => {
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
