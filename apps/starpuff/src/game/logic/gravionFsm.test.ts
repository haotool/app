import { describe, expect, it } from 'vitest';
import { EX_MODS } from './bossFsm';
import { AUDIT_THRESHOLDS, sequenceEntropyBits } from './difficulty';
import { createSeededRng } from './moveTable';
import {
  EX_GRAVION,
  GRAVION,
  blackholePull,
  createGravionFsm,
  gravionMoveTable,
  type GravionCommand,
} from './gravionFsm';

// 引力侯爵 Gravion FSM（GAME_DESIGN §123）：引力三階段——P1 重力切換（方向力場）、
// P2 軌道星體（可破屏障）、P3 黑洞壓縮（側牆＋星彈彎折）；力場為位移力非傷害。

const driveTo = (
  fsm: ReturnType<typeof createGravionFsm>,
  kind: GravionCommand['kind'],
): GravionCommand | null => {
  for (let i = 0; i < 5000; i += 1) {
    const command = fsm.tick(50);
    if (command?.kind === kind) return command;
  }
  return null;
};

const collectAttacks = (fsm: ReturnType<typeof createGravionFsm>, count: number) => {
  const commands: GravionCommand[] = [];
  for (let i = 0; i < 8000 && commands.length < count; i += 1) {
    const command = fsm.tick(50);
    if (command && command.kind !== 'idle') commands.push(command);
  }
  return commands;
};

describe('Gravion 三階段加權表（§123）', () => {
  it('HP 124 接續終局章階梯（>120）；三階段招池對表', () => {
    const fsm = createGravionFsm();
    expect(fsm.maxHp).toBe(124);
    expect(GRAVION.maxHp).toBeGreaterThan(120);
    expect(gravionMoveTable('p1').map((m) => m.action)).toEqual(['gswitch', 'orbshot']);
    expect(gravionMoveTable('p2').map((m) => m.action)).toEqual(['gswitch', 'orbshot', 'orbit']);
    expect(gravionMoveTable('p3').map((m) => m.action)).toEqual(['crush', 'barrage', 'gswitch']);
  });

  it('傷害驅動 P1→P2（≤66%）與 P2→P3（≤33%）；phase 事件依序帶出', () => {
    const fsm = createGravionFsm();
    let events = fsm.takeDamage(43);
    expect(fsm.phase).toBe('p2');
    expect(events.some((e) => e.kind === 'phase' && e.phase === 'p2')).toBe(true);
    events = fsm.takeDamage(41);
    expect(fsm.phase).toBe('p3');
    expect(events.some((e) => e.kind === 'phase' && e.phase === 'p3')).toBe(true);
  });

  it('擊破：hp 歸零鎖存 defeated，之後 tick 無指令且再受擊無事件（冪等）', () => {
    const fsm = createGravionFsm();
    const events = fsm.takeDamage(124);
    expect(events.some((e) => e.kind === 'defeated')).toBe(true);
    expect(fsm.defeated).toBe(true);
    expect(fsm.tick(5000)).toBeNull();
    expect(fsm.takeDamage(10)).toEqual([]);
  });

  it('供彈保證律（§26）：每損 10 HP 掉補給小怪事件', () => {
    const fsm = createGravionFsm();
    const events = fsm.takeDamage(25);
    expect(events.filter((e) => e.kind === 'minionDrop').length).toBe(2);
  });

  it('懸浮場控型免暈（§74 慣例）：stun 恆回 false（下砸僅回彈）', () => {
    const fsm = createGravionFsm();
    expect(fsm.stun(800)).toBe(false);
  });
});

describe('重力切換（§123 主題機制：位移力非傷害）', () => {
  it('方向自四向抽選且連抽避重（同 seed 可重放）', () => {
    const run = (seed: number): string[] => {
      const fsm = createGravionFsm({ rng: createSeededRng(seed) });
      const dirs: string[] = [];
      for (let i = 0; i < 8000 && dirs.length < 10; i += 1) {
        const command = fsm.tick(50);
        if (command?.kind === 'gswitch') dirs.push(command.direction);
      }
      return dirs;
    };
    expect(run(7)).toEqual(run(7));
    const dirs = run(11);
    expect(dirs.length).toBeGreaterThanOrEqual(6);
    for (let i = 1; i < dirs.length; i += 1) {
      expect(dirs[i]).not.toBe(dirs[i - 1]);
    }
    for (const dir of dirs) expect(['left', 'right', 'up', 'down']).toContain(dir);
  });

  it('力場指令帶時長；位移力恆低於玩家全速（交叉不變式 16）', () => {
    const fsm = createGravionFsm({ rng: createSeededRng(2) });
    const gswitch = driveTo(fsm, 'gswitch');
    expect(gswitch).not.toBeNull();
    if (gswitch?.kind === 'gswitch') expect(gswitch.fieldMs).toBe(GRAVION.gswitchFieldMs);
    // 玩家全速 220px/s（PLAYER.moveSpeed 口徑）：漂移是壓力非禁錮。
    expect(GRAVION.gswitchDriftPxPerSec).toBeLessThan(220);
    // 力場時長有界（招式循環自然收場，無常駐禁錮）。
    expect(GRAVION.gswitchFieldMs).toBeLessThanOrEqual(4000);
    // 上向力升托帶頂線（防無限上浮）。
    expect(GRAVION.gswitchLiftTopY).toBeGreaterThanOrEqual(100);
  });

  it('切換瞬間不得直接命中：telegraph 先行且力場全程零傷害語意（常數自證）', () => {
    // telegraph（箭頭預告）≥600ms 先行；力場僅位移（呈現層 positional drift），
    // 傷害面由招池其餘招式承擔——gswitch 指令不帶任何傷害參數。
    expect(GRAVION.gswitchTelegraphMs).toBeGreaterThanOrEqual(600);
    const fsm = createGravionFsm({ rng: createSeededRng(2) });
    const gswitch = driveTo(fsm, 'gswitch');
    if (gswitch?.kind === 'gswitch') {
      expect(Object.keys(gswitch).sort()).toEqual(['direction', 'fieldMs', 'kind']);
    }
  });
});

describe('軌道星體與黑洞壓縮（§123 反制每招 ≥2 解）', () => {
  it('軌道指令帶上限；星體屏障有界（一般 4／EX 6）', () => {
    const fsm = createGravionFsm({ rng: createSeededRng(3) });
    fsm.takeDamage(43);
    const orbit = driveTo(fsm, 'orbit');
    expect(orbit).not.toBeNull();
    if (orbit?.kind === 'orbit') expect(orbit.cap).toBe(GRAVION.orbCap);
    expect(GRAVION.orbCap).toBe(4);
    expect(EX_GRAVION.orbCap).toBe(6);
  });

  it('壓縮走廊恆開（anti-softlock）：雙側牆合計覆蓋 <100%、駐留有界', () => {
    // 各側 20% → 中央 60% 恆開。
    expect(GRAVION.crushWallRatio * 2).toBeLessThan(1);
    expect(GRAVION.crushHoldMs).toBeLessThanOrEqual(3000);
    const fsm = createGravionFsm({ rng: createSeededRng(4) });
    fsm.takeDamage(84);
    expect(fsm.phase).toBe('p3');
    const crush = driveTo(fsm, 'crush');
    expect(crush).not.toBeNull();
    if (crush?.kind === 'crush') expect(crush.holdMs).toBe(GRAVION.crushHoldMs);
  });

  it('黑洞彎折（純函式）：域內星彈朝洞彎折、域外不動、重合不動', () => {
    // 域內：向洞加速。
    const bent = blackholePull(100, 100, 200, 0, 200, 100, 100);
    expect(bent.vx).toBeGreaterThan(200);
    expect(bent.vy).toBe(0);
    // 域外（>radius）：原速不動。
    const far = blackholePull(0, 0, 200, 0, GRAVION.blackholeRadiusPx + 50, 0, 100);
    expect(far).toEqual({ vx: 200, vy: 0 });
    // 重合：不動（除零防護）。
    expect(blackholePull(200, 100, 120, -40, 200, 100, 100)).toEqual({ vx: 120, vy: -40 });
  });

  it('彈幕數：一般 6／EX 8', () => {
    const fsm = createGravionFsm({ rng: createSeededRng(5) });
    fsm.takeDamage(84);
    const barrage = driveTo(fsm, 'barrage');
    if (barrage?.kind === 'barrage') expect(barrage.count).toBe(GRAVION.barrageCount);
    const exFsm = createGravionFsm({ ex: true, rng: createSeededRng(5) });
    exFsm.takeDamage(126);
    const exBarrage = driveTo(exFsm, 'barrage');
    if (exBarrage?.kind === 'barrage') expect(exBarrage.count).toBe(EX_GRAVION.barrageCount);
  });
});

describe('加權選招治理（§111.1 去背板）', () => {
  it('同 seed 可完整重放；連續同招上限 2', () => {
    const run = (seed: number): string[] => {
      const fsm = createGravionFsm({ rng: createSeededRng(seed) });
      return collectAttacks(fsm, 16).map((c) => c.kind);
    };
    expect(run(9)).toEqual(run(9));
    const kinds = run(6);
    for (let i = 2; i < kinds.length; i += 1) {
      expect(new Set(kinds.slice(i - 2, i + 1)).size).toBeGreaterThan(1);
    }
  });

  it('招式序列條件熵 ≥ 門檻（#813；AUDIT_THRESHOLDS.moveEntropyMinBits 口徑）', () => {
    const fsm = createGravionFsm({ rng: createSeededRng(13) });
    const kinds = collectAttacks(fsm, 60).map((c) => c.kind);
    expect(kinds.length).toBeGreaterThanOrEqual(40);
    expect(sequenceEntropyBits(kinds)).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.moveEntropyMinBits);
  });
});

describe('可讀性與 EX 差分紅線', () => {
  it('全招式 telegraph ≥600ms（可讀性紅線；含 orbit 召喚類——W2 540ms 漏網教訓）', () => {
    for (const ms of [
      GRAVION.gswitchTelegraphMs,
      GRAVION.orbshotTelegraphMs,
      GRAVION.orbitTelegraphMs,
      GRAVION.crushTelegraphMs,
      GRAVION.barrageTelegraphMs,
    ]) {
      expect(ms).toBeGreaterThanOrEqual(600);
    }
  });

  it('EX 差分：HP ×1.5（186）、telegraph 與力場窗不縮（只增體不縮窗）', () => {
    const fsm = createGravionFsm({ ex: true, rng: createSeededRng(8) });
    expect(fsm.maxHp).toBe(Math.round(GRAVION.maxHp * EX_MODS.hpMul));
    const gswitch = driveTo(fsm, 'gswitch');
    if (gswitch?.kind === 'gswitch') expect(gswitch.fieldMs).toBe(GRAVION.gswitchFieldMs);
  });
});
