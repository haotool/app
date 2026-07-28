import { describe, expect, it } from 'vitest';
import { AUDIT_THRESHOLDS, sequenceEntropyBits } from './difficulty';
import { createSeededRng } from './moveTable';
import {
  EX_LIUDONG,
  LIUDONG,
  createLiudongFsm,
  liudongMoveTable,
  type LiudongCommand,
} from './liudongFsm';

// 劉董・崩盤之王 FSM（GAME_DESIGN §125，PRD §6）：迷因終盤三階段——P1 三市場
// 輪替（思考下單前奏）、P2 全屏壓力（反擊窗＋不連續同型全屏）、P3 終局（熔斷
// 倒數脆弱窗＋一次性最後轉帳）；失敗保護層（首見減速/連傷降節奏/EX 質性差分）。

type Fsm = ReturnType<typeof createLiudongFsm>;

const driveTo = (fsm: Fsm, kind: LiudongCommand['kind']): LiudongCommand | null => {
  for (let i = 0; i < 8000; i += 1) {
    const command = fsm.tick(50);
    if (command?.kind === kind) return command;
  }
  return null;
};

const collectAttacks = (fsm: Fsm, count: number): LiudongCommand[] => {
  const commands: LiudongCommand[] = [];
  for (let i = 0; i < 12_000 && commands.length < count; i += 1) {
    const command = fsm.tick(50);
    if (command && command.kind !== 'idle') commands.push(command);
  }
  return commands;
};

describe('Liudong 三階段加權表（§125）', () => {
  it('HP 132 為全魔王頂點（>Gravion 124）；三階段招池對表', () => {
    const fsm = createLiudongFsm();
    expect(fsm.maxHp).toBe(132);
    expect(LIUDONG.maxHp).toBeGreaterThan(124);
    expect(liudongMoveTable('p1', false).map((m) => m.action)).toEqual([
      'usstock',
      'crypto',
      'twstock',
    ]);
    expect(liudongMoveTable('p2', false).map((m) => m.action)).toEqual([
      'arrowrain',
      'klinewave',
      'bullbear',
      'transferchain',
      'shortlaser',
      'fakeout',
    ]);
    expect(liudongMoveTable('p3', false).map((m) => m.action)).toEqual([
      'doomarrow',
      'bearcore',
      'liquidation',
      'circuitbreaker',
    ]);
  });

  it('招池為 phase 純函式（PRD §6.7 前三死不加新招的結構保證）：重複求值恆等', () => {
    for (const phase of ['p1', 'p2', 'p3'] as const) {
      expect(liudongMoveTable(phase, false)).toEqual(liudongMoveTable(phase, false));
    }
  });

  it('EX 質性差分（PRD §6.7）：fakeout 僅 EX 有權重；箭雨 EX 三批（含假箭頭）、一般兩批', () => {
    const fakeoutNormal = liudongMoveTable('p2', false).find((m) => m.action === 'fakeout');
    const fakeoutEx = liudongMoveTable('p2', true).find((m) => m.action === 'fakeout');
    expect(fakeoutNormal?.weight).toBe(0);
    expect(fakeoutEx?.weight).toBe(EX_LIUDONG.fakeoutWeight);
    expect(EX_LIUDONG.arrowrainBatches).toBe(3);
    expect(EX_LIUDONG.doomarrowNarrow).toBe(true);
  });

  it('傷害驅動 P1→P2（≤70%）與 P2→P3（≤35%）；phase 事件依序帶出', () => {
    const fsm = createLiudongFsm();
    let events = fsm.takeDamage(40);
    expect(fsm.phase).toBe('p2');
    expect(events.some((e) => e.kind === 'phase' && e.phase === 'p2')).toBe(true);
    events = fsm.takeDamage(47);
    expect(fsm.phase).toBe('p3');
    expect(events.some((e) => e.kind === 'phase' && e.phase === 'p3')).toBe(true);
  });

  it('擊破：hp 歸零鎖存 defeated，之後 tick 無指令且再受擊無事件（冪等）', () => {
    const fsm = createLiudongFsm();
    const events = fsm.takeDamage(132);
    expect(events.some((e) => e.kind === 'defeated')).toBe(true);
    expect(fsm.defeated).toBe(true);
    expect(fsm.tick(5000)).toBeNull();
    expect(fsm.takeDamage(10)).toEqual([]);
  });

  it('供彈保證律（§26）：每損 10 HP 掉補給小怪事件', () => {
    const fsm = createLiudongFsm();
    const events = fsm.takeDamage(25);
    expect(events.filter((e) => e.kind === 'minionDrop').length).toBe(2);
  });
});

describe('P1 思考下單系統（PRD §6.3 預告即機制）', () => {
  it('market 指令帶市場別與首見旗標；思考＋下單前奏合計 ≥ telegraph 紅線', () => {
    const fsm = createLiudongFsm({ rng: createSeededRng(7) });
    const command = driveTo(fsm, 'market');
    expect(command).not.toBeNull();
    if (command?.kind === 'market') {
      expect(['usstock', 'crypto', 'twstock']).toContain(command.market);
      expect(command.firstSeen).toBe(true);
    }
    expect(LIUDONG.thinkMs + LIUDONG.orderMs).toBeGreaterThanOrEqual(
      AUDIT_THRESHOLDS.telegraphMinMs,
    );
  });

  it('稜化斷單（tryInterruptOrder）：僅市場招執行期可斷、回待機；其餘招回 false', () => {
    const fsm = createLiudongFsm({ rng: createSeededRng(3) });
    expect(fsm.tryInterruptOrder()).toBe(false);
    const command = driveTo(fsm, 'market');
    expect(command).not.toBeNull();
    expect(fsm.tryInterruptOrder()).toBe(true);
    expect(fsm.state).toBe('idle');
    expect(fsm.tryInterruptOrder()).toBe(false);
  });

  it('首見新招 −15%（PRD §6.7）：同招第二次 firstSeen=false', () => {
    const fsm = createLiudongFsm({ rng: createSeededRng(11) });
    const seen = new Map<string, boolean[]>();
    for (const command of collectAttacks(fsm, 12)) {
      if (command.kind !== 'market') continue;
      const list = seen.get(command.market) ?? [];
      list.push(command.firstSeen);
      seen.set(command.market, list);
    }
    for (const flags of seen.values()) {
      expect(flags[0]).toBe(true);
      for (const flag of flags.slice(1)) expect(flag).toBe(false);
    }
    expect(LIUDONG.firstSeenSpeedMul).toBeCloseTo(0.85, 5);
  });
});

describe('P2 全屏壓力（PRD §6.6）', () => {
  const toP2 = (seed: number): Fsm => {
    const fsm = createLiudongFsm({ rng: createSeededRng(seed) });
    fsm.takeDamage(40);
    return fsm;
  };

  it('不連續同型全屏：全屏招（arrowrain/klinewave）不緊接同型', () => {
    for (const seed of [1, 2, 3, 5, 8, 13]) {
      const fsm = toP2(seed);
      const fullscreen = ['arrowrain', 'klinewave', 'doomarrow', 'liquidation'];
      const kinds = collectAttacks(fsm, 20).map((c) => c.kind);
      for (let i = 1; i < kinds.length; i += 1) {
        const prev = kinds[i - 1] ?? '';
        const cur = kinds[i] ?? '';
        if (fullscreen.includes(prev) && fullscreen.includes(cur)) {
          expect(cur).not.toBe(prev);
        }
      }
    }
  });

  it('一般模式箭雨兩批、無 fakeout；EX 三批（反向假箭頭批次）', () => {
    const fsm = toP2(21);
    const rain = driveTo(fsm, 'arrowrain');
    expect(rain).not.toBeNull();
    if (rain?.kind === 'arrowrain') expect(rain.batches).toBe(2);
    const kinds = collectAttacks(fsm, 30).map((c) => c.kind);
    expect(kinds).not.toContain('fakeout');
    const exFsm = createLiudongFsm({ ex: true, rng: createSeededRng(21) });
    exFsm.takeDamage(Math.ceil(exFsm.maxHp * 0.31));
    const exRain = driveTo(exFsm, 'arrowrain');
    if (exRain?.kind === 'arrowrain') expect(exRain.batches).toBe(3);
  });

  it('全屏招後反擊窗：fullscreenRecoverBonusMs > 0 且輸出窗常數落 1–2.5s 帶', () => {
    expect(LIUDONG.fullscreenRecoverBonusMs).toBeGreaterThan(0);
    for (const phase of ['p1', 'p2', 'p3'] as const) {
      expect(LIUDONG.idleMs[phase]).toBeGreaterThanOrEqual(1000);
      expect(LIUDONG.idleMs[phase]).toBeLessThanOrEqual(2500);
    }
  });
});

describe('P3 終局與失敗保護（PRD §6.6/§6.7）', () => {
  const toP3 = (seed: number, ex = false): Fsm => {
    const fsm = createLiudongFsm({ ex, rng: createSeededRng(seed) });
    fsm.takeDamage(Math.ceil(fsm.maxHp * 0.66));
    return fsm;
  };

  it('熔斷倒數：倒數期滿開脆弱窗（受擊 ×2），窗外恢復 ×1', () => {
    const fsm = toP3(31);
    const command = driveTo(fsm, 'circuitbreaker');
    expect(command).not.toBeNull();
    if (command?.kind !== 'circuitbreaker') return;
    expect(fsm.vulnerable).toBe(false);
    // 快轉至倒數期滿（tick 推進 FSM 內部時鐘）。
    let advanced = 0;
    while (advanced < command.countdownMs + 100) {
      fsm.tick(50);
      advanced += 50;
    }
    expect(fsm.vulnerable).toBe(true);
    const before = fsm.hp;
    fsm.takeDamage(5);
    expect(before - fsm.hp).toBe(5 * LIUDONG.vulnerableDamageMul);
  });

  it('最後轉帳一次性（HP ≤12% 首個出招位強制接管；不重複觸發）', () => {
    const fsm = toP3(41);
    fsm.takeDamage(Math.ceil(fsm.maxHp * 0.25));
    expect(fsm.hp / fsm.maxHp).toBeLessThanOrEqual(LIUDONG.finalTransferHpRatio);
    const command = driveTo(fsm, 'finaltransfer');
    expect(command).not.toBeNull();
    const rest = collectAttacks(fsm, 12).map((c) => c.kind);
    expect(rest).not.toContain('finaltransfer');
  });

  it('連續三次受傷自動降節奏（PRD §6.7）：speedFactor ×0.8；boss 受擊即歸零計數', () => {
    const fsm = createLiudongFsm();
    fsm.tick(50);
    const base = fsm.speedFactor;
    fsm.notePlayerHurt();
    fsm.notePlayerHurt();
    expect(fsm.speedFactor).toBe(base);
    fsm.notePlayerHurt();
    expect(fsm.speedFactor).toBeCloseTo(base * LIUDONG.mercySlowdownMul, 5);
    // 慈悲窗期滿恢復。
    for (let i = 0; i < LIUDONG.mercyDurationMs / 50 + 2; i += 1) fsm.tick(50);
    expect(fsm.speedFactor).toBeCloseTo(base, 5);
    // 反擊歸零：兩次受傷後 boss 受擊，計數重來。
    fsm.notePlayerHurt();
    fsm.notePlayerHurt();
    fsm.takeDamage(1);
    fsm.notePlayerHurt();
    expect(fsm.speedFactor).toBeCloseTo(base, 5);
  });

  it('生存窗招不可暈（熔斷倒數/最後轉帳/牛熊召喚）；其餘招可暈回待機', () => {
    const fsm = toP3(51);
    const command = driveTo(fsm, 'circuitbreaker');
    expect(command).not.toBeNull();
    expect(fsm.stun(800)).toBe(false);
    const fsm2 = createLiudongFsm({ rng: createSeededRng(9) });
    const market = driveTo(fsm2, 'market');
    expect(market).not.toBeNull();
    expect(fsm2.stun(800)).toBe(true);
    expect(fsm2.state).toBe('idle');
  });
});

describe('加權選招治理（§111.1 去背板）', () => {
  // 市場招以市場別展開（FSM state 亦為 usstock/crypto/twstock 粒度）。
  const actionOf = (c: LiudongCommand): string => (c.kind === 'market' ? c.market : c.kind);

  it('同 seed 可完整重放；連續同招上限 2', () => {
    const seqOf = (seed: number): string[] => {
      const fsm = createLiudongFsm({ rng: createSeededRng(seed) });
      return collectAttacks(fsm, 16).map(actionOf);
    };
    expect(seqOf(77)).toEqual(seqOf(77));
    const seq = seqOf(78);
    for (let i = 2; i < seq.length; i += 1) {
      expect(seq[i] === seq[i - 1] && seq[i - 1] === seq[i - 2]).toBe(false);
    }
  });

  it('招式序列條件熵 ≥ 門檻（#813；AUDIT_THRESHOLDS.moveEntropyMinBits 口徑）', () => {
    const fsm = createLiudongFsm({ rng: createSeededRng(99) });
    const seq = collectAttacks(fsm, 40).map(actionOf);
    expect(sequenceEntropyBits(seq)).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.moveEntropyMinBits);
  });
});

describe('可讀性與 EX 差分紅線', () => {
  it('全招式 telegraph ≥600ms（可讀性紅線；含 bullbear/bearcore 召喚類與箭雨陰影）', () => {
    const telegraphs = [
      LIUDONG.usstockTelegraphMs,
      LIUDONG.cryptoTelegraphMs,
      LIUDONG.twstockTelegraphMs,
      LIUDONG.arrowShadowMs,
      LIUDONG.klinewaveTelegraphMs,
      LIUDONG.bullbearTelegraphMs,
      LIUDONG.transferchainTelegraphMs,
      LIUDONG.shortlaserTelegraphMs,
      LIUDONG.fakeoutTelegraphMs,
      LIUDONG.doomarrowTelegraphMs,
      LIUDONG.bearcoreTelegraphMs,
      LIUDONG.liquidationTelegraphMs,
      LIUDONG.circuitbreakerTelegraphMs,
      LIUDONG.finaltransferTelegraphMs,
    ];
    for (const ms of telegraphs) {
      expect(ms).toBeGreaterThanOrEqual(AUDIT_THRESHOLDS.telegraphMinMs);
    }
  });

  it('EX 差分：HP ×1.5（198）；脆弱窗與生存窗時長不縮（只增體不縮窗）', () => {
    const exFsm = createLiudongFsm({ ex: true });
    expect(exFsm.maxHp).toBe(198);
    // 生存窗常數不隨 EX 縮放（durationMs 對 circuitbreaker/finaltransfer 固定）。
    expect(LIUDONG.circuitbreakerVulnerableMs).toBeGreaterThanOrEqual(3000);
    expect(LIUDONG.finaltransferVulnerableMs).toBeGreaterThanOrEqual(3000);
  });
});
