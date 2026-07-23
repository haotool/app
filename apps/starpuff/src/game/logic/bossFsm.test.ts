import { describe, expect, it } from 'vitest';
import {
  BOSS,
  JELLORD_MOVES,
  createBossFsm,
  jellyRainCount,
  phaseForHp,
  type BossCommand,
  type BossFsm,
} from './bossFsm';
import { AUDIT_THRESHOLDS, sequenceEntropyBits } from './difficulty';
import { createSeededRng } from './moveTable';

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

  it('加權表：p2/p3 招池含 dash（遠距帶限定），p1 不含', () => {
    expect(JELLORD_MOVES.p1.map((m) => m.action)).not.toContain('dash');
    for (const phase of ['p2', 'p3'] as const) {
      const dash = JELLORD_MOVES[phase].find((m) => m.action === 'dash');
      expect(dash?.condition).toEqual({ band: 'far' });
    }
  });

  it('加權表：全表 weight 為正、每階段至少兩招', () => {
    for (const table of Object.values(JELLORD_MOVES)) {
      expect(table.length).toBeGreaterThanOrEqual(2);
      for (const move of table) expect(move.weight).toBeGreaterThan(0);
    }
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

  it('p1 出招穿插 idle 且招式僅限 rain(5)/slam', () => {
    const fsm = createBossFsm({ rng: createSeededRng(11) });
    const commands = collectCommands(fsm, 20000);
    expect(commands.length).toBeGreaterThan(4);
    commands.forEach((command, index) => {
      if (index % 2 === 1) {
        expect(command.kind).toBe('idle');
        return;
      }
      if (command.kind === 'rain')
        expect(command).toEqual({ kind: 'rain', count: 5, homing: false });
      else expect(command.kind).toBe('slam');
    });
  });

  it('加權選招同 seed 可完整重放（§5）', () => {
    const run = (seed: number): string[] =>
      collectCommands(createBossFsm({ rng: createSeededRng(seed) }), 30000).map((c) => c.kind);
    expect(run(42)).toEqual(run(42));
    expect(run(42)).not.toEqual(run(43));
  });

  it('招式序不再 100% 等於舊固定循環（rain→slam 交替；§5 去背板）', () => {
    // 舊行為：p1 固定 rain→slam→rain→slam。20 次出招內任一 seed 應偏離固定序。
    const attacks = collectCommands(createBossFsm({ rng: createSeededRng(7) }), 60000)
      .filter((c) => c.kind !== 'idle')
      .slice(0, 20)
      .map((c) => c.kind);
    const legacy = Array.from({ length: attacks.length }, (_, i) =>
      i % 2 === 0 ? 'rain' : 'slam',
    );
    expect(attacks).not.toEqual(legacy);
  });

  it('招式序列條件熵 ≥ 門檻（#813 去背板；AUDIT_THRESHOLDS.moveEntropyMinBits 口徑）', () => {
    const attacks = collectCommands(createBossFsm({ rng: createSeededRng(13) }), 240000)
      .filter((c) => c.kind !== 'idle')
      .map((c) => c.kind);
    expect(attacks.length).toBeGreaterThanOrEqual(40);
    expect(sequenceEntropyBits(attacks)).toBeGreaterThanOrEqual(
      AUDIT_THRESHOLDS.moveEntropyMinBits,
    );
  });

  it('連續同招上限 2：長時序列無三連同招', () => {
    const attacks = collectCommands(createBossFsm({ rng: createSeededRng(3) }), 120000)
      .filter((c) => c.kind !== 'idle')
      .map((c) => c.kind);
    for (let i = 2; i < attacks.length; i += 1) {
      expect(new Set(attacks.slice(i - 2, i + 1)).size).toBeGreaterThan(1);
    }
  });

  it('近距帶下 p2 不出 dash（條件欄距離帶）', () => {
    const fsm = createBossFsm({ rng: createSeededRng(5) });
    fsm.setTargetDistance(120);
    fsm.takeDamage(30);
    const kinds = collectCommands(fsm, 60000).map((c) => c.kind);
    expect(kinds).not.toContain('dash');
    expect(kinds).toContain('rain');
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

  it('p2 招池含 dash（遠距帶）且 rain 升為 7 顆（非追蹤）', () => {
    const fsm = createBossFsm({ rng: createSeededRng(21) });
    fsm.takeDamage(30);
    const commands = collectCommands(fsm, 60000);
    const kinds = commands.map((c) => c.kind);
    expect(kinds).toContain('dash');
    const rains = commands.filter((c) => c.kind === 'rain');
    expect(rains.length).toBeGreaterThan(0);
    for (const rain of rains) expect(rain).toEqual({ kind: 'rain', count: 7, homing: false });
  });

  it('p2 slam 不帶震落旗標、帶果凍回彈旗標（§5）', () => {
    const fsm = createBossFsm({ rng: createSeededRng(21) });
    fsm.takeDamage(30);
    const slams = collectCommands(fsm, 60000).filter((c) => c.kind === 'slam');
    expect(slams.length).toBeGreaterThan(0);
    for (const slam of slams) expect(slam).toEqual({ kind: 'slam', quake: false, jelly: true });
  });

  it('p1 slam 不帶果凍回彈旗標（既有反制不 regress）', () => {
    const fsm = createBossFsm({ rng: createSeededRng(11) });
    const slams = collectCommands(fsm, 60000).filter((c) => c.kind === 'slam');
    expect(slams.length).toBeGreaterThan(0);
    for (const slam of slams) expect(slam).toEqual({ kind: 'slam', quake: false, jelly: false });
  });

  it('p2 節奏加速：idle 時長縮短為 1/1.3', () => {
    const fsm = createBossFsm();
    fsm.takeDamage(30);
    const enragedIdleMs = BOSS.idleMs / BOSS.enrageSpeedMultiplier;
    expect(collectCommands(fsm, enragedIdleMs - 50, 1)).toEqual([]);
    const command = fsm.tick(60);
    expect(command).not.toBeNull();
    expect(command?.kind).not.toBe('idle');
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

  it('p3 招池：rain 為追蹤彈 ×5、slam 帶震落＋果凍旗標、含 dash', () => {
    const fsm = createBossFsm({ rng: createSeededRng(21) });
    fsm.takeDamage(45);
    const commands = collectCommands(fsm, 60000);
    const rains = commands.filter((c) => c.kind === 'rain');
    expect(rains.length).toBeGreaterThan(0);
    for (const rain of rains) expect(rain).toEqual({ kind: 'rain', count: 5, homing: true });
    const slams = commands.filter((c) => c.kind === 'slam');
    expect(slams.length).toBeGreaterThan(0);
    for (const slam of slams) expect(slam).toEqual({ kind: 'slam', quake: true, jelly: true });
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
