import { describe, expect, it } from 'vitest';
import { EX_MODS } from './bossFsm';
import { AUDIT_THRESHOLDS, sequenceEntropyBits } from './difficulty';
import { createSeededRng } from './moveTable';
import {
  EX_REFLECTOR,
  REFLECTOR,
  createReflectorFsm,
  reflectorMoveTable,
  type ReflectorCommand,
} from './reflectorFsm';

// 鏡界館長 Reflector FSM（GAME_DESIGN §123）：鏡界三階段——P1 鏡面回彈（固定射線）、
// P2 假噗噗分身、P3 全景反射；anti-softlock 不變式＝全階段星彈全額結算（無免傷窗）。

const driveTo = (
  fsm: ReturnType<typeof createReflectorFsm>,
  kind: ReflectorCommand['kind'],
): ReflectorCommand | null => {
  for (let i = 0; i < 5000; i += 1) {
    const command = fsm.tick(50);
    if (command?.kind === kind) return command;
  }
  return null;
};

const collectAttacks = (fsm: ReturnType<typeof createReflectorFsm>, count: number) => {
  const commands: ReflectorCommand[] = [];
  for (let i = 0; i < 8000 && commands.length < count; i += 1) {
    const command = fsm.tick(50);
    if (command && command.kind !== 'idle') commands.push(command);
  }
  return commands;
};

describe('Reflector 三階段加權表（§123）', () => {
  it('HP 120 接續終局章階梯（>116）；三階段招池對表', () => {
    const fsm = createReflectorFsm();
    expect(fsm.maxHp).toBe(120);
    expect(REFLECTOR.maxHp).toBeGreaterThan(116);
    expect(reflectorMoveTable('p1').map((m) => m.action)).toEqual(['beam', 'shard', 'mirror']);
    expect(reflectorMoveTable('p2').map((m) => m.action)).toEqual([
      'beam',
      'shard',
      'mirror',
      'clone',
    ]);
    expect(reflectorMoveTable('p3').map((m) => m.action)).toEqual(['panorama', 'shard', 'mirror']);
  });

  it('光束限遠距帶（§111.1 條件欄：貼身光束不可讀）；近距帶不出 beam', () => {
    const beam = reflectorMoveTable('p1').find((m) => m.action === 'beam');
    expect(beam?.condition).toEqual({ band: 'far' });
    const fsm = createReflectorFsm({ rng: createSeededRng(1) });
    fsm.setTargetDistance(120);
    const kinds = collectAttacks(fsm, 10).map((c) => c.kind);
    expect(kinds).not.toContain('beam');
  });

  it('傷害驅動 P1→P2（≤66%）與 P2→P3（≤33%）；phase 事件依序帶出', () => {
    const fsm = createReflectorFsm();
    let events = fsm.takeDamage(41);
    expect(fsm.phase).toBe('p2');
    expect(events.some((e) => e.kind === 'phase' && e.phase === 'p2')).toBe(true);
    events = fsm.takeDamage(40);
    expect(fsm.phase).toBe('p3');
    expect(events.some((e) => e.kind === 'phase' && e.phase === 'p3')).toBe(true);
  });

  it('分身指令帶場上上限；全景指令帶彈幕數', () => {
    const fsm = createReflectorFsm({ rng: createSeededRng(3) });
    fsm.takeDamage(41);
    const clone = driveTo(fsm, 'clone');
    expect(clone).not.toBeNull();
    if (clone?.kind === 'clone') expect(clone.cap).toBe(REFLECTOR.cloneCap);
    fsm.takeDamage(40);
    const panorama = driveTo(fsm, 'panorama');
    expect(panorama).not.toBeNull();
    if (panorama?.kind === 'panorama') expect(panorama.count).toBe(REFLECTOR.panoramaShardCount);
  });

  it('擊破：hp 歸零鎖存 defeated，之後 tick 無指令且再受擊無事件（冪等）', () => {
    const fsm = createReflectorFsm();
    const events = fsm.takeDamage(120);
    expect(events.some((e) => e.kind === 'defeated')).toBe(true);
    expect(fsm.defeated).toBe(true);
    expect(fsm.tick(5000)).toBeNull();
    expect(fsm.takeDamage(10)).toEqual([]);
  });

  it('供彈保證律（§26）：每損 10 HP 掉補給小怪事件', () => {
    const fsm = createReflectorFsm();
    const events = fsm.takeDamage(25);
    expect(events.filter((e) => e.kind === 'minionDrop').length).toBe(2);
  });
});

describe('鏡面回彈（§123 主題機制：anti-softlock 自證）', () => {
  // 開鏡窗起點＝mirror 指令發出後 telegraph 期滿；以固定步長驅動到窗內。
  const driveIntoMirrorWindow = (fsm: ReturnType<typeof createReflectorFsm>): boolean => {
    for (let i = 0; i < 5000; i += 1) {
      const command = fsm.tick(50);
      if (command?.kind === 'mirror') {
        // telegraph 期（射線顯示）內不回彈；推進到窗內。
        for (let t = 0; t < REFLECTOR.mirrorTelegraphMs; t += 50) fsm.tick(50);
        return true;
      }
    }
    return false;
  };

  it('開鏡窗內星彈命中→回彈節流觸發；telegraph 期不回彈（預告先行）', () => {
    const fsm = createReflectorFsm({ rng: createSeededRng(5) });
    // 窗外恆不回彈。
    expect(fsm.tryRebound()).toBe(false);
    expect(driveIntoMirrorWindow(fsm)).toBe(true);
    expect(fsm.isMirrorWindow()).toBe(true);
    expect(fsm.tryRebound()).toBe(true);
    // 冷卻內連續命中不重複回彈（高頻射擊不刷屏）。
    expect(fsm.tryRebound()).toBe(false);
  });

  it('anti-softlock 自證：開鏡窗內受擊仍全額結算（無免傷窗，基礎星彈恆可通關）', () => {
    const fsm = createReflectorFsm({ rng: createSeededRng(5) });
    expect(driveIntoMirrorWindow(fsm)).toBe(true);
    const before = fsm.hp;
    fsm.tryRebound();
    const events = fsm.takeDamage(5);
    expect(fsm.hp).toBe(before - 5);
    expect(events.some((e) => e.kind === 'damaged')).toBe(true);
  });

  it('窗滿接閃光弱點窗（鏡面閃光露弱點）：兩窗互斥、閃光期受擊 ×2 由呈現層乘算', () => {
    const fsm = createReflectorFsm({ rng: createSeededRng(5) });
    expect(driveIntoMirrorWindow(fsm)).toBe(true);
    expect(fsm.isFlashWindow()).toBe(false);
    // 推進過開鏡窗 → 入閃光窗。
    for (let t = 0; t < REFLECTOR.mirrorWindowMs; t += 50) fsm.tick(50);
    expect(fsm.isMirrorWindow()).toBe(false);
    expect(fsm.isFlashWindow()).toBe(true);
    // 閃光窗滿即收（獎勵窗有界）。
    for (let t = 0; t < REFLECTOR.flashWindowMs + 100; t += 50) fsm.tick(50);
    expect(fsm.isFlashWindow()).toBe(false);
  });

  it('回彈 anti-softlock 紅線：節流 ≥ 冷卻下限、場上上限有界、弱點倍率 ×2', () => {
    expect(REFLECTOR.reboundCooldownMs).toBeGreaterThanOrEqual(800);
    expect(REFLECTOR.reboundCap).toBeLessThanOrEqual(4);
    expect(REFLECTOR.flashDamageMul).toBe(2);
    expect(REFLECTOR.cloneLifeMs).toBeLessThanOrEqual(8000);
  });
});

describe('頭頂短暈（§58 hit window：近身窗反制）', () => {
  it('可暈（回待機停拍）', () => {
    const fsm = createReflectorFsm();
    expect(fsm.stun(REFLECTOR.slamStunMs)).toBe(true);
    expect(fsm.state).toBe('idle');
  });
});

describe('加權選招治理（§111.1 去背板）', () => {
  it('同 seed 可完整重放；連續同招上限 2', () => {
    const run = (seed: number): string[] => {
      const fsm = createReflectorFsm({ rng: createSeededRng(seed) });
      return collectAttacks(fsm, 16).map((c) => c.kind);
    };
    expect(run(9)).toEqual(run(9));
    const kinds = run(6);
    for (let i = 2; i < kinds.length; i += 1) {
      expect(new Set(kinds.slice(i - 2, i + 1)).size).toBeGreaterThan(1);
    }
  });

  it('招式序列條件熵 ≥ 門檻（#813；AUDIT_THRESHOLDS.moveEntropyMinBits 口徑）', () => {
    const fsm = createReflectorFsm({ rng: createSeededRng(13) });
    const kinds = collectAttacks(fsm, 60).map((c) => c.kind);
    expect(kinds.length).toBeGreaterThanOrEqual(40);
    expect(sequenceEntropyBits(kinds)).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.moveEntropyMinBits);
  });
});

describe('可讀性與 EX 差分紅線', () => {
  it('全招式 telegraph ≥600ms（可讀性紅線；含 clone 召喚類——W2 540ms 漏網教訓）', () => {
    for (const ms of [
      REFLECTOR.beamTelegraphMs,
      REFLECTOR.shardTelegraphMs,
      REFLECTOR.mirrorTelegraphMs,
      REFLECTOR.cloneTelegraphMs,
      REFLECTOR.panoramaTelegraphMs,
    ]) {
      expect(ms).toBeGreaterThanOrEqual(600);
    }
  });

  it('EX 差分：HP ×1.5（180）、雙射線交錯、幻影上限 +1；窗長不縮（只增體不縮窗）', () => {
    const fsm = createReflectorFsm({ ex: true, rng: createSeededRng(8) });
    expect(fsm.maxHp).toBe(Math.round(REFLECTOR.maxHp * EX_MODS.hpMul));
    expect(fsm.cloneCap).toBe(EX_REFLECTOR.cloneCap);
    const mirror = driveTo(fsm, 'mirror');
    expect(mirror?.kind).toBe('mirror');
    if (mirror?.kind === 'mirror') {
      expect(mirror.dualRay).toBe(true);
      expect(mirror.windowMs).toBe(REFLECTOR.mirrorWindowMs);
    }
  });

  it('換階段關窗：跨段不殘留開鏡/閃光窗', () => {
    const fsm = createReflectorFsm({ rng: createSeededRng(5) });
    for (let i = 0; i < 5000; i += 1) {
      const command = fsm.tick(50);
      if (command?.kind === 'mirror') break;
    }
    fsm.takeDamage(41);
    expect(fsm.phase).toBe('p2');
    expect(fsm.isMirrorWindow()).toBe(false);
    expect(fsm.isFlashWindow()).toBe(false);
  });
});
