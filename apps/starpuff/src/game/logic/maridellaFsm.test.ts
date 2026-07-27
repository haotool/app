import { describe, expect, it } from 'vitest';
import { PLAYER } from '../core/config';
import { EX_MODS } from './bossFsm';
import { AUDIT_THRESHOLDS, sequenceEntropyBits } from './difficulty';
import { createSeededRng } from './moveTable';
import {
  EX_MARIDELLA,
  MARIDELLA,
  createMaridellaFsm,
  maridellaMoveTable,
  type MaridellaCommand,
} from './maridellaFsm';

// 潮汐女王 Maridella FSM（GAME_DESIGN §122）：懸浮場控三階段——P1 潮線改道、
// P2 海嘯階梯（缺口牆）、P3 深海月蝕（三水球依序環爆）；hit window = idle 僵直。

const driveTo = (
  fsm: ReturnType<typeof createMaridellaFsm>,
  kind: MaridellaCommand['kind'],
): MaridellaCommand | null => {
  for (let i = 0; i < 5000; i += 1) {
    const command = fsm.tick(50);
    if (command?.kind === kind) return command;
  }
  return null;
};

const collectAttacks = (fsm: ReturnType<typeof createMaridellaFsm>, count: number) => {
  const commands: MaridellaCommand[] = [];
  for (let i = 0; i < 8000 && commands.length < count; i += 1) {
    const command = fsm.tick(50);
    if (command && command.kind !== 'idle') commands.push(command);
  }
  return commands;
};

describe('Maridella 三階段加權表（§122）', () => {
  it('HP 116 接續終局章階梯（>112）；三階段招池對表', () => {
    const fsm = createMaridellaFsm();
    expect(fsm.maxHp).toBe(116);
    expect(MARIDELLA.maxHp).toBeGreaterThan(112);
    expect(maridellaMoveTable('p1').map((m) => m.action)).toEqual(['current', 'droplet']);
    expect(maridellaMoveTable('p2').map((m) => m.action)).toEqual([
      'wave',
      'droplet',
      'summon',
      'current',
    ]);
    expect(maridellaMoveTable('p3').map((m) => m.action)).toEqual(['moonorb', 'wave', 'current']);
  });

  it('水滴限遠距帶（§111.1 條件欄：貼身拋物不可讀）；近距帶只出潮線', () => {
    const droplet = maridellaMoveTable('p1').find((m) => m.action === 'droplet');
    expect(droplet?.condition).toEqual({ band: 'far' });
    const fsm = createMaridellaFsm({ rng: createSeededRng(1) });
    fsm.setTargetDistance(120);
    const kinds = collectAttacks(fsm, 8).map((c) => c.kind);
    expect(kinds).not.toContain('droplet');
    const farFsm = createMaridellaFsm({ rng: createSeededRng(1) });
    const farKinds = collectAttacks(farFsm, 12).map((c) => c.kind);
    expect(farKinds).toContain('droplet');
  });

  it('潮線改道交替出向（可讀性）：連續兩次 current 方向必翻轉', () => {
    const fsm = createMaridellaFsm({ rng: createSeededRng(2) });
    const dirs: number[] = [];
    for (let i = 0; i < 8000 && dirs.length < 4; i += 1) {
      const command = fsm.tick(50);
      if (command?.kind === 'current') dirs.push(command.dir);
    }
    expect(dirs.length).toBe(4);
    for (let i = 1; i < dirs.length; i += 1) {
      expect(dirs[i]).toBe((dirs[i - 1] ?? 1) * -1);
    }
  });

  it('傷害驅動 P1→P2（≤66%）與 P2→P3（≤33%）；phase 事件依序帶出', () => {
    const fsm = createMaridellaFsm();
    let events = fsm.takeDamage(40);
    expect(fsm.phase).toBe('p2');
    expect(events.some((e) => e.kind === 'phase' && e.phase === 'p2')).toBe(true);
    events = fsm.takeDamage(39);
    expect(fsm.phase).toBe('p3');
    expect(events.some((e) => e.kind === 'phase' && e.phase === 'p3')).toBe(true);
  });

  it('P2 海嘯牆：起浪側與缺口位置同 seed 可重放；召喚帶上限 2', () => {
    const run = (seed: number) => {
      const fsm = createMaridellaFsm({ rng: createSeededRng(seed) });
      fsm.takeDamage(40);
      const waves: { fromLeft: boolean; gapLow: boolean }[] = [];
      for (let i = 0; i < 8000 && waves.length < 5; i += 1) {
        const command = fsm.tick(50);
        if (command?.kind === 'wave') {
          waves.push({ fromLeft: command.fromLeft, gapLow: command.gapLow });
        }
      }
      return waves;
    };
    expect(run(7)).toEqual(run(7));
    const fsm = createMaridellaFsm({ rng: createSeededRng(3) });
    fsm.takeDamage(40);
    const summon = driveTo(fsm, 'summon');
    expect(summon).not.toBeNull();
    if (summon?.kind === 'summon') expect(summon.cap).toBe(MARIDELLA.summonCap);
  });

  it('P3 月蝕：水球 ×3 依 count 帶出；環爆彈數 SSOT 有界', () => {
    const fsm = createMaridellaFsm({ rng: createSeededRng(4) });
    fsm.takeDamage(79);
    expect(fsm.phase).toBe('p3');
    const moonorb = driveTo(fsm, 'moonorb');
    expect(moonorb).not.toBeNull();
    if (moonorb?.kind === 'moonorb') expect(moonorb.count).toBe(MARIDELLA.moonorbCount);
    expect(MARIDELLA.moonorbRingShots).toBeLessThanOrEqual(10);
  });

  it('擊破：hp 歸零鎖存 defeated，之後 tick 無指令且再受擊無事件（冪等）', () => {
    const fsm = createMaridellaFsm();
    const events = fsm.takeDamage(116);
    expect(events.some((e) => e.kind === 'defeated')).toBe(true);
    expect(fsm.defeated).toBe(true);
    expect(fsm.tick(5000)).toBeNull();
    expect(fsm.takeDamage(10)).toEqual([]);
  });

  it('供彈保證律（§26）：每損 10 HP 掉補給小怪事件', () => {
    const fsm = createMaridellaFsm();
    const events = fsm.takeDamage(25);
    expect(events.filter((e) => e.kind === 'minionDrop').length).toBe(2);
  });

  it('狂暴節奏：P2/P3 speedFactor ×1.15；僵直窗固定不縮短', () => {
    const fsm = createMaridellaFsm();
    expect(fsm.speedFactor).toBe(1);
    fsm.takeDamage(40);
    expect(fsm.speedFactor).toBeCloseTo(MARIDELLA.enrageSpeedMultiplier, 5);
    let elapsed = 0;
    let firstCommandAt = -1;
    while (elapsed < 3000 && firstCommandAt < 0) {
      const command = fsm.tick(50);
      elapsed += 50;
      if (command) firstCommandAt = elapsed;
    }
    expect(firstCommandAt).toBeGreaterThanOrEqual(MARIDELLA.idleMs.p2);
    expect(firstCommandAt).toBeLessThanOrEqual(MARIDELLA.idleMs.p2 + 100);
  });

  it('雷化斷召（§58 慣例）：召喚態可中斷回僵直，非召喚態不成立', () => {
    const fsm = createMaridellaFsm({ rng: createSeededRng(5) });
    expect(fsm.interruptSummon()).toBe(false);
    fsm.takeDamage(40);
    const summon = driveTo(fsm, 'summon');
    expect(summon).not.toBeNull();
    expect(fsm.state).toBe('summon');
    expect(fsm.interruptSummon()).toBe(true);
    expect(fsm.state).toBe('idle');
  });
});

describe('加權選招治理（§111.1 去背板）', () => {
  it('同 seed 可完整重放；連續同招上限 2', () => {
    const run = (seed: number): string[] => {
      const fsm = createMaridellaFsm({ rng: createSeededRng(seed) });
      return collectAttacks(fsm, 16).map((c) => c.kind);
    };
    expect(run(9)).toEqual(run(9));
    const kinds = run(6);
    for (let i = 2; i < kinds.length; i += 1) {
      expect(new Set(kinds.slice(i - 2, i + 1)).size).toBeGreaterThan(1);
    }
  });

  it('招式序列條件熵 ≥ 門檻（#813；AUDIT_THRESHOLDS.moveEntropyMinBits 口徑）', () => {
    const fsm = createMaridellaFsm({ rng: createSeededRng(13) });
    const kinds = collectAttacks(fsm, 60).map((c) => c.kind);
    expect(kinds.length).toBeGreaterThanOrEqual(40);
    expect(sequenceEntropyBits(kinds)).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.moveEntropyMinBits);
  });
});

describe('可讀性與 anti-softlock 紅線（§122）', () => {
  it('全招式 telegraph ≥600ms（可讀性紅線）', () => {
    for (const ms of [
      MARIDELLA.currentTelegraphMs,
      MARIDELLA.dropletTelegraphMs,
      MARIDELLA.waveTelegraphMs,
      MARIDELLA.moonorbTelegraphMs,
    ]) {
      expect(ms).toBeGreaterThanOrEqual(600);
    }
  });

  it('潮線推移恆低於玩家全速（交叉不變式 16：不與速度控制器對抗）', () => {
    expect(MARIDELLA.currentPushPxPerSec).toBeLessThan(PLAYER.moveSpeed);
    expect(MARIDELLA.currentHoldMs).toBeLessThanOrEqual(5000);
  });

  it('海嘯牆缺口恆容玩家本體（48px＋裕度）；EX 缺口不縮（只縮體不縮窗同源）', () => {
    expect(MARIDELLA.waveGapPx).toBeGreaterThanOrEqual(48 + 40);
    // EX 差分表無缺口欄位＝缺口恆定（質性差分只加球數/召喚/水滴）。
    expect(Object.keys(EX_MARIDELLA)).toEqual(['summonCap', 'moonorbCount', 'dropletCount']);
  });

  it('EX 差分：HP ×1.5（174）、水球 ×4、召喚上限 3、水滴 ×5', () => {
    const fsm = createMaridellaFsm({ ex: true, rng: createSeededRng(8) });
    expect(fsm.maxHp).toBe(Math.round(MARIDELLA.maxHp * EX_MODS.hpMul));
    fsm.takeDamage(118);
    expect(fsm.phase).toBe('p3');
    const moonorb = driveTo(fsm, 'moonorb');
    if (moonorb?.kind === 'moonorb') expect(moonorb.count).toBe(EX_MARIDELLA.moonorbCount);
    const summonFsm = createMaridellaFsm({ ex: true, rng: createSeededRng(3) });
    summonFsm.takeDamage(60);
    expect(summonFsm.phase).toBe('p2');
    const summon = driveTo(summonFsm, 'summon');
    if (summon?.kind === 'summon') expect(summon.cap).toBe(EX_MARIDELLA.summonCap);
  });
});
